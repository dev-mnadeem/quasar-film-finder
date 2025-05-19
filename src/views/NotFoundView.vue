<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="not-found" data-testid="not-found">
    <p class="not-found__code" aria-hidden="true">404</p>
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
  font-family: var(--ff-font-display);
  font-size: 4.5rem;
  font-weight: 600;
  line-height: 1;
  color: var(--ff-rule);
}

.not-found__title {
  margin: 0;
  font-size: 1.7rem;
}

.not-found__path {
  margin: 0;
  color: var(--ff-ink-muted);
  word-break: break-all;
}

.not-found__link {
  font-weight: 500;
}
</style>
