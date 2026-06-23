import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LiveFeed.css';

const scoreFilters = [
  { key: 'all', label: 'All', count: 1240 },
  { key: 'low', label: 'Low Score (< 50)', count: 248 },
  { key: 'warn', label: 'Warnings (50-80)', count: 382 },
  { key: 'safe', label: 'Safe (80-100)', count: 610 },
];

const announcements = [
  {
    id: 1,
    received: 'Nov 20, 2025',
    time: '10:42 AM',
    company: 'ZOMATO LTD',
    isin: 'INE758T01015',
    type: 'Resignation of KMP',
    score: 42,
    sector: 'Technology',
    reason: 'Missing "Detailed Reason"',
    reasonSubtext: 'Circular 2023 Compliance',
    severity: 'alert',
    clause: 'Reg 30(6)',
    action: 'Review',
    badge: null,
  },
  {
    id: 2,
    received: 'Nov 20, 2025',
    time: '10:30 AM',
    company: 'ADANI ENT',
    isin: 'INE423A01024',
    type: 'Financial Results (Q3)',
    score: 35,
    sector: 'Conglomerate',
    reason: 'Calculation Mismatch',
    reasonSubtext: 'Assets != Liab + Equity',
    severity: 'alert',
    clause: 'Reg 33',
    action: 'Review',
    badge: 'Watchlist',
  },
  {
    id: 3,
    received: 'Nov 20, 2025',
    time: '10:15 AM',
    company: 'PAYTM (ONE 97)',
    isin: 'INE982J01020',
    type: 'Analyst Meet',
    score: 65,
    sector: 'Financial Services',
    reason: 'Delay > 24 Hours',
    reasonSubtext: 'Event: 2 days ago',
    severity: 'warn',
    clause: 'Reg 30(6)',
    action: 'Review',
    badge: null,
  },
  {
    id: 4,
    received: 'Nov 20, 2025',
    time: '09:50 AM',
    company: 'TCS LTD',
    isin: 'INE467B01029',
    type: 'Loss of Share Cert.',
    score: 98,
    sector: 'Technology',
    reason: 'Clean / No Issues',
    reasonSubtext: 'Auto Verified',
    severity: 'clean',
    clause: 'Reg 39(3)',
    action: 'Details',
    badge: null,
  },
  {
    id: 5,
    received: 'Nov 20, 2025',
    time: '09:30 AM',
    company: 'INFOSYS',
    isin: 'INE009A01021',
    type: 'Board Meeting Outcome',
    score: 55,
    sector: 'Technology',
    reason: 'Dividend Record Date?',
    reasonSubtext: 'AI unable to parse date',
    severity: 'warn',
    clause: 'Reg 42',
    action: 'Review',
    badge: null,
  },
  {
    id: 6,
    received: 'Nov 20, 2025',
    time: '09:05 AM',
    company: 'RELIANCE IND',
    isin: 'INE002A01018',
    type: 'Fund Raising',
    score: 46,
    sector: 'Energy',
    reason: 'Missing Pricing Details',
    reasonSubtext: 'Schedule VII disclosure',
    severity: 'alert',
    clause: 'Reg 29',
    action: 'Review',
    badge: null,
  },
  {
    id: 7,
    received: 'Nov 20, 2025',
    time: '08:55 AM',
    company: 'HDFC BANK',
    isin: 'INE040A01034',
    type: 'Press Release',
    score: 72,
    sector: 'Financial Services',
    reason: 'Pending Clarification',
    reasonSubtext: 'Awaiting supporting doc',
    severity: 'warn',
    clause: 'Reg 30',
    action: 'Review',
    badge: null,
  },
];

const announcementTypes = ['All Announcement Types', 'Resignation of KMP', 'Financial Results', 'Analyst Meet', 'Board Meeting', 'Fund Raising'];
const sectors = ['All Sectors', 'Technology', 'Financial Services', 'Energy', 'Conglomerate'];

const getScoreClass = (score) => {
  if (score >= 80) return 'score-safe';
  if (score >= 50) return 'score-warn';
  return 'score-low';
};

function RegulatorLiveFeed() {
  const navigate = useNavigate();
  const [scoreFilter, setScoreFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('All Announcement Types');
  const [sectorFilter, setSectorFilter] = useState('All Sectors');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      if (scoreFilter === 'low' && item.score >= 50) return false;
      if (scoreFilter === 'warn' && (item.score < 50 || item.score >= 80)) return false;
      if (scoreFilter === 'safe' && item.score < 80) return false;

      if (typeFilter !== 'All Announcement Types' && !item.type.startsWith(typeFilter.replace(' (Q3)', ''))) {
        return false;
      }

      if (sectorFilter !== 'All Sectors' && item.sector !== sectorFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const haystack = `${item.company} ${item.isin} ${item.type}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [scoreFilter, typeFilter, sectorFilter, searchTerm]);

  return (
    <div className="live-feed-page">
      <div className="live-feed-header">
        <div>
          <h1>Incoming Corporate Announcements</h1>
          <p>Real-time filings flowing in from 1,240 listed entities.</p>
        </div>
        <div className="sync-info sync-info-right">
          <span>Last synced</span>
          <div className="sync-time">
            10:45:30 AM
            <button type="button" aria-label="Refresh feed">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="feed-filter-chips">
        {scoreFilters.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`filter-chip ${scoreFilter === chip.key ? 'active' : ''} filter-${chip.key}`}
            onClick={() => setScoreFilter(chip.key)}
          >
            {chip.label}
            <span className="chip-count">{chip.count.toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="feed-filter-row">
        <div className="filter-select-group">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {announcementTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search Scrip or Keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="feed-table-wrapper">
        <table className="feed-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Scrip / Company</th>
              <th>Announcement Type</th>
              <th>Comp. Score</th>
              <th>AI Flag / Reason</th>
              <th>LODR Clause</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnnouncements.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="received-date">{item.received}</div>
                  <div className="received-time">{item.time}</div>
                </td>
                <td>
                  <div className="company-name">
                    {item.company}
                    {item.badge && <span className="watchlist-badge">{item.badge}</span>}
                  </div>
                  <div className="company-isin">{item.isin}</div>
                </td>
                <td>{item.type}</td>
                <td>
                  <span className={`score-pill ${getScoreClass(item.score)}`}>
                    {item.score} / 100
                  </span>
                </td>
                <td>
                  <div className={`reason-text reason-${item.severity}`}>{item.reason}</div>
                  <div className="reason-subtext">{item.reasonSubtext}</div>
                </td>
                <td>{item.clause}</td>
                <td>
                  <button
                    type="button"
                    className={`review-btn ${item.action === 'Details' ? 'secondary' : ''}`}
                    onClick={() => {
                      if (item.action === 'Review') {
                        navigate('/regulator/review');
                      }
                    }}
                  >
                    {item.action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="feed-table-footer">
        <span>
          Showing {filteredAnnouncements.length ? '1' : '0'} to {Math.min(filteredAnnouncements.length, 5)} of{' '}
          {filteredAnnouncements.length.toLocaleString()} entries
        </span>
        <div className="feed-pagination">
          <button type="button" className="page-btn" disabled>
            Prev
          </button>
          <button type="button" className="page-btn active">
            1
          </button>
          <button type="button" className="page-btn">
            2
          </button>
          <button type="button" className="page-btn">
            3
          </button>
          <button type="button" className="page-btn">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegulatorLiveFeed;

