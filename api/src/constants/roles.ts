export const ROLE_NAMES = {
  SUPERADMIN: 'SUPERADMIN',
  OPERATOR: 'OPERATOR',
} as const

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES]

export const isSuperadmin = (roleName: string): boolean => {
  return roleName.toUpperCase() === ROLE_NAMES.SUPERADMIN
}

export const isOperator = (roleName: string): boolean => {
  return roleName.toUpperCase() === ROLE_NAMES.OPERATOR
}
