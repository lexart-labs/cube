<template>
  <div class="card-parent">
    <div class="usr-info">
      <h2>{{ user.name }}</h2>
      <h4>
        <b>{{ user.position }}</b>
      </h4>
      <div class="tags">
        <h4>
          <span
            class="badge badge-info badge-secondary"
            v-for="(tech, i) in user.technologies"
            :key="`tech${i}`"
          >
            {{ tech }}
          </span>
        </h4>
      </div>
    </div>
    <div class="graphic">
      <Rombo :evaluations="user.evaluations" :year="new Date().getFullYear()" />
    </div>
    <input type="checkbox" />
  </div>
</template>

<script>
import Rombo from "./rombo.vue";

export default {
  name: "UserCard",
  props: ["user"],
  components: { Rombo },
  data() {
    return {};
  },
};
</script>

<style scoped>
.card-parent {
  max-width: 60%;
  height: 300px;
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  padding: 1rem;
}
.card-parent:hover {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  }
.usr-info {
  flex-basis: 50%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.tags > h4 {
  display: flex;
  gap: 0.5rem;
}
.graphic {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
