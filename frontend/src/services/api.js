import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching auth token if needed
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export const screeningService = {
  screenResume: async (jobId, resumeFile) => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobId', jobId);
    
    const response = await apiClient.post('/screen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  checkDuplicate: async ({ candidateEmail, candidateName }) => {
    const response = await apiClient.post('/screen/check-duplicate', {
      candidateEmail,
      candidateName,
    });
    return response.data;
  },
  submitScreening: async (submitData) => {
    const response = await apiClient.post('/screen/submit', submitData);
    return response.data;
  },
};


export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  loginFirebase: async (email, password, fullName) => {
    const response = await apiClient.post('/auth/login-firebase', { email, password, fullName });
    return response.data;
  },
  signup: async (userData) => {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  },
  sendOtp: async (email, purpose) => {
    const response = await apiClient.post('/auth/send-otp', { email, purpose });
    return response.data;
  },
  verifyOtp: async (email, otpCode, purpose) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otpCode, purpose });
    return response.data;
  },
  resetPassword: async (email, otpCode, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', { email, otpCode, newPassword });
    return response.data;
  },
  changeEmailRequest: async (currentPassword, newEmail) => {
    const response = await apiClient.post('/auth/change-email-request', { currentPassword, newEmail });
    return response.data;
  },
  changeEmailConfirm: async (newEmail, otpCode) => {
    const response = await apiClient.post('/auth/change-email-confirm', { newEmail, otpCode });
    return response.data;
  },
  changeEmailFirebase: async (newEmail) => {
    const response = await apiClient.post('/auth/change-email-firebase', { newEmail });
    return response.data;
  },
  resetPasswordSettings: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/reset-password-settings', { currentPassword, newPassword });
    return response.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  }
};

export const candidatesService = {
  listCandidates: async (search = '') => {
    const response = await apiClient.get(`/candidates${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    return response.data;
  },
  getCandidate: async (id) => {
    const response = await apiClient.get(`/candidates/${id}`);
    return response.data;
  },
  updateCandidateStatus: async (id, status) => {
    const response = await apiClient.put(`/candidates/${id}/status`, { status });
    return response.data;
  },
  deleteCandidate: async (candidateId) => {
    const response = await apiClient.delete(`/candidates/${candidateId}`);
    return response.data;
  },
  deleteScreeningResult: async (screeningId) => {
    const response = await apiClient.delete(`/candidates/screening/${screeningId}`);
    return response.data;
  }
};

export const jobsService = {
  listJobs: async () => {
    const response = await apiClient.get('/jobs');
    return response.data;
  },
  getJob: async (id) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data;
  },
  createJob: async (jobData) => {
    const response = await apiClient.post('/jobs', jobData);
    return response.data;
  },
  updateJob: async (id, jobData) => {
    const response = await apiClient.put(`/jobs/${id}`, jobData);
    return response.data;
  },
  deleteJob: async (id) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return response.data;
  },
  rescreenJob: async (id) => {
    const response = await apiClient.post(`/jobs/${id}/rescreen`);
    return response.data;
  }
};

export default apiClient;
