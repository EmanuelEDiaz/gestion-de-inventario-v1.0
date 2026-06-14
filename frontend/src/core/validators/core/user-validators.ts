import { z } from 'zod';
import { userUsername, userDisplayName, userEmail, userPassword, userRoleId } from '../fields/core/user-fields';

export const createUserSchema = z.object({
  username: userUsername(),
  displayName: userDisplayName(),
  email: userEmail().optional().or(z.literal('')),
  password: userPassword(),
  roleId: userRoleId(),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
