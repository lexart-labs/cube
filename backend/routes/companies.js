const express = require('express');
const router  = express.Router();
const Companies   = require('../services/companies.service');

router.get('/', Mdl.middleware, async (_req, res) => {
  const response = await Companies.getAll();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/openToExternalRelations', Mdl.middleware, async (_req, res) => {
  const response = await Companies.getAllOpenToExternalRelations();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/verify', Mdl.middleware, async (req, res) => {
  const { company } = req.body;

  const response = await Companies.exists(company);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Companies.getById(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', Mdl.middleware, async (req, res) => {
  const response = await Companies.insert(req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.put('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Companies.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Companies.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;