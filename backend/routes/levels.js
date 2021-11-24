const express = require('express');
const router = express.Router();
const Level 	 = require('../services/levels.service');

router.get('/', async (_req, res) => {
  const response = await Level.getAll();

  res.set(['Content-Type', 'application/json']);
  return res.send(response);
});

module.exports = router;