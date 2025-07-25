// File: src/service/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/synoptic/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
