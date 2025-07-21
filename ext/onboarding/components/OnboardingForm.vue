<template>
  <div>
    <h2 class="text-2xl font-bold text-center mb-6">Onboarding Information</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            v-model="form.fullName"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Identity Document
          </label>
          <input
            v-model="form.identityDocument"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Full Address
        </label>
        <textarea
          v-model="form.fullAddress"
          required
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            v-model="form.country"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            IBAN
          </label>
          <input
            v-model="form.iban"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Bank Information
        </label>
        <textarea
          v-model="form.bankInformation"
          required
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Intermediary Bank
        </label>
        <input
          v-model="form.intermediaryBank"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Profile Photo
        </label>
        <input
          ref="fileInput"
          @change="handleFileUpload"
          type="file"
          accept="image/*"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div v-if="uploadProgress" class="mt-2">
          <div class="bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">Uploading... {{ uploadProgress }}%</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            v-model="form.phone"
            type="tel"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Emergency Phone
          </label>
          <input
            v-model="form.emergencyPhone"
            type="tel"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div class="flex justify-between">
        <button
          type="button"
          @click="$emit('prev')"
          class="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600"
        >
          Previous
        </button>
        
        <button
          type="submit"
          :disabled="loading"
          class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Submitting...' : 'Submit' }}
        </button>
      </div>
    </form>
    
    <div v-if="error" class="mt-4 text-red-600 text-sm text-center">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['next', 'prev'])
const authStore = useAuthStore()

const form = reactive({
  fullName: '',
  identityDocument: '',
  fullAddress: '',
  bankInformation: '',
  country: '',
  iban: '',
  intermediaryBank: '',
  profilePhoto: '',
  phone: '',
  emergencyPhone: ''
})

const loading = ref(false)
const error = ref('')
const uploadProgress = ref(0)
const fileInput = ref(null)

const handleFileUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  try {
    uploadProgress.value = 0
    
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await $fetch('/api/upload', {
      method: 'POST',
      body: formData,
      onUploadProgress: (progress) => {
        uploadProgress.value = Math.round((progress.loaded / progress.total) * 100)
      }
    })
    
    form.profilePhoto = response.filename
    uploadProgress.value = 0
  } catch (err) {
    error.value = 'File upload failed'
    uploadProgress.value = 0
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.submitKYC(form)
    emit('next')
  } catch (err) {
    error.value = err.data?.message || 'Submission failed'
  } finally {
    loading.value = false
  }
}
</script>