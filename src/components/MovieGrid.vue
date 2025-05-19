<script setup lang="ts">
import MovieCard from '@/components/MovieCard.vue'
import type { Movie } from '@/types/movies'

/** Cards above this index are lazy-loaded: the first row is what the viewport shows. */
const EAGER_CARD_COUNT = 5

defineProps<{ movies: readonly Movie[] }>()
</script>

<template>
  <ul class="movie-grid" data-testid="movie-grid">
    <li v-for="(movie, index) in movies" :key="movie.id" class="movie-grid__item">
      <MovieCard :movie="movie" :eager="index < EAGER_CARD_COUNT" />
    </li>
  </ul>
</template>

<style scoped lang="scss">
.movie-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
}

.movie-grid__item {
  min-width: 0;
}
</style>
