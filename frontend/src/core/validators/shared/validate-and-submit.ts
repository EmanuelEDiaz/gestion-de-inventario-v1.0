import { z } from 'zod';

function setNestedError(
  errors: Record<string, string>,
  path: (string | number)[],
  message: string,
): void {
  const key = path.join('.');
  if (!errors[key]) errors[key] = message;
}

export function validateFormData<T>(
  schema: z.ZodType<T>,
  rawValues: Record<string, unknown>,
): { success: true; data: T } | { success: false; fieldErrors: Record<string, string> } {
  const result = schema.safeParse(rawValues);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      setNestedError(fieldErrors, issue.path as (string | number)[], issue.message);
    }
    return { success: false, fieldErrors };
  }
  return { success: true, data: result.data };
}
