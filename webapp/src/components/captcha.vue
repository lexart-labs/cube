<template>
  <div
    class="g-recaptcha"
    :data-sitekey="siteKey"
    data-callback="onGetToken"
  >
  </div>
</template>

<script>
import { SITE_KEY } from "../../env";

window.onGetToken = function(tk) {
  window.localStorage.setItem('captchatoken', tk);
};

export default {
  name: 'Captcha',
  data() {
    return {
      siteKey: SITE_KEY,
    }
  },
  methods: {},
}
</script>

