const express = require('express');
const router = express.Router();
const Collaborators = require('../services/collaborators.service');

router.get('/by-id/:id', async function (req, res) {
  const { id } = req.params;
  const company_slug = req.headers.company_slug;
  res.set(['Content-Type', 'application/json']);

  const response = await Collaborators.getByIdUser(id, company_slug, res);
  res.send(response)
});

router.get('/', async function (req, res) {
  const company_slug = req.headers.company_slug;
  const page_number = req.query.page;
  const name_to_filter = req.query.name;

  res.set(['Content-Type', 'application/json']);
  
  const response = await Collaborators.getByCompany(company_slug, page_number, name_to_filter, res);
  res.send(response)
});

router.get('/quantity-of-pages', async function (req, res) {
  const company_slug = req.headers.company_slug;
  const name_to_filter = req.query.name;

  res.set(['Content-Type', 'application/json']);
  
  const response = await Collaborators.countPages(company_slug, name_to_filter, res);
  res.send(response)
});

router.post('/', async function (req, res) {
  const company_slug = req.headers.company_slug;
  res.set(['Content-Type', 'application/json']);
  
  const response = await Collaborators.insert(req.body, company_slug, res);
  res.send(response)
});

router.put('/:id', async function (req, res) {
  const company_slug = req.headers.company_slug;
  const { id } = req.params;
  res.set(['Content-Type', 'application/json']);

  const response = await Collaborators.update(id, req.body, company_slug, res);
  res.send(response)
});

router.delete('/:id', async function (req, res) {
  const company_slug = req.headers.company_slug;
  const { id } = req.params;
  res.set(['Content-Type', 'application/json']);

  const response = await Collaborators.remove(id, company_slug, res);
  res.send(response)
});

module.exports = router;
