<template>
  <div class="ctl-card">
    <h4>{{ $t('dashboard.romboTitle')}}</h4>
    <br />
    <div id="chartdiv"></div>
  </div>
</template>

<script>
import axios from 'axios';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { APP_NAME, API_LEXTRACKING } from '../../env';

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
        label: 'Human Factor',
        value: 0
      },
      {
        label: 'Performance',
        value: 0
      },
      {
        label: 'Ability',
        value: 0
      },
      {
        label: 'Evolution',
        value: 0
      },
      {
        label: 'Continuity',
        value: 0
      }
    ],
      isLoading: false,
      monthlyHours: [],
      id: JSON.parse(localStorage.getItem(`_lextracking_user-${APP_NAME}`)).idLextracking,
    };
  },
  methods: {
    parseEvaluation(evaluation, key) {
      const MAX_VALUE = 5;
      if(!evaluation.indicadores || !evaluation.indicadores[key]) return 0;

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
      const ENDPOINT_BASE = `${API_LEXTRACKING}/tracks-by-year`;
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
      series.stroke = am4core.color('#0676ff');
      series.fillOpacity = 0.2;
      series.fill = am4core.color('#0676ff');
    },
    async setUpData() {
      // Calculo el factor de conversion para decimal, horas / cien por ciento;
    const MAX_MONTH_HOURS_CONV_FACTOR = 200 / 100;
    const SECOND_TO_HOURS = (60 * 60);
    const EVALUATION_LENGTH = this.evaluations.length;


    // Busco las horas menuales por año
    console.log(this.id)
    const monthlyHours = await this.getMonthHours(this.id, this.year);
    console.log(monthlyHours)
  

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
        label: 'Human Factor',
        value: humanFactorAvg.toFixed(2)
      },
      {
        label: 'Performance',
        value: performanceAvg.toFixed(2)
      },
      {
        label: 'Ability',
        value: abilityAvg.toFixed(2)
      },
      {
        label: 'Evolution',
        value: evolutionAvg.toFixed(2)
      },
      {
        label: 'Continuity',
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
    height: calc(400px - 4rem);
    max-height: 100%;
  }
  .ctl-card {
    height: 400px;
    width: 100%;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    padding: 1rem;
  }
  .ctl-card:hover {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  }
</style>
