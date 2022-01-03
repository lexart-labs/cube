<template>
  <div class="ctl-card">
    <h4>Vision general por año</h4>
    <br />
    <div id="chartdiv"></div>
  </div>
</template>

<script>
import axios from 'axios';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { APP_NAME } from '../../env';

export default {
  name: 'Rombo',
  props: ['evaluations', 'year'],
  watch: {
    evaluations: function(newVal, oldVal) {
      this.setUpData();
    }
  },
  data() {
    return {
      graphData: [
      {
        label: 'humanFactor',
        value: 0
      },
      {
        label: 'performance',
        value: 0
      },
      {
        label: 'ability',
        value: 0
      },
      {
        label: 'evolution',
        value: 0
      },
      {
        label: 'continuity',
        value: 0
      }
    ],
      isLoading: false,
      monthlyHours: [],
      id: JSON.parse(localStorage.getItem('_lextracking_user-lexart-cube-v1')).idLextracking,
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
    getMonthHours: async function(idLextracking, year) {
      this.isLoading = true;

      // Para teste local:
      const ENDPOINT_BASE = `http://localhost/lextracking/api/public/tracks-by-year`;
      const token = localStorage.getItem(`token-app-${APP_NAME}`);

      const headers = { token };

      const { data } =  await axios.get(`${ENDPOINT_BASE}/${idLextracking}/${year}`, { headers });
      if (data.response) {
        this.monthlyHours = data.response;
      }

      this.isLoading = false;
      return data.response;
    },
    sumAll(array, key) {
      return array.reduce((acc, cur) => acc += Number(cur[key]), 0);
    },
    buildGraphic() {
      let chart = am4core.create("chartdiv", am4charts.RadarChart);

      chart.data = this.graphData;

      /* Create axes */
      let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "label";

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
      series.stroke = am4core.color('#2bc4a7');
      series.fillOpacity = 0.2;
      series.fill = am4core.color('#2bc4a7');
    },
    async setUpData() {
      // Calculo el factor de conversion para decimal, horas / cien por ciento;
    const MAX_MONTH_HOURS_CONV_FACTOR = 200 / 100;
    const SECOND_TO_HOURS = (60 * 60);
    const EVALUATION_LENGTH = this.evaluations.length;


    // Busco las horas menuales por año
    const monthlyHours = await this.getMonthHours(this.id, this.year);
  

    // Calculo los datos para armar el grafico
    const evolutionAvg = this.sumAll(this.evaluations, 'total') / this.evaluations.length;
    let continuityAvg = 0;

    if (monthlyHours) {
      continuityAvg = (
        this.sumAll(monthlyHours, 'tracks') /
        (SECOND_TO_HOURS * monthlyHours.length * MAX_MONTH_HOURS_CONV_FACTOR)
      );
    }

    const humanFactorAvg = (
      this.evaluations.reduce((acc, cur) => {
        acc += this.parseEvaluation(cur,'factorHumano')
        return acc;
      }, 0) / EVALUATION_LENGTH
    );
    const performanceAvg = (
      this.evaluations.reduce((acc, cur) => {
        acc += this.parseEvaluation(cur,'desempeño')
        return acc;
      }, 0) / EVALUATION_LENGTH
    );
    const abilityAvg = (
      this.evaluations.reduce((acc, cur) => {
        acc += this.parseEvaluation(cur,'habilidades')
        return acc;
      }, 0) / EVALUATION_LENGTH
    );

    this.graphData = [
      {
        label: 'humanFactor',
        value: humanFactorAvg.toFixed(2)
      },
      {
        label: 'performance',
        value: performanceAvg.toFixed(2)
      },
      {
        label: 'ability',
        value: abilityAvg.toFixed(2)
      },
      {
        label: 'evolution',
        value: evolutionAvg.toFixed(2)
      },
      {
        label: 'continuity',
        value: continuityAvg.toFixed(2)
      }
    ];

    this.buildGraphic();
    },
  },
  mounted() {
    this.setUpData();
  },
}
</script>

<style scoped>
  #chartdiv {
    width: 100%;
    height: calc(100% - 3.9rem)
  }

  .ctl-card {
    max-height: 100%;
    width: 40%;
  }

  @media (max-width: 700px) {
    .ctl-card {
      height: auto;
      width: 100%;
    }

    #chartdiv {
      height: auto;
      min-height: 200px;
    }
  }

</style>
