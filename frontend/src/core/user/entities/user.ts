/**
 * Entidad de Usuario (dominio puro).
 * No contiene lógica de framework ni anotaciones.
 */
export interface User {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

/** @deprecated usar Role.code directamente */
export type RoleCode = string;

export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
  displayName: string;
  roleId: string;
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface CreateRoleData {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
}

// ===== Auth Types =====

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
