import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatDateShort } from './utils';

describe('cn utility', () => {
  it('should combine class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should handle false conditions', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should handle empty strings', () => {
    const result = cn('class1', '', 'class2');
    expect(result).toBe('class1 class2');
  });
});

describe('formatCurrency', () => {
  it('should format currency with default locale', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
  });

  it('should format currency with custom currency', () => {
    const result = formatCurrency(100, 'USD', 'en-US');
    expect(result).toContain('100');
    expect(result).toMatch(/\$100/);
  });

  it('should format with 2 decimal places', () => {
    const result = formatCurrency(99.9);
    expect(result).toMatch(/99\.90/);
  });
});

describe('formatDate', () => {
  it('should format date with default options', () => {
    const dateStr = '2024-01-15T10:30:00Z';
    const result = formatDate(dateStr);
    expect(result).toContain('2024');
    expect(result).toContain('ene');
    expect(result).toContain('15');
  });

  it('should format date with custom options', () => {
    const dateStr = '2024-01-15T10:30:00Z';
    const result = formatDate(dateStr, { year: 'numeric', month: '2-digit', day: '2-digit' });
    expect(result).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('should format date without time', () => {
    const dateStr = '2024-01-15T10:30:00Z';
    const result = formatDateShort(dateStr);
    expect(result).toContain('2024');
    expect(result).toContain('ene');
    expect(result).toContain('15');
    expect(result).not.toContain(':');
  });
});