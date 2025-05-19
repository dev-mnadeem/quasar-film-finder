<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { QHeader, QLayout, QPage, QPageContainer, QToolbar, QToolbarTitle } from 'quasar'

import { useMoviesSearchStore } from '@/stores/moviesSearch'

const store = useMoviesSearchStore()
</script>

<template>
  <QLayout view="hHh lpR fFf">
    <QHeader elevated class="app-header">
      <QToolbar class="app-header__bar">
        <QToolbarTitle class="app-header__title">
          <RouterLink class="app-header__link" :to="{ name: 'movie-search' }">
            Film Finder
          </RouterLink>
        </QToolbarTitle>
        <span class="app-header__source" data-testid="app-source">
          {{ store.sourceLabel }}
        </span>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <QPage padding>
        <RouterView />
      </QPage>
    </QPageContainer>
  </QLayout>
</template>

<style scoped lang="scss">
.app-header {
  background: linear-gradient(90deg, #14213d 0%, #1f4068 100%);
  color: #fff;
}

.app-header__bar {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.app-header__title {
  font-weight: 700;
  letter-spacing: 0.4px;
}

.app-header__link {
  color: inherit;
  text-decoration: none;
}

.app-header__source {
  font-size: 0.76rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.75;
}
</style>
