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
  }
};

export default OnboardingUsersService;
