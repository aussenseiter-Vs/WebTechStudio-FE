<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/services/api'
import { setAuth } from '@/stores/auth'

const router = useRouter()
const fullName = ref('')
const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const errors = ref({})
const loading = ref(false)

async function handleRegister() {
  errors.value = {}
  if (password.value !== passwordConfirm.value) {
    errors.value = { password_confirmation: ['Passwords do not match'] }
    return
  }
  loading.value = true
  try {
    const res = await register(fullName.value, username.value, password.value)
    const { data } = res.data
    setAuth(data, data.token)
    router.push('/')
  } catch (e) {
    const data = e.response?.data
    if (data?.errors) {
      errors.value = data.errors
    } else {
      errors.value = { form: [data?.message || 'Registration failed'] }
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
        <p class="text-base-content/60 mt-2">Create a new account</p>
      </div>
      <div class="card bg-base-100 w-full max-w-sm shadow-xl">
        <form @submit.prevent="handleRegister" class="card-body">
          <div class="form-control">
            <label class="label"><span class="label-text">Full Name</span></label>
            <input v-model="fullName" type="text" class="input input-bordered" :class="{ 'input-error': errors.full_name }" required />
            <p v-if="errors.full_name" class="text-error text-xs mt-1">{{ errors.full_name[0] }}</p>
          </div>
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
          <div class="form-control">
            <label class="label"><span class="label-text">Confirm Password</span></label>
            <input v-model="passwordConfirm" type="password" class="input input-bordered" :class="{ 'input-error': errors.password_confirmation }" required />
            <p v-if="errors.password_confirmation" class="text-error text-xs mt-1">{{ errors.password_confirmation[0] }}</p>
          </div>
          <p v-if="errors.form" class="text-error text-sm mt-2">{{ errors.form[0] }}</p>
          <div class="form-control mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Creating account...' : 'Create Account' }}
            </button>
          </div>
          <p class="text-center text-sm mt-4">
            Already have an account?
            <router-link to="/login" class="link link-primary">Sign in</router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
