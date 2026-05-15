<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/services/api'
import { setAuth } from '@/stores/auth'

const router = useRouter()
const username = ref('')
const password = ref('')
const errors = ref({})
const loading = ref(false)

async function handleLogin() {
  errors.value = {}
  loading.value = true
  try {
    const res = await login(username.value, password.value)
    const { data } = res.data
    setAuth(data, data.token)
    router.push('/')
  } catch (e) {
    const data = e.response?.data
    if (data?.errors) {
      errors.value = data.errors
    } else {
      errors.value = { form: [data?.message || 'Login failed'] }
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold">WebTechStudio</h1>
        <p class="text-base-content/60 mt-2">Sign in to your account</p>
      </div>
      <div class="card bg-base-100 w-full max-w-sm shadow-xl">
        <form @submit.prevent="handleLogin" class="card-body">
          <div class="form-control">
            <label class="label"><span class="label-text">Username</span></label>
            <input v-model="username" type="text" class="input input-bordered" :class="{ 'input-error': errors.username }" required />
            <p v-if="errors.username" class="text-error text-xs mt-1">{{ errors.username[0] }}</p>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Password</span></label>
            <input v-model="password" type="password" class="input input-bordered" :class="{ 'input-error': errors.password }" required />
            <p v-if="errors.password" class="text-error text-xs mt-1">{{ errors.password[0] }}</p>
          </div>
          <p v-if="errors.form" class="text-error text-sm mt-2">{{ errors.form[0] }}</p>
          <div class="form-control mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>
          <p class="text-center text-sm mt-4">
            Don't have an account?
            <router-link to="/register" class="link link-primary">Register</router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
