<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourse, getUserProgress, registerCourse } from '@/services/api'
import { auth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const slug = route.params.course_slug

const course = ref(null)
const registered = ref(false)
const completedLessons = ref([])
const registering = ref(false)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [courseRes, progressRes] = await Promise.all([
      getCourse(slug),
      getUserProgress(),
    ])
    course.value = courseRes.data.data
    const userProgress = progressRes.data.data.progress.find(
      (p) => p.course.id === course.value.id
    )
    if (userProgress) {
      registered.value = true
      completedLessons.value = userProgress.completed_lessons || []
    }
  } catch (e) {
    if (e.response?.status === 404) {
      error.value = 'Course not found'
    } else {
      error.value = 'Failed to load course'
    }
  } finally {
    loading.value = false
  }
})

const completedIds = computed(() => new Set(completedLessons.value.map((l) => l.id)))

const currentLessonId = computed(() => {
  for (const set of course.value?.sets || []) {
    for (const lesson of set.lessons) {
      if (!completedIds.value.has(lesson.id)) return lesson.id
    }
  }
  return null
})

const currentSetId = computed(() => {
  for (const set of course.value?.sets || []) {
    for (const lesson of set.lessons) {
      if (!completedIds.value.has(lesson.id)) return set.id
    }
  }
  return null
})

const totalLessons = computed(() => {
  return course.value?.sets.reduce((s, set) => s + set.lessons.length, 0) || 0
})

const progressPercent = computed(() => {
  if (totalLessons.value === 0) return 0
  return Math.round((completedIds.value.size / totalLessons.value) * 100)
})

const allDone = computed(() => {
  return totalLessons.value > 0 && completedIds.value.size === totalLessons.value
})

function lessonStatus(lesson) {
  if (completedIds.value.has(lesson.id)) return 'completed'
  if (lesson.id === currentLessonId.value) return 'current'
  return 'locked'
}

async function handleRegister() {
  registering.value = true
  try {
    await registerCourse(slug)
    registered.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to register'
  } finally {
    registering.value = false
  }
}

function goToLesson(lesson) {
  const status = lessonStatus(lesson)
  if (status === 'locked') return
  router.push(`/${slug}/lessons/${lesson.id}`)
}

function jumpToSet(setId) {
  const set = course.value.sets.find((s) => s.id === setId)
  if (!set) return
  const first = set.lessons.find((l) => lessonStatus(l) !== 'completed')
  if (first) router.push(`/${slug}/jump/${first.id}`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-error">{{ error }}</p>
      <button class="btn btn-ghost mt-4" @click="router.push('/')">Back to home</button>
    </div>

    <template v-else-if="course">
      <h1 class="text-2xl font-bold mb-2">{{ course.name }}</h1>

      <div v-if="!registered" class="space-y-6">
        <p class="text-base-content/70">{{ course.description }}</p>
        <div>
          <h3 class="font-semibold mb-2">Course Outline</h3>
          <ul class="list-disc list-inside text-sm text-base-content/60 space-y-1">
            <li v-for="set in course.sets" :key="set.id">{{ set.name }}</li>
          </ul>
        </div>
        <button class="btn btn-primary" :disabled="registering" @click="handleRegister">
          {{ registering ? 'Registering...' : 'Register to this course' }}
        </button>
      </div>

      <div v-else-if="allDone" class="card bg-base-100 shadow-sm mt-6">
        <div class="card-body text-center py-12">
          <div class="text-5xl mb-4">🎓</div>
          <h2 class="card-title text-2xl justify-center mb-2">Certificate of Completion</h2>
          <p class="text-base-content/70">This certifies that</p>
          <p class="text-xl font-bold my-2">{{ auth.user?.full_name }}</p>
          <p class="text-base-content/70">has successfully completed the course</p>
          <p class="text-xl font-bold mt-2">{{ course.name }}</p>
        </div>
      </div>

      <div v-else>
        <div class="flex items-center gap-4 mb-6">
          <div class="radial-progress text-primary" :style="{ '--value': progressPercent }" role="progressbar">
            {{ progressPercent }}%
          </div>
          <div>
            <p class="text-sm text-base-content/60">Learning Progress</p>
            <p class="text-sm font-medium">{{ completedIds.size }} / {{ totalLessons }} lessons</p>
          </div>
        </div>

        <div v-for="set in course.sets" :key="set.id" class="card bg-base-100 shadow-sm mb-4">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ set.name }}</h3>
              <button
                v-if="currentSetId === set.id"
                class="btn btn-outline btn-xs"
                @click="jumpToSet(set.id)"
              >
                Jump Here
              </button>
            </div>
            <div class="space-y-1 mt-2">
              <div
                v-for="lesson in set.lessons"
                :key="lesson.id"
                class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
                :class="{
                  'hover:bg-base-200': lessonStatus(lesson) !== 'locked',
                  'opacity-50': lessonStatus(lesson) === 'locked',
                  'bg-primary/5': lessonStatus(lesson) === 'current',
                }"
                @click="goToLesson(lesson)"
              >
                <span
                  class="badge badge-sm"
                  :class="{
                    'badge-success': lessonStatus(lesson) === 'completed',
                    'badge-info': lessonStatus(lesson) === 'current',
                    'badge-ghost': lessonStatus(lesson) === 'locked',
                  }"
                >
                  {{ lessonStatus(lesson) }}
                </span>
                <span class="text-sm">{{ lesson.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
