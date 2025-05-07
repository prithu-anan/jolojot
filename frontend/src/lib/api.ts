import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authority APIs
export const getStationDataByHour = (stationId: number, hours: number) =>
  api.get(`/authority/stations/${stationId}/data?hours=${hours}`);
export const updateStationLocation = (stationId: number, data: { lat: number; lon: number }) =>
  api.post(`/authority/stations/${stationId}/location`, data);

// Waterlogging Prediction
export const predictWaterlogging = (data) => api.post('/model/predict/', data);
export const sendFeedback = (data) => api.post('/model/feedback', data);
export const getWeights = () => api.get('/model/weights');
export const updateWeights = (data) => api.post('/model/weights', data);
export const getStations = () => api.get('/authority/stations');
export const getStationData = (stationId) =>
  api.get(`/model/station-data?station_id=${stationId}`);
export const updateStationData = (data) => api.post('/model/station-data', data);

// Weather APIs
export const getCurrentWeather = (lat, lon) =>
  api.get(`/weather/current?lat=${lat}&lon=${lon}`);
export const getForecast = (lat, lon) =>
  api.get(`/weather/forecast?lat=${lat}&lon=${lon}`);
export const getWeatherAlerts = (lat, lon) =>
  api.get(`/weather/alerts?lat=${lat}&lon=${lon}`);

// Route Planning
export const getSafeRoutes = (data) => api.post('/routes/plan', data);

// Forum APIs
export const getPosts = () => api.get('/forum/posts');
export const createPost = (data) => api.post('/forum/create', data);
export const uploadPostImage = (postId, formData) =>
api.post(`/forum/posts/${postId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const voteOnPost = (postId, data) => api.post(`/forum/posts/${postId}/vote`, data);

// Auth APIs (optional stubs)
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

export default api;
