<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { QHeader, QLayout, QPage, QPageContainer, QToolbar, QToolbarTitle } from 'quasar'

import { useMoviesSearchStore } from '@/stores/moviesSearch'

const store = useMoviesSearchStore()
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <QLayout view="hHh lpR fFf">
    <QHeader class="app-header">
      <QToolbar class="app-header__bar">
        <QToolbarTitle class="app-header__title">
          <RouterLink class="app-header__link" :to="{ name: 'movie-search' }">
            Film Finder
          </RouterLink>
        </QToolbarTitle>
        <span class="app-header__source" data-testid="app-source">{{ store.sourceLabel }}</span>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <QPage id="main" padding tabindex="-1" class="app-main">
        <RouterView />
      </QPage>
    </QPageContainer>
  </QLayout>
</template>

<style scoped lang="scss">
.skip-link {
  position: absolute;
  left: 12px;
  top: -48px;
  z-index: 3000;
  padding: 8px 14px;
  border-radius: 6px;
  background: var(--ff-surface);
  color: var(--ff-marquee);
  font-weight: 600;

  &:focus {
    top: 8px;
  }
}

.app-header {
  background: var(--ff-ink);
  color: #fff;
  border-bottom: 3px solid var(--ff-marquee);
}

.app-main:focus {
  outline: none;
}

.app-header__bar {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.app-header__title {
  font-family: var(--ff-font-display);
  font-size: 1.45rem;
  font-weight: 600;
}

.app-header__link {
  color: inherit;
  text-decoration: none;
}

.app-header__source {
  flex: none;
  padding: 3px 10px;
  border: 1px dashed rgba(255, 255, 255, 0.55);
  border-radius: 4px;
  font-size: 0.72rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #f4eee3;
}
</style>
