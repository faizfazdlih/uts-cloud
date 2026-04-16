const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    let message = 'Terjadi kesalahan pada server';
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch {
      // ignore parsing error
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  getReports: () => request('/reports'),
  createReport: (payload) =>
    request('/reports', {
      method: 'POST',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),
  updateReportStatus: (id, status) =>
    request(`/reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getSchedules: () => request('/schedules'),
  createSchedule: (payload) =>
    request('/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOfficers: () => request('/officers'),
  createOfficer: (payload) =>
    request('/officers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createOfficerLog: (officerId, payload) =>
    request(`/officers/${officerId}/logs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMonitoring: () => request('/monitoring'),
};

export function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
}
