const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('kade_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}


async function handleResponse(res) {
  let data;
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try { data = JSON.parse(text); } catch { throw new Error('API unavailable'); }
    }
  } catch (e) {
    throw new Error(e.message || 'API unavailable');
  }
  if (!res.ok) {
    throw new Error(data?.error || 'Bir hata oluştu');
  }
  return data;
}

// Auth
export async function loginApi(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function changePasswordApi(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(res);
}

// Blog
export async function getBlogsApi() {
  const res = await fetch(`${API_BASE}/blog`);
  return handleResponse(res);
}

export async function createBlogApi(data) {
  const res = await fetch(`${API_BASE}/blog`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateBlogApi(data) {
  const res = await fetch(`${API_BASE}/blog`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteBlogApi(id) {
  const res = await fetch(`${API_BASE}/blog?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Content
export async function getContentApi(section) {
  const url = section ? `${API_BASE}/content?section=${section}` : `${API_BASE}/content`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function updateContentApi(section, data) {
  const res = await fetch(`${API_BASE}/content`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ section, data }),
  });
  return handleResponse(res);
}

// Partners
export async function getPartnersApi() {
  const res = await fetch(`${API_BASE}/partners`);
  return handleResponse(res);
}

export async function createPartnerApi(data) {
  const res = await fetch(`${API_BASE}/partners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updatePartnerApi(data) {
  const res = await fetch(`${API_BASE}/partners`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deletePartnerApi(id) {
  const res = await fetch(`${API_BASE}/partners?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Messages
export async function getMessagesApi() {
  const res = await fetch(`${API_BASE}/messages`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function markMessageReadApi(id) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function updateMessageStatusApi(id, status) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, status }),
  });
  return handleResponse(res);
}

export async function deleteMessageApi(id) {
  const res = await fetch(`${API_BASE}/messages?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Contact (public)
export async function sendContactApi(data) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Users (admin only)
export async function getUsersApi() {
  const res = await fetch(`${API_BASE}/users`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function createUserApi(data) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUserApi(data) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteUserApi(id) {
  const res = await fetch(`${API_BASE}/users?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Calendar Invite
export async function sendCalendarInviteApi(data) {
  const res = await fetch(`${API_BASE}/calendar-invite`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Seed (dev only — requires SEED_SECRET env var)
export async function seedApi(secret) {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret }),
  });
  return handleResponse(res);
}
