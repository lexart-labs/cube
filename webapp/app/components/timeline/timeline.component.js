const Timeline = Vue.component('timeline-component', function (callback) {
	let viewUrl = './app/components/timeline/timelineView.html';

	axios.get(viewUrl).then(function (result) {
		let view = result.data;

		callback({
			mounted: function () {
				axios.get('http://localhost:3001/careers')
					.then(({ data: { response: careers } }) => {
						const current = 'Jr. Software Architect';
						let isFull = true;

						am4core.useTheme(am4themes_animated);
						const chart = am4core.create(this.$refs.chartdiv, am4charts.XYChart);

						const data = careers.reduce((acc, cur, i) => {
							const docTemplate = {
								x: i++,
								y: 1,
								text: cur.position,
								center: i % 2 === 0 ? 'top' : 'bottom',
								config: {
									fill: isFull ? '#2bc4a7' : 'white',
								},
							};

							if (cur.position === current) {
								isFull = false;
								return [...acc, { ...docTemplate, config: { fill: '#2bc4a7' } }]
							}
							return [...acc, docTemplate];
						}, []);

						// const bulletLabels = careers.map(({ position }, i) => ({
						// 	'x': `${i + 1}`,
						// 	'y': 1,
						// 	'text': position,
						// 	'center': i % 2 === 0 ? 'top' : 'bottom',
						// 	'config': {
						// 		'fill': position === current ? '#2bc4a7' : 'white',
						// 	}
						// }));

						chart.data = data;

						let xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
						xAxis.dataFields.category = 'x';
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
						series.dataFields.categoryX = 'x';
						series.dataFields.valueY = 'y';
						series.stroke = am4core.color('#2bc4a7');
						series.strokeWidth = 4;

						let bullet = series.bullets.push(new am4charts.CircleBullet());
						bullet.circle.fill = am4core.color('#2bc4a7');
						bullet.circle.configField = 'config';
						bullet.circle.radius = 10;

						let labelBullet = series.bullets.push(new am4charts.LabelBullet());
						labelBullet.label.text = '{text}';
						labelBullet.label.maxWidth = 150;
						labelBullet.label.wrap = true;
						labelBullet.label.truncate = false;
						labelBullet.label.textAlign = 'middle';
						labelBullet.label.propertyFields.verticalCenter = 'center';
						labelBullet.label.paddingTop = 20;
						labelBullet.label.paddingBottom = 20;
						labelBullet.label.fill = am4core.color('#6a6c74');
					});
			},
			template: view
		})
	})
});
