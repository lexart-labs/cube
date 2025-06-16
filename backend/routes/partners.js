const express = require('express');
const router = express.Router();
const PartnersService = require('../services/partners.service');
const checkToken = Mdl.middleware
const EmailService = require('../services/email.service');

// Get all partners with pagination
router.get('/', checkToken, async (req, res) => {
    const page = req.query.page || 0;
    const search = req.query.search || '';
    const response = await PartnersService.all(page, search);
    res.send(response);
});

// Get total pages count
router.get('/pages', checkToken, async (req, res) => {
    const search = req.query.search || '';
    const response = await PartnersService.countResults(search);
    res.send(response);
});

// Get partner by ID
router.get('/:id', checkToken, async (req, res) => {
    const id = req.params.id;
    const response = await PartnersService.one(id);
    res.send(response);
});

// Create or update partner
router.post('/', checkToken, async (req, res) => {
    const partner = req.body;
    const response = await PartnersService.upsert(partner);
    res.send(response);
});

// Update partner
router.put('/:id', checkToken, async (req, res) => {
    const id = req.params.id;
    const partner = req.body;
    partner.id = id;
    const response = await PartnersService.upsert(partner);
    res.send(response);
});

// Delete partner
router.delete('/:id', checkToken, async (req, res) => {
    const id = req.params.id;
    const response = await PartnersService.delete(id);
    res.send(response);
});

// Add this new route to your existing partners.js file
router.post('/send-matches', checkToken, async (req, res) => {
  try {
    const matchData = req.body;
    
    if (!matchData || Object.keys(matchData).length === 0) {
      return res.status(400).send({ error: "No match data provided" });
    }
    
    const result = await EmailService.sendPartnerMatches(matchData);
    res.send(result);
  } catch (error) {
    console.error('Error sending partner matches:', error);
    res.status(500).send({ error: "Failed to send partner matches" });
  }
});

module.exports = router;
