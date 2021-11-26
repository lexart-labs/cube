const express = require('express');
const router = express.Router();
const Career 	 = require('../services/careers.service');

router.get('/', async (_req, res) => {
  const response = await Career.getAll();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.put('/:id', async (req, res) => {
  const { position, active } = req.body;
  const { id } = req.params;

  const response = await Career.upsert(id, position, active);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', async (req, res) => {
  const { position, active } = req.body;

  const response = await Career.upsert(null, position, active);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Career.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;
