const express = require('express');
const router = express.Router();
const Team 	 = require('../services/teams.service');

router.get('/', Mdl.middleware, async (req, res) => {
  const idLead = req.headers['user-id'];
  const response = await Team.all(idLead);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.put('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Team.upsert(id, req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', Mdl.middleware, async (req, res) => {
  const response = await Team.insertOne(req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Team.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;