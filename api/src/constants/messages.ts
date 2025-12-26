export const COMMON_MESSAGES = {
  SUCCESS: 'Operation successful',
  ERROR: 'An error occurred',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input data',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
} as const

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_FAILED: 'Invalid username or password',
  LOGIN_ERROR: 'An error occurred during logout',
  USER_NOT_FOUND: 'User not found',
  LOGOUT_SUCCESS: 'Logout successful',
  LOGOUT_ERROR: 'An error occurred during logout',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
  REFRESH_TOKEN_FAILED: 'Failed to refresh token',
  UNAUTHORIZED_NO_TOKEN: 'No access token provided',
  UNAUTHORIZED_INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED_INVALID_TYPE: 'Invalid token type',
  UNAUTHORIZED_FAILED: 'Authorization failed',
  SESSION_EXPIRED: 'Session expired due to inactivity',
  SESSION_REVOKED: 'Session has been revoked',
} as const

export const USER_MESSAGES = {
  GET_SUCCESS: 'Users retrieved successfully',
  PROFILE_RETRIEVED: 'User profile retrieved successfully',
  CURRENT_USER_RETRIEVED: 'Current user retrieved successfully',
  NOT_FOUND: 'User not found',
  ALREADY_EXISTS: 'User already exists',
  CREATED_SUCCESS: 'User created successfully',
  UPDATED_SUCCESS: 'User updated successfully',
  DELETED_SUCCESS: 'User deleted successfully',
  COULD_NOT_CREATE: 'Could not create user',
  COULD_NOT_UPDATE: 'Could not update user',
} as const

export const ROLE_MESSAGES = {
  GET_SUCCESS: 'Roles retrieved successfully',
  NOT_FOUND: 'Role not found',
  ALREADY_EXISTS: 'Role with this name already exists',
  COULD_NOT_CREATE: 'Could not create role',
  COULD_NOT_UPDATE: 'Could not update role',
  CREATED_SUCCESS: 'Role created successfully',
  UPDATED_SUCCESS: 'Role updated successfully',
  DELETED_SUCCESS: 'Role deleted successfully',
} as const

export const CAMERA_MESSAGES = {
  GET_SUCCESS: 'Cameras retrieved successfully',
  NOT_FOUND: 'Camera not found',
  ALREADY_EXISTS: 'Camera with this name and base URL already exists',
  CREATED_SUCCESS: 'Camera created successfully',
  UPDATED_SUCCESS: 'Camera updated successfully',
  DELETED_SUCCESS: 'Camera deleted successfully',
  COULD_NOT_CREATE: 'Could not create camera',
  COULD_NOT_UPDATE: 'Could not update camera',
} as const

export const WORKSTATION_MESSAGES = {
  GET_SUCCESS: 'Workstations retrieved successfully',
  NOT_FOUND: 'Workstation not found',
  CREATED_SUCCESS: 'Workstation created successfully',
  UPDATED_SUCCESS: 'Workstation updated successfully',
  DELETED_SUCCESS: 'Workstation deleted successfully',
  ALREADY_EXISTS: 'Workstation with this camera already exists',
  COULD_NOT_CREATE: 'Could not create workstation',
  COULD_NOT_UPDATE: 'Could not update workstation',
} as const

export const PACKING_MESSAGES = {
  GET_SUCCESS: 'Packing items retrieved successfully',
  NOT_FOUND: 'Packing item not found',
  SCAN_START_SUCCESS: 'Packing started successfully',
  SCAN_END_SUCCESS: 'Packing ended successfully',
  ALREADY_STARTED: 'Packing already started for this barcode',
  NOT_STARTED: 'No active packing found for this barcode',
  REPROCESS_SUCCESS: 'Packing item queued for reprocessing',
} as const

export const CLIP_MESSAGES = {
  GET_SUCCESS: 'Clips retrieved successfully',
  NOT_FOUND: 'Clip not found',
  URL_GENERATED: 'Signed URL generated successfully',
} as const

export const BATCH_MESSAGES = {
  GET_SUCCESS: 'Batch jobs retrieved successfully',
  NOT_FOUND: 'Batch job not found',
  TRIGGER_SUCCESS: 'Batch job triggered successfully',
  ALREADY_RUNNING: 'A batch job is already running',
} as const
