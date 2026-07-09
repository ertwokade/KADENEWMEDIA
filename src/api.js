const API_BASE = '/api';

const CSRF_COOKIE = 'kade_csrf';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

try { localStorage.removeItem('kade_admin_token'); } catch { /* legacy cleanup */ }

function getCookie(name) {
  const value = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function clearCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Strict`;
}

let csrfPromise = null;

async function ensureCsrfToken({ force = false } = {}) {
  const existing = getCookie(CSRF_COOKIE);
  if (existing && !force) return existing;
  if (force) clearCookie(CSRF_COOKIE);

  csrfPromise ||= globalThis.fetch(`${API_BASE}/auth?action=csrf`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return data.csrfToken || getCookie(CSRF_COOKIE) || null;
    })
    .catch(() => null)
    .finally(() => { csrfPromise = null; });

  return csrfPromise;
}

async function fetch(input, init = {}) {
  const method = String(init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});

  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  return globalThis.fetch(input, {
    ...init,
    credentials: init.credentials || 'include',
    headers,
  });
}

export { fetch as apiFetch };

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}


async function handleResponse(res, { reloadOnUnauthorized = true } = {}) {
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
  if (res.status === 401) {
    try { sessionStorage.removeItem('kade_admin_user'); } catch { /* ignore */ }
    if (reloadOnUnauthorized) window.location.reload();
    throw new Error(data?.error || 'Oturum suresi doldu. Lutfen tekrar giris yapin.');
  }
  if (!res.ok) {
    const message = data?.error || 'Bir hata oluştu';
    if (String(message).includes('ALLOWED_ORIGINS')) {
      throw new Error('Sunucu ayarı güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.');
    }
    throw new Error(message);
  }
  return data;
}

// Auth
export async function loginApi(username, password) {
  // Refresh before login so stale CSRF cookies left from an older deploy/JWT
  // secret do not keep the admin screen locked out.
  await ensureCsrfToken({ force: true });

  let res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (res.status === 403) {
    const data = await res.clone().json().catch(() => ({}));
    if (String(data?.error || '').toLowerCase().includes('csrf')) {
      await ensureCsrfToken({ force: true });
      res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
  }

  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function getSessionApi() {
  const res = await fetch(`${API_BASE}/auth?action=session`);
  if (res.status === 401) return { authenticated: false };
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function logoutApi() {
  const res = await fetch(`${API_BASE}/auth?action=logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function changePasswordApi(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/auth?action=change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(res);
}

// Customer Auth
export async function customerLoginApi(email, password) {
  await ensureCsrfToken({ force: true });
  const res = await fetch(`${API_BASE}/customer-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function customerRegisterApi(name, email, password, phone) {
  await ensureCsrfToken({ force: true });
  const res = await fetch(`${API_BASE}/customer-auth?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  });
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function customerSessionApi() {
  const res = await fetch(`${API_BASE}/customer-auth?action=session`);
  if (res.status === 401) return { authenticated: false };
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function customerLogoutApi() {
  const res = await fetch(`${API_BASE}/customer-auth?action=logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function customerPortalApi() {
  const res = await fetch(`${API_BASE}/customer-portal`);
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function claimFreePackageApi(reference) {
  const res = await fetch(`${API_BASE}/customer-portal?action=claim-free-package`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reference }),
  });
  return handleResponse(res, { reloadOnUnauthorized: false });
}

// Admin — Müşteri Yönetimi
export async function getPortalCustomersApi() {
  const res = await fetch(`${API_BASE}/customers`);
  return handleResponse(res);
}

export async function getPackageDefinitionsApi() {
  const res = await fetch(`${API_BASE}/customers?action=packages`);
  return handleResponse(res);
}

export async function addCustomerPackageApi(customerId, reference, customPackage) {
  const res = await fetch(`${API_BASE}/customers?action=add-package`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ customerId, reference, customPackage }),
  });
  return handleResponse(res);
}

export async function updateCustomerPackageApi(customerId, packageId, status) {
  const res = await fetch(`${API_BASE}/customers?action=update-package`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ customerId, packageId, status }),
  });
  return handleResponse(res);
}

export async function removeCustomerPackageApi(customerId, packageId) {
  const res = await fetch(`${API_BASE}/customers?action=remove-package`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ customerId, packageId }),
  });
  return handleResponse(res);
}

export async function updateCustomerStatusApi(customerId, status) {
  const res = await fetch(`${API_BASE}/customers?action=update-status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ customerId, status }),
  });
  return handleResponse(res);
}

export async function deletePortalCustomerApi(customerId) {
  const res = await fetch(`${API_BASE}/customers`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ customerId }),
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

// Contact (public — no CSRF needed)
export async function sendContactApi(data) {
  const res = await globalThis.fetch(`${API_BASE}/contact`, {
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
    headers: getAuthHeaders(),
    body: JSON.stringify({ secret }),
  });
  return handleResponse(res);
}

// Newsletter (public — no CSRF needed)
export async function subscribeNewsletterApi(email) {
  const res = await globalThis.fetch(`${API_BASE}/contact?action=newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

// Notes (CRM)
export async function getNotesApi(messageId) {
  const res = await fetch(`${API_BASE}/messages?action=notes&messageId=${messageId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function createNoteApi(data) {
  const res = await fetch(`${API_BASE}/messages?action=notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteNoteApi(id) {
  const res = await fetch(`${API_BASE}/messages?action=notes&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Notifications
export async function getNotificationsApi() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function markNotificationReadApi(id) {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function markAllNotificationsReadApi() {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ markAllRead: true }),
  });
  return handleResponse(res);
}

export async function deleteNotificationApi(id) {
  const res = await fetch(`${API_BASE}/notifications?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Google Analytics 4 Data API
export async function getGA4AnalyticsApi(period = 'week') {
  const res = await fetch(`${API_BASE}/content?action=ga4&period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Analytics
export async function trackPageviewApi(path, referrer) {
  try {
    await fetch(`${API_BASE}/content?action=pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, referrer }),
    });
  } catch { /* non-critical */ }
}

export async function heartbeatApi(sessionId, path) {
  try {
    await fetch(`${API_BASE}/content?action=heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, path }),
      keepalive: true,
    });
  } catch { /* non-critical */ }
}

export async function getActiveVisitorsApi() {
  try {
    const res = await fetch(`${API_BASE}/content?action=active-visitors`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.activeUsers === 'number' ? data.activeUsers : null;
  } catch { return null; }
}

export async function getAiUsageApi() {
  try {
    const res = await fetch(`${API_BASE}/content?action=ai-usage`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function getAnalyticsApi(period = 'week') {
  const res = await fetch(`${API_BASE}/content?action=analytics&period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Activity Log
export async function getActivityLogApi(type) {
  const url = type && type !== 'all'
    ? `${API_BASE}/notifications?action=activity&type=${type}`
    : `${API_BASE}/notifications?action=activity`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createActivityLogApi(data) {
  const res = await fetch(`${API_BASE}/notifications?action=activity`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Newsletter subscribers (admin)
export async function getNewsletterSubscribersApi() {
  const res = await fetch(`${API_BASE}/contact?action=subscribers`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function deleteNewsletterSubscriberApi(id) {
  const res = await fetch(`${API_BASE}/contact?action=subscribers&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function sendNewsletterApi(subject, html) {
  const res = await fetch(`${API_BASE}/contact?action=send-newsletter`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, html }),
  });
  return handleResponse(res);
}

// SMTP test
export async function testSmtpApi() {
  const res = await fetch(`${API_BASE}/contact?action=smtp-test`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Reply to message via email
export async function replyToMessageApi(id, replyText, subject) {
  const res = await fetch(`${API_BASE}/messages?action=reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, replyText, subject }),
  });
  return handleResponse(res);
}

// Kariyer başvurusu
export async function applyJobApi(data) {
  const res = await fetch(`${API_BASE}/contact?action=apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Portfolio (content section)
export async function getPortfolioApi() {
  const res = await fetch(`${API_BASE}/content?section=portfolio`);
  return handleResponse(res);
}

// Dynamic sitemap
export async function getSitemapApi() {
  const res = await fetch(`${API_BASE}/content?action=sitemap`);
  return res.text();
}

// Site settings (stored in content collection)
export async function getSiteSettingsApi() {
  const res = await fetch(`${API_BASE}/content?section=site-settings`);
  return handleResponse(res);
}

export async function updateSiteSettingsApi(data) {
  const res = await fetch(`${API_BASE}/content`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ section: 'site-settings', data }),
  });
  return handleResponse(res);
}

// Reminders
export async function getRemindersApi(status) {
  const url = status && status !== 'all'
    ? `${API_BASE}/reminders?status=${status}`
    : `${API_BASE}/reminders`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createReminderApi(data) {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateReminderApi(data) {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteReminderApi(id) {
  const res = await fetch(`${API_BASE}/reminders?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function checkRemindersApi() {
  const res = await fetch(`${API_BASE}/reminders?action=check`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Social Media Analyzer Lead
export async function submitAnalyzerLeadApi(data) {
  const res = await fetch(`${API_BASE}/contact?action=analyzer-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Proposals (Teklifler) ──────────────────────────────────────────────────
export async function getProposalsApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_BASE}/proposals?${qs}` : `${API_BASE}/proposals`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createProposalApi(data) {
  const res = await fetch(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateProposalApi(data) {
  const res = await fetch(`${API_BASE}/proposals`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteProposalApi(id) {
  const res = await fetch(`${API_BASE}/proposals?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ── Tasks (Görevler) ────────────────────────────────────────────────────────
export async function getTasksApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_BASE}/tasks?${qs}` : `${API_BASE}/tasks`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createTaskApi(data) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTaskApi(data) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTaskApi(id) {
  const res = await fetch(`${API_BASE}/tasks?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ── Media (Medya Kütüphanesi) ────────────────────────────────────────────────
export async function getMediaApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_BASE}/media?${qs}` : `${API_BASE}/media`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function uploadMediaApi(data) {
  const res = await fetch(`${API_BASE}/media`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateMediaApi(data) {
  const res = await fetch(`${API_BASE}/media`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteMediaApi(id) {
  const res = await fetch(`${API_BASE}/media?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function bulkDeleteMediaApi(ids) {
  const res = await fetch(`${API_BASE}/media?ids=${ids.join(',')}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ── Subscriptions (Abonelik/Retainer) ────────────────────────────────────────
export async function getSubscriptionsApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_BASE}/subscriptions?${qs}` : `${API_BASE}/subscriptions`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createSubscriptionApi(data) {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateSubscriptionApi(data) {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function recordPaymentApi(id, paymentData) {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, action: 'record-payment', ...paymentData }),
  });
  return handleResponse(res);
}

export async function deleteSubscriptionApi(id) {
  const res = await fetch(`${API_BASE}/subscriptions?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ── Surveys (NPS Anketleri) ───────────────────────────────────────────────────
export async function getSurveysApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_BASE}/surveys?${qs}` : `${API_BASE}/surveys`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getSurveyStatsApi() {
  const res = await fetch(`${API_BASE}/surveys?stats=true`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function sendSurveyApi(data) {
  const res = await fetch(`${API_BASE}/surveys`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function submitSurveyResponseApi(token, score, comment) {
  const res = await fetch(`${API_BASE}/surveys?action=submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, score, comment }),
  });
  return handleResponse(res);
}

export async function deleteSurveyApi(id) {
  const res = await fetch(`${API_BASE}/surveys?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Referral Program
export async function submitReferralApi(data) {
  const res = await fetch(`${API_BASE}/referrals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getReferralsApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_BASE}/referrals?${qs}` : `${API_BASE}/referrals`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function updateReferralApi(data) {
  const res = await fetch(`${API_BASE}/referrals`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteReferralApi(id) {
  const res = await fetch(`${API_BASE}/referrals?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Operations / Growth tools
export async function submitQuoteApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getQuotesApi() {
  const res = await fetch(`${API_BASE}/ops?resource=quotes`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function updateQuoteApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=quotes`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteQuoteApi(id) {
  const res = await fetch(`${API_BASE}/ops?resource=quotes&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function trackClientErrorApi(data) {
  try {
    await fetch(`${API_BASE}/ops?resource=client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch { /* non-critical */ }
}

export async function savePushSubscriptionApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getCustomerProfilesApi(params = {}) {
  const qs = new URLSearchParams({ resource: 'customer-profiles', ...params }).toString();
  const res = await fetch(`${API_BASE}/ops?${qs}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getInvoicesApi() {
  const res = await fetch(`${API_BASE}/ops?resource=invoices`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createInvoiceApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=invoices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateInvoiceApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=invoices`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteInvoiceApi(id) {
  const res = await fetch(`${API_BASE}/ops?resource=invoices&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getBackupSummaryApi() {
  const res = await fetch(`${API_BASE}/ops?resource=backup`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createBackupApi() {
  const res = await fetch(`${API_BASE}/ops?resource=backup`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Email Templates
export async function getEmailTemplatesApi() {
  const res = await fetch(`${API_BASE}/ops?resource=email-templates`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function createEmailTemplateApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=email-templates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
export async function updateEmailTemplateApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=email-templates`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
export async function deleteEmailTemplateApi(id) {
  const res = await fetch(`${API_BASE}/ops?resource=email-templates&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Onboarding Forms
export async function getOnboardingFormsApi() {
  const res = await fetch(`${API_BASE}/ops?resource=onboarding`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function createOnboardingFormApi(data) {
  const res = await fetch(`${API_BASE}/ops?resource=onboarding`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
export async function deleteOnboardingFormApi(id) {
  const res = await fetch(`${API_BASE}/ops?resource=onboarding&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Media file (returns { data, mimeType } for preview)
export async function getMediaFileApi(id) {
  const res = await fetch(`${API_BASE}/media?id=${id}&action=file`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
