import { Role } from '@prisma/client'

// Define granular permissions based on the Master Prompt requirements
export type Permission = 
  | 'loan.create'
  | 'loan.update'
  | 'loan.close'
  | 'loan.repay'
  | 'loan.approve'
  | 'customer.create'
  | 'customer.edit'
  | 'customer.delete'
  | 'reports.view'
  | 'reports.export'
  | 'users.manage'
  | 'branches.manage'
  | 'subscriptions.manage'
  | 'audit.view'
  | 'shops.manage' // Super admin specific

// Map Roles to their allowed permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'subscriptions.manage',
    'shops.manage',
    'audit.view'
  ],
  OWNER: [
    'loan.create',
    'loan.update',
    'loan.close',
    'loan.repay',
    'loan.approve',
    'customer.create',
    'customer.edit',
    'customer.delete',
    'reports.view',
    'reports.export',
    'users.manage',
    'branches.manage',
    'audit.view'
  ],
  STAFF: [
    'loan.create',
    'loan.repay',
    'customer.create',
    'customer.edit',
    'reports.view'
  ]
}

/**
 * Checks if a role has the required permission.
 * Throws an error if the permission is missing, ensuring strict enforcement.
 */
export function requirePermission(role: Role, permission: Permission) {
  const permissions = ROLE_PERMISSIONS[role] || []
  
  if (!permissions.includes(permission)) {
    throw new Error(`Forbidden: You lack the '${permission}' permission to perform this action.`)
  }
}

/**
 * Boolean check for UI rendering purposes.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] || []).includes(permission)
}
