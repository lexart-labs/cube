const express = require('express');
const router = express.Router();
const User 	 = require('../services/users.service');
const Technologies = require('../services/technologies.service');


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
	let response = await User.all(req.headers['user-id'], page || null);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/lextracking/all', Mdl.middleware, async function (req, res) {
	const { minified } = req.query;
	let response = await User.allUserLextracking(req, minified);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/count', Mdl.middleware, async function (req, res) {
	let response = await User.countResults(req.headers['user-id']);
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/lextracking-ids', async function (_req, res) {
	const response = await User.devIds();
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/upsert', Mdl.middleware, async function (req, res) {
	let post 	 = req.body;
	let response = await User.upsert(post, req.headers['user-id']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/leads', Mdl.middleware, async function (_req, res) {
	let response = await User.getLeads();

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/lead-tree', async (_req, res) => {
	const response = await User.getLeaderDevTree();
	
	res.set(['Content-Type', 'application/json']);
  res.send(response);
})

router.get('/dev-indexes', async (req, res) => {
	const { token } = req.headers;
	const { year } = req.query;

	const response = await User.allDevsIndexes(token, Number(year));
	
	res.set(['Content-Type', 'application/json']);
  res.send(response);
})

router.get('/:id', Mdl.middleware, async function (req, res) {
	let response = await User.one(req.params.id, req.headers['token']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/skills/:id', async function (req, res) {
	const {id} = req.params;
	const { isManager } = req.query;
	let response;

	if(isManager) {
		response = await Technologies.getByLead(id);
	} else {
		response = await Technologies.getByUser(id);
	}

	res.set(['Content-Type', 'application/json']);
  res.send(response);
});

router.post('/skills/:id/:idTech', async function (req, res) {
	const { id, idTech} = req.params;

	const response = await Technologies.createRelation(id, idTech);

	res.set(['Content-Type', 'application/json']);
  res.send(response);
});

router.delete('/skills/:id/:idTech', async function (req, res) {
	const { id, idTech} = req.params;

	const response = await Technologies.deleteRelation(id, idTech);

	res.set(['Content-Type', 'application/json']);
  res.send(response);
});

module.exports = router;