<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCourses, getUserProgress } from '@/services/api'
import { auth } from '@/stores/auth'

const router = useRouter()
const registeredCourses = ref([])
const availableCourses = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [coursesRes, progressRes] = await Promise.all([
      getCourses(),
      getUserProgress(),
    ])
    const allCourses = coursesRes.data.data.courses
    const userProgress = progressRes.data.data.progress
    const registeredIds = new Set(userProgress.map((p) => p.course.id))
    const progressMap = {}
    for (const p of userProgress) {
      const completed = p.completed_lessons?.length || 0
      progressMap[p.course.id] = { completed }
    }
    registeredCourses.value = allCourses
      .filter((c) => registeredIds.has(c.id))
      .map((c) => ({ ...c, progress: progressMap[c.id] || { completed: 0 } }))
    availableCourses.value = allCourses.filter((c) => !registeredIds.has(c.id))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function viewCourse(slug) {
  router.push(`/${slug}`)
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Welcome!</h1>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <div v-if="registeredCourses.length" class="mb-8">
        <h2 class="text-lg font-semibold mb-3">My Courses</h2>
        <div class="grid gap-3">
          <div
            v-for="course in registeredCourses"
            :key="course.id"
            class="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            @click="viewCourse(course.slug)"
          >
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-medium">{{ course.name }}</h3>
                  <p class="text-sm text-base-content/60 mt-0.5">{{ course.description }}</p>
                </div>
                <div class="text-right">
                  <span class="text-sm text-base-content/50">{{ course.progress.completed }} lesson{{ course.progress.completed !== 1 ? 's' : '' }} completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="availableCourses.length">
        <h2 class="text-lg font-semibold mb-3">Available Courses</h2>
        <div class="grid gap-3">
          <div
            v-for="course in availableCourses"
            :key="course.id"
            class="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            @click="viewCourse(course.slug)"
          >
            <div class="card-body p-4">
              <h3 class="font-medium">{{ course.name }}</h3>
              <p class="text-sm text-base-content/60 mt-0.5">{{ course.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!registeredCourses.length && !availableCourses.length" class="text-center py-12 text-base-content/50">
        No courses available yet.
      </div>
    </template>
  </div>
</template>
