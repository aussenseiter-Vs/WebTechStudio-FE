<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="hero min-h-[80vh]">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-6xl font-bold text-base-content/20">404</h1>
        <p class="text-xl mt-4">Page Not Found</p>
        <button class="btn btn-primary mt-6" @click="router.push('/')">Back to Home</button>
      </div>
    </div>
  </div>
</template>
