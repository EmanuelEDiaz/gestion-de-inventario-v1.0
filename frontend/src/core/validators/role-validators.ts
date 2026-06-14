import { z } from 'zod';
import { roleCode, roleName, roleDescription } from './fields/core/role-fields';

export const createRoleSchema = z.object({
  code: roleCode(),
  name: roleName(),
  description: roleDescription().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
