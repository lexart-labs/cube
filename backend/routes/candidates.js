const express = require('express');
const router = express.Router();
const Candidate = require('../services/candidates.service');

router.get('/', async function (req, res) {
	const { page, search } = req.query;
	let response = await Candidate.all(null, page || 0, search);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/pages', async function (req, res) {
	const { search } = req.query;
	let response = await Candidate.countResults(search);
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/:id', async function (req, res) {
	let response = await Candidate.one(req.params.id);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/', async function (req, res) {
	let post = req.body;
	let response = await Candidate.upsert(post);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.put('/:id', async function (req, res) {
	let post = req.body;
	post.id = req.params.id;
	let response = await Candidate.upsert(post);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.delete('/:id', async function (req, res) {
	let response = await Candidate.delete(req.params.id);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

module.exports = router;