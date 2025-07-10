import axios from "axios";
import { API_URL } from "../constants/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});