import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import quasarLang from 'quasar/lang/en-US'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import '@fontsource-variable/fraunces'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import './styles/theme.scss'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(Quasar, {
  lang: quasarLang,
  plugins: {},
  // Mirrors the tokens in styles/theme.scss so Quasar's own controls match.
  config: {
    brand: { primary: '#a3261b', secondary: '#7d5300', negative: '#8f1d14' },
  },
})
app.use(createPinia())
app.use(router)

app.mount('#app')
