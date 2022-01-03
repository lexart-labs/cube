<template>
  <div class="ctl-card">
    <h4>Historico de evaluaciones</h4>
    <br />
    <div class="grafic-evaluation" ref="chartdiv2" />
  </div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

export default {
  name: "Graphic",
  props: ["evaluations"],
  watch: {
    evaluations: function(newVal, oldVal) {
      this.createGraphic();
    }
  },
  methods: {
    createGraphic() {
      const months = [
        "Enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];

      am4core.useTheme(am4themes_animated);
      const chart = am4core.create(this.$refs.chartdiv2, am4charts.XYChart);

      const generateData = (array) =>
        array.reduce((acc, cur) => {
          const docTemplate = {
            x: months[new Date(cur.fecha).getMonth()],
            y: cur.total,
            text: `${cur.total} %`,
          };

          return [...acc, docTemplate];
        }, []);

      chart.data = generateData(this.evaluations);

      // Configuraciones
      const xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      xAxis.dataFields.category = "x";
      xAxis.tooltip.disabled = false;

      const yAxis = chart.yAxes.push(new am4charts.ValueAxis());
      yAxis.min = 0;
      yAxis.max = 100;
      yAxis.strictMinMax = true;
      yAxis.tooltip.disabled = true;

      const series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.categoryX = "x";
      series.dataFields.valueY = "y";
      series.stroke = am4core.color("#6a6c74");
      series.strokeWidth = 3;

      const bullet = series.bullets.push(new am4charts.CircleBullet());
      bullet.circle.fill = am4core.color("#2bc4a7");
      bullet.circle.radius = 5;

      const labelBullet = series.bullets.push(new am4charts.LabelBullet());
      labelBullet.label.text = "{text}";
      labelBullet.label.maxWidth = 150;
      labelBullet.label.wrap = true;
      labelBullet.label.truncate = false;
      labelBullet.label.textAlign = "middle";
      labelBullet.label.propertyFields.verticalCenter = "bottom";
      labelBullet.label.paddingBottom = 30;
      labelBullet.label.fill = am4core.color("#6a6c74");
    },
  },
  mounted() {
    this.createGraphic();
  },
};
</script>

<style scoped>
  .ctl-card {
    max-height: 100%;
    width: 55%;
  }

  @media (max-width: 700px) {
    .ctl-card {
      height: auto;
      width: 100%;
    }
  }

</style>
