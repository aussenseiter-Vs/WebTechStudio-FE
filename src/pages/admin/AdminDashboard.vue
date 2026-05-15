<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/services/api'

const router = useRouter()
const courses = ref([])
const loading = ref(true)
const showForm = ref(false)
const editing = ref(null)
const form = ref({ name: '', slug: '', description: '' })
const saving = ref(false)
const error = ref('')

onMounted(loadCourses)

async function loadCourses() {
  loading.value = true
  try {
    const res = await getCourses()
    courses.value = res.data.data.courses
  } catch {
    error.value = 'Failed to load courses'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', slug: '', description: '' }
  showForm.value = true
  error.value = ''
}

function openEdit(course) {
  editing.value = course
  form.value = {
    name: course.name,
    slug: course.slug,
    description: course.description || '',
  }
  showForm.value = true
  error.value = ''
}

async function saveCourse() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await updateCourse(editing.value.slug, {
        name: form.value.name,
        description: form.value.description,
      })
    } else {
      await createCourse(form.value)
    }
    showForm.value = false
    await loadCourses()
  } catch (e) {
    const data = e.response?.data
    if (data?.errors) {
      error.value = Object.values(data.errors).flat().join(', ')
    } else {
      error.value = data?.message || 'Failed to save course'
    }
  } finally {
    saving.value = false
  }
}

async function togglePublish(course) {
  try {
    await updateCourse(course.slug, {
      name: course.name,
      description: course.description || '',
      is_published: !course.is_published,
    })
    course.is_published = !course.is_published
  } catch {
    error.value = 'Failed to update course'
  }
}

async function removeCourse(course) {
  if (!confirm(`Delete "${course.name}"? This cannot be undone.`)) return
  try {
    await deleteCourse(course.slug)
    await loadCourses()
  } catch {
    error.value = 'Failed to delete course'
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Admin Dashboard</h1>
      <button class="btn btn-primary" @click="openCreate">Create Course</button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <!-- Course Form Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showForm = false">
      <div class="card bg-base-100 w-full max-w-md shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ editing ? 'Edit Course' : 'Create Course' }}</h2>
          <form @submit.prevent="saveCourse" class="space-y-3">
            <div class="form-control">
              <label class="label"><span class="label-text">Name</span></label>
              <input v-model="form.name" class="input input-bordered" required />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Slug</span></label>
              <input v-model="form.slug" class="input input-bordered" :disabled="!!editing" required />
              <label class="label"><span class="label-text-alt text-base-content/50">URL identifier, e.g. "my-course"</span></label>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Description</span></label>
              <textarea v-model="form.description" class="textarea textarea-bordered" rows="3"></textarea>
            </div>
            <div class="flex gap-2 justify-end mt-4">
              <button type="button" class="btn btn-ghost" @click="showForm = false">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : editing ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="!courses.length" class="text-center py-12 text-base-content/50">
      No courses yet. Create your first course!
    </div>

    <div v-else class="space-y-3">
      <div v-for="course in courses" :key="course.id" class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-medium">{{ course.name }}</h3>
                <span class="badge badge-sm" :class="course.is_published ? 'badge-success' : 'badge-ghost'">
                  {{ course.is_published ? 'Published' : 'Draft' }}
                </span>
              </div>
              <p class="text-sm text-base-content/60 mt-0.5">{{ course.slug }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-ghost btn-xs" @click="togglePublish(course)">
                {{ course.is_published ? 'Unpublish' : 'Publish' }}
              </button>
              <button class="btn btn-ghost btn-xs" @click="openEdit(course)">Edit</button>
              <button class="btn btn-ghost btn-xs" @click="router.push(`/admin/courses/${course.slug}/manage`)">Manage</button>
              <button class="btn btn-ghost btn-xs text-error" @click="removeCourse(course)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
