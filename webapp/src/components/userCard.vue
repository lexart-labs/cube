<template>
  <div class="card-parent">
    <div class="usr-info">
      <h2>{{user.name}}</h2>
      <h4><b>{{user.position}}</b></h4>
      <div class="tags">
        <div
          class="tag"
          v-for="(tech, i) in user.technologies"
          :key="`tech${i}`"
        >
          {{tech}}
        </div>
      </div>
    </div>
    <Rombo
      :evaluations="user.evaluations"
      :year="new Date().getFullYear()"
    />
    <input type="checkbox">
  </div>
</template>

<script>
export default {
  name: 'UserCard',
  props: ['user'],
  components: {Rombo},
  data () {
    return {};
  },

}
</script>

<style scoped>
  
</style>
