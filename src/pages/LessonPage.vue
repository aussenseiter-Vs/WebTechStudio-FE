<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourse, getUserProgress, checkAnswer, completeLesson } from '@/services/api'

const route = useRoute()
const router = useRouter()
const slug = route.params.course_slug
const lessonId = Number(route.params.lesson_id)

const course = ref(null)
const lesson = ref(null)
const loading = ref(true)
const error = ref('')
const contentIndex = ref(0)
const selectedOption = ref(null)
const answerFeedback = ref(null)
const answering = ref(false)
const completing = ref(false)
const completedLessons = ref([])

const STORAGE_KEY = `lesson_${lessonId}_content`

onMounted(async () => {
  try {
    const [courseRes, progressRes] = await Promise.all([
      getCourse(slug),
      getUserProgress(),
    ])
    course.value = courseRes.data.data
    completedLessons.value =
      progressRes.data.data.progress
        .find((p) => p.course.id === course.value.id)
        ?.completed_lessons || []

    const found = findLesson(course.value, lessonId)
    if (!found) {
      error.value = 'Lesson not found'
      return
    }
    lesson.value = found

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const idx = parseInt(saved)
      if (!isNaN(idx) && idx < lesson.value.contents.length) {
        contentIndex.value = idx
      }
    }
  } catch (e) {
    error.value = 'Failed to load lesson'
  } finally {
    loading.value = false
  }
})

function findLesson(c, id) {
  for (const set of c.sets) {
    for (const l of set.lessons) {
      if (l.id === id) return l
    }
  }
  return null
}

const contents = computed(() => lesson.value?.contents || [])
const currentContent = computed(() => contents.value[contentIndex.value])
const totalContents = computed(() => contents.value.length)

const lessonCompleted = computed(() => {
  return completedLessons.value.some((l) => l.id === lessonId)
})

function selectOption(optionId) {
  if (answering.value) return
  selectedOption.value = optionId
  answerFeedback.value = null
}

async function submitAnswer() {
  if (!selectedOption.value || answering.value) return
  answering.value = true
  answerFeedback.value = null
  try {
    const res = await checkAnswer(lessonId, currentContent.value.id, selectedOption.value)
    const isCorrect = res.data.data.is_correct
    if (isCorrect) {
      advanceContent()
    } else {
      answerFeedback.value = { type: 'error', message: 'Wrong answer, try again' }
      selectedOption.value = null
    }
  } catch {
    answerFeedback.value = { type: 'error', message: 'Failed to check answer' }
  } finally {
    answering.value = false
  }
}

async function advanceContent() {
  answerFeedback.value = null
  selectedOption.value = null
  const nextIndex = contentIndex.value + 1
  if (nextIndex >= totalContents.value) {
    await finishLesson()
  } else {
    contentIndex.value = nextIndex
    localStorage.setItem(STORAGE_KEY, nextIndex.toString())
  }
}

async function finishLesson() {
  completing.value = true
  try {
    await completeLesson(lessonId)
    localStorage.removeItem(STORAGE_KEY)
    router.push(`/${slug}`)
  } catch {
    error.value = 'Failed to complete lesson'
  } finally {
    completing.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-error">{{ error }}</p>
      <button class="btn btn-ghost mt-4" @click="router.push(`/${slug}`)">Back to Course</button>
    </div>

    <template v-else-if="lesson && currentContent">
      <div class="mb-6">
        <h1 class="text-xl font-bold">{{ lesson.name }}</h1>
        <div class="flex items-center gap-2 mt-2">
          <progress
            class="progress progress-primary w-full"
            :value="contentIndex"
            :max="totalContents"
          ></progress>
          <span class="text-sm text-base-content/60 whitespace-nowrap">
            {{ contentIndex + 1 }}/{{ totalContents }}
          </span>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <div v-if="currentContent.type === 'learn'">
            <p class="text-base-content/80 leading-relaxed whitespace-pre-line">{{ currentContent.content }}</p>
            <button class="btn btn-primary mt-6" @click="advanceContent" :disabled="completing">
              Continue
            </button>
          </div>

          <div v-else-if="currentContent.type === 'quiz'">
            <p class="font-medium mb-4">{{ currentContent.content }}</p>
            <div class="space-y-2">
              <button
                v-for="option in currentContent.options"
                :key="option.id"
                class="btn btn-outline w-full justify-start text-left h-auto py-3 px-4"
                :class="{
                  'btn-primary': selectedOption === option.id,
                }"
                @click="selectOption(option.id)"
                :disabled="answering"
              >
                {{ option.option_text }}
              </button>
            </div>
            <p
              v-if="answerFeedback"
              class="text-sm mt-3"
              :class="answerFeedback.type === 'error' ? 'text-error' : 'text-success'"
            >
              {{ answerFeedback.message }}
            </p>
            <button
              class="btn btn-primary mt-6"
              :disabled="!selectedOption || answering || completing"
              @click="submitAnswer"
            >
              {{ answering ? 'Checking...' : 'Submit Answer' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
