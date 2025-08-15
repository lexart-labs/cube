import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);
  return {
    headers: {
      'token': token,
      'user-id': userId
    }
  };
};

// Add this method to the existing service
const OnboardingUsersService = {
  // Get all pending users with pagination and filtering
  getAll: async (page = 0, limit = 10, status = 'pending') => {
    return await axios.get(`${API}onboarding/users`, {
      ...generateHeader(),
      params: { page, limit, status }
    });
  },

  // Get user by ID
  getById: async (id) => {
    return await axios.get(`${API}onboarding/users/${id}`, generateHeader());
  },

  // Approve a user
  approve: async (id) => {
    return await axios.post(`${API}onboarding/users/${id}/approve`, {}, generateHeader());
  },

  // Update user status
  updateStatus: async (id, status) => {
    return await axios.post(`${API}onboarding/users/${id}/status`, { status }, generateHeader());
  },

  // Create a new pending user
  create: async (userData) => {
    return await axios.post(`${API}onboarding/users/create`, userData, generateHeader());
  },

  // Add this method to your existing service
  delete: async (userId) => {
    return await axios.delete(`${API}onboarding/users/${userId}`, generateHeader());
  },

  async uploadSignedDocuments(userId, formData) {
    try {
			const token = localStorage.getItem(`token-app-${APP_NAME}`);
  		const userIdCube = localStorage.getItem(`id-${APP_NAME}`);
      const response = await axios.post(`${API}onboarding/users/${userId}/upload-signed-documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'token': token,
          'user-id': userIdCube
        }
      })
      return response.data
    } catch (error) {
      console.error('Error uploading signed documents:', error)
      throw error
    }
  }
};

export default OnboardingUsersService;
