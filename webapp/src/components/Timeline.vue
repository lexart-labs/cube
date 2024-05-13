<template>
  <div>
    <div v-show="!isLoading" class="timeline" ref="chartdiv"></div>
    <div class="modal" tabindex="-1" role="dialog" id="myModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><b>{{ $t("generic.asignments") }}</b></h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <header>
              <span>
                {{ $t("AdminUsers.daysLeftMessage") }}
                <b>{{ changePositionTime }} d.</b>
              </span>
            </header>
            <br />
            <div class="list-group list-group-flush">
              <span
                v-for="(atb, i) in jobAssignments"
                :key="i"
                class="
                  list-group-item
                  d-flex
                  justify-content-between
                  align-items-center
                "
              >
                {{ jobAssignmentsTranslated[i] }}
                <i
                  class="fas fa-check"
                  v-show="user.skills && user.skills[atb]"
                ></i>
              </span>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import translations from "../data/translate";
import { APP_NAME, API } from "../../env";
import minimunTimes from "../data/positionMinimunTimes";

export default {
  name: "Timeline",
  props: ["user"],
  data() {
    return {
      isLoading: false,
      jobAssignments: [],
      changePositionTime: 0,
      jobAssignmentsTranslated: [],
      careers: [],
    };
  },
  watch: {
    user: async function () {
      this.isLoading = true;
      const user = this.chartData
      const [careers] = await Promise.all([
      this.getCareers({ "user-id": user.id }),
      ]);
      this.isLoading = false;
      this.careers = careers;
      this.buildGraphic();
    },
  },
  methods: {
    showJobDetails(charge) {
      let foundCareer = this.careers.find((career)=> career.position == charge).roadmap;
      this.jobAssignments = foundCareer
      this.jobAssignmentsTranslated = foundCareer

      $("#myModal").modal();
    },
    getCareers: async function(headers) {
      const { data: { response: careers }} = await axios.get(`${API}careers/byUser`, { headers });
      return careers || [];
    },
    getUserInfo: async function(id, headers) {
      const { data: { response } } = await axios.get(`${API}users/${id}`, { headers });
      return response || {};
    },
    buildGraphic() {
      const AIMLpositions = [
        { position: "IA/ML Developer" },
        { position: "IA/ML Architect" },
        { position: "Research Developer" },
        { position: "Research Architect" },
      ];  

      const usr = this.chartData;

      const current = usr.position;
      let isFull = true;

      // The grapich will be created appended to this element
      am4core.useTheme(am4themes_animated);
      const chart = am4core.create(this.$refs.chartdiv, am4charts.XYChart);

      const generateData = (array) =>
        array.reduce((acc, cur, i) => {
          const docTemplate = {
            x: i + 1,
            y: 1,
            text: cur.position,
            center: i % 2 === 0 ? "top" : "bottom",
            config: {
              fill: isFull ? "#0676ff" : "white",
            },
          };

          if (cur.position === current) {
            isFull = false;
            return [...acc, { ...docTemplate, config: { fill: "#0676ff" } }];
          }
          return [...acc, docTemplate];
        }, []);

      chart.data = AIMLpositions.includes(current)
        ? generateData(AIMLpositions)
        : generateData(this.careers);

      // Hover effect
      chart.cursor = new am4charts.XYCursor();
      chart.cursor.lineX.disabled = true;
      chart.cursor.lineY.disabled = true;

      // Responsive
      chart.responsive.enabled = true;
      chart.responsive.useDefault = false;
      chart.responsive.rules.push({
        relevant: am4core.ResponsiveBreakpoints.widthL,
        state: function(target, stateId) {
          if (target instanceof am4charts.XYChart) {
            let state = target.states.create(stateId);

            state.properties.paddingTop = 10;
            state.properties.paddingRight = 15;
            state.properties.paddingBottom = 0;
            state.properties.paddingLeft = 15;
            state.properties.fontSize = 7.5;

            chart.cursor = false;
            chart.tapToActivate = true;
            chart.scrollbarX = new am4core.Scrollbar();
            //chart.scrollbarX.series.push(series);
            
            //colors outside
            chart.scrollbarX.background.fill = am4core.color("#dc67ab");
            chart.scrollbarX.background.fillOpacity = 0.2;

            //colors inside
            chart.scrollbarX.startGrip.background.fill = am4core.color("#CBA5A4");
            chart.scrollbarX.endGrip.background.fill = am4core.color("#CBA5A4");
            chart.scrollbarX.thumb.background.fill = am4core.color("#CBA5A4");
            
            //colors icons
            chart.scrollbarX.startGrip.icon.stroke = am4core.color("#8A5658");
            chart.scrollbarX.endGrip.icon.stroke = am4core.color("#8A5658");

            // height scrollbar
            chart.scrollbarX.minHeight = 3;

            //remove grip
            //chart.scrollbarX.startGrip.disabled = true;
            //chart.scrollbarX.endGrip.disabled = true;

            return state;
          } else if (target instanceof am4charts.XYChart && target.scrollbarX) {
            let state = target.states.create(stateId);
            let sbstate = target.scrollbarX.states.create(stateId);
            sbstate.properties.disabled = true;
            return state;
          }
          return null;
        }
      });

      // Configuraciones
      const xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      xAxis.dataFields.category = "x";
      xAxis.renderer.grid.template.disabled = true;
      xAxis.renderer.labels.template.disabled = true;
      xAxis.tooltip.disabled = true;

      const yAxis = chart.yAxes.push(new am4charts.ValueAxis());
      yAxis.min = 0;
      yAxis.max = 2;
      yAxis.strictMinMax = true;
      yAxis.renderer.grid.template.disabled = true;
      yAxis.renderer.labels.template.disabled = true;
      yAxis.renderer.baseGrid.disabled = true;
      yAxis.tooltip.disabled = true;

      const series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.categoryX = "x";
      series.dataFields.valueY = "y";
      series.stroke = am4core.color("#0676ff");
      series.strokeWidth = 4;

      const bullet = series.bullets.push(new am4charts.CircleBullet());
      bullet.circle.fill = am4core.color("#0676ff");
      bullet.circle.configField = "config";
      bullet.circle.radius = 12;
      bullet.events.on(
        "hit",
        function (e) {
          this.showJobDetails(e.target.dataItem.dataContext.text);
        },
        this
      );

      const labelBullet = series.bullets.push(new am4charts.LabelBullet());
      labelBullet.label.text = "{text}";
      labelBullet.label.maxWidth = 250;
      labelBullet.label.wrap = true;
      labelBullet.label.truncate = false;
      labelBullet.label.textAlign = "middle";
      labelBullet.label.propertyFields.verticalCenter = "center";
      labelBullet.label.paddingTop = 20;
      labelBullet.label.paddingBottom = 20;
      labelBullet.label.fill = am4core.color("#6a6c74");

      labelBullet.setStateOnChildren = true;
      labelBullet.states.create("hover").properties.scale = 1.2;

      const currentCareer = this.careers.find(position => position.id === usr.positionId);

      if(currentCareer) {

        if (usr.since < currentCareer.minimumTime) {
          this.changePositionTime = currentCareer.minimumTime - usr.since;
        }
      }
    },
  },
  async mounted() {
    // id = id of the user that will be required;
    // userId = id of the user doing the query;
    // they can be equal or not;
    // Build the graphic
    this.buildGraphic(this.user);
  },
  computed: {
    chartData() {
      return this.user;
    },
  },
};
</script>
