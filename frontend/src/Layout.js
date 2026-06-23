import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';
import PortalModeContext from './context/PortalModeContext';
import apiService from './services/api';

const getMenuKeyFromPath = (path) => {
  if (path === '/home' || path === '/') {
    return 'dashboard';
  }
  if (path.startsWith('/upload')) {
    return 'upload';
  }
  if (path.startsWith('/validation')) {
    return 'validation';
  }
  if (path.startsWith('/rkb') || path.startsWith('/regulation')) {
    return 'rkb';
  }
  if (path.startsWith('/feedback')) {
    return 'feedback';
  }
  if (path.startsWith('/regulator/live-feed')) {
    return 'live';
  }
  if (path.startsWith('/regulator/review')) {
    return 'review';
  }
  if (path.startsWith('/regulator/entity-master')) {
    return 'entity';
  }
  return 'dashboard';
};

const enterpriseNavItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/home',
    title: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
  },
  {
    key: 'upload',
    label: 'AI Agent',
    path: '/upload',
    title: 'AI Agent',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    ),
  },
  {
    key: 'validation',
    label: 'Validation History',
    path: '/validation',
    title: 'Validation History',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
  },
  {
    key: 'rkb',
    label: 'Knowledge Center',
    path: '/rkb',
    title: 'Knowledge Center',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    key: 'feedback',
    label: 'Feedback',
    path: '/feedback',
    title: 'Feedback',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
  },
];

const regulatorNavItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/home',
    title: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
  },
  {
    key: 'live',
    label: 'Live Feed',
    path: '/regulator/live-feed',
    title: 'Live Feed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M4 12h1"></path>
        <path d="M19 12h1"></path>
        <path d="M12 4v1"></path>
        <path d="M12 19v1"></path>
        <path d="M12 12l4 3"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
  },
  {
    key: 'review',
    label: 'Review',
    path: '/regulator/review',
    title: 'Review',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="14" rx="2"></rect>
        <path d="M7 21h10"></path>
        <path d="M12 17v4"></path>
        <path d="M7 7h10"></path>
        <path d="M7 11h6"></path>
      </svg>
    ),
  },
  {
    key: 'entity',
    label: 'Entity Master',
    path: '/regulator/entity-master',
    title: 'Entity Master',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4"></circle>
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
      </svg>
    ),
  },
  {
    key: 'rkb',
    label: 'Knowledge Center',
    path: '/rkb',
    title: 'Knowledge Center',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
];

function Layout({ children, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Collapse sidebar by default on home page
    return location.pathname === '/home' || location.pathname === '/';
  });
  const [activeMenu, setActiveMenu] = useState(() => getMenuKeyFromPath(location.pathname));
  const [portalMode, setPortalMode] = useState(() => {
    return localStorage.getItem('portal_mode') || 'Enterprise';
  });
  const previousModeRef = useRef(portalMode);
  const profileMenuRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Email verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [otpResendCount, setOtpResendCount] = useState(0);
  const [otpTimer, setOtpTimer] = useState(120);
  const [userEmail, setUserEmail] = useState('');
  const otpTimerIntervalRef = useRef(null);
<<<<<<< HEAD
=======
  
  // Password creation state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
>>>>>>> dev

  const handleMenuClick = (menuItem, path) => {
    setActiveMenu(menuItem);
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogoutClick = () => {
<<<<<<< HEAD
    try {
      localStorage.removeItem('ai_agent_chat_history');
    } catch (error) {
      console.error('Failed to clear AI agent chat history', error);
    }
=======
    // Don't clear chat history - it's stored in backend now and persists across logouts
    // localStorage.removeItem('ai_agent_chat_history');
>>>>>>> dev
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  useEffect(() => {
    localStorage.setItem('portal_mode', portalMode);
  }, [portalMode]);

  // Update sidebar state when navigating to/from home page
  useEffect(() => {
    const isHomePage = location.pathname === '/home' || location.pathname === '/';
    setIsCollapsed(isHomePage);
  }, [location.pathname]);

  useEffect(() => {
    setActiveMenu(getMenuKeyFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (previousModeRef.current !== portalMode) {
      setActiveMenu('dashboard');
      if (portalMode === 'Regulator') {
        navigate('/home', { replace: true, state: { from: 'portal-switch' } });
      } else {
        navigate('/home', { replace: true, state: { from: 'portal-switch' } });
      }
      previousModeRef.current = portalMode;
    }
  }, [portalMode, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

<<<<<<< HEAD
=======
  // Get current user email for display
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

>>>>>>> dev
  // Check if user needs email verification
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Show verification modal if user is not verified and is a guest user
        if (user && !user.is_email_verified && user.auth_provider === 'guest' && !showVerificationModal) {
          setUserEmail(user.email);
          setShowVerificationModal(true);
          setOtpTimer(120);
<<<<<<< HEAD
          // Start timer
          if (otpTimerIntervalRef.current) {
            clearInterval(otpTimerIntervalRef.current);
          }
          otpTimerIntervalRef.current = setInterval(() => {
            setOtpTimer((prev) => {
              if (prev <= 1) {
                if (otpTimerIntervalRef.current) {
                  clearInterval(otpTimerIntervalRef.current);
                  otpTimerIntervalRef.current = null;
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
=======
>>>>>>> dev
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
<<<<<<< HEAD
    
    // Cleanup timer on unmount
=======
  }, [location.pathname, showVerificationModal]);

  // Start OTP timer when verification modal is shown
  useEffect(() => {
    if (showVerificationModal && otpTimer > 0) {
      if (otpTimerIntervalRef.current) {
        clearInterval(otpTimerIntervalRef.current);
      }
      otpTimerIntervalRef.current = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            if (otpTimerIntervalRef.current) {
              clearInterval(otpTimerIntervalRef.current);
              otpTimerIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Cleanup timer on unmount or when modal closes
>>>>>>> dev
    return () => {
      if (otpTimerIntervalRef.current) {
        clearInterval(otpTimerIntervalRef.current);
        otpTimerIntervalRef.current = null;
      }
    };
<<<<<<< HEAD
  }, [location.pathname, showVerificationModal]);
=======
  }, [showVerificationModal]);
>>>>>>> dev

  const startOTPTimer = () => {
    if (otpTimerIntervalRef.current) {
      clearInterval(otpTimerIntervalRef.current);
    }
    setOtpTimer(120);
    otpTimerIntervalRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          if (otpTimerIntervalRef.current) {
            clearInterval(otpTimerIntervalRef.current);
            otpTimerIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setVerificationError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerificationLoading(true);
      setVerificationError('');
      const response = await apiService.verifyOTP(userEmail, otpCode);
      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
<<<<<<< HEAD
      setShowVerificationModal(false);
      setOtpCode('');
      // Reload page to reflect verified status
      window.location.reload();
=======
      setCurrentUser(response.user);
      setShowVerificationModal(false);
      setOtpCode('');
      
      // Check if user needs to set password (guest user)
      if (response.user.auth_provider === 'guest') {
        setShowPasswordModal(true);
      } else {
        // Reload page to reflect verified status
        window.location.reload();
      }
>>>>>>> dev
    } catch (err) {
      setVerificationError(err.message || 'OTP verification failed');
    } finally {
      setVerificationLoading(false);
    }
  };

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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const checks = validatePassword(password);
    if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number || !checks.special) {
      setPasswordError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
      return;
    }

    try {
      setPasswordLoading(true);
      await apiService.setPassword(password, confirmPassword);
      setShowPasswordModal(false);
      setPassword('');
      setConfirmPassword('');
      // Reload page to reflect changes
      window.location.reload();
    } catch (err) {
      setPasswordError(err.message || 'Failed to set password');
    } finally {
      setPasswordLoading(false);
    }
  };

>>>>>>> dev
  const handleResendOTP = async () => {
    if (otpResendCount >= 5) {
      setVerificationError('Maximum resend attempts reached. Please contact support.');
      return;
    }

    try {
      setVerificationLoading(true);
      setVerificationError('');
      const response = await apiService.resendOTP(userEmail);
      setOtpResendCount(response.resend_count || otpResendCount + 1);
      setOtpCode('');
      setOtpTimer(120);
      startOTPTimer();
    } catch (err) {
      setVerificationError(err.message || 'Failed to resend OTP');
    } finally {
      setVerificationLoading(false);
    }
  };

  const navItems = portalMode === 'Regulator' ? regulatorNavItems : enterpriseNavItems;

  const handlePortalSwitch = (mode) => {
    if (mode !== portalMode) {
      setPortalMode(mode);
    }
    setIsProfileMenuOpen(false);
  };

  return (
    <PortalModeContext.Provider value={{ portalMode, setPortalMode }}>
      <div className="app-layout">
      {/* Left Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/iris logo.png" alt="iRIS Logo" className="sidebar-logo-image" />
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isCollapsed ? (
                <polyline points="9 18 15 12 9 6"></polyline>
              ) : (
                <polyline points="15 18 9 12 15 6"></polyline>
              )}
            </svg>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeMenu === item.key ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.key, item.path)}
              title={item.title}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`main-content-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <div className="header-logo-text">
<<<<<<< HEAD
              <div className="header-logo-main">LODR AI Agent</div>
=======
              <div className="header-logo-main">IRIS RegAI</div>
              <p className="header-logo-subtitle">
                Smart, Regulatory AI engine for continuous monitoring and early warning system on non-compliance
              </p>
>>>>>>> dev
            </div>
          </div>
          <div className="header-right">
            <div className="utility-buttons">
              <button className="header-button" aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>
              <button className="header-button" aria-label="Help">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </button>
            </div>
            <div className="user-profile-wrapper" ref={profileMenuRef}>
              <button
                className="user-profile-button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
<<<<<<< HEAD
                <span>Admin</span>
=======
                <span>{currentUser?.email || 'Admin'}</span>
>>>>>>> dev
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {isProfileMenuOpen && (
                <div className="user-dropdown" role="menu">
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileMenuOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => handlePortalSwitch(portalMode === 'Enterprise' ? 'Regulator' : 'Enterprise')}
                  >
                    {portalMode === 'Enterprise' ? 'Switch to Regulator view' : 'Switch to Enterprise view'}
                  </button>
<<<<<<< HEAD
                  <button type="button" className="user-dropdown-item" onClick={handleLogoutClick}>
                    Logout
                  </button>
=======
>>>>>>> dev
                </div>
              )}
            </div>
            <button
              className="header-button logout-button desktop-logout"
              onClick={handleLogoutClick}
              aria-label="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
      
      {/* Email Verification Modal */}
      {showVerificationModal && (
        <div className="password-modal" onClick={() => !verificationLoading && setShowVerificationModal(false)} style={{ zIndex: 9999 }}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h2 className="password-modal-title">Verify Your Email</h2>
              <button 
                className="password-modal-close" 
                onClick={() => {
                  setShowVerificationModal(false);
                  setOtpCode('');
                  setVerificationError('');
                }}
                disabled={verificationLoading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleOTPVerify}>
              <div className="password-form-group">
                <label className="password-form-label">Enter OTP</label>
                <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                  We've sent a verification code to <strong>{userEmail}</strong>
                </p>
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
                  disabled={verificationLoading}
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
                  disabled={verificationLoading || otpResendCount >= 5}
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
              {verificationError && (
                <div className="password-form-error">{verificationError}</div>
              )}
              <button 
                type="submit" 
                className="password-form-submit"
                disabled={verificationLoading || otpCode.length !== 6}
              >
                {verificationLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </div>
        </div>
      )}
<<<<<<< HEAD
=======
      
      {/* Password Creation Modal */}
      {showPasswordModal && (
        <div className="password-modal" onClick={() => !passwordLoading && setShowPasswordModal(false)} style={{ zIndex: 9999 }}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h2 className="password-modal-title">Create Strong Password</h2>
              <button 
                className="password-modal-close" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                disabled={passwordLoading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="password-form-group">
                <label className="password-form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="password-form-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter password"
                    required
                    disabled={passwordLoading}
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
                {password && (
                  <div style={{ marginTop: '8px', fontSize: '0.85em' }}>
                    <div style={{ color: password.length >= 8 ? '#4caf50' : '#999' }}>
                      ✓ At least 8 characters
                    </div>
                    <div style={{ color: /[A-Z]/.test(password) ? '#4caf50' : '#999' }}>
                      ✓ Uppercase letter
                    </div>
                    <div style={{ color: /[a-z]/.test(password) ? '#4caf50' : '#999' }}>
                      ✓ Lowercase letter
                    </div>
                    <div style={{ color: /[0-9]/.test(password) ? '#4caf50' : '#999' }}>
                      ✓ Number
                    </div>
                    <div style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '#4caf50' : '#999' }}>
                      ✓ Special character
                    </div>
                  </div>
                )}
              </div>
              <div className="password-form-group">
                <label className="password-form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="password-form-input"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Confirm password"
                    required
                    disabled={passwordLoading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? (
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
                {confirmPassword && password !== confirmPassword && (
                  <div style={{ marginTop: '4px', fontSize: '0.85em', color: '#d32f2f' }}>
                    Passwords do not match
                  </div>
                )}
              </div>
              {passwordError && (
                <div className="password-form-error">{passwordError}</div>
              )}
              <button 
                type="submit" 
                className="password-form-submit"
                disabled={passwordLoading || !password || !confirmPassword || password !== confirmPassword}
              >
                {passwordLoading ? 'Setting Password...' : 'Set Password'}
              </button>
            </form>
          </div>
        </div>
      )}
>>>>>>> dev
      </div>
    </PortalModeContext.Provider>
  );
}

export default Layout;