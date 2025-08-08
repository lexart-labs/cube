require('dotenv').config();
const axios = require('axios');

const ONBOARDING_API_URL = process.env.ONBOARDING_API_URL;
const ONBOARDING_API_KEY = process.env.ONBOARDING_API_KEY;

// Add this method to the existing onboarding.service.js file

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
  approveUser: async function(userId, cubeUserId) {
    try {
      const response = await axios.post(`${ONBOARDING_API_URL}/api/users/${userId}/approve`,  {}, {
        headers: {
          'X-API-Key': ONBOARDING_API_KEY,
					'user-id': cubeUserId
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
  },

  updateSignedDocuments: async (userId, documents, files) => {
    try {
      const FormData = require('form-data');
      const fs = require('fs');

      const formData = new FormData();

      // Add files to form data if they exist
      if (files.nda && files.nda[0]) {
        formData.append('nda', fs.createReadStream(files.nda[0].path), {
          filename: files.nda[0].originalname,
          contentType: 'application/pdf'
        });
      }

      if (files.service_agreement && files.service_agreement[0]) {
        formData.append('service_agreement', fs.createReadStream(files.service_agreement[0].path), {
          filename: files.service_agreement[0].originalname,
          contentType: 'application/pdf'
        });
      }

      const config = {
        method: 'POST',
        url: `${ONBOARDING_API_URL}/api/users/${userId}/upload-signed-documents`,
        headers: {
          'X-API-Key': ONBOARDING_API_KEY,
          ...formData.getHeaders()
        },
        data: formData
      }

      const response = await axios(config)
      return { response: response.data }
    } catch (error) {
      console.error('Error updating signed documents:', error)
      return { error: 'Failed to update signed documents' }
    }
  }
};

module.exports = OnboardingService;
