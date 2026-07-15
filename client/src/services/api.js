import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeader() {
  const stored = localStorage.getItem('auth');
  if (!stored) return {};

  try {
    const { token } = JSON.parse(stored);
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export async function signup(name, email, password) {
  const response = await axios.post(`${BASE_URL}/auth/signup`, {
    name,
    email,
    password,
  });
  return response.data;
}

export async function login(email, password) {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
}

export async function analyzeImage(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await axios.post(
    `${BASE_URL}/detection/analyze`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeader(),
      },
    }
  );

  return response.data;
}

export async function getHistory() {
  const response = await axios.get(`${BASE_URL}/history`, {
    headers: getAuthHeader(),
  });
  return response.data;
}

export async function deleteHistoryEntry(id) {
  const response = await axios.delete(`${BASE_URL}/history/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
}

export async function clearHistory() {
  const response = await axios.delete(`${BASE_URL}/history`, {
    headers: getAuthHeader(),
  });
  return response.data;
}