const express = require('express');
const router  = express.Router();
const Companies   = require('../services/companies.service');

router.get('/', async (_req, res) => {
  const response = await Companies.getAll();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Companies.getById(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', async (req, res) => {
  const response = await Companies.insert(req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Companies.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Companies.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;