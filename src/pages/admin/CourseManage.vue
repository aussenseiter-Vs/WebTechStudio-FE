<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourse, createSet, deleteSet, deleteLesson, updateCourse } from '@/services/api'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug

const course = ref(null)
const loading = ref(true)
const error = ref('')
const newSetName = ref('')
const addingSet = ref(false)

onMounted(loadCourse)

async function loadCourse() {
  loading.value = true
  try {
    const res = await getCourse(slug)
    course.value = res.data.data
  } catch {
    error.value = 'Failed to load course'
  } finally {
    loading.value = false
  }
}

async function addSet() {
  if (!newSetName.value.trim()) return
  addingSet.value = true
  try {
    await createSet(slug, { name: newSetName.value })
    newSetName.value = ''
    await loadCourse()
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to add set'
  } finally {
    addingSet.value = false
  }
}

async function removeSet(set) {
  if (!confirm(`Delete set "${set.name}" and all its lessons?`)) return
  try {
    await deleteSet(slug, set.id, set.name)
    await loadCourse()
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to delete set'
  }
}

async function removeLesson(lesson) {
  if (!confirm(`Delete lesson "${lesson.name}"?`)) return
  try {
    await deleteLesson(lesson.id)
    await loadCourse()
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to delete lesson'
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <div class="mb-6">
      <router-link to="/admin" class="link link-hover text-sm">&larr; Back to Admin</router-link>
      <h1 class="text-2xl font-bold mt-1">{{ course?.name || 'Course' }}</h1>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else-if="course">
      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body p-4">
          <h3 class="font-semibold mb-2">Add Set</h3>
          <form @submit.prevent="addSet" class="flex gap-2">
            <input v-model="newSetName" class="input input-bordered flex-1" placeholder="Set name" required />
            <button type="submit" class="btn btn-primary" :disabled="addingSet">
              {{ addingSet ? 'Adding...' : 'Add' }}
            </button>
          </form>
        </div>
      </div>

      <div v-for="set in course.sets" :key="set.id" class="card bg-base-100 shadow-sm mb-4">
        <div class="card-body p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold">{{ set.name }}</h3>
            <button class="btn btn-ghost btn-xs text-error" @click="removeSet(set)">Delete Set</button>
          </div>

          <div v-if="!set.lessons?.length" class="text-sm text-base-content/50 py-2">
            No lessons in this set.
          </div>

          <div v-else class="space-y-1">
            <div v-for="lesson in set.lessons" :key="lesson.id" class="flex items-center justify-between px-3 py-2 rounded-lg bg-base-200/50">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ lesson.name }}</span>
                <span class="badge badge-ghost badge-xs">order {{ lesson.order }}</span>
                <span class="text-xs text-base-content/50">{{ lesson.contents?.length || 0 }} content items</span>
              </div>
              <button class="btn btn-ghost btn-xs text-error" @click="removeLesson(lesson)">Delete</button>
            </div>
          </div>

          <button
            class="btn btn-outline btn-sm mt-3"
            @click="router.push(`/admin/courses/${slug}/lessons/create?set_id=${set.id}`)"
          >
            + Add Lesson
          </button>
        </div>
      </div>

      <div v-if="!course.sets?.length" class="text-center py-12 text-base-content/50">
        No sets yet. Add a set to get started.
      </div>
    </template>
  </div>
</template>
