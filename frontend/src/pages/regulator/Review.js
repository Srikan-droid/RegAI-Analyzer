import React, { useState } from 'react';
import './Review.css';

function RegulatorReview() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  return (
    <div className="review-workbench">
      {/* Top Header */}
      <div className="review-header">
        <div className="review-header-left">
          <div className="review-title-section">
            <h1 className="review-title">Review Workbench: Zomato Resignation</h1>
            <div className="critical-flag-badge">
              <span className="regulation-tag">Reg 30(6)</span>
              <span className="critical-flag-text">CRITICAL FLAG</span>
            </div>
          </div>
          <div className="review-filters">
            <div className="filter-search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search Scrip, Keyword, or ISIN..."
              />
            </div>
            <div className="date-picker-container">
              <button className="date-nav-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <input type="date" className="date-input" defaultValue="2025-11-20" />
              <button className="date-nav-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button className="load-next-button">→ Load Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="review-content">
        {/* Left Panel - Document Viewer */}
        <div className="review-document-panel">
          <div className="document-header">
            <h2 className="document-title">Zomato KMP Resignation Filing (Source: BSE)</h2>
            <div className="page-indicator">
              Page {currentPage} of {totalPages}
            </div>
          </div>
          <div className="document-content">
            <div className="document-text">
              <p>To,</p>
              <p>The Listing Department,</p>
              <p>BSE Limited</p>
              <br />
              <p><strong>Subject:</strong> Intimation under Regulation 30 of SEBI (LODR) Regulations, 2015 - Resignation of Key Managerial Personnel (KMP)</p>
              <br />
              <div className="document-section highlight-yellow">
                <strong>SECTION: KMP RESIGNATION DETAILS</strong>
              </div>
              <p>
                This is to inform that Mr. Akshay Sinha, Chief Financial Officer (CFO) and Key Managerial Personnel (KMP) of the Company has tendered his resignation with effect from the close of business hours on{' '}
                <span className="highlight-green">December 31, 2025.</span>
              </p>
              <p>
                The Board of Directors accepted his resignation in the meeting held today. The Company extends its sincere gratitude for his contributions.
              </p>
              <br />
              <div className="document-section highlight-yellow">
                <strong>SECTION: REASONS FOR RESIGNATION</strong>
              </div>
              <p>
                The resignation is due to <strong><span className="highlight-pink">personal reasons</span></strong> and to pursue <strong><span className="highlight-pink">other opportunities outside the organization</span></strong>. The company affirms that there are no other material reasons.
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '16px' }}>
                (End of relevant section. Highlighted text corresponds to issues in the Triage Panel.)
              </p>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.2)', margin: '24px 0' }} />
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                *** Simulation Data for Scroll Testing ***
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Line 1: Filler text to force vertical scrolling.</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Line 2: Filler text to force vertical scrolling.</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Line 3: Filler text to force vertical scrolling.</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Line 4: Filler text to force vertical scrolling.</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Details & Issues */}
        <div className="review-details-panel">
          <div className="announcement-details-section">
            <h3 className="details-section-title">ANNOUNCEMENT DETAILS</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">ISIN:</span>
                <span className="detail-value">INE758T01015</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">Nov 20, 2025</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">KMP Change</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Score:</span>
                <span className="detail-value score-critical">42/100 (Critical)</span>
              </div>
            </div>
          </div>

          <div className="issues-section">
            <div className="issues-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <h3 className="issues-section-title">Issues & Flags (2)</h3>
            </div>

            <div className="issue-card issue-critical">
              <div className="issue-header">
                <div className="issue-indicator issue-critical-dot"></div>
                <div className="issue-title">
                  <strong>Critical: Vague Reason (Reg 30(6))</strong>
                </div>
              </div>
              <div className="issue-description">
                The AI flagged the reason "personal reasons and to pursue other opportunities" as non-compliant with the new circular requiring detailed, specific, and non-generic explanations.
              </div>
              <div className="issue-meta">
                <span className="issue-validation">Validation: Semantic Analysis</span>
                <button className="issue-action-link">View Rule</button>
              </div>
            </div>

            <div className="issue-card issue-warning">
              <div className="issue-header">
                <div className="issue-indicator issue-warning-dot"></div>
                <div className="issue-title">
                  <strong>Warning: Short Notice Period</strong>
                </div>
              </div>
              <div className="issue-description">
                Notice period (Nov 20 to Dec 31) is 41 days. Policy recommends 60 days.
              </div>
              <div className="issue-meta">
                <span className="issue-validation">Validation: Date Arithmetic</span>
                <button className="issue-action-link">View Rule</button>
              </div>
            </div>
          </div>

          <div className="officer-notes-section">
            <h3 className="officer-notes-title">Officer Notes (Internal)</h3>
            <textarea
              className="officer-notes-textarea"
              placeholder="Add internal notes for investigation..."
              rows="6"
            />
          </div>

          <div className="action-buttons-section">
            <button className="action-button action-dismiss">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Dismiss (No Action)
            </button>
            <button className="action-button action-query">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Send Query
            </button>
            <button className="action-button action-flag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0s-.83-.83 0-1.66L12 10"></path>
                <path d="M17.64 15L22 10.64a2.5 2.5 0 0 0 0-3.54l-2.82-2.82a2.5 2.5 0 0 0-3.54 0L12 6.36"></path>
                <path d="M8 8l-5.36 5.36a2.5 2.5 0 0 0 0 3.54l2.82 2.82a2.5 2.5 0 0 0 3.54 0L16 16"></path>
                <line x1="8" y1="8" x2="16" y2="16"></line>
              </svg>
              Flag as Violation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegulatorReview;
