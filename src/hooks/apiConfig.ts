export const API_BASE_URL = "https://api-gateway-px44.onrender.com/api/";

import axios from "axios";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});