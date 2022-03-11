require('dotenv').config();
const axios = require('axios');

const API_LEXTRACKING = process.env.API_LEXTRACKING;

const syncWithTracking = async (token) => {
	const local = 'http://localhost/lextracking/api/';
	const ENDPOINT_BASE = `${local}/tracks-by-year`;
	const DEFAULT_TRACK = { month, metric: "seconds", tracks: 0 };
	const headers = { Authorization: token };
	const year = (new Date()).getFullYear();
	const month = (new Date()).getMonth();

	const sql = `SELECT id, idLextracking FROM users WHERE idCompany = 1`;
	const sqlUpsert = `
		IF EXISTS (SELECT 1 FROM colaborators_continuity WHERE idColaborator = ? AND month = ${month})
			UPDATE colaborators_continuity SET continuity = ? WHERE idColaborator = ? AND month = ${month}
		ELSE
			INSERT INTO colaborators_continuity
				(month, year, continuity, idColaborator)
			VALUES (${month}, ${year}, ?, ?)
		END
	`;

	const devIds = await conn.query(sql);
	const requestHourFromTracking = async (idLextracking) => {
		const { data } = await axios.get(`${ENDPOINT_BASE}/${idLextracking}/${year}?month=${month}`, { headers });
		return data.response ? data.response[0] : DEFAULT_TRACK;
	};
	const Hours = await Promise.all(devIds.map(el => requestHourFromTracking(el.idLextracking)));
	await Promise.all(
		Hours.map(({ tracks }, i) => {
			const idColaborator = devIds[i].id;
			const continuity = +tracks;
			conn.query(sqlUpsert, [idColaborator, continuity, idColaborator, continuity, idColaborator])
		})
	);
};

const getTrackingToken = async (email, password) => {
	const { data } = await axios.post(API_LEXTRACKING + 'login', { email, password });
	const response = data.response;

	return response ? response.token : 'error';
};


const sumAll = (array, key) => array.reduce((acc, cur) => acc += Number(cur[key]), 0);

// Get user hours by year on lextracking
const getMonthHours = async (id, year) => {
	const sql = `
		SELECT
			SUM(continuity) AS 'tracks',
			'seconds' AS 'metric',
			month
		FROM colaborators_continuity
		WHERE year = ? AND idColaborator = ?
		GROUP BY month;
	`;

	const data = await conn.query(sql, [year, id]);

	return data.length ? data : [];
};

// Sum all item at some evaluation topic and pass it to percentage
const parseEvaluation = (evaluation, key) => {
	const MAX_VALUE = 5;
	if (!evaluation.indicadores || !evaluation.indicadores[key]) return 0;

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
	const EVALUATION_LENGTH = evaluations.length;

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
		evaluations.reduce((acc, cur) => {
			acc += parseEvaluation(cur, 'desempeño')
			return acc;
		}, 0) / EVALUATION_LENGTH
	);
	const abilityAvg = (
		evaluations.reduce((acc, cur) => {
			acc += parseEvaluation(cur, 'habilidades')
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
			value: !isNaN(evolutionAvg) ? evolutionAvg.toFixed(2) : '0.00'
		},
		{
			label: 'Continuity',
			value: !isNaN(continuityAvg) ? continuityAvg.toFixed(2) : '0.00'
		}
	];

	return graphData;
};

module.exports = {
	setUpData,
	syncWithTracking,
	getTrackingToken,
};
