const express = require('express');
const router = express.Router();
const Hours 	 = require('../services/continuity.service');


router.put('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Hours.update(id, req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', async (req, res) => {
  const response = await Hours.insert(req.body);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Hours.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/count', async (req, res) => {
  const response = await Hours.count();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const response = await Hours.getOne(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/', async (req, res) => {
  const { month, year, idCompany, p } = req.query;
  const response = await Hours.getAll(
    Number(idCompany),
    Number(month),
    Number(year),
    Number(p)
  );

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;