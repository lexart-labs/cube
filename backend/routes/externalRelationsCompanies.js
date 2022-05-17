const { Router } = require('express');
const express = require('express');
const router = express.Router();
const relationsExternal = require('../services/externalRelationsCompanies.service');
const Utils = require('../services/utils.service');

router.get('/', async (req, res) => {
  const idUser = req.headers['user-id'];
  const companyId = await Utils.getIdCompanyByIdUser(idUser);
  const response = await relationsExternal.getAll(companyId);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const response = await relationsExternal.getById(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', async (req, res) => {
  const { idCompany1, idCompany2 } = req.body;

  const response = await relationsExternal.newRelation(idCompany1, idCompany2);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  const response = await relationsExternal.deActiveRelation(id);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
})

module.exports = router;
