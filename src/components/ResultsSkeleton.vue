<script setup lang="ts">
import { SKELETON_CARD_COUNT } from '@/config/appConfig'

withDefaults(defineProps<{ count?: number }>(), { count: SKELETON_CARD_COUNT })
</script>

<template>
  <div class="skeleton" data-testid="movie-skeleton" aria-hidden="true">
    <div v-for="n in count" :key="n" class="skeleton__card">
      <div class="skeleton__poster" />
      <div class="skeleton__line skeleton__line--wide" />
      <div class="skeleton__line" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.skeleton {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
}

.skeleton__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.skeleton__poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.07);
}

.skeleton__line {
  height: 10px;
  border-radius: 5px;
  width: 55%;
  background: rgba(0, 0, 0, 0.07);
}

.skeleton__line--wide {
  width: 85%;
}
</style>
