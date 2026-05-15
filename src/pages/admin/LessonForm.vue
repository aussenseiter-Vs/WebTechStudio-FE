<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourse, createLesson } from '@/services/api'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug

const course = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = ref({
  name: '',
  set_id: Number(route.query.set_id) || '',
})

const contents = ref([])

onMounted(async () => {
  try {
    const res = await getCourse(slug)
    course.value = res.data.data
  } catch {
    error.value = 'Failed to load course'
  } finally {
    loading.value = false
  }
})

function addContent(type) {
  const content = { type, content: '' }
  if (type === 'quiz') {
    content.options = [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ]
  }
  contents.value.push(content)
}

function removeContent(index) {
  contents.value.splice(index, 1)
}

function addOption(contentIndex) {
  contents.value[contentIndex].options.push({ option_text: '', is_correct: false })
}

function removeOption(contentIndex, optIndex) {
  contents.value[contentIndex].options.splice(optIndex, 1)
}

function setCorrect(contentIndex, optIndex) {
  const options = contents.value[contentIndex].options
  options.forEach((o, i) => (o.is_correct = i === optIndex))
}

async function submit() {
  error.value = ''
  if (!form.value.name || !form.value.set_id) {
    error.value = 'Lesson name and set are required'
    return
  }
  if (!contents.value.length) {
    error.value = 'At least one content item is required'
    return
  }
  for (let i = 0; i < contents.value.length; i++) {
    const c = contents.value[i]
    if (!c.content) {
      error.value = `Content item ${i + 1} has no text`
      return
    }
    if (c.type === 'quiz') {
      const correctCount = c.options.filter((o) => o.is_correct).length
      if (correctCount === 0) {
        error.value = `Quiz ${i + 1} has no correct answer selected`
        return
      }
      if (correctCount > 1) {
        error.value = `Quiz ${i + 1} has multiple correct answers (only one allowed)`
        return
      }
      const emptyOpt = c.options.some((o) => !o.option_text)
      if (emptyOpt) {
        error.value = `Quiz ${i + 1} has empty option fields`
        return
      }
    }
  }

  saving.value = true
  try {
    await createLesson({
      name: form.value.name,
      set_id: form.value.set_id,
      contents: contents.value,
    })
    router.push(`/admin/courses/${slug}/manage`)
  } catch (e) {
    const data = e.response?.data
    if (data?.errors) {
      error.value = Object.values(data.errors).flat().join(', ')
    } else {
      error.value = data?.message || 'Failed to create lesson'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <div class="mb-6">
      <router-link :to="`/admin/courses/${slug}/manage`" class="link link-hover text-sm">
        &larr; Back to Course
      </router-link>
      <h1 class="text-2xl font-bold mt-1">Create Lesson</h1>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else-if="course">
      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <div class="form-control">
            <label class="label"><span class="label-text">Lesson Name</span></label>
            <input v-model="form.name" class="input input-bordered" required />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Set</span></label>
            <select v-model="form.set_id" class="select select-bordered" required>
              <option value="" disabled>Select a set</option>
              <option v-for="set in course.sets" :key="set.id" :value="set.id">
                {{ set.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold">Content Items</h2>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" @click="addContent('learn')">+ Add Learn</button>
          <button class="btn btn-outline btn-sm" @click="addContent('quiz')">+ Add Quiz</button>
        </div>
      </div>

      <div v-if="!contents.length" class="text-center py-8 text-base-content/50">
        No content items yet. Add a learn or quiz item.
      </div>

      <div v-for="(content, ci) in contents" :key="ci" class="card bg-base-100 shadow-sm mb-3">
        <div class="card-body p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="badge badge-sm" :class="content.type === 'learn' ? 'badge-info' : 'badge-warning'">
              {{ content.type }}
            </span>
            <button class="btn btn-ghost btn-xs text-error" @click="removeContent(ci)">Remove</button>
          </div>
          <div class="form-control">
            <textarea
              v-model="content.content"
              class="textarea textarea-bordered"
              :placeholder="content.type === 'learn' ? 'Content text...' : 'Question text...'"
              rows="2"
            ></textarea>
          </div>

          <div v-if="content.type === 'quiz'" class="mt-3">
            <p class="text-sm font-medium mb-2">Options</p>
            <div v-for="(option, oi) in content.options" :key="oi" class="flex items-center gap-2 mb-1">
              <input
                type="radio"
                :name="'correct_' + ci"
                class="radio radio-primary radio-sm"
                :checked="option.is_correct"
                @change="setCorrect(ci, oi)"
              />
              <input
                v-model="option.option_text"
                class="input input-bordered input-sm flex-1"
                :placeholder="'Option ' + (oi + 1)"
              />
              <button v-if="content.options.length > 2" class="btn btn-ghost btn-xs" @click="removeOption(ci, oi)">x</button>
            </div>
            <button class="btn btn-ghost btn-xs mt-1" @click="addOption(ci)">+ Add Option</button>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <router-link :to="`/admin/courses/${slug}/manage`" class="btn btn-ghost">Cancel</router-link>
        <button class="btn btn-primary" :disabled="saving" @click="submit">
          {{ saving ? 'Creating...' : 'Create Lesson' }}
        </button>
      </div>
    </template>
  </div>
</template>
