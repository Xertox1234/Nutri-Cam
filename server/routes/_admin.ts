/**
 * Admin authorization utilities.
 */

/** Check if userId is in the ADMIN_USER_IDS env var */
export function isAdmin(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .filter(Boolean);
  return adminIds.includes(userId);
}
