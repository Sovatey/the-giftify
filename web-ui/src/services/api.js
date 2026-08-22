import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token and selected company context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    const companyId = localStorage.getItem('selectedCompanyId');
    // Attach company_id filter to data requests, but NOT when fetching all companies list
    if (companyId && !config.url?.includes('/user/companies/')) {
      config.headers['X-Company-ID'] = companyId;
      config.params = {
        ...(config.params || {}),
        company_id: companyId,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') {
        message.warning('Session expired. Please log in again.');
        window.location.href = '/';
      }
    } else if (status === 403) {
      message.error('Access Denied: You do not have permission for this action.');
    } else if (status >= 500) {
      message.error('Server error. Please check backend API.');
    }
    return Promise.reject(error);
  }
);

export default api;
