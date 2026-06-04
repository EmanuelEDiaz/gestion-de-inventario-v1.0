import { describe, it, expect, vi, afterEach } from 'vitest';
import { sha256 } from './crypto';

describe('sha256', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hashes "abc" to the known SHA-256 digest', async () => {
    const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    await expect(sha256('abc')).resolves.toBe(expected);
  });

  it('hashes empty string to the SHA-256 of ""', async () => {
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    await expect(sha256('')).resolves.toBe(expected);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await sha256('hello');
    const b = await sha256('world');
    expect(a).not.toBe(b);
  });

  it('returns a 64-character hex string', async () => {
    const result = await sha256('anything');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
