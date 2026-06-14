import { z } from 'zod';

export const userUsername = () => z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(100, 'El usuario no puede exceder 100 caracteres');
export const userDisplayName = () => z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres');
export const userEmail = () => z.string().email('Email inválido').max(255, 'El email no puede exceder 255 caracteres');
export const userPassword = () => z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');
export const userRoleId = () => z.string().min(1, 'El rol es requerido');
