import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import LoginForm from '../../components/Auth/LoginForm';
import SignupForm from '../../components/Auth/SignupForm';
import './Auth.css';

function Auth() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleAuthSuccess = (result) => {
    if (mode === 'signup') {
      // For signup, redirect immediately to onboarding
      navigate('/onboarding');
    } else {
      // For login, show success message and redirect after delay
      setSuccessMessage('Login successful!');
      setTimeout(() => {
        // Check onboarding status from authService
        const hasCompletedOnboarding = authService.hasCompletedOnboarding();
        if (hasCompletedOnboarding) {
          navigate('/dashboard');
        } else {
          // User who hasn't completed onboarding
          navigate('/onboarding');
        }
      }, 1500);
    }
  };

  const handleAuthError = (error) => {
    // Error is already handled in the form components
    console.error('Auth error:', error);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setSuccessMessage('');
  };

  return (
    <div className="auth">
      <div className="auth-container">
        <div className="auth-header">
          <h2>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? 'Login to access your personalized dashboard' 
              : 'Sign up to get started with CryptoPal'}
          </p>
        </div>

        <div className="auth-toggle">
          <button
            className={`toggle-button ${mode === 'login' ? 'active' : ''}`}
            onClick={() => mode !== 'login' && toggleMode()}
          >
            Login
          </button>
          <button
            className={`toggle-button ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => mode !== 'signup' && toggleMode()}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-form-container">
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {mode === 'login' ? (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          ) : (
            <SignupForm 
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
