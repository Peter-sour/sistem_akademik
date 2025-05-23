// API Functions

const API_BASE = 'http://localhost:3000/api';
	async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token'); // Ambil token dari localStorage

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
