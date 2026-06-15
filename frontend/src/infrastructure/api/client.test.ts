import { describe, it, expect, vi } from 'vitest';
import { getFieldErrors, isClientError } from './client';

vi.mock('axios', () => ({
  default: {
    isAxiosError: vi.fn((err: unknown) =>
      typeof err === 'object' && err !== null && (err as Record<string, unknown>).isAxiosError === true,
    ),
    create: vi.fn(() => ({
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    })),
  },
  isAxiosError: vi.fn((err: unknown) =>
    typeof err === 'object' && err !== null && (err as Record<string, unknown>).isAxiosError === true,
  ),
}));

function createAxiosError(status: number, data: unknown) {
  return {
    isAxiosError: true,
    response: { status, data },
    config: {},
    message: 'Mock error',
    name: 'AxiosError',
    toJSON: () => ({}),
  };
}

describe('getFieldErrors', () => {
  it('returns fieldErrors array when present', () => {
    const error = createAxiosError(400, {
      type: 'validation', title: 'Validation error', status: 400, detail: 'Invalid input',
      fieldErrors: [{ field: 'name', message: 'Name is required' }],
    });
    expect(getFieldErrors(error)).toEqual([{ field: 'name', message: 'Name is required' }]);
  });

  it('returns empty array for error without fieldErrors', () => {
    const error = createAxiosError(400, {
      type: 'validation', title: 'Bad request', status: 400, detail: 'Invalid input',
    });
    expect(getFieldErrors(error)).toEqual([]);
  });

  it('returns empty array for non-axios error', () => {
    expect(getFieldErrors(new Error('Generic'))).toEqual([]);
  });
});

describe('isClientError', () => {
  it('returns true for 400', () => {
    expect(isClientError(createAxiosError(400, { type: 'error', title: '', status: 400, detail: '' }))).toBe(true);
  });

  it('returns true for 409', () => {
    expect(isClientError(createAxiosError(409, { type: 'error', title: '', status: 409, detail: '' }))).toBe(true);
  });

  it('returns true for 422', () => {
    expect(isClientError(createAxiosError(422, { type: 'error', title: '', status: 422, detail: '' }))).toBe(true);
  });

  it('returns false for 401', () => {
    expect(isClientError(createAxiosError(401, { type: 'error', title: '', status: 401, detail: '' }))).toBe(false);
  });

  it('returns false for 403', () => {
    expect(isClientError(createAxiosError(403, { type: 'error', title: '', status: 403, detail: '' }))).toBe(false);
  });

  it('returns false for 500', () => {
    expect(isClientError(createAxiosError(500, { type: 'error', title: '', status: 500, detail: '' }))).toBe(false);
  });

  it('returns false for non-axios error', () => {
    expect(isClientError(new Error('Generic'))).toBe(false);
  });
});
