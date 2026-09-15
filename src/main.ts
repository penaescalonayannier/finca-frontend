import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import AuthService from '@/services/AuthService'
import '@/assets/variables.css'

// Initialize auth headers if token exists
AuthService.initializeAuth()

createApp(App).use(router).mount('#app')
