export function isAllowedAdmin(id: unknown, expected: string | undefined = process.env.ADMIN_GITHUB_ID): boolean {
  return Boolean(expected && /^\d+$/.test(expected) && String(id) === expected);
}
export function authConfigured() {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && /^\d+$/.test(process.env.ADMIN_GITHUB_ID || ""));
}
