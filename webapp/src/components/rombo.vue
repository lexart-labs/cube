<template>
  
</template>

<script>
export default {
  name: '',
  data() {
    return {

    };
  },
  methods: {
    parseEvaluation(evaluation, key) {
      const MAX_VALUE = 5;

      const valuesArray = evaluation.indicadores[key];
      const maxTotal = valuesArray.length * MAX_VALUE;

      const points = valuesArray.reduce((acc, cur, i) => {
        acc += parseInt(cur.total);
        return acc;
      }, 0);

      const result = (points * 100) / maxTotal;
      return result;
    },
  },
}
</script>