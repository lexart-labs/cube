const express = require('express');
const router = express.Router();
const User 	 = require('../services/users.service')


router.post('/login', async function (req, res) {
	let post = req.body;
	let response = await User.loginLextracking(post.email, post.password);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/school/:token', async function (req, res) {
	let token = req.params.token;
	let response = await User.byToken(token);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/check-type', Mdl.middleware, async function (req, res) {
	let post = req.body;
	let response = await User.checkType(post.token, post.userId);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/all', async function (req, res) {
	const { page } = req.query;
	let response = await User.all(req.headers['user-id'], page || 0);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/lextracking/all', Mdl.middleware, async function (req, res) {
	let response = await User.allUserLextracking(req);

	// console.log(response)

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/count', Mdl.middleware, async function (req, res) {
	let response = await User.countResults(req.headers['user-id']);
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/:id', Mdl.middleware, async function (req, res) {
	let response = await User.one(req.params.id, req.headers['token']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/upsert', Mdl.middleware, async function (req, res) {
	let post 	 = req.body;
	let response = await User.upsert(post, req.headers['user-id']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

module.exports = router;