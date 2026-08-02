export const VERCEL_GATEWAY_STATUS_KEY = 'VERCEL_AI_GATEWAY'

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

export function hasVercelGatewayRuntime(request?: Request) {
  return Boolean(
    configured('AI_GATEWAY_API_KEY')
    || configured('VERCEL_OIDC_TOKEN')
    || request?.headers.get('x-vercel-oidc-token')?.trim()
    || process.env.VERCEL === '1'
  )
}

export async function getVercelGatewayToken() {
  const configuredToken = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim()
  if (configuredToken) return configuredToken

  try {
    const { headers } = await import('next/headers')
    return (await headers()).get('x-vercel-oidc-token')?.trim() || ''
  } catch {
    return ''
  }
}
