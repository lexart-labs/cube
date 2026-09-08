export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  // Load reCAPTCHA script
  const loadRecaptcha = () => {
    return new Promise((resolve) => {
      if (window.grecaptcha) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${config.public.recaptchaSiteKey}`
      script.onload = resolve
      document.head.appendChild(script)
    })
  }
  
  return {
    provide: {
      recaptcha: async (action) => {
        await loadRecaptcha()
        
        return new Promise((resolve, reject) => {
          window.grecaptcha.ready(() => {
            window.grecaptcha.execute(config.public.recaptchaSiteKey, { action })
              .then(resolve)
              .catch(reject)
          })
        })
      }
    }
  }
})