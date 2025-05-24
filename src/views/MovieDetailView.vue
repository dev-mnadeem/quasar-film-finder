<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { QBanner, QBtn, QCard, QCardSection, QChip, QIcon } from 'quasar'

import MoviePoster from '@/components/MoviePoster.vue'
import { isAbortError } from '@/api/errors'
import { useMoviesSearchStore } from '@/stores/moviesSearch'
import type { Movie } from '@/types/movies'

type DetailState = 'loading' | 'found' | 'missing' | 'unsupported' | 'error'

const route = useRoute()
const store = useMoviesSearchStore()

const movie = ref<Movie | null>(null)
const state = ref<DetailState>('loading')
const errorMessage = ref('')

let inFlight: AbortController | null = null

async function load(id: string): Promise<void> {
  inFlight?.abort()
  const controller = new AbortController()
  inFlight = controller

  if (!store.provider.capabilities.details) {
    state.value = 'unsupported'
    movie.value = null
    return
  }

  state.value = 'loading'
  try {
    const found = await store.provider.getById(id, controller.signal)
    if (inFlight !== controller) return
    movie.value = found
    state.value = found ? 'found' : 'missing'
  } catch (error: unknown) {
    if (inFlight !== controller || isAbortError(error)) return
    state.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Could not load this movie.'
  }
}

watch(
  () => route.params.id,
  (id) => {
    void load(typeof id === 'string' ? id : '')
  },
  { immediate: true },
)

/** Keeps the user's search in the URL when they go back to the results. */
function backTarget() {
  return {
    name: 'movie-search' as const,
    query: store.phrase ? { q: store.phrase } : {},
  }
}
</script>

<template>
  <div class="detail">
    <RouterLink class="detail__back" :to="backTarget()" data-testid="detail-back">
      <QIcon name="arrow_back" size="18px" />
      Back to results
    </RouterLink>

    <QCard
      v-if="state === 'found' && movie"
      flat
      bordered
      class="detail__card"
      data-testid="detail-card"
    >
      <div class="detail__layout">
        <div class="detail__poster">
          <MoviePoster :movie="movie" eager />
        </div>
        <QCardSection class="detail__body">
          <h1 class="detail__title" data-testid="detail-title">{{ movie.title }}</h1>
          <div class="detail__meta" data-testid="detail-meta">
            <span>{{ movie.year }}</span>
            <span v-if="movie.runtimeMinutes !== null">{{ movie.runtimeMinutes }} min</span>
            <span v-if="movie.rating !== null" class="detail__rating">
              &#9733; {{ movie.rating.toFixed(1) }}
            </span>
          </div>
          <div v-if="movie.genres.length > 0" class="detail__genres">
            <QChip
              v-for="genre in movie.genres"
              :key="genre"
              outline
              color="primary"
              size="sm"
              :label="genre"
            />
          </div>
          <p v-if="movie.overview" class="detail__overview" data-testid="detail-overview">
            {{ movie.overview }}
          </p>
          <p class="detail__id">
            Catalogue id: <code>{{ movie.id }}</code>
          </p>
        </QCardSection>
      </div>
    </QCard>

    <QBanner
      v-else-if="state === 'loading'"
      rounded
      class="detail__notice"
      data-testid="detail-loading"
    >
      Loading movie&hellip;
    </QBanner>

    <QBanner
      v-else-if="state === 'unsupported'"
      rounded
      class="bg-amber-2 text-brown-9 detail__notice"
      data-testid="detail-unsupported"
    >
      <template #avatar><QIcon name="info" color="brown-9" /></template>
      {{ store.sourceLabel }} has no detail endpoint, so there is nothing to show for this title.
      Switch to the bundled catalogue to see full records.
    </QBanner>

    <QBanner
      v-else-if="state === 'missing'"
      rounded
      class="bg-grey-3 detail__notice"
      data-testid="detail-missing"
    >
      <template #avatar><QIcon name="search_off" /></template>
      No movie with that id is in {{ store.sourceLabel }}.
      <template #action>
        <QBtn flat dense no-caps color="primary" label="Back to search" :to="backTarget()" />
      </template>
    </QBanner>

    <QBanner
      v-else
      rounded
      class="bg-negative text-white detail__notice"
      data-testid="detail-error"
    >
      <template #avatar><QIcon name="error_outline" color="white" /></template>
      {{ errorMessage }}
    </QBanner>
  </div>
</template>

<style scoped lang="scss">
.detail {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  text-decoration: none;
  font-size: 0.88rem;
  color: #1976d2;

  &:hover {
    text-decoration: underline;
  }
}

.detail__card {
  border-radius: 14px;
  overflow: hidden;
  max-width: 860px;
}

.detail__layout {
  display: grid;
  grid-template-columns: minmax(200px, 300px) 1fr;
  gap: 8px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.detail__poster {
  padding: 16px;
}

.detail__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail__title {
  font-size: 1.9rem;
  line-height: 1.15;
  margin: 0;
  font-weight: 700;
}

.detail__meta {
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.detail__rating {
  font-weight: 600;
  color: #b26a00;
}

.detail__genres {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.detail__overview {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 62ch;
}

.detail__id {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(0, 0, 0, 0.45);
}

.detail__notice {
  border-radius: 12px;
}
</style>
