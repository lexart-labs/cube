import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    currentStep: 0
  }),

  actions: {
    async login(email, password, recaptchaToken) {
      try {
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password, recaptchaToken }
        })

        this.user = response.user
        this.token = response.token
        
        // Determine step based on user status
        if (response.user.has_kyc_data && response.user.kyc_status === 'under_review') {
          this.currentStep = 3 // Go to review step
        } else {
          this.currentStep = 1 // Go to onboarding form
        }

        // Store token in cookie
        const tokenCookie = useCookie('auth-token')
        tokenCookie.value = response.token

        return response
      } catch (error) {
        throw error
      }
    },

    async submitKYC(kycData) {
      try {
        const response = await $fetch('/api/kyc/submit', {
          method: 'POST',
          body: kycData,
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        
        return response
      } catch (error) {
        throw error
      }
    },

    async submitContracts(contractData) {
      try {
        const response = await $fetch('/api/contracts/submit', {
          method: 'POST',
          body: contractData,
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        
        // Update user status
        this.user.kyc_status = 'under_review'
        this.user.has_kyc_data = true
        
        return response
      } catch (error) {
        throw error
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.currentStep = 0
      const tokenCookie = useCookie('auth-token')
      tokenCookie.value = null
    },

    nextStep() {
      this.currentStep++
    },

    prevStep() {
      if (this.currentStep > 0) {
        this.currentStep--
      }
    }
  }
})