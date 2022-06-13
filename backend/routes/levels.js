const express = require('express');
const router = express.Router();
const Level 	 = require('../services/levels.service');
const User = require('../services/users.service')

router.get('/', async (_req, res) => {
  const response = await Level.getAll();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.get('/by_user', async (req,res) => {
  const user_id = req.headers.user_id
  const user = await User.one(user_id)
  const response = await Level.getByUser(user.response.idCompany, user.response.idCareerType)
  return res.send(response);
})

router.get('/by_user_admin', async (req, res) => {
  const { company_slug } = req.headers;
  const response = await Level.getByUserAdmin(company_slug, res)

  return res.send(response)
})

router.get('/by_career_type/:idCareerType', async (req,res)=> {
  const { company_slug } = req.headers;
  const { idCareerType } = req.params;
  
  const response = await Level.getByCareerType(company_slug, idCareerType, res)
  return res.send(response);
})

router.put('/:id', async (req, res) => {
  const { level, active } = req.body;
  const { id } = req.params;

  const response = await Level.upsert(id, level, active);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.post('/', async (req, res) => {
  const { level, active, idCareerType, id } = req.body;
  const { company_slug } = req.headers;

  const response = await Level.upsert(id, level, active, idCareerType, company_slug, res);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { company_slug } = req.headers;

  const response = await Level.remove(id, company_slug, res);

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;