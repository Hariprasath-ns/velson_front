export const validateUser = (formData, isEditMode = false) => {
  const errors = {};
  
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Invalid email format';
    }
  }
  
  if (!isEditMode) {
    if (!formData.password || !formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  } else {
    if (formData.password && formData.password.trim().length > 0 && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
