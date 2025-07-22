<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Stepper Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="flex items-center"
            >
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep >= index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                ]"
              >
                {{ index }}
              </div>
              <span
                :class="[
                  'ml-2 text-sm font-medium',
                  currentStep >= index ? 'text-blue-600' : 'text-gray-500'
                ]"
              >
                {{ step.title }}
              </span>
              <div
                v-if="index < steps.length - 1"
                :class="[
                  'w-16 h-0.5 ml-4',
                  currentStep > index ? 'bg-blue-600' : 'bg-gray-300'
                ]"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <LoginStep v-if="currentStep === 0" @next="handleLogin" />
        <OnboardingForm v-if="currentStep === 1" @next="handleKYCSubmit" @prev="prevStep" />
        <ComplianceStep v-if="currentStep === 2" @next="handleContractsSubmit" @prev="prevStep" />
        <ReviewStep v-if="currentStep === 3 && isUnderReview" />
        <CompletionStep v-if="currentStep === 3 && !isUnderReview" />
      </div>
    </div>
  </div>
</template>

<script setup>
// Set the page title
useHead({
  title: 'Ext. Onboarding Cube'
})

const authStore = useAuthStore()

const steps = [
  { title: 'Login' },
  { title: 'Onboarding' },
  { title: 'Compliance' },
  { title: 'Complete' }
]

const currentStep = computed(() => authStore.currentStep)
const isUnderReview = computed(() => authStore.user?.kyc_status === 'under_review')

const handleLogin = () => {
  authStore.nextStep()
}

const handleKYCSubmit = () => {
  authStore.nextStep()
}

const handleContractsSubmit = () => {
  authStore.nextStep()
}

const prevStep = () => {
  authStore.prevStep()
}
</script>
