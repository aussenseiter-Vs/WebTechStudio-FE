<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourse, checkAnswer, completeLesson } from '@/services/api'

const route = useRoute()
const router = useRouter()
const slug = route.params.course_slug
const jumpLessonId = Number(route.params.lesson_id)

const course = ref(null)
const currentSet = ref(null)
const loading = ref(true)
const error = ref('')

const quizItems = ref([])
const quizIndex = ref(0)
const selectedOption = ref(null)
const answerFeedback = ref(null)
const answering = ref(false)
const completing = ref(false)

onMounted(async () => {
  try {
    const courseRes = await getCourse(slug)
    course.value = courseRes.data.data

    const foundSet = findSetByLesson(course.value, jumpLessonId)
    if (!foundSet) {
      error.value = 'Set not found'
      return
    }
    currentSet.value = foundSet

    const items = []
    for (const lesson of foundSet.lessons) {
      for (const content of lesson.contents) {
        if (content.type === 'quiz') {
          items.push({ lesson, content })
        }
      }
    }
    quizItems.value = items
  } catch {
    error.value = 'Failed to load'
  } finally {
    loading.value = false
  }
})

function findSetByLesson(c, lessonId) {
  for (const set of c.sets) {
    for (const lesson of set.lessons) {
      if (lesson.id === lessonId) return set
    }
  }
  return null
}

const currentQuiz = computed(() => quizItems.value[quizIndex.value])
const totalQuizzes = computed(() => quizItems.value.length)
const progressPercent = computed(() => {
  if (totalQuizzes.value === 0) return 100
  return Math.round((quizIndex.value / totalQuizzes.value) * 100)
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
    const res = await checkAnswer(
      currentQuiz.value.lesson.id,
      currentQuiz.value.content.id,
      selectedOption.value
    )
    const isCorrect = res.data.data.is_correct
    if (isCorrect) {
      await advanceQuiz()
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

async function advanceQuiz() {
  answerFeedback.value = null
  selectedOption.value = null
  const nextIndex = quizIndex.value + 1
  if (nextIndex >= totalQuizzes.value) {
    await finishSet()
  } else {
    quizIndex.value = nextIndex
  }
}

async function finishSet() {
  completing.value = true
  try {
    const lessons = currentSet.value.lessons
    for (const lesson of lessons) {
      await completeLesson(lesson.id)
    }
    router.push(`/${slug}`)
  } catch {
    error.value = 'Failed to complete set'
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

    <template v-else-if="currentSet">
      <div class="mb-6">
        <h1 class="text-xl font-bold">{{ currentSet.name }}</h1>
        <p class="text-sm text-base-content/60 mt-1">Jump mode - complete all quizzes in this set</p>
        <div class="flex items-center gap-2 mt-2">
          <progress
            class="progress progress-primary w-full"
            :value="quizIndex"
            :max="totalQuizzes"
          ></progress>
          <span class="text-sm text-base-content/60 whitespace-nowrap">
            {{ quizIndex + 1 }}/{{ totalQuizzes }}
          </span>
        </div>
      </div>

      <div v-if="currentQuiz" class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <p class="text-xs text-base-content/50 mb-2">Lesson: {{ currentQuiz.lesson.name }}</p>
          <p class="font-medium mb-4">{{ currentQuiz.content.content }}</p>
          <div class="space-y-2">
            <button
              v-for="option in currentQuiz.content.options"
              :key="option.id"
              class="btn btn-outline w-full justify-start text-left h-auto py-3 px-4"
              :class="{ 'btn-primary': selectedOption === option.id }"
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

      <div v-else class="text-center py-12 text-base-content/50">
        No quizzes in this set.
        <button class="btn btn-ghost mt-4" @click="router.push(`/${slug}`)">Back to Course</button>
      </div>
    </template>
  </div>
</template>
