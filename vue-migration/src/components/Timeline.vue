<template>
  <div>
    <div v-show="!isLoading" class="timeline" ref="chartdiv"></div>
  </div>
</template>

<script>
import axios from 'axios';
require('dotenv').config();
const { APP_NAME, API } = process.env;

export default {
  name: "Timeline",
  data: function () {
    return {
      isLoading: false,
    };
  },
  mounted: async function () {
    this.isLoading = true;
    const AIMLpositions = [
      { position: "IA/ML Developer" },
      { position: "IA/ML Architect" },
      { position: "Research Developer" },
      { position: "Research Architect" },
    ];

    const { data: { response: careers } } = await axios.get(`${API}careers`);

    let id = localStorage.getItem('id-' + APP_NAME);
    let token = localStorage.getItem('token-app-' + APP_NAME);
    let userId = localStorage.getItem('id-' + APP_NAME);
    const headers = { token, 'user-id': userId };

    const { data: { response } } = await axios.get(API + "users/" + id, { headers });
    this.isLoading = false;

    const current = response.position;
    let isFull = true;

    am4core.useTheme(am4themes_animated);
    const chart = am4core.create(this.$refs.chartdiv, am4charts.XYChart);

    const generateData = (array) =>
      array.reduce((acc, cur, i) => {
        const docTemplate = {
          x: i++,
          y: 1,
          text: cur.position,
          center: i % 2 === 0 ? "top" : "bottom",
          config: {
            fill: isFull ? "#2bc4a7" : "white",
          },
        };

        if (cur.position === current) {
          isFull = false;
          return [...acc, { ...docTemplate, config: { fill: "#2bc4a7" } }];
        }
        return [...acc, docTemplate];
      }, []);

    chart.data = AIMLpositions.includes(current)
      ? generateData(AIMLpositions)
      : generateData(careers);

    // Configuraciones
    let xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    xAxis.dataFields.category = "x";
    xAxis.renderer.grid.template.disabled = true;
    xAxis.renderer.labels.template.disabled = true;
    xAxis.tooltip.disabled = true;

    let yAxis = chart.yAxes.push(new am4charts.ValueAxis());
    yAxis.min = 0;
    yAxis.max = 2;
    yAxis.strictMinMax = true;
    yAxis.renderer.grid.template.disabled = true;
    yAxis.renderer.labels.template.disabled = true;
    yAxis.renderer.baseGrid.disabled = true;
    yAxis.tooltip.disabled = true;

    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.categoryX = "x";
    series.dataFields.valueY = "y";
    series.stroke = am4core.color("#2bc4a7");
    series.strokeWidth = 4;

    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.fill = am4core.color("#2bc4a7");
    bullet.circle.configField = "config";
    bullet.circle.radius = 10;

    let labelBullet = series.bullets.push(new am4charts.LabelBullet());
    labelBullet.label.text = "{text}";
    labelBullet.label.maxWidth = 150;
    labelBullet.label.wrap = true;
    labelBullet.label.truncate = false;
    labelBullet.label.textAlign = "middle";
    labelBullet.label.propertyFields.verticalCenter = "center";
    labelBullet.label.paddingTop = 20;
    labelBullet.label.paddingBottom = 20;
    labelBullet.label.fill = am4core.color("#6a6c74");
  },
};
</script>
