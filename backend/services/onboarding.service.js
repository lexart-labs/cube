require('dotenv').config();
const axios = require('axios');

const ONBOARDING_API_URL = process.env.ONBOARDING_API_URL;
const ONBOARDING_API_KEY = process.env.ONBOARDING_API_KEY;

const OnboardingService = {
  // Get all pending users with pagination and filtering
  getPendingUsers: async function(page = 0, limit = 10, status = 'pending') {
    try {
      const response = await axios.get(`${ONBOARDING_API_URL}/api/users`, {
        params: { page, limit, status },
        headers: {
          'X-API-Key': ONBOARDING_API_KEY
        }
      });
      return { response: response.data };
    } catch (error) {
      console.error('Error fetching pending users from onboarding system:', error.message);
      return { error: 'Error fetching pending users from onboarding system' };
    }
  },

  // Approve a user
  approveUser: async function(userId) {
    try {
      const response = await axios.post(`${ONBOARDING_API_URL}/api/users/${userId}/approve`,  {}, {
        headers: {
          'X-API-Key': ONBOARDING_API_KEY
        }
      });
      return { response: response.data };
    } catch (error) {
      console.error('Error approving user in onboarding system:', error.message);
      return { error: 'Error approving user in onboarding system' };
    }
  },

  // Update user status
  updateUserStatus: async function(userId, status) {
    try {
      const response = await axios.post(`${ONBOARDING_API_URL}/api/users/${userId}/status`, {
        status
      }, {
        headers: {
          'X-API-Key': ONBOARDING_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return { response: response.data };
    } catch (error) {
      console.error('Error updating user status in onboarding system:', error.message);
      return { error: 'Error updating user status in onboarding system' };
    }
  },

  // Get user details by ID
  getUserById: async function(userId) {
    try {
      const response = await axios.get(`${ONBOARDING_API_URL}/api/users/${userId}`, {
        headers: {
          'X-API-Key': ONBOARDING_API_KEY
        }
      });
      return { response: response.data };
    } catch (error) {
      console.error('Error fetching user details from onboarding system:', error.message);
      return { error: 'Error fetching user details from onboarding system' };
    }
  },

  // Create a new user
  createUser: async function(userData) {
    try {
      const response = await axios.post(`${ONBOARDING_API_URL}/api/users/create`, userData, {
        headers: {
          'X-API-Key': ONBOARDING_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return { response: response.data };
    } catch (error) {
      console.error('Error creating user in onboarding system:', error.message);
      return { error: 'Error creating user in onboarding system' };
    }
  },

  // Delete a user
  deleteUser: async function(userId) {
    try {
      const response = await axios.delete(`${ONBOARDING_API_URL}/api/users/${userId}/delete`, {
        headers: {
          'X-API-Key': ONBOARDING_API_KEY
        }
      });
      return { response: response.data };
    } catch (error) {
      console.error('Error deleting user in onboarding system:', error.message);
      return { error: 'Error deleting user in onboarding system' };
    }
  }
};

module.exports = OnboardingService;
