<template>
  <div
    :class="isSelected ? 'card-parent selected' : 'card-parent'"
    v-on:click="onClick(user)"
  >
    <div class="usr-info">
      <h2 class="is-big-text is-bold">{{ user.name }}</h2>
      <h4>
        <b>{{ user.position }}</b>
      </h4>
      <div class="tags">
        <h4 class="tag">
          <span
            class="badge badge-primary col-4"
            v-for="(tech, i) in user.technologies"
            :key="`tech${i}`"
          >
            {{ tech }}
          </span>
        </h4>
      </div>
    </div>
    <div class="graphic" :ref="`chartdiv2`"></div>
  </div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";

export default {
  name: "UserCard",
  props: ["user", "selected", "onClick"],
  watch: {
    user: function () {
      this.buildGraphic();
    },
  },
  methods: {
    buildGraphic() {
      let chart = am4core.create(this.$refs[`chartdiv2`], am4charts.RadarChart);

      chart.data = this.chartData;

      /* Create axes */
      let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "label";
      categoryAxis.fontSize = 12;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.renderer.gridType = "polygons";
      valueAxis.min = 0;
      valueAxis.max = 100;

      /* Create and configure series */
      let series = chart.series.push(new am4charts.RadarSeries());
      series.dataFields.valueY = "value";
      series.dataFields.categoryX = "label";
      series.name = "Development";
      series.strokeWidth = 1.5;
      series.stroke = am4core.color("#2bc4a7");
      series.fillOpacity = 0.2;
      series.fill = am4core.color("#2bc4a7");
    },
  },
  mounted() {
    this.buildGraphic();
  },
  computed: {
    chartData: function () {
      return this.user.indicadores;
    },
    isSelected: function () {
      return this.selected;
    },
  },
};
</script>

<style scoped>
.card-parent {
  max-width: 80%;
  height: 300px;
  display: flex;
  margin: 1rem auto 0;
  justify-content: space-between;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid transparent;
}
.card-parent:hover {
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.usr-info {
  flex-basis: 30%;
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
  flex-basis: 30%;
  height: 200px;
  justify-content: center;
  align-items: center;
}
.selected {
  border: 2px solid var(--green-2);
}
</style>
