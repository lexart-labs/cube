const express = require('express');
const router = express.Router();
const DevOrigins = require('../services/DevOrigins.service');

router.get('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await DevOrigins.getById(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.get('/', async function (_req, res) {
  const response = await DevOrigins.getAll();

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.post('/', async function (req, res) {
  const response = await DevOrigins.insert(req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.put('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await DevOrigins.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.delete('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await DevOrigins.remove(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

module.exports = router;
