<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { Movie } from '@/types/movies'

const props = withDefaults(defineProps<{ movie: Movie; eager?: boolean }>(), { eager: false })

const failed = ref(false)

// A new movie in the same slot gets a fresh chance to load.
watch(
  () => props.movie.id,
  () => {
    failed.value = false
  },
)

const showImage = computed(() => props.movie.posterPath !== null && !failed.value)

/** Up to two initials, so the fallback tile still identifies the film. */
const initials = computed(() =>
  props.movie.title
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join(''),
)
</script>

<template>
  <div class="poster" data-testid="movie-poster">
    <img
      v-if="showImage"
      class="poster__image"
      :src="movie.posterPath ?? ''"
      :alt="`Poster for ${movie.title}`"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      data-testid="movie-poster-image"
      @error="failed = true"
    />
    <div
      v-else
      class="poster__fallback"
      role="img"
      :aria-label="`No poster for ${movie.title}`"
      data-testid="movie-poster-fallback"
    >
      <span class="poster__initials">{{ initials }}</span>
      <span class="poster__caption">No poster</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.poster {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 10px;
  background: #1a1c22;
}

.poster__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.poster__fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.82);
  background: repeating-linear-gradient(135deg, #24262e 0 14px, #1c1e25 14px 28px);
}

.poster__initials {
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: 2px;
}

.poster__caption {
  font-size: 0.72rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.6;
}
</style>
