<template>
  <div>
    <input type="text" v-model="newTechnologie.name" placeholder="React Native">
    <select v-model="newTechnologie.plataform">
      <option value="" disabled>Selecione</option>
      <option
        v-for="(plataform, i) in plataforms"
        :value="plataform"
        :key="`plat-${i}`"
      >
        {{ plataform}}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'Technologies',
  data() {
    return {
      technologies: [],
      newTechnologie: {
        name: '',
        plataform: ''
      },
      plataforms: ['Web', 'Mobile', 'Desktop']
    };
  }
}
</script>
