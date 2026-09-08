const express = require('express');
const router = express.Router();
const Hours 	 = require('../services/continuity.service');

router.put('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Hours.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', Mdl.middleware, async (req, res) => {
  const response = await Hours.insert(req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;

  const response = await Hours.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/count', Mdl.middleware, async (req, res) => {
  const {month, year } = req.query;
  const { company_slug } = req.headers;
  const response = await Hours.count(month, year, company_slug);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/all-year-hours/:id/:year', Mdl.middleware, async (req, res) => {
  const { id, year } = req.params;

  const response = await Hours.sumUserHoursByYear(id, year);
  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', Mdl.middleware, async (req, res) => {
  const { id } = req.params;
  const response = await Hours.getOne(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/', Mdl.middleware, async (req, res) => {
  const { month, year, idCompany, p } = req.query;
  const response = await Hours.getAll(
    idCompany,
    Number(month),
    Number(year),
    Number(p)
  );

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;