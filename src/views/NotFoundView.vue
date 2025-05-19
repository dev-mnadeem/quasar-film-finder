<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="not-found" data-testid="not-found">
    <p class="not-found__code">404</p>
    <h1 class="not-found__title">No such page</h1>
    <p class="not-found__path">
      <code>{{ route.fullPath }}</code> is not a route in this app.
    </p>
    <RouterLink class="not-found__link" :to="{ name: 'movie-search' }">
      Go to movie search
    </RouterLink>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  max-width: 560px;
  margin: 72px auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.not-found__code {
  margin: 0;
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
  color: rgba(0, 0, 0, 0.16);
}

.not-found__title {
  margin: 0;
  font-size: 1.5rem;
}

.not-found__path {
  margin: 0;
  color: rgba(0, 0, 0, 0.6);
  word-break: break-all;
}

.not-found__link {
  color: #1976d2;
}
</style>
