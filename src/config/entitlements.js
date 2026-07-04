const DEFAULT_ENTITLEMENTS = {
  role: 'customer',
  consultingPlan: null,
  consultingStatus: 'inactive',
  hasOrganizationKitAccess: false,
  hasKadeKitBusinessAccess: false,
  hasKadeRadarAccess: false,
  hasAIKnowledgeCenterAccess: false,
}

export const CONSULTING_PLANS = {
  fractional_new_media_director: {
    label: 'Fractional New Media Director',
    model: 'Aylık stratejik yönetim ortaklığı',
  },
}

export const userEntitlements = {
  'demirk314@gmail.com': {
    role: 'client_admin',
    consultingPlan: 'fractional_new_media_director',
    consultingStatus: 'active',
    hasOrganizationKitAccess: true,
    hasKadeKitBusinessAccess: true,
    hasKadeRadarAccess: true,
    hasAIKnowledgeCenterAccess: true,
  },
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function getUserEntitlements(email) {
  const entitlement = userEntitlements[normalizeEmail(email)]
  return {
    ...DEFAULT_ENTITLEMENTS,
    ...(entitlement || {}),
  }
}

export function getConsultingPlanLabel(planKey) {
  return CONSULTING_PLANS[planKey]?.label || 'Danışmanlık Planı'
}

export function hasOrganizationKitAccess(email) {
  return Boolean(getUserEntitlements(email).hasOrganizationKitAccess)
}
