<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import MoviePoster from '@/components/MoviePoster.vue'
import type { Movie } from '@/types/movies'

const props = withDefaults(defineProps<{ movie: Movie; eager?: boolean }>(), { eager: false })

const ratingLabel = computed(() =>
  props.movie.rating === null ? null : props.movie.rating.toFixed(1),
)
</script>

<template>
  <RouterLink
    class="movie-card"
    :to="{ name: 'movie-detail', params: { id: movie.id } }"
    data-testid="movie-card"
  >
    <MoviePoster :movie="movie" :eager="eager" />
    <div class="movie-card__body">
      <h3 class="movie-card__title" data-testid="movie-card-title">{{ movie.title }}</h3>
      <div class="movie-card__meta">
        <span data-testid="movie-card-year">{{ movie.year }}</span>
        <span v-if="ratingLabel" class="movie-card__rating" data-testid="movie-card-rating">
          ★ {{ ratingLabel }}
        </span>
      </div>
      <p v-if="movie.genres.length > 0" class="movie-card__genres">
        {{ movie.genres.join(' · ') }}
      </p>
    </div>
  </RouterLink>
</template>

<style scoped lang="scss">
.movie-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  border-radius: 12px;
  padding: 8px;
  transition:
    transform 140ms ease,
    background-color 140ms ease;

  &:hover,
  &:focus-visible {
    background: rgba(25, 118, 210, 0.08);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
}

.movie-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.movie-card__title {
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
  /* Two lines of room keeps the year and rating on one baseline across the grid. */
  min-height: 2.6em;
}

.movie-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.82rem;
  color: rgba(0, 0, 0, 0.6);
}

.movie-card__rating {
  font-weight: 600;
  color: #b26a00;
}

.movie-card__genres {
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
}
</style>
