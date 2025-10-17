import React from 'react';
import type { UseFormRegister, FieldError } from 'react-hook-form';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  register,
  error,
  ...props
}) => {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input id={name} {...register(name)} {...props} />
      {error && <span className="form-error">{error.message}</span>}
    </div>
  );
};
