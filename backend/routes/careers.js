const express = require('express');
const router = express.Router();
const Career 	 = require('../services/careers.service');
const CareersType = require('../services/careersType.service');

router.get('/', async (_req, res) => {
  const response = await Career.getAll();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.put('/:id', async (req, res) => {
  const { position, active } = req.body;
  const { id } = req.params;

  const response = await Career.upsert(id, position, active);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', async (req, res) => {
  const { position, active } = req.body;

  const response = await Career.upsert(null, position, active);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await Career.remove(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

// Careers Type
router.get('/type', async (req, res) => {
  const { company_slug } = req.headers;
  const { page } = req.query;

  const response = await CareersType.getByIdCompany(company_slug, page, res);
  
  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/type/new', async (req, res) => {
  const { company_slug } = req.headers;
  const { careerName } = req.body;
  const response = await CareersType.createNewCareerType(careerName, company_slug);
  
  res.set(['Content-Type', 'application/json']);
  return res.send(response);
})

router.put('/type/edit', async function (req, res) {
  const { company_slug } = req.headers;
  const { careerName, careerId } = req.body;

  const response = await CareersType.updateOneCareerType(careerName, careerId, company_slug);
  
  res.set(['Content-Type', 'application/json']);
  return res.send(response);
})

router.delete('/type/delete/:careerId', async (req, res) => {
  const { company_slug } = req.headers;
  const { careerId } = req.params;

  const response = await CareersType.deleteOneCareerType(careerId, company_slug);
  
  res.set(['Content-Type', 'application/json']);
  return res.send(response);
})
module.exports = router;
