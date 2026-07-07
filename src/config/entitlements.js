const DEFAULT_ENTITLEMENTS = {
  role: 'customer',
  consultingPlan: null,
  consultingStatus: 'inactive',
  hasConsultingPanelAccess: false,
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

export const PACKAGE_ACCESS = {
  'danismanlik-test': {
    consultingPlan: 'fractional_new_media_director',
    consultingStatus: 'active',
    hasConsultingPanelAccess: true,
  },
  'kade-organizasyon-kiti-test': {
    consultingPlan: 'fractional_new_media_director',
    consultingStatus: 'active',
    hasOrganizationKitAccess: true,
  },
  'dijital-danismanlik': {
    consultingPlan: 'fractional_new_media_director',
    consultingStatus: 'active',
    hasConsultingPanelAccess: true,
  },
  'tam-dijital': {
    consultingPlan: 'fractional_new_media_director',
    consultingStatus: 'active',
    hasConsultingPanelAccess: true,
    hasOrganizationKitAccess: true,
    hasKadeKitBusinessAccess: true,
    hasKadeRadarAccess: true,
    hasAIKnowledgeCenterAccess: true,
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

export function isPackageActive(pkg, now = new Date()) {
  if (!pkg || pkg.status !== 'active') return false
  if (!pkg.expiresAt) return true
  const expiresAt = new Date(pkg.expiresAt)
  return Number.isNaN(expiresAt.getTime()) || expiresAt >= now
}

export function getPackageEntitlements(packages = []) {
  const entitlements = { ...DEFAULT_ENTITLEMENTS }
  const activePackages = Array.isArray(packages) ? packages.filter(isPackageActive) : []

  activePackages.forEach((pkg) => {
    const access = pkg.access || PACKAGE_ACCESS[pkg.reference] || {}
    Object.entries(access).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        entitlements[key] = Boolean(entitlements[key] || value)
      } else if (value != null) {
        entitlements[key] = value
      }
    })
  })

  return entitlements
}

export function getUserEntitlements(email, packages = [], extraEntitlements = {}) {
  const entitlement = userEntitlements[normalizeEmail(email)]
  return {
    ...DEFAULT_ENTITLEMENTS,
    ...getPackageEntitlements(packages),
    ...(entitlement || {}),
    ...(extraEntitlements || {}),
  }
}

export function getConsultingPlanLabel(planKey) {
  return CONSULTING_PLANS[planKey]?.label || 'Danışmanlık Planı'
}

export function hasOrganizationKitAccess(email) {
  return Boolean(getUserEntitlements(email).hasOrganizationKitAccess)
}
