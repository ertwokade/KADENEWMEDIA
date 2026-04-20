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
  if (res.status === 401) {
    // Token süresi dolmuş veya geçersiz — temizle ve login ekranına dön
    localStorage.removeItem('kade_admin_token');
    localStorage.removeItem('kade_admin_user');
    window.location.reload();
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }
  if (!res.ok) {
    throw new Error(data?.error || 'Bir hata oluştu');
  }
  return data;
}

// Auth
export async function loginApi(username, password) {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function changePasswordApi(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/auth?action=change-password`, {
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

// Newsletter
export async function subscribeNewsletterApi(email) {
  const res = await fetch(`${API_BASE}/contact?action=newsletter`, {
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
