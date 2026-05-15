<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import { logout } from '@/services/api'
import { auth, clearAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const loggingOut = ref(false)

const isAdmin = computed(() => auth.user?.role === 'admin')

async function handleLogout() {
  loggingOut.value = true
  try {
    await logout()
  } catch {}
  clearAuth()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div v-if="auth.token" class="navbar bg-base-100 shadow-sm px-4">
      <div class="flex-1 flex items-center gap-4">
        <router-link to="/" class="text-xl font-bold">WebTechStudio</router-link>
        <router-link v-if="isAdmin" to="/admin" class="link link-hover text-sm">Admin</router-link>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm">{{ auth.user?.full_name || auth.user?.username }}</span>
        <button class="btn btn-ghost btn-sm" @click="handleLogout" :disabled="loggingOut">
          {{ loggingOut ? 'Logging out...' : 'Logout' }}
        </button>
      </div>
    </div>
    <RouterView />
  </div>
</template>
