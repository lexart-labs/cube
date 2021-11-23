const express = require('express');
const router = express.Router();
const Career 	 = require('../services/careers.service');

router.get('/', async (_req, res) => {
  const response = await Career.getAll();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;
