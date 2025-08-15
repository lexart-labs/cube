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

        // Determine step based on user completion status
        this.currentStep = this.determineCurrentStep(response.user)

        // Store token in cookie
        const tokenCookie = useCookie('auth-token')
        tokenCookie.value = response.token

        return response
      } catch (error) {
        throw error
      }
    },

    determineCurrentStep(user) {
      // Step 0: Login (already completed if we're here)
      // Step 1: Onboarding (KYC)
      // Step 2: Compliance (Contracts)
      // Step 3: Review/Complete

      if (!user.has_kyc_data) {
        // User hasn't completed onboarding yet
        return 1
      }

      if (!user.has_contracts_data) {
        // User completed onboarding but not compliance
        return 2
      }

      // User completed both onboarding and compliance
      if (user.kyc_status === 'under_review') {
        return 3 // Review step
      }

      if (user.kyc_status === 'approved') {
        return 3 // Completion step
      }

      // Default to compliance step if status is unclear
      return 2
    },

    async submitKYC(formData) {
      try {
        const response = await $fetch('/api/kyc/submit', {
          method: 'POST',
          body: {
            fullName: formData.fullName,
            identityDocument: formData.identityDocument,
            fullAddress: formData.fullAddress,
            bankInformation: formData.bankInformation,
            country: formData.country,
            iban: formData.iban,
            intermediaryBank: formData.intermediaryBank,
            profilePhoto: formData.profilePhoto,
            phone: formData.phone,
            emergencyPhone: formData.emergencyPhone,
            // Add new company fields
            company_name: formData.company_name,
            company_rut: formData.company_rut,
            company_address: formData.company_address
          },
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })

        // Update user data
        this.user.has_kyc_data = true
        return response
      } catch (error) {
        throw error
      }
    },

    async submitContracts(contractData) {
      try {
        const transformedData = {
          ndaContract: contractData.nda_contract,
          serviceAgreementContract: contractData.service_agreement_contract
        }
        
        const response = await $fetch('/api/contracts/submit', {
          method: 'POST',
          body: transformedData,
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
    
        // Update user status after successful contracts submission
        this.user.kyc_status = 'under_review'
        this.user.has_kyc_data = true
        this.user.has_contracts_data = true
        
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
