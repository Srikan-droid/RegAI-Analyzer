import React, { useState, useMemo } from 'react';
import './EntityMaster.css';

const announcementHistory = [
  {
    id: 1,
    date: '2025-11-20',
    regulation: 'Reg 30(6)',
    subject: 'Resignation of KMP (Critical Alert)',
    status: 'Flagged',
    isCritical: true,
  },
  {
    id: 2,
    date: '2025-11-15',
    regulation: 'Reg 33',
    subject: 'Q3 Financial Results',
    status: 'Clear',
    isCritical: false,
  },
  {
    id: 3,
    date: '2025-10-30',
    regulation: 'Reg 30',
    subject: 'Board Meeting Intimation',
    status: 'Clear',
    isCritical: false,
  },
  {
    id: 4,
    date: '2025-10-10',
    regulation: 'Reg 30',
    subject: 'Closure of Trading Window',
    status: 'Clear',
    isCritical: false,
  },
  ...Array.from({ length: 244 }, (_, i) => ({
    id: i + 5,
    date: `2025-${String(9 - Math.floor(i / 30)).padStart(2, '0')}-${String(30 - (i % 30)).padStart(2, '0')}`,
    regulation: i % 3 === 0 ? 'Reg 30' : i % 3 === 1 ? 'Reg 33' : 'Reg 30(6)',
    subject: `Announcement ${i + 5}`,
    status: i % 5 === 0 ? 'Flagged' : 'Clear',
    isCritical: i % 5 === 0,
  })),
];

function EntityMaster() {
  const [activeTab, setActiveTab] = useState('scorecard');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [entitySearch, setEntitySearch] = useState('');

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcementHistory;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.regulation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'All Types') {
      filtered = filtered.filter((item) => item.regulation === typeFilter);
    }

    return filtered;
  }, [searchTerm, typeFilter]);

  return (
    <div className="entity-master">
      {/* Header Bar */}
      <div className="entity-header">
        <div className="entity-header-left">
          <h1 className="entity-title">Entity View: ZOMATO LTD.</h1>
          <div className="entity-isin">
            <span className="entity-isin-label">ISIN</span>
            <span className="entity-isin-value">INE758T01015</span>
          </div>
        </div>
        <div className="entity-header-right">
          <div className="load-entity-section">
            <input
              type="text"
              className="entity-search-input"
              placeholder="Enter Scrip Code or ISIN to search..."
              value={entitySearch}
              onChange={(e) => setEntitySearch(e.target.value)}
            />
            <button className="entity-search-button">Search</button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="entity-metrics-grid">
        <div className="entity-metric-card metric-blue">
          <div className="metric-label">TOTAL ANNOUNCEMENTS YTD</div>
          <div className="metric-value-large">248</div>
          <div className="metric-change">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 6 12 12 6 6"></polyline>
            </svg>
            <span>12% YoY</span>
          </div>
        </div>
        <div className="entity-metric-card metric-orange">
          <div className="metric-label">AVG. QUARTERLY COMPLIANCE SCORE</div>
          <div className="metric-value-large">82%</div>
        </div>
        <div className="entity-metric-card metric-red">
          <div className="metric-label">HIGH RISK ALERTS (LAST 90 DAYS)</div>
          <div className="metric-value-large">6</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="entity-content-layout">
        {/* Left Panel */}
        <div className="entity-left-panel">
          {/* Corporate Profile Section */}
          <div className="entity-info-card">
            <div className="card-title-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <h3 className="card-title">Corporate Profile</h3>
            </div>
            <div className="profile-details">
              <div className="profile-detail-row">
                <span className="profile-detail-label">Headquarters:</span>
                <span className="profile-detail-value">Gurugram, India</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Industry:</span>
                <span className="profile-detail-value">E-Commerce/Tech</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Exchange(s):</span>
                <span className="profile-detail-value">NSE & BSE</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Listing Date:</span>
                <span className="profile-detail-value">2021-07-23</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Auditor Firm:</span>
                <span className="profile-detail-value">Deloitte Haskins & Sells</span>
              </div>
            </div>
            <button className="view-filing-button">View All Filing History</button>
          </div>

          {/* Compliance Contact Section */}
          <div className="entity-info-card">
            <div className="card-title-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3 className="card-title">Compliance Contact</h3>
            </div>
            <div className="contact-info">
              <div className="contact-name">Mr. Akshant Goyal</div>
              <div className="contact-title">Company Secretary</div>
              <div className="contact-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>investors@zomato.com</span>
              </div>
              <div className="contact-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+91-124-6632488</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Tabs */}
        <div className="entity-right-panel">
          {/* Tabs */}
          <div className="entity-tabs">
            <button
              className={`entity-tab ${activeTab === 'scorecard' ? 'active' : ''}`}
              onClick={() => setActiveTab('scorecard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 6 18 6 15 10 10 14 2 18"></polyline>
                <polyline points="22 6 12 13 2 18"></polyline>
              </svg>
              Compliance Scorecard
            </button>
            <button
              className={`entity-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Company Profile
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'scorecard' && (
            <div className="tab-content">
              {/* Quarterly Score Overview */}
              <div className="score-overview-section">
                <div className="score-overview-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h3 className="section-title">Quarterly Score Overview</h3>
                </div>
                <div className="score-tiles">
                  <div className="score-tile score-tile-green">
                    <div className="score-tile-label">Q3 2025 Score</div>
                    <div className="score-tile-value">91%</div>
                  </div>
                  <div className="score-tile-divider"></div>
                  <div className="score-tile score-tile-red">
                    <div className="score-tile-label">Critical Violations YTD</div>
                    <div className="score-tile-value">2</div>
                  </div>
                </div>
              </div>

              {/* Announcement History Section */}
              <div className="announcement-history-section">
                <div className="announcement-history-header">
                <h3 className="history-title">All Announcement History ({announcementHistory.length} Total)</h3>
                <div className="history-filters">
                  <input
                    type="text"
                    className="history-search-input"
                    placeholder="Filter by event type or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    className="history-type-filter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="All Types">Filter by Type</option>
                    <option value="Reg 30">Reg 30</option>
                    <option value="Reg 30(6)">Reg 30(6)</option>
                    <option value="Reg 33">Reg 33</option>
                  </select>
                </div>
                </div>

                <div className="announcement-table-container">
                <table className="announcement-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Regulation</th>
                      <th>Subject</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnnouncements.map((item) => (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>
                          <span className={`regulation-cell ${item.isCritical ? 'regulation-critical' : ''}`}>
                            {item.regulation}
                          </span>
                        </td>
                        <td>{item.subject}</td>
                        <td>
                          <span className={`status-badge ${item.status === 'Flagged' ? 'status-flagged' : 'status-clear'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
        )}

        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="profile-placeholder">
              <p>Company Profile details will be displayed here.</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default EntityMaster;
