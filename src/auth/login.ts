export interface AdminLoginResult {
  success: boolean;
  error?: string;
  message?: string;
}

export function validateAdminLogin(
  email: string | undefined,
  password: string | undefined
): AdminLoginResult {
  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  return {
    success: false,
    error: 'Invalid admin credentials!',
  };
}
