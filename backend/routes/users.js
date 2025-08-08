const express = require('express');
const router = express.Router();
const User 	 = require('../services/users.service');
const Technologies = require('../services/technologies.service');

router.post('/login', Mdl.middleware, async function (req, res) {
	const  { email, idCompany } = req.body;
	let response = await User.loginCube(email, idCompany);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/login/verify', async function (req, res) {
	const { email, password, captcha } = req.body;
	let response = await User.loginVerify(email, password, captcha);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/school/:token', Mdl.middleware, async function (req, res) {
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

router.get('/all', Mdl.middleware, async function (req, res) {
	const { page, query } = req.query;

	let response = await User.all(req.headers['user-id'], page || null, query, req.user);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/lextracking/all', Mdl.middleware, async function (req, res) {
	const { minified } = req.query;
	res.set(['Content-Type', 'application/json']);
	let response = {};

	try {
		response = await User.allUserLextracking(req, minified, res);
	} catch ({ message }) {
		console.log('error -->', message);
	}
    res.send(response);
})

router.get('/unasigned', Mdl.middleware, async function (req, res) {
	const { company_slug } = req. headers;
	const response = await User.findUnasigneds(company_slug);
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/count', Mdl.middleware, async function (req, res) {
	const { q } = req.query;
	let response = await User.countResults(req.headers['user-id'], q);
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/lextracking-ids', Mdl.middleware, async function (_req, res) {
	const response = await User.devIds();
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/upsert', Mdl.middleware, async function (req, res) {
	let post 	 = req.body;
	console.log("user-id :: ", req.headers['user-id'])
	let response = await User.upsert(post, req.headers['user-id'], req.headers["company_slug"]);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/leads', Mdl.middleware, async function (req, res) {
	const { company_slug } = req.headers;
	let response = await User.getLeads(company_slug);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/lead-tree/:id', Mdl.middleware, async (req, res) => {
	const { id } = req.params;
	const response = await User.getLeaderDevs(id);

	res.set(['Content-Type', 'application/json']);
  res.send(response);
})

router.get('/lead-tree', Mdl.middleware, async (req, res) => {
	const { company_slug } = req.headers;
	const response = await User.getLeaderDevTree(company_slug);

	res.set(['Content-Type', 'application/json']);
  res.send(response);
})

router.post('/dev-indexes/count', Mdl.middleware, async (req, res) => {
	const { techs } = req.body;

	let response = await User.countDevs(techs);
	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/dev-indexes/:id', Mdl.middleware, async (req, res) => {
	const { token } = req.headers;
	const { year } = req.query;
	const { id } = req.params;

	const response = await User.devIndexes(id, token, Number(year));

	res.set(['Content-Type', 'application/json']);
  res.send(response);
})

router.post('/dev-indexes', Mdl.middleware, async (req, res) => {
	const { token, company_slug } = req.headers;
	const { year, page } = req.query;
	const { techs } = req.body;

	const response = await User.allDevelopersIndicators(
		token, Number(year), techs, page, company_slug
	);

	res.set(['Content-Type', 'application/json']);
  res.send(response);
})

router.get('/:id', Mdl.middleware, async function (req, res) {
	let response = await User.one(req.params.id, req.headers['token']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/skills/:id', async function (req, res) {
	const { id } = req.params;
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
	const { id, idTech } = req.params;

	const response = await Technologies.createRelation(id, idTech);

	res.set(['Content-Type', 'application/json']);
  res.send(response);
});

router.delete('/skills/:id/:idTech', async function (req, res) {
	const { id, idTech } = req.params;

	const response = await Technologies.deleteRelation(id, idTech);

	res.set(['Content-Type', 'application/json']);
  res.send(response);
});

router.get('/companies/participate', async function (req, res) {
	const { token } = req.headers;
	const response = await User.getCompaniesWhichUserParticipate(token);

	res.status(response.status).send(response);
})

router.post('/checkexist', Mdl.middleware, async function (req, res) {
	const { email, idCompany } = req.body;
	const response = await User.checkUserAlreadyExists(email, idCompany);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

module.exports = router;
