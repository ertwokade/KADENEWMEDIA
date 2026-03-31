// Analytics utility — wraps gtag with graceful fallback
// Replace G-XXXXXXXXXX with your actual GA4 Measurement ID in index.html

export function trackEvent(eventName, params = {}) {
  const consent = localStorage.getItem('cookie_consent')
  if (consent !== 'accepted') return
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Predefined conversion events for key CTAs
export const analytics = {
  // Contact form
  formSubmit: (service) =>
    trackEvent('form_submit', { event_category: 'Lead', event_label: service || 'general' }),

  // CTA clicks
  ctaClick: (label, destination) =>
    trackEvent('cta_click', { event_category: 'CTA', event_label: label, destination }),

  // WhatsApp
  whatsappClick: (source) =>
    trackEvent('whatsapp_click', { event_category: 'Contact', event_label: source }),

  // Package/pricing
  packageClick: (packageName) =>
    trackEvent('package_click', { event_category: 'Pricing', event_label: packageName }),

  // Blog
  blogRead: (slug, title) =>
    trackEvent('blog_read', { event_category: 'Blog', event_label: title, slug }),

  // Audit
  auditStart: () =>
    trackEvent('audit_start', { event_category: 'Lead', event_label: 'free_audit' }),

  auditComplete: (score, company) =>
    trackEvent('audit_complete', { event_category: 'Lead', event_label: company, score }),

  // Map / directions
  mapDirections: () =>
    trackEvent('map_directions', { event_category: 'Engagement', event_label: 'google_maps' }),

  // Partner case study
  caseStudyView: (partnerName) =>
    trackEvent('case_study_view', { event_category: 'Engagement', event_label: partnerName }),
};
