import { createApp } from 'vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './style.css'
import App from './App.vue'

createApp(App)
    .use(Toast, { timeout: 2000, hideProgressBar: true })
    .mount('#app')
