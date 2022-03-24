const express = require('express');
const router = express.Router();
const Payments 	 = require('../services/payments.service');


router.put('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Payments.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', async (req, res) => {
  const response = await Payments.insert(req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Payments.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/count', async (req, res) => {
  const { year, idUser } = req.query;
  const { company_slug: slug } = req.headers;
  const response = await Payments.count(year, slug, idUser);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const response = await Payments.getOne(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/', async (req, res) => {
  const { year, p: page, idUser } = req.query;
  const { company_slug: slug } = req.headers;
  const response = await Payments.getAll(
    slug, year, page, idUser || false
  );

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;