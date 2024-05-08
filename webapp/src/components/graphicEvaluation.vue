<template>
  <div class="ctl-card">
    <h4>{{ $t('dashboard.histogramTitle') }}</h4>
    <br />
    <div class="grafic-evaluation" ref="chartdiv2" />
  </div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import translations from '../data/translate';

export default {
  name: "Graphic",
  props: ["evaluations"],
  data() {
    return {
      months: translations[this.$store.state.language].generic.months,
    };
  },
  watch: {
    evaluations: function (newVal, oldVal) {
      this.createGraphic();
    },
    '$store.state.language': function (newVal, oldVal) {
      this.months = translations[this.$store.state.language].generic.months;
      this.createGraphic();
    },
  },
  methods: {
    createGraphic() {
      am4core.useTheme(am4themes_animated);
      const chart = am4core.create(this.$refs.chartdiv2, am4charts.XYChart);

      const generateData = (array) => {
       
        const dataByMonth = {};

        
        array.forEach(item => {
          const month = new Date(item.fecha).getMonth();
          if (!dataByMonth[month]) {
            dataByMonth[month] = [];
          }
          dataByMonth[month].push(item);
        });

        Object.keys(dataByMonth).forEach(month => {
          dataByMonth[month].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        });

        return Object.keys(dataByMonth).reduce((acc, month) => {
          return acc.concat(dataByMonth[month].map(item => ({
            x: this.months[new Date(item.fecha).getMonth()],
            y: item.total,
            text: `${item.total} %`
          })));
        }, []);
      };

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
      series.sortByField = "x";
      series.stroke = am4core.color("#6a6c74");
      series.strokeWidth = 2;

      const bullet = series.bullets.push(new am4charts.CircleBullet());
      bullet.circle.fill = am4core.color("#0676ff");
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
