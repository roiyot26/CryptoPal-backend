import { useState } from 'react';
import { authService } from '../../utils/auth';
import './AuthForm.css';

function SignupForm({ onSuccess, onError }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.name) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.signup(
        formData.email,
        formData.name,
        formData.password
      );
      if (result.success) {
        onSuccess(result);
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  const getPasswordStrengthClass = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'weak';
    if (passwordStrength <= 3) return 'medium';
    return 'strong';
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="signup-email">Email</label>
        <input
          type="email"
          id="signup-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
          placeholder="Enter your email"
          disabled={isLoading}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-name">Full Name</label>
        <input
          type="text"
          id="signup-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="Enter your full name"
          disabled={isLoading}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-password">Password</label>
        <input
          type="password"
          id="signup-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? 'error' : ''}
          placeholder="Create a password (min. 8 characters)"
          disabled={isLoading}
        />
        {formData.password && (
          <div className="password-strength">
            <div className={`strength-bar ${getPasswordStrengthClass()}`}>
              <div 
                className="strength-fill" 
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              ></div>
            </div>
            {getPasswordStrengthLabel() && (
              <span className={`strength-label ${getPasswordStrengthClass()}`}>
                {getPasswordStrengthLabel()}
              </span>
            )}
          </div>
        )}
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-confirm-password">Confirm Password</label>
        <input
          type="password"
          id="signup-confirm-password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={errors.confirmPassword ? 'error' : ''}
          placeholder="Confirm your password"
          disabled={isLoading}
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>

      {errors.submit && (
        <div className="error-message submit-error">{errors.submit}</div>
      )}

      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}

export default SignupForm;

