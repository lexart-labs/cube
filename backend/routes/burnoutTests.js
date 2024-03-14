const express = require('express');
const router = express.Router();
const BurnoutTest = require('../services/burnoutTests.service');

router.get('/all', Mdl.middleware, async function (req, res) {
	const { page, query } = req.query;
	let response = await BurnoutTest.all(req.headers['user-id'], page || 0, query);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/count', Mdl.middleware, async function (req, res) {
	const { query } = req.query;
	let response = await BurnoutTest.countResults(req.headers['user-id'], query);
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/:id', Mdl.middleware, async function (req, res) {
	let response = await BurnoutTest.one(req.params.id);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/upsert', Mdl.middleware, async function (req, res) {
	let post 	 = req.body;
	let response = await BurnoutTest.upsert(post, req.headers['user-id']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

module.exports = router;