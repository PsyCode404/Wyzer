import React from 'react';

const FormInput = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-text mb-2">{label}</label>
      <input className="form-input" {...props} />
      {error && <div className="error-text">{error}</div>}
    </div>
  );
};

export default FormInput;
