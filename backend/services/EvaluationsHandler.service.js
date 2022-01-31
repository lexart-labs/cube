const sumAll = (array, key) => array.reduce((acc, cur) => acc += Number(cur[key]), 0);

// Get user hours by year on lextracking
const getMonthHours = async (idLextracking, year, token) => {
	const API_LEXTRACKING = 'https://api.lexart.com.uy/lextracking-dev/';
	const ENDPOINT_BASE = `${API_LEXTRACKING}public/tracks-by-year`;
	const headers = { token };

	const { data } =  await axios.get(`${ENDPOINT_BASE}/${idLextracking}/${year}`, { headers });

	return data.response || [];
};

// Sum all item at some evaluation topic and pass it to percentage
const parseEvaluation = (evaluation, key) => {
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
};

// Parse all evaluation to an average percentage value
const setUpData = async (idLextracking, year, token, evaluations) => {
	const MAX_MONTH_HOURS_CONV_FACTOR = 200 / 100;
	const SECOND_TO_HOURS = (60 * 60);
	const EVALUATION_LENGTH = this.evaluations.length;

	// Busco las horas menuales por año
	const monthlyHours = await getMonthHours(idLextracking, year, token);

	const evolutionAvg = sumAll(evaluations, 'total') / evaluations.length;
	let continuityAvg = 0;
	if (monthlyHours) {
		continuityAvg = (
			sumAll(monthlyHours, 'tracks') /
			(SECOND_TO_HOURS * monthlyHours.length * MAX_MONTH_HOURS_CONV_FACTOR)
		);
	}
	const humanFactorAvg = (
		evaluations.reduce((acc, cur) => {
			acc += parseEvaluation(cur, 'factorHumano')
			return acc;
		}, 0) / EVALUATION_LENGTH
	);
	const performanceAvg = (
		this.evaluations.reduce((acc, cur) => {
			acc += this.parseEvaluation(cur, 'desempeño')
			return acc;
		}, 0) / EVALUATION_LENGTH
	);
	const abilityAvg = (
		this.evaluations.reduce((acc, cur) => {
			acc += this.parseEvaluation(cur, 'habilidades')
			return acc;
		}, 0) / EVALUATION_LENGTH
	);

	const graphData = [
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

	return graphData;
};

module.exports = {
  setUpData,
};
