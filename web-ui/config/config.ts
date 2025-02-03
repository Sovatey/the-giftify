import axios from "axios";

// Create an instance of axios
const apiClient = axios.create({
  baseURL: "http://192.168.137.1:8100/api", // Replace with your API base URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error(error);
    return Promise.reject(error);
  }
);

export default apiClient;
