/**
 * FormField - Reusable form field wrapper with label
 */

interface FormFieldProps {
  label: string;
  labelSuffix?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, labelSuffix, htmlFor, required, error, children }: FormFieldProps) {
  return (
    <div>
      <label 
        htmlFor={htmlFor} 
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        <span className="inline-flex items-center gap-1">{label}{labelSuffix}</span>
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
