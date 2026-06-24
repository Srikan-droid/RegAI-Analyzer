import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';
import apiService from './services/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpResendCount, setOtpResendCount] = useState(0);
  const [otpTimer, setOtpTimer] = useState(120); // 2 minutes in seconds
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetOTPCode, setResetOTPCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [resetOtpTimer, setResetOtpTimer] = useState(120);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Microsoft OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleMicrosoftCallback(code);
    }
  }, [searchParams]);

  const handleMicrosoftCallback = async (code) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.microsoftLogin(code);
      onLogin(response.user);
      navigate('/choose-agent');
    } catch (err) {
      setError(err.message || 'Microsoft login failed');
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const authUrl = await apiService.getMicrosoftAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError(err.message || 'Failed to initiate Microsoft login');
      setLoading(false);
    }
  };

  const handlePasswordLoginClick = async () => {
    setError('');

    try {
      setLoading(true);
      // TODO: remove bypass for production — restore password modal + apiService.login
      const mockUser = {
        email: 'test@local.dev',
        name: 'Test User',
        is_email_verified: true,
        auth_provider: 'password',
      };
      apiService.setToken('local-dev-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      onLogin(mockUser);
      navigate('/choose-agent');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      // TODO: remove bypass for production — restore apiService.login(email, password)
      const mockUser = {
        email: email || 'test@local.dev',
        name: 'Test User',
        is_email_verified: true,
        auth_provider: 'password',
      };
      apiService.setToken('local-dev-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      setShowPasswordModal(false);
      onLogin(mockUser);
      navigate('/choose-agent');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    // Show name and email input modal first
    setShowOTPModal(true);
    setShowOTPInput(false);
    setGuestEmail('');
    setGuestName('');
    setOtpCode('');
    setOtpResendCount(0);
    setOtpTimer(120);
    setError('');
  };

  const handleGuestEmailSubmit = async (e) => {
    e.preventDefault();
    if (!guestEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!guestName) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiService.guestLogin(guestEmail, guestName);
      
      // Log the user in and navigate to home
      // Verification popup will be shown in Layout component
      setShowOTPModal(false);
      setShowOTPInput(false);
      onLogin(response.user);
      navigate('/choose-agent');
    } catch (err) {
      setError(err.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  const startOTPTimer = () => {
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiService.verifyOTP(guestEmail, otpCode);
      setShowOTPModal(false);
      setShowOTPInput(false);
      onLogin(response.user);
      navigate('/choose-agent');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpResendCount >= 5) {
      setError('Maximum resend attempts reached. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiService.resendOTP(guestEmail);
      setOtpResendCount(response.resend_count || otpResendCount + 1);
      setOtpCode('');
      setOtpTimer(120);
      startOTPTimer();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiService.forgotPassword(forgotPasswordEmail);
      setShowResetPasswordForm(true);
      setResetOtpTimer(120);
      // Start timer
      const interval = setInterval(() => {
        setResetOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetOTPCode || resetOTPCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (resetPassword !== confirmResetPassword) {
      setError('Passwords do not match');
      return;
    }

    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiService.verifyResetOTP(forgotPasswordEmail, resetOTPCode, resetPassword, confirmResetPassword);
      setShowForgotPasswordModal(false);
      setShowResetPasswordForm(false);
      setForgotPasswordEmail('');
      setResetOTPCode('');
      setResetPassword('');
      setConfirmResetPassword('');
      setError('');
      alert('Password reset successfully! Please login with your new password.');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="language-selector">
        <button className="lang-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          EN
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      <div className="login-card">
        <div className="logo-section">
          <div className="iris-logo">
            <img src="/iris logo.png" alt="iRIS Logo" className="logo-image" />
          </div>
        </div>

        <div className="welcome-section">
          <h1 className="welcome-title">IRIS RegAI</h1>
          <p className="service-description">
            Smart, Regulatory AI engine for continuous monitoring and early warning system on non-compliance
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px',
            background: '#fee',
            color: '#d32f2f',
            borderRadius: '6px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div className="login-options">
          {/* <button 
            className="login-button microsoft-button" 
            onClick={handleMicrosoftLogin}
            // disabled={loading}
            disabled={disabled}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <line x1="8" y1="4" x2="8" y2="20"></line>
              <line x1="2" y1="12" x2="8" y2="12"></line>
            </svg>
            {loading ? 'Loading...' : 'Continue with Microsoft'}
          </button> */}

          <button
            className="login-button microsoft-button"
            disabled
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <line x1="8" y1="4" x2="8" y2="20"></line>
              <line x1="2" y1="12" x2="8" y2="12"></line>
            </svg>
            Continue with Microsoft (Coming soon)
          </button>


          <button 
            className="login-button password-button" 
            onClick={handlePasswordLoginClick}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Login with Password
          </button>

          <div className="separator">
            <div className="separator-line"></div>
            <span className="separator-text">or</span>
            <div className="separator-line"></div>
          </div>

          <button 
            className="guest-option" 
            onClick={handleGuestAccess}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Continue as Guest
          </button>
        </div>

        <div className="features-section">
          <div className="feature-item">
            <div className="feature-icon fast-processing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
              </svg>
            </div>
            <p className="feature-text">Fast Processing</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon secure">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M9 12l2 2 4-4"></path>
              </svg>
            </div>
            <p className="feature-text">Secure</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon ai-powered">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <p className="feature-text">AI Powered</p>
          </div>
        </div>
      </div>

      {/* Password Login Modal */}
      {showPasswordModal && (
        <div className="password-modal" onClick={() => !loading && setShowPasswordModal(false)}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h2 className="password-modal-title">Login with Password</h2>
              <button 
                className="password-modal-close" 
                onClick={() => setShowPasswordModal(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="password-form-group">
                <label className="password-form-label">Email</label>
                <input
                  type="email"
                  className="password-form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              <div className="password-form-group">
                <label className="password-form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="password-form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#666'
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setShowForgotPasswordModal(true);
                    setForgotPasswordEmail(email);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '0.9em',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              {error && (
                <div className="password-form-error">{error}</div>
              )}
              <button 
                type="submit" 
                className="password-form-submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="password-modal" onClick={() => !loading && setShowOTPModal(false)}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h2 className="password-modal-title">
                {showOTPInput ? 'Verify Email' : 'Continue as Guest'}
              </h2>
              <button 
                className="password-modal-close" 
                onClick={() => {
                  setShowOTPModal(false);
                  setShowOTPInput(false);
                  setOtpCode('');
                  setGuestEmail('');
                  setGuestName('');
                  setOtpResendCount(0);
                  setOtpTimer(120);
                  setError('');
                }}
                disabled={loading}
              >
                ×
              </button>
            </div>
            {!showOTPInput ? (
              <form onSubmit={handleGuestEmailSubmit}>
                <div className="password-form-group">
                  <label className="password-form-label">Name</label>
                  <input
                    type="text"
                    className="password-form-input"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="password-form-group">
                  <label className="password-form-label">Email Address</label>
                  <input
                    type="email"
                    className="password-form-input"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="password-form-error">{error}</div>
                )}
                <button 
                  type="submit" 
                  className="password-form-submit"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Continue as Guest'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerify}>
                <div className="password-form-group">
                  <label className="password-form-label">Enter OTP</label>
                  <input
                    type="text"
                    className="password-form-input"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    disabled={loading}
                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2em' }}
                  />
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '0.9em', 
                    color: otpTimer === 0 ? '#d32f2f' : '#666',
                    textAlign: 'center'
                  }}>
                    {otpTimer > 0 ? (
                      <>OTP expires in: <strong>{formatTime(otpTimer)}</strong></>
                    ) : (
                      <span style={{ color: '#d32f2f' }}>OTP expired</span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading || otpResendCount >= 5}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: otpResendCount >= 5 ? '#999' : '#1976d2',
                      cursor: otpResendCount >= 5 ? 'not-allowed' : 'pointer',
                      textDecoration: 'underline',
                      fontSize: '0.9em'
                    }}
                  >
                    {otpResendCount >= 5 
                      ? 'Max resend attempts reached' 
                      : `Resend OTP (${5 - otpResendCount} attempts left)`
                    }
                  </button>
                </div>
                {error && (
                  <div className="password-form-error">{error}</div>
                )}
                <button 
                  type="submit" 
                  className="password-form-submit"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                {error && error.includes('locked') && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowOTPModal(false);
                      setShowOTPInput(false);
                      setOtpCode('');
                      setGuestEmail('');
                      setGuestName('');
                      setOtpResendCount(0);
                      setOtpTimer(120);
                      setError('');
                    }}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '10px',
                      background: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Back to Login
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="password-modal" onClick={() => !loading && setShowForgotPasswordModal(false)}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h2 className="password-modal-title">
                {showResetPasswordForm ? 'Reset Password' : 'Forgot Password'}
              </h2>
              <button 
                className="password-modal-close" 
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setShowResetPasswordForm(false);
                  setForgotPasswordEmail('');
                  setResetOTPCode('');
                  setResetPassword('');
                  setConfirmResetPassword('');
                  setError('');
                }}
                disabled={loading}
              >
                ×
              </button>
            </div>
            {!showResetPasswordForm ? (
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="password-form-group">
                  <label className="password-form-label">Email</label>
                  <input
                    type="email"
                    className="password-form-input"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="password-form-error">{error}</div>
                )}
                <button 
                  type="submit" 
                  className="password-form-submit"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="password-form-group">
                  <label className="password-form-label">Enter OTP</label>
                  <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                    We've sent a reset code to <strong>{forgotPasswordEmail}</strong>
                  </p>
                  <input
                    type="text"
                    className="password-form-input"
                    value={resetOTPCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetOTPCode(value);
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    disabled={loading}
                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2em' }}
                  />
                </div>
                <div className="password-form-group">
                  <label className="password-form-label">New Password</label>
                  <input
                    type="password"
                    className="password-form-input"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="password-form-group">
                  <label className="password-form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="password-form-input"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="password-form-error">{error}</div>
                )}
                <button 
                  type="submit" 
                  className="password-form-submit"
                  disabled={loading || resetOTPCode.length !== 6}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
