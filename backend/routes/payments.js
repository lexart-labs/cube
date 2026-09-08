const express = require('express');
const router = express.Router();
const Payments 	 = require('../services/payments.service');

router.put('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Payments.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', Mdl.middleware, async (req, res) => {
  const response = await Payments.insert(req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Payments.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/count', Mdl.middleware, async (req, res) => {
  const { year, idUser } = req.query;
  const { company_slug: slug } = req.headers;
  const response = await Payments.count(year, slug, +idUser);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;
  const response = await Payments.getOne(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/', Mdl.middleware, async (req, res) => {
  const { year, p: page, idUser } = req.query;
  const { company_slug: slug } = req.headers;
  const response = await Payments.getAll(slug, year, page, +idUser);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;