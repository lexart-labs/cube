<template>
  <div>
    <h2 class="text-2xl font-bold text-center mb-6">
      {{ hasExistingData ? 'Edit Onboarding Information' : 'Onboarding Information' }}
    </h2>

    <!-- Show loading state while fetching data -->
    <div v-if="loadingData" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Loading your information...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Personal Information Section -->
      <h3 class="text-xl font-semibold">Personal Information</h3>
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

			<div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Profile Photo
        </label>

        <!-- Show existing photo if available -->
        <div v-if="form.profilePhoto && !uploadProgress" class="mb-2">
          <div class="flex items-center space-x-2 text-sm text-green-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Current photo: {{ form.profilePhoto }}</span>
          </div>
        </div>

        <input
          ref="fileInput"
          @change="handleFileUpload"
          type="file"
          accept="image/*"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p class="text-xs text-gray-500 mt-1">
          {{ form.profilePhoto ? 'Upload a new photo to replace the current one' : 'Upload your profile photo' }}
        </p>

        <!-- Image preview -->
        <div v-if="form.profilePhoto && !uploadProgress" class="mt-3">
          <img
            :src="`/uploads/${form.profilePhoto}`"
            :alt="'Profile photo of ' + form.fullName"
            class="w-32 h-32 object-cover rounded-lg border border-gray-300 shadow-sm"
            @error="handleImageError"
          />
        </div>

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

			<!-- Company Information Section -->
      <h3 class="text-xl font-semibold mt-6">Company Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            v-model="form.companyName"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Company RUT/CNPJ
          </label>
          <input
            v-model="form.companyRut"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Company Address
        </label>
        <textarea
          v-model="form.companyAddress"
          required
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

			<!-- Bank Information Section -->
      <h3 class="text-xl font-semibold mt-6">Bank Information</h3>
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
          Bank Account Information <small>(for international accounts add SWIFT CODE here)</small>
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

      <div class="flex justify-between">
        <button
					style="visibility: hidden;"
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
          {{ loading ? 'Submitting...' : (hasExistingData ? 'Update' : 'Submit') }}
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
  emergencyPhone: '',
  // Add new company fields
  companyName: '',
  companyRut: '',
  companyAddress: ''
})

const loading = ref(false)
const loadingData = ref(false)
const error = ref('')
const uploadProgress = ref(0)
const fileInput = ref(null)
const hasExistingData = ref(false)

// Load existing KYC data when component mounts
onMounted(async () => {
  if (authStore.user?.has_kyc_data) {
    await loadExistingData()
  }
})

const loadExistingData = async () => {
  loadingData.value = true
  try {
    const response = await $fetch('/api/kyc/get', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })

    if (response.data) {
      // Pre-populate form with existing data
      Object.assign(form, response.data)
      hasExistingData.value = true
    }
  } catch (err) {
    console.error('Failed to load existing data:', err)
    // Don't show error to user, just proceed with empty form
  } finally {
    loadingData.value = false
  }
}

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
    // Map form fields to match database column names
    const formData = {
      ...form,
      company_name: form.companyName,
      company_rut: form.companyRut,
      company_address: form.companyAddress
    }

    await authStore.submitKYC(formData)
    emit('next')
  } catch (err) {
    error.value = err.data?.message || 'Submission failed'
  } finally {
    loading.value = false
  }
}
</script>
