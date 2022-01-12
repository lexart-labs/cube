const express = require('express');
const router = express.Router();
const Technologies = require('../services/technologies.service');

router.get('/', Mdl.middleware, async function (_req, res) {
  const response = await Technologies.get();

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.get('/:id', Mdl.middleware, async function (req, res) {
  const { id } = req.params;

  const response = await Technologies.get(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.post('/', Mdl.middleware, async function (req, res) {
  const response = await Technologies.insert(req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.put('/:id', Mdl.middleware, async function (req, res) {
  const { id } = req.params;

  const response = await Technologies.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.delete('/:id', Mdl.middleware, async function (req, res) {
  const { id } = req.params;

  const response = await Technologies.remove(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

module.exports = router;
