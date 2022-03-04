const express = require('express');
const router = express.Router();
const collaborators = require('../services/collaborators.service');

router.get('/:id', async function (req, res) {
  const { id } = req.params;
  const company_slug = req.headers.company_slug;

  const response = await collaborators.getByIdUser(id, company_slug);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.get('/', async function (req, res) {
    const company_slug = req.headers.company_slug;
    const response = await collaborators.getByCompany(company_slug);

    res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.post('/', async function (req, res) {
  const response = await collaborators.insert(req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.put('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await collaborators.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

router.delete('/:id', async function (req, res) {
  const { id } = req.params;

  const response = await Plataforms.remove(id);

  res.set(['Content-Type', 'application/json']);
    res.send(response);
});

module.exports = router;
