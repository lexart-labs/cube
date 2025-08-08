<template>
  <div>
    <h2 class="text-2xl font-bold text-center mb-6">Compliance Documents</h2>
    
    <div class="space-y-8">
      <!-- NDA Contract Section -->
      <div class="border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Non-Disclosure Agreement (NDA)
        </h3>
        
        <div class="mb-4 space-y-2">
          <button
            @click="viewContract('nda')"
            class="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center mr-2"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            View NDA Contract
          </button>
          
          <button
            @click="downloadContract('nda')"
            class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Download NDA Contract
          </button>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Upload Signed NDA Contract
          </label>
          <input
            @change="handleFileUpload('nda', $event)"
            type="file"
            accept=".pdf"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div v-if="uploadProgress.nda" class="mt-2">
            <div class="bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: uploadProgress.nda + '%' }"
              ></div>
            </div>
            <p class="text-sm text-gray-600 mt-1">Uploading NDA... {{ uploadProgress.nda }}%</p>
          </div>
          <div v-if="contracts.nda_contract" class="mt-2 text-sm text-green-600">
            ✓ NDA Contract uploaded successfully
          </div>
        </div>
      </div>
      
      <!-- Service Agreement Section -->
      <div class="border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Service Agreement
        </h3>
        
        <div class="mb-4 space-y-2">
          <button
            @click="viewContract('service_agreement')"
            class="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center mr-2"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            View Service Agreement
          </button>
          
          <button
            @click="downloadContract('service')"
            class="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Download Service Agreement
          </button>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Upload Signed Service Agreement
          </label>
          <input
            @change="handleFileUpload('service', $event)"
            type="file"
            accept=".pdf"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div v-if="uploadProgress.service_agreement" class="mt-2">
            <div class="bg-gray-200 rounded-full h-2">
              <div 
                class="bg-green-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: uploadProgress.service_agreement + '%' }"
              ></div>
            </div>
            <p class="text-sm text-gray-600 mt-1">Uploading Service Agreement... {{ uploadProgress.service_agreement }}%</p>
          </div>
          <div v-if="contracts.service_agreement_contract" class="mt-2 text-sm text-green-600">
            ✓ Service Agreement uploaded successfully
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <div class="flex justify-between mt-8">
      <button
        type="button"
        @click="$emit('prev')"
        class="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600"
      >
        Previous
      </button>
      
      <button
        @click="handleSubmit"
        :disabled="loading || !contracts.nda_contract || !contracts.service_agreement_contract"
        class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Submitting...' : 'Submit Contracts' }}
      </button>
    </div>

    <!-- Contract Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="flex justify-between items-center p-6 border-b">
          <h3 class="text-xl font-semibold">{{ modalContent.title }}</h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[70vh]">
          <div v-if="loadingModal" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">Loading contract...</p>
          </div>
          <div v-else v-html="modalContent.content" class="prose max-w-none"></div>
        </div>
        <div class="flex justify-end p-6 border-t">
          <button
            @click="closeModal"
            class="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const authStore = useAuthStore()

const emit = defineEmits(['next', 'prev'])

const contracts = ref({
  nda_contract: '',
  service_agreement_contract: ''
})

const uploadProgress = ref({
  nda: 0,
  service: 0
})

const loading = ref(false)
const error = ref('')

const canProceed = computed(() => {
  return contracts.value.nda_contract && contracts.value.service_agreement_contract
})

const downloadContract = async (type) => {
  try {
    const endpoint = type === 'nda' ? '/api/contracts/nda' : '/api/contracts/service-agreement'
    const filename = type === 'nda' ? 'NDA_Contract.pdf' : 'Service_Agreement_Contract.pdf'
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download contract')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    error.value = `Failed to download ${type} contract`
  }
}

const handleFileUpload = async (type, event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.type !== 'application/pdf') {
    error.value = 'Please upload only PDF files'
    return
  }
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  
  try {
    error.value = ''
    uploadProgress.value[type] = 0
    
    const response = await $fetch('/api/upload-contract', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      onUploadProgress: (progress) => {
        uploadProgress.value[type] = Math.round((progress.loaded / progress.total) * 100)
      }
    })
    
    if (type === 'nda') {
      contracts.value.nda_contract = response.filename
    } else {
      contracts.value.service_agreement_contract = response.filename
    }
    
    uploadProgress.value[type] = 0
  } catch (err) {
    error.value = `Failed to upload ${type} contract`
    uploadProgress.value[type] = 0
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.submitContracts(contracts.value)
    emit('next')
  } catch (err) {
    error.value = 'Failed to submit contracts'
  } finally {
    loading.value = false
  }
}

const showModal = ref(false)
const loadingModal = ref(false)
const modalContent = ref({ title: '', content: '' })

const viewContract = async (type) => {
  showModal.value = true
  loadingModal.value = true
  
  try {
    const response = await $fetch(`/api/contracts/template?type=${type}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    modalContent.value = {
      title: response.data.title,
      content: response.data.content
    }
  } catch (err) {
    error.value = 'Failed to load contract content'
    showModal.value = false
  } finally {
    loadingModal.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  modalContent.value = { title: '', content: '' }
}
</script>