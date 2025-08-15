const express = require('express');
const router = express.Router();
const Plataforms = require('../services/plataforms.service');

router.get('/:id', Mdl.middleware, async function (req, res) {
  const { id } = req.params;

  const response = await Plataforms.getById(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.get('/', Mdl.middleware, async function (_req, res) {
  const response = await Plataforms.getAll();

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.post('/', Mdl.middleware, async function (req, res) {
  const response = await Plataforms.insert(req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.put('/:id', Mdl.middleware, async function (req, res) {
  const { id } = req.params;

  const response = await Plataforms.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.delete('/:id', Mdl.middleware, async function (req, res) {
  const { id } = req.params;

  const response = await Plataforms.remove(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

module.exports = router;
