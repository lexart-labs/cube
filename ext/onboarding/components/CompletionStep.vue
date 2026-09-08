<template>
  <div class="text-center">
    <div class="mb-6">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete!</h2>
      <p class="text-gray-600">
        Thank you for completing the onboarding process. Your information has been submitted successfully.
      </p>
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
