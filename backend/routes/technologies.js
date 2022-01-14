const express = require('express');
const router = express.Router();
const Technologies = require('../services/technologies.service');

router.get('/', async function (_req, res) {
  const response = await Technologies.get();

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.get('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await Technologies.get(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.post('/', async function (req, res) {
  const response = await Technologies.insert(req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.put('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await Technologies.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.delete('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await Technologies.remove(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

module.exports = router;
