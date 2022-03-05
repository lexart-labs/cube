const express = require('express');
const router = express.Router();
const Collaborators = require('../services/collaborators.service');

router.get('/by-id/:id', async function (req, res) {
  const { id } = req.params;
  const company_slug = req.headers.company_slug;
  res.set(['Content-Type', 'application/json']);

  await Collaborators.getByIdUser(id, company_slug, res);
});

router.get('/', async function (req, res) {
  const company_slug = req.headers.company_slug;
  const page_number = req.query.page
  res.set(['Content-Type', 'application/json']);
  
  await Collaborators.getByCompany(company_slug, page_number, res);
});

router.get('/quantity-of-pages', async function (req, res) {
  const company_slug = req.headers.company_slug;
  res.set(['Content-Type', 'application/json']);
  
  await Collaborators.countPages(company_slug, res);
});

router.post('/', async function (req, res) {
  const company_slug = req.headers.company_slug;
  res.set(['Content-Type', 'application/json']);
  
  await Collaborators.insert(req.body, company_slug, res);
});

router.put('/:id', async function (req, res) {
  const company_slug = req.headers.company_slug;
  const { id } = req.params;
  res.set(['Content-Type', 'application/json']);

  await Collaborators.update(id, req.body, company_slug, res);
});

router.delete('/:id', async function (req, res) {
  const company_slug = req.headers.company_slug;
  const { id } = req.params;
  res.set(['Content-Type', 'application/json']);

  await Collaborators.remove(id, company_slug, res);
});

module.exports = router;
