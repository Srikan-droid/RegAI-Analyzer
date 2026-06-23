import React, { useState, useEffect } from 'react';
import './Profile.css';
import apiService from './services/api';

function Profile({ user }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
<<<<<<< HEAD
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
=======
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
>>>>>>> dev
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(user);

<<<<<<< HEAD
=======
  const validatePassword = (pwd) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    };
    return checks;
  };

>>>>>>> dev
  useEffect(() => {
    // Fetch latest user info
    const fetchUserInfo = async () => {
      try {
        const info = await apiService.getCurrentUser();
        setUserInfo(info);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };
    fetchUserInfo();
  }, []);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await apiService.setPassword(password, confirmPassword);
      setSuccess('Password set successfully!');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      
      // Refresh user info
      const info = await apiService.getCurrentUser();
      setUserInfo(info);
    } catch (err) {
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    const checks = validatePassword(newPassword);
    if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number || !checks.special) {
      setError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
      return;
    }

    try {
      setLoading(true);
      await apiService.resetPassword(oldPassword, newPassword, confirmNewPassword);
      setSuccess('Password reset successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowResetPasswordForm(false);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

>>>>>>> dev
  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">User Profile</h1>
        
        <div className="profile-info">
          <div className="profile-info-item">
            <label className="profile-label">Email</label>
            <div className="profile-value">{userInfo?.email || 'N/A'}</div>
          </div>
          
          <div className="profile-info-item">
<<<<<<< HEAD
            <label className="profile-label">Full Name</label>
            <div className="profile-value">{userInfo?.full_name || 'Not set'}</div>
=======
            <label className="profile-label">Name</label>
            <div className="profile-value">{userInfo?.name || 'Not set'}</div>
>>>>>>> dev
          </div>
          
          <div className="profile-info-item">
            <label className="profile-label">Role</label>
            <div className="profile-value">
<<<<<<< HEAD
              <span className={`role-badge ${userInfo?.role === 'admin' ? 'admin' : 'user'}`}>
                {userInfo?.role === 'admin' ? 'Admin' : 'User'}
=======
              <span className={`role-badge ${userInfo?.role?.role_name === 'admin' ? 'admin' : 'user'}`}>
                {userInfo?.role?.role_name ? userInfo.role.role_name.charAt(0).toUpperCase() + userInfo.role.role_name.slice(1) : 'User'}
>>>>>>> dev
              </span>
            </div>
          </div>
          
          <div className="profile-info-item">
            <label className="profile-label">Account Type</label>
            <div className="profile-value">
<<<<<<< HEAD
              {userInfo?.is_guest ? (
=======
              {userInfo?.auth_provider === 'guest' ? (
>>>>>>> dev
                <span className="guest-badge">Guest User</span>
              ) : (
                <span className="regular-badge">Regular User</span>
              )}
            </div>
          </div>
<<<<<<< HEAD
          
          <div className="profile-info-item">
            <label className="profile-label">Password Status</label>
            <div className="profile-value">
              {userInfo?.has_password ? (
                <span className="password-set">Password Set</span>
              ) : (
                <span className="password-not-set">No Password Set</span>
              )}
            </div>
          </div>
        </div>

        {userInfo?.is_guest && !userInfo?.has_password && (
          <div className="password-section">
            {!showPasswordForm ? (
              <div className="password-prompt">
                <p className="password-prompt-text">
                  As a guest user, you can set a password to convert your account to a regular account.
                </p>
                <button
                  className="set-password-button"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Set Password
                </button>
              </div>
            ) : (
              <form className="password-form" onSubmit={handleSetPassword}>
                <h3 className="password-form-title">Set Password</h3>
                
                <div className="password-form-group">
                  <label className="password-form-label">New Password</label>
                  <input
                    type="password"
                    className="password-form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 8 characters)"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="password-form-group">
                  <label className="password-form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="password-form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    disabled={loading}
                  />
                </div>
                
                {error && (
                  <div className="password-form-error">{error}</div>
                )}
                
                {success && (
                  <div className="password-form-success">{success}</div>
                )}
                
                <div className="password-form-actions">
                  <button
                    type="button"
                    className="password-form-cancel"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPassword('');
                      setConfirmPassword('');
                      setError('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="password-form-submit"
                    disabled={loading}
                  >
                    {loading ? 'Setting...' : 'Set Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
=======
        </div>

        {/* Reset Password Section */}
        <div className="password-section">
          {!showResetPasswordForm ? (
            <div className="password-prompt">
              <button
                className="set-password-button"
                onClick={() => setShowResetPasswordForm(true)}
              >
                Reset Password
              </button>
            </div>
          ) : (
            <form className="password-form" onSubmit={handleResetPassword}>
              <h3 className="password-form-title">Reset Password</h3>
              
              <div className="password-form-group">
                <label className="password-form-label">Current Password</label>
                <input
                  type="password"
                  className="password-form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="password-form-group">
                <label className="password-form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="password-form-input"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                    {showNewPassword ? (
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
                {newPassword && (
                  <div style={{ marginTop: '8px', fontSize: '0.85em' }}>
                    <div style={{ color: newPassword.length >= 8 ? '#4caf50' : '#999' }}>
                      ✓ At least 8 characters
                    </div>
                    <div style={{ color: /[A-Z]/.test(newPassword) ? '#4caf50' : '#999' }}>
                      ✓ Uppercase letter
                    </div>
                    <div style={{ color: /[a-z]/.test(newPassword) ? '#4caf50' : '#999' }}>
                      ✓ Lowercase letter
                    </div>
                    <div style={{ color: /[0-9]/.test(newPassword) ? '#4caf50' : '#999' }}>
                      ✓ Number
                    </div>
                    <div style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '#4caf50' : '#999' }}>
                      ✓ Special character
                    </div>
                  </div>
                )}
              </div>
              
              <div className="password-form-group">
                <label className="password-form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    className="password-form-input"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
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
                    {showConfirmNewPassword ? (
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
                {confirmNewPassword && newPassword !== confirmNewPassword && (
                  <div style={{ marginTop: '4px', fontSize: '0.85em', color: '#d32f2f' }}>
                    Passwords do not match
                  </div>
                )}
              </div>
              
              {error && (
                <div className="password-form-error">{error}</div>
              )}
              
              {success && (
                <div className="password-form-success">{success}</div>
              )}
              
              <div className="password-form-actions">
                <button
                  type="button"
                  className="password-form-cancel"
                  onClick={() => {
                    setShowResetPasswordForm(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setError('');
                    setSuccess('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="password-form-submit"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
>>>>>>> dev
      </div>
    </div>
  );
}

export default Profile;

