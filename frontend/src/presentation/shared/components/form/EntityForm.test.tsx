import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { z } from 'zod';

vi.mock('@/presentation/shared/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}));

vi.mock('@/presentation/shared/components/ui/Button', () => ({
  Button: ({ children, onClick, type, disabled }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) =>
    <button type={type} onClick={onClick} disabled={disabled}>{children}</button>,
}));

vi.mock('@/presentation/shared/components/ui/Input', () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}));

vi.mock('@/presentation/shared/components/form/Textarea', () => ({
  Textarea: (props: Record<string, unknown>) => <textarea {...props} />,
}));

vi.mock('@/presentation/shared/components/form/ComboboxSelect', () => ({
  ComboboxSelect: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
    <select value={value} onChange={(e) => onChange(e.target.value)} data-testid="combobox-select" />,
}));

vi.mock('@/presentation/shared/components/form/LabelWithHint', () => ({
  LabelWithHint: ({ label, required }: { label: string; required?: boolean }) =>
    <label>{label}{required && <span>*</span>}</label>,
}));

vi.mock('@/presentation/shared/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/presentation/shared/components/ui', () => ({
  TooltipWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/infrastructure/api/client', () => ({
  getFieldErrors: vi.fn(),
  getErrorMessage: vi.fn(() => 'Error del servidor'),
}));

import { getFieldErrors, getErrorMessage } from '@/infrastructure/api/client';
import { EntityForm } from './EntityForm';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getErrorMessage).mockReturnValue('Error del servidor');
});

describe('EntityForm', () => {
  const baseProps = {
    title: 'Test Form',
    fields: [
      { name: 'name', label: 'Name', type: 'text' as const, required: true },
    ],
    values: {} as Record<string, string>,
    onChange: vi.fn(),
    onCancel: vi.fn(),
    storageKey: 'test-form',
  };

  it('renders title', () => {
    render(<EntityForm {...baseProps} />);
    expect(screen.getByText('Test Form')).toBeInTheDocument();
  });

  it('calls onSubmitAction on submit when safeParse succeeds', async () => {
    const onSubmitAction = vi.fn().mockResolvedValue(undefined);
    const schema = z.object({ name: z.string().min(1, 'Name is required') });
    render(
      <EntityForm
        {...baseProps}
        createSchema={schema}
        values={{ name: 'Product A' }}
        onSubmitAction={onSubmitAction}
      />,
    );

    fireEvent.submit(screen.getByRole('button', { name: /crear/i }).closest('form')!);

    await waitFor(() => {
      expect(onSubmitAction).toHaveBeenCalledWith({ name: 'Product A' });
    });
  });

  it('shows field errors when safeParse fails', async () => {
    const onSubmitAction = vi.fn().mockResolvedValue(undefined);
    const schema = z.object({ name: z.string().min(1, 'Name is required') });
    render(
      <EntityForm
        {...baseProps}
        createSchema={schema}
        values={{}}
        onSubmitAction={onSubmitAction}
      />,
    );

    fireEvent.submit(screen.getByRole('button', { name: /crear/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/expected string/)).toBeInTheDocument();
    });
    expect(onSubmitAction).not.toHaveBeenCalled();
  });

  it('calls getFieldErrors when onSubmitAction throws', async () => {
    vi.mocked(getFieldErrors).mockReturnValue([{ field: 'name', message: 'Already exists' }]);
    const onSubmitAction = vi.fn().mockRejectedValue(new Error('Conflict'));
    const schema = z.object({ name: z.string().min(1) });

    render(
      <EntityForm
        {...baseProps}
        createSchema={schema}
        values={{ name: 'Duplicate' }}
        onSubmitAction={onSubmitAction}
      />,
    );

    fireEvent.submit(screen.getByRole('button', { name: /crear/i }).closest('form')!);

    await waitFor(() => {
      expect(getFieldErrors).toHaveBeenCalled();
    });
  });

  it('shows server error message when no fieldErrors in response', async () => {
    vi.mocked(getFieldErrors).mockReturnValue([]);
    const onSubmitAction = vi.fn().mockRejectedValue(new Error('Server error'));

    render(
      <EntityForm
        {...baseProps}
        values={{ name: 'Test' }}
        onSubmitAction={onSubmitAction}
        createSchema={z.object({ name: z.string().min(1) })}
      />,
    );

    const form = screen.getByRole('button', { name: /crear/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error del servidor');
    });
  });
});
