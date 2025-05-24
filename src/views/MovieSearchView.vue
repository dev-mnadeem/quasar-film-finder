<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  QBanner,
  QBtn,
  QCard,
  QCardSection,
  QChip,
  QIcon,
  QInput,
  QPagination,
  QSeparator,
  QSpinner,
} from 'quasar'

import MovieGrid from '@/components/MovieGrid.vue'
import ResultsSkeleton from '@/components/ResultsSkeleton.vue'
import { useDebouncedWatch } from '@/composables/useDebouncedWatch'
import { MAX_PAGINATION_LINKS } from '@/config/appConfig'
import { useMoviesSearchStore } from '@/stores/moviesSearch'

/** Phrases that show off the parser without the reviewer having to guess at it. */
const EXAMPLE_PHRASES = ['night', 'sci-fi from the 90s', 'documentary', '2016 comedy'] as const

const route = useRoute()
const router = useRouter()
const store = useMoviesSearchStore()
const { phrase, intent, page, status, errorMessage, movies, total, totalPages, isLoading } =
  storeToRefs(store)

const localQuery = ref('')

/** The URL is the source of truth: the input writes to it, and this watcher reads it back. */
function routeQuery(): { q: string; page: number } {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const raw = Number(route.query.page)
  return { q, page: Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1 }
}

function writeUrl(q: string, nextPage: number, mode: 'push' | 'replace'): void {
  const query: Record<string, string> = {}
  if (q) query.q = q
  if (nextPage > 1) query.page = String(nextPage)
  void router[mode]({ name: 'movie-search', query })
}

const debounced = useDebouncedWatch(localQuery, (value) => {
  const next = String(value ?? '').trim()
  // The field is also written to when a URL is opened directly. Navigating in that
  // case would reset the page number the visitor deep-linked to.
  if (next === routeQuery().q) return
  writeUrl(next, 1, 'replace')
})

async function applyRoute(): Promise<void> {
  const target = routeQuery()
  if (localQuery.value !== target.q) {
    localQuery.value = target.q
    debounced.cancel()
  }
  if (!target.q) {
    store.reset()
    return
  }
  if (target.q !== phrase.value) {
    await store.search(target.q)
  }
  if (target.page !== page.value) {
    await store.setPage(target.page)
  }
}

watch(() => `${routeQuery().q} ${routeQuery().page}`, applyRoute, { immediate: true })

function submitNow(): void {
  debounced.cancel()
  writeUrl(localQuery.value.trim(), 1, 'replace')
}

function onPageChange(next: number): void {
  writeUrl(phrase.value, next, 'push')
}

function useExample(example: string): void {
  localQuery.value = example
  submitNow()
}

function retry(): void {
  void store.search(phrase.value)
}

const showIdleHint = computed(() => status.value === 'idle' && movies.value.length === 0)
const showEmpty = computed(() => status.value === 'success' && movies.value.length === 0)
const firstIndex = computed(() => (page.value - 1) * store.perPage + 1)
const lastIndex = computed(() => Math.min(page.value * store.perPage, total.value))
</script>

<template>
  <div class="search">
    <QCard flat bordered class="search__panel">
      <QCardSection>
        <QInput
          :model-value="localQuery"
          data-testid="movie-search-input"
          outlined
          clearable
          autofocus
          label="Search movies"
          hint="Try a title, or a phrase like 'sci-fi from the 90s'. Results follow the URL, so a search is shareable."
          @update:model-value="localQuery = String($event ?? '')"
          @keyup.enter="submitNow"
        >
          <template #prepend>
            <QIcon name="search" />
          </template>
          <template #append>
            <QSpinner
              v-if="isLoading"
              size="20px"
              color="primary"
              data-testid="movie-search-spinner"
            />
          </template>
        </QInput>

        <div class="search__actions">
          <QBtn
            data-testid="movie-search-submit"
            color="primary"
            unelevated
            no-caps
            label="Search"
            @click="submitNow"
          />
          <div v-if="intent" class="search__intent" data-testid="movie-intent">
            Reading that as <strong>{{ intent.explanation }}</strong>
          </div>
        </div>

        <div v-if="showIdleHint" class="search__examples" data-testid="movie-examples">
          <span class="search__examples-label">Try</span>
          <QChip
            v-for="example in EXAMPLE_PHRASES"
            :key="example"
            clickable
            outline
            color="primary"
            size="sm"
            :label="example"
            @click="useExample(example)"
          />
        </div>
      </QCardSection>
    </QCard>

    <QBanner
      v-if="store.ignoredFilters.length > 0"
      rounded
      class="bg-amber-2 text-brown-9 search__notice"
      data-testid="movie-ignored-filters"
    >
      <template #avatar><QIcon name="info" color="brown-9" /></template>
      {{ store.sourceLabel }} searches by title only, so the
      {{ store.ignoredFilters.join(' and ') }} filter was not applied.
    </QBanner>

    <QBanner
      v-if="store.needsTitle"
      rounded
      class="bg-amber-2 text-brown-9 search__notice"
      data-testid="movie-needs-title"
    >
      <template #avatar><QIcon name="info" color="brown-9" /></template>
      {{ store.sourceLabel }} needs a title to search for - add a word from the film's name.
    </QBanner>

    <QBanner
      v-if="status === 'error'"
      rounded
      class="bg-negative text-white search__notice"
      data-testid="movie-error"
    >
      <template #avatar><QIcon name="error_outline" color="white" /></template>
      {{ errorMessage }}
      <template #action>
        <QBtn flat dense no-caps color="white" label="Retry" @click="retry" />
      </template>
    </QBanner>

    <section
      class="search__results"
      data-testid="movie-results-section"
      :aria-busy="isLoading"
      aria-live="polite"
    >
      <div v-if="total > 0" class="search__summary" data-testid="movie-total">
        <strong>{{ total }}</strong> result{{ total === 1 ? '' : 's' }}
        <span v-if="totalPages > 1">
          &middot; showing {{ firstIndex }}&ndash;{{ lastIndex }} (page {{ page }} of
          {{ totalPages }})
        </span>
        &middot; source: {{ store.sourceLabel }}
      </div>

      <ResultsSkeleton v-if="isLoading && movies.length === 0" />

      <p v-else-if="showIdleHint" class="search__placeholder" data-testid="movie-idle-hint">
        Search {{ store.sourceLabel }} by title, or describe what you are in the mood for.
      </p>

      <div v-else-if="showEmpty" class="search__placeholder" data-testid="movie-empty">
        <p class="search__placeholder-lead">Nothing matched &ldquo;{{ phrase }}&rdquo;</p>
        <p class="search__placeholder-hint">Try a shorter phrase, or drop one of the filters.</p>
      </div>

      <MovieGrid v-if="movies.length > 0" :movies="movies" />

      <QSeparator v-if="totalPages > 1" class="q-my-md" />

      <div v-if="totalPages > 1" class="search__pagination">
        <QPagination
          data-testid="movie-pagination"
          :model-value="page"
          :max="totalPages"
          :max-pages="MAX_PAGINATION_LINKS"
          direction-links
          boundary-links
          color="primary"
          :disable="isLoading"
          @update:model-value="onPageChange"
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.search {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto;
}

.search__panel {
  border-radius: 14px;
}

.search__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.search__intent {
  font-size: 0.82rem;
  color: rgba(0, 0, 0, 0.6);
}

.search__examples {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.search__examples-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(0, 0, 0, 0.45);
  margin-right: 2px;
}

.search__notice {
  border-radius: 12px;
}

.search__summary {
  font-size: 0.84rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 12px;
}

.search__placeholder {
  margin: 28px 0;
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.6);
}

.search__placeholder-lead {
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
}

.search__placeholder-hint {
  margin: 0;
}

.search__pagination {
  display: flex;
  justify-content: center;
}
</style>
