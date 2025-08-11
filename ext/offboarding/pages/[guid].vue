<template>
  <OffboardingForm :guid="guid" />
</template>

<script setup>
import { useRoute } from 'vue-router'
import OffboardingForm from '~/components/OffboardingForm.vue'

const route = useRoute()
const guid = route.params.guid
</script>