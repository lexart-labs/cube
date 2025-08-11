<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 p-4 max-w-md mx-auto">
    <h2 class="text-xl font-semibold">Offboarding Form</h2>

    <div>
      <label for="guid" class="block font-medium">GUID</label>
      <input id="guid" type="text" :value="guid" readonly class="mt-1 block w-full border rounded px-3 py-2 bg-gray-100" />
    </div>

    <div>
      <label for="fullName" class="block font-medium">Full Name</label>
      <input id="fullName" type="text" v-model="form.fullName" required class="mt-1 block w-full border rounded px-3 py-2" />
    </div>

    <div>
      <label for="email" class="block font-medium">Email</label>
      <input id="email" type="email" v-model="form.email" required class="mt-1 block w-full border rounded px-3 py-2" />
    </div>

    <div>
      <label for="phone" class="block font-medium">Phone</label>
      <input id="phone" type="tel" v-model="form.phone" required class="mt-1 block w-full border rounded px-3 py-2" />
    </div>

    <div>
      <label for="contractFile" class="block font-medium">Offboarding Contract Upload</label>
      <input id="contractFile" type="file" @change="handleFileUpload('contract', $event)" class="mt-1 block w-full" />
      <div v-if="uploadProgress.contract">Uploading: {{ uploadProgress.contract }}%</div>
      <div v-if="form.contractFileUrl"><a :href="form.contractFileUrl" target="_blank" class="text-blue-600 underline">View uploaded contract</a></div>
    </div>

    <div>
      <label for="computerPhotos" class="block font-medium">Computer Photos Upload (if applicable)</label>
      <input id="computerPhotos" type="file" multiple @change="handleFileUpload('photos', $event)" class="mt-1 block w-full" />
      <div v-if="uploadProgress.photos">Uploading: {{ uploadProgress.photos }}%</div>
      <div v-if="form.computerPhotosUrls.length">
        <ul class="list-disc pl-5">
          <li v-for="(url, index) in form.computerPhotosUrls" :key="index" class="flex items-center space-x-2">
            <img :src="url" alt="Uploaded photo" class="w-16 h-16 object-cover rounded" />
            <a :href="url" target="_blank" class="text-blue-600 underline flex-1">Photo {{ index + 1 }}</a>
            <button @click.prevent="removePhoto(index)" class="text-red-600 hover:text-red-800">Delete</button>
          </li>
        </ul>
      </div>
    </div>

    <div class="pt-4">
      <button type="submit" :disabled="isSubmitting" class="bg-blue-600 text-white px-4 py-2 rounded">
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </button>
    </div>

    <div v-if="error" class="text-red-600 mt-2">{{ error }}</div>
  </form>
</template>

<script setup>
const props = defineProps({
  guid: String
})

console.log('GUID prop:', props.guid)

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const guid = ref('')
const form = ref({
  fullName: '',
  email: '',
  phone: '',
  contractFileUrl: '',
  computerPhotosUrls: []
})
const uploadProgress = ref({ contract: 0, photos: 0 })
const isSubmitting = ref(false)
const error = ref('')

onMounted(() => {
  if (props.guid) {
    guid.value = props.guid
  } else {
    error.value = 'GUID not provided in URL.'
  }
})

async function handleFileUpload(type, event) {
  error.value = ''
  const files = event.target.files
  if (!files.length) return

  try {
    const uploadedUrls = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/offboarding/upload')

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          uploadProgress.value[type] = percent
        }
      }

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            resolve(response.url)
          } else {
            reject('Upload failed with status ' + xhr.status)
          }
        }
        xhr.onerror = () => reject('Upload error')
      })

      xhr.send(formData)
      const url = await uploadPromise
      uploadedUrls.push(url)
    }

    if (type === 'contract') {
      form.value.contractFileUrl = uploadedUrls[0] || ''
    } else if (type === 'photos') {
      form.value.computerPhotosUrls = uploadedUrls
    }
  } catch (e) {
    error.value = e
  }
}

async function handleSubmit() {
  if (!guid.value) {
    error.value = 'GUID is required.'
    return
  }
  isSubmitting.value = true
  error.value = ''

  try {
    const body = {
      guid: guid.value,
      fullName: form.value.fullName,
      email: form.value.email,
      phone: form.value.phone,
      contractFileUrl: form.value.contractFileUrl,
      computerPhotosUrls: form.value.computerPhotosUrls
    }

    const response = await fetch('/api/offboarding/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Submission failed')
    }

    console.log('Offboarding data submitted successfully!')
    router.push('/under-review')
  } catch (e) {
    error.value = e.message
  } finally {
    isSubmitting.value = false
  }
}

function removePhoto(index) {
  form.value.computerPhotosUrls.splice(index, 1);
}
</script>

<style scoped>
form {
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
