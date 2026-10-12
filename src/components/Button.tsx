import type { ComponentPropsWithRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-moss text-paper hover:bg-moss-deep',
  secondary: 'border border-mist bg-white text-ink hover:border-ink-soft',
  danger: 'bg-danger text-white hover:brightness-90',
};

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant;
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
