<template>
  <div class="text-center">
    <div class="mb-6">
      <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <!-- Clock Icon -->
        <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
      <p class="text-gray-600 mb-4">
        Thank you for submitting your onboarding information. We are currently reviewing all your details and will get back to you soon.
      </p>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm text-yellow-800">
            <strong>Status:</strong> Your application is being processed. You will receive an email notification once the review is complete.
          </p>
        </div>
      </div>
    </div>
    
    <button
      @click="authStore.logout()"
      class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
    >
      Logout
    </button>
  </div>
</template>

<script setup>
const authStore = useAuthStore()
</script>