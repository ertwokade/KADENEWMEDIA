export function canAccessOwnedResource(authenticatedUserId: string, resourceUserId: string) {
  return Boolean(authenticatedUserId) && authenticatedUserId === resourceUserId
}
