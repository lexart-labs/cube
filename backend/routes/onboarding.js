const express = require('express');
const router = express.Router();
const OnboardingService = require('../services/onboarding.service');

// Middleware to validate authentication
const validateAuth = (req, res, next) => {
  const { token, 'user-id': userId } = req.headers;
  
  if (!token || !userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Add additional token validation logic here if needed
  next();
};

// Get all pending users
router.get('/users', validateAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, status = 'pending' } = req.query;
    const result = await OnboardingService.getPendingUsers(
      parseInt(page), 
      parseInt(limit), 
      status
    );
    
    if (result.error) {
      return res.status(500).json(result);
    }
    
    res.json(result.response);
  } catch (error) {
    console.error('Error in onboarding users route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OnboardingService.getUserById(id);
    
    if (result.error) {
      return res.status(500).json(result);
    }
    
    res.json(result.response);
  } catch (error) {
    console.error('Error in onboarding user details route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve user
router.post('/users/:id/approve', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OnboardingService.approveUser(id);
    
    if (result.error) {
      return res.status(500).json(result);
    }
    
    res.json(result.response);
  } catch (error) {
    console.error('Error in approve user route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status
router.post('/users/:id/status', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await OnboardingService.updateUserStatus(id, status);
    
    if (result.error) {
      return res.status(500).json(result);
    }
    
    res.json(result.response);
  } catch (error) {
    console.error('Error in update user status route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;