const express = require('express');
const router = express.Router();
const Career 	 = require('../services/careers.service');
const CareersType = require('../services/careersType.service');
const Utils = require('../services/utils.service');
const Middleware = require('../services/middleware.service')

router.get('/byUser', async (req, res) => {
  const idUser = req.headers['user-id'];
  const response = await Career.getByUser(idUser);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/byIdCareerType/:idCareer', async (req, res) => {
  const { company_slug } = req.headers;
  
  const idCompany = await Utils.getIdCompanyBySlug(company_slug, res)
  const { idCareer } = req.params;

  const response = await Career.getIdCareerType(idCareer, idCompany);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/byCompany', async (req, res) => {
  const { company_slug } = req.headers;
  const idCompany = await Utils.getIdCompanyBySlug(company_slug, res)
  res.set(['Content-Type', 'application/json']);
  const response = await Career.getByCompany(idCompany);

  return res.send(response);
});

router.put('/:id', async (req, res) => {
  const { position, active, idCareerType, minimumTime } = req.body;
  const { id } = req.params;
  const { company_slug } = req.headers;
  const idCompany = await Utils.getIdCompanyBySlug(company_slug, res);

  res.set(['Content-Type', 'application/json']);
  const response = await Career.upsert(id, position, active, idCompany, idCareerType, minimumTime);

  return res.send(response);
});

router.patch('/:idPosition/roadmap', Middleware.middleware, async (req, res) => {
  const { roadmap } = req.body
  const { idPosition } = req.params

  const response = await Career.editRoadmap(idPosition, roadmap)

  return res.send(response)
})

router.post('/', async (req, res) => {
  const { position, active, roadmap, idCareerType, minimumTime } = req.body;
  const { company_slug } = req.headers;
  
  const idCompany = await Utils.getIdCompanyBySlug(company_slug, res);
  const response = await Career.upsert(null, position, active, roadmap, idCompany, idCareerType, minimumTime);

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
});

router.put('/type/edit', async function (req, res) {
  const { company_slug } = req.headers;
  const { careerName, careerId } = req.body;

  const response = await CareersType.updateOneCareerType(careerName, careerId, company_slug);
  
  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/type/delete/:careerId', async (req, res) => {
  const { company_slug } = req.headers;
  const { careerId } = req.params;

  const response = await CareersType.deleteOneCareerType(careerId, company_slug);
  
  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const response = await Career.getById(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;
