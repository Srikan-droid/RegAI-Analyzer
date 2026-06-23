<<<<<<< HEAD
import React, { useMemo, useState } from 'react';
=======
import React, { useMemo, useState, useEffect, useCallback, startTransition } from 'react';
>>>>>>> dev
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { formatDisplayDate } from './data/disclosures';
import { useDisclosures } from './context/DisclosuresContext';
import { usePortalMode } from './context/PortalModeContext';
<<<<<<< HEAD
=======
import apiService from './services/api';
>>>>>>> dev

function Dashboard() {
  const { disclosures } = useDisclosures();
  const navigate = useNavigate();
  const { portalMode } = usePortalMode();
<<<<<<< HEAD

  const latestDisclosures = useMemo(() => disclosures.slice(0, 5), [disclosures]);

  const metrics = useMemo(() => {
    const totalAnnouncements = disclosures.length;
    let scoreAbove80 = 0;
    let scoreBetween50And80 = 0;
    let scoreBelow50 = 0;

    disclosures.forEach((item) => {
      if (item.complianceScore == null) return;

      if (item.complianceScore >= 80) {
        scoreAbove80 += 1;
      } else if (item.complianceScore >= 50) {
        scoreBetween50And80 += 1;
      } else {
        scoreBelow50 += 1;
      }
    });

    return {
      totalAnnouncements,
      scoreAbove80,
      scoreBetween50And80,
      scoreBelow50,
    };
  }, [disclosures]);
=======
  const [complianceMetrics, setComplianceMetrics] = useState({
    total_announcements: 0,
    compliance_metrics: {
      greater_than_equal_80: 0,
      between_50_and_79: 0,
      below_50: 0
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedDisclosures, setPaginatedDisclosures] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load compliance metrics from backend
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await apiService.getComplianceMetrics();
        setComplianceMetrics(data);
      } catch (error) {
        console.error('Failed to load compliance metrics:', error);
      }
    };
    loadMetrics();
  }, []);

  // Load paginated documents
  const loadDocuments = React.useCallback(async (isPolling = false) => {
    // CRITICAL FIX: Don't set loading state during polling to prevent blinking
    if (!isPolling) {
      setLoading(true);
    }
    try {
      const response = await apiService.listPDFDocuments(currentPage, pageSize);
      if (response.results) {
        // Map backend data to frontend format
        const mappedDisclosures = response.results.map(doc => {
          // Extract reg_title from result_data
          let regTitle = doc.announcement_title;
          if (doc.result_data && typeof doc.result_data === 'object') {
            for (const key in doc.result_data) {
              if (doc.result_data[key]?.reg_title) {
                regTitle = doc.result_data[key].reg_title;
                break;
              }
            }
          }
          
          return {
            id: doc.id,
            documentId: doc.id,
            announcementTitle: regTitle || doc.file_name.replace('.pdf', ''),
            dateOfEvent: doc.date_of_event,
            uploadedDate: doc.uploaded_at,
            requestId: doc.request_id,
            fileStatus: doc.validation_status, // Already mapped by backend
            complianceScore: doc.compliance_score,
            fileName: doc.file_name,
            resultData: doc.result_data,
            mandate: doc.mandate,
            typeOfSubmission: doc.type_of_submission,
            resultIndex: doc.result_index, // Index for multiple validation results
          };
        });
        
        // CRITICAL FIX: Count how many results exist for each document ID
        // Only show result index if there are multiple results for the same document
        const documentResultCounts = {};
        mappedDisclosures.forEach(item => {
          const key = item.documentId || item.id;
          if (!documentResultCounts[key]) {
            documentResultCounts[key] = 0;
          }
          documentResultCounts[key]++;
        });
        
        // Update mappedDisclosures to include hasMultipleResults flag
        mappedDisclosures.forEach(item => {
          const key = item.documentId || item.id;
          item.hasMultipleResults = documentResultCounts[key] > 1;
        });
        
        // CRITICAL FIX: Use startTransition for state updates during polling to prevent blinking
        if (isPolling) {
          startTransition(() => {
            setPaginatedDisclosures(mappedDisclosures);
            setTotalPages(response.total_pages || 1);
          });
        } else {
          setPaginatedDisclosures(mappedDisclosures);
          setTotalPages(response.total_pages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Real-time polling for processing documents - refresh every 10 seconds
  useEffect(() => {
    // Check if there are any processing documents
    const hasProcessingDocs = paginatedDisclosures.some(
      doc => doc.fileStatus === 'PROCESSING' || doc.fileStatus === 'Processing' || doc.fileStatus === 'PENDING'
    );

    if (!hasProcessingDocs) {
      return; // No processing documents, no need to poll
    }

    //console.log('[Dashboard] Starting real-time polling for processing documents');
    const intervalId = setInterval(() => {
      // CRITICAL FIX: Pass isPolling=true to prevent loading state changes
      loadDocuments(true);
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [paginatedDisclosures, loadDocuments]);

  const metrics = useMemo(() => {
    return {
      totalAnnouncements: complianceMetrics.total_announcements,
      scoreAbove80: complianceMetrics.compliance_metrics.greater_than_equal_80,
      scoreBetween50And80: complianceMetrics.compliance_metrics.between_50_and_79,
      scoreBelow50: complianceMetrics.compliance_metrics.below_50,
    };
  }, [complianceMetrics]);
>>>>>>> dev

  if (portalMode === 'Regulator') {
    return <RegulatorDashboard />;
  }

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="entity-overview-section">
        <h2 className="section-title">Entity Overview</h2>
        <div className="metrics-container">
          <div 
            className="metric-card total-announcements clickable" 
            onClick={() => navigate('/validation')}
          >
            <div className="metric-value">{metrics.totalAnnouncements}</div>
            <div className="metric-label">Total Announcements</div>
          </div>
          <div 
            className="metric-card score-high clickable" 
            onClick={() => navigate('/validation?scoreFilter=80-plus')}
          >
            <div className="metric-value">{metrics.scoreAbove80}</div>
            <div className="metric-label">Compliance ≥ 80%</div>
          </div>
          <div 
            className="metric-card score-mid clickable" 
            onClick={() => navigate('/validation?scoreFilter=50-79')}
          >
            <div className="metric-value">{metrics.scoreBetween50And80}</div>
            <div className="metric-label">Compliance 50-79%</div>
          </div>
          <div 
            className="metric-card score-low clickable" 
            onClick={() => navigate('/validation?scoreFilter=below-50')}
          >
            <div className="metric-value">{metrics.scoreBelow50}</div>
            <div className="metric-label">Compliance &lt; 50%</div>
          </div>
        </div>
        <div className="quick-upload-container">
          <button className="quick-upload-button" onClick={() => navigate('/upload')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Quick Upload
          </button>
        </div>
      </div>

      <div className="latest-disclosures-section">
        <h2 className="section-title">Latest Disclosures</h2>
        <div className="disclosures-table-container">
<<<<<<< HEAD
          <table className="disclosures-table">
            <thead>
              <tr>
                <th>Announcement Title</th>
                <th>Date of Event</th>
                <th>Regulations</th>
                <th>Status</th>
                <th>Compliance Score</th>
              </tr>
            </thead>
            <tbody>
              {latestDisclosures.map((item) => {
                const showScore = item.fileStatus === 'Completed' && item.complianceScore != null;
                const isClickable = item.fileStatus === 'Completed';
                // Generate dummy data if missing
                const displayTitle = item.announcementTitle || `Disclosure - ${item.fileName?.replace('.pdf', '') || 'Document'}`;
                const displayDate = item.dateOfEvent || new Date().toISOString().split('T')[0];
                return (
                  <tr key={item.id}>
                    <td>
                      <button
                        className={`disclosure-link ${!isClickable ? 'disabled' : ''}`}
                        onClick={() => isClickable && navigate(`/validation/${item.id}`, { state: { from: 'dashboard' } })}
                        disabled={!isClickable}
                      >
                        {displayTitle}
                      </button>
                    </td>
                    <td>{formatDisplayDate(displayDate)}</td>
                    <td>
                      {item.regulations.map((reg) => (
                        <span key={reg} className="regulation-tag">
                          {reg}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(item.fileStatus)}`}>
                        {item.fileStatus}
                      </span>
                    </td>
                    <td>
                      {showScore ? (
                        <span className="compliance-score">
                          <span className={`score-indicator ${getScoreIndicatorClass(item.complianceScore)}`} />
                          {item.complianceScore}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
=======
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
          ) : (
            <table className="disclosures-table">
              <thead>
                <tr>
                  <th>Announcement Title</th>
                  <th>Status</th>
                  <th>Compliance Score</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDisclosures.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                      No disclosures found
                    </td>
                  </tr>
                ) : (
                  paginatedDisclosures.map((item) => {
                    const showScore = item.fileStatus === 'COMPLETED' && item.complianceScore != null;
                    const isClickable = item.fileStatus === 'COMPLETED';
                    const displayTitle = item.announcementTitle || `Disclosure - ${item.fileName?.replace('.pdf', '') || 'Document'}`;
                    
                    return (
                      <tr key={item.id}>
                        <td>
                          <button
                            className={`disclosure-link ${!isClickable ? 'disabled' : ''}`}
                            onClick={() => {
                              if (isClickable) {
                                const url = item.resultIndex != null 
                                  ? `/validation/${item.id}?result_index=${item.resultIndex}`
                                  : `/validation/${item.id}`;
                                navigate(url, { state: { from: 'dashboard' } });
                              }
                            }}
                            disabled={!isClickable}
                          >
                            {displayTitle} {item.hasMultipleResults && item.resultIndex != null ? `(Result ${parseInt(item.resultIndex) + 1})` : ''}
                          </button>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(item.fileStatus)}`}>
                            {item.fileStatus}
                          </span>
                        </td>
                        <td>
                          {showScore ? (
                            <span className="compliance-score">
                              <span className={`score-indicator ${getScoreIndicatorClass(item.complianceScore)}`} />
                              {typeof item.complianceScore === 'number' 
                                ? item.complianceScore.toFixed(2) 
                                : parseFloat(item.complianceScore || 0).toFixed(2)}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!loading && paginatedDisclosures.length > 0 && (
          <div className="pagination-bar" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-button"
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span className="pagination-info" style={{ fontSize: '14px', color: '#666' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= totalPages}
              className="pagination-button"
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: currentPage >= totalPages ? '#f5f5f5' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
>>>>>>> dev
      </div>
    </div>
  );
}

const getStatusClass = (status) => {
  switch (status) {
<<<<<<< HEAD
    case 'Completed':
      return 'status-completed';
    case 'Processing':
      return 'status-processing';
    case 'Pending':
      return 'status-pending';
    case 'Error':
      return 'status-error';
=======
    case 'COMPLETED':
    case 'Completed':
      return 'status-completed';
    case 'PROCESSING':
    case 'Processing':
      return 'status-processing';
    case 'PENDING':
    case 'Pending':
      return 'status-pending';
    case 'ERROR':
    case 'Error':
      return 'status-error';
    case 'CANCELLED':
>>>>>>> dev
    case 'Cancelled':
      return 'status-cancelled';
    default:
      return '';
  }
};

const getScoreIndicatorClass = (score) => {
  if (score >= 80) return 'score-good';
  if (score >= 50) return 'score-warning';
  return 'score-poor';
};

const regulatorMetrics = [
  {
    key: 'incoming',
    title: 'Incoming Today',
    value: '1,240',
    subtitle: '↑ 12% vs Avg',
    subtitleClass: 'subtitle-positive',
    badge: 'Incoming',
    variant: 'reg-metric-incoming',
    borderClass: 'border-blue',
  },
  {
    key: 'low',
    title: 'Low Score (< 50)',
    value: '15',
    subtitle: 'Action Req.',
    subtitleClass: 'subtitle-alert',
    badge: 'Critical',
    variant: 'reg-metric-low',
    borderClass: 'border-red',
  },
  {
    key: 'warning',
    title: 'Warnings (50-80)',
    value: '42',
    subtitle: 'Pending Review',
    subtitleClass: 'subtitle-neutral',
    badge: 'Warning',
    variant: 'reg-metric-warning',
    borderClass: 'border-orange',
  },
  {
    key: 'safe',
    title: 'Safe (80-100)',
    value: '850',
    subtitle: 'Auto-Verified',
    subtitleClass: 'subtitle-neutral',
    badge: 'Safe',
    variant: 'reg-metric-safe',
    borderClass: 'border-green',
  },
];

const complianceTrendTiles = [
  {
    key: 'today',
    title: 'Today',
    safe: 64,
    warning: 24,
    critical: 12,
  },
  {
    key: 'yesterday',
    title: 'Yesterday',
    safe: 71,
    warning: 20,
    critical: 9,
  },
  {
    key: 'weekly',
    title: '7-day Avg',
    safe: 76,
    warning: 16,
    critical: 8,
  },
];

const priorityQueue = [
  {
    company: 'RELIANCE (500325)',
    announcement: 'Resignation of KMP',
    reason: 'Missing "Detailed Reason"',
    score: 42,
    received: '10:42 AM',
  },
  {
    company: 'ADANI ENT (512599)',
    announcement: 'Financial Results',
    reason: 'Calculation Mismatch (Equity)',
    score: 35,
    received: '10:30 AM',
  },
  {
    company: 'TATA MOTORS (500570)',
    announcement: 'Analyst Meet',
    reason: 'Late Submission (>24h)',
    score: 48,
    received: '09:50 AM',
  },
  {
    company: 'POWERGRID (532898)',
    announcement: 'Debt Rating Update',
    reason: 'Rating Not Disclosed',
    score: 44,
    received: '09:15 AM',
  },
  {
    company: 'HDFC BANK (500180)',
    announcement: 'Board Meeting Outcome',
    reason: 'Missing Attendee Details',
    score: 39,
    received: '08:55 AM',
  },
  {
    company: 'INFOSYS (500209)',
    announcement: 'Press Release',
    reason: 'Unsupported Claim Evidence',
    score: 33,
    received: '08:20 AM',
  },
  {
    company: 'BHARTI AIRTEL (532454)',
    announcement: 'Investor Presentation',
    reason: 'Outdated Financial Metrics',
    score: 32,
    received: '08:05 AM',
  },
  {
    company: 'ICICI BANK (532174)',
    announcement: 'Quarterly Results',
    reason: 'Missing Auditor Statement',
    score: 41,
    received: '07:50 AM',
  },
  {
    company: 'L&T (500510)',
    announcement: 'Project Award',
    reason: 'Contract Value Not Shared',
    score: 37,
    received: '07:40 AM',
  },
  {
    company: 'KOTAK BANK (500247)',
    announcement: 'Capital Raising',
    reason: 'Missing Voting Results',
    score: 29,
    received: '07:25 AM',
  },
  {
    company: 'SUN PHARMA (524715)',
    announcement: 'Regulatory Filing',
    reason: 'Incomplete Annexures',
    score: 26,
    received: '07:15 AM',
  },
  {
    company: 'ULTRATECH (532538)',
    announcement: 'Capacity Expansion',
    reason: 'Missing Sustainability Impact',
    score: 31,
    received: '07:05 AM',
  },
  {
    company: 'MARUTI (532500)',
    announcement: 'Production Update',
    reason: 'Variance Explanation Missing',
    score: 34,
    received: '06:55 AM',
  },
  {
    company: 'ONGC (500312)',
    announcement: 'Operational Update',
    reason: 'Delayed Disclosure (>24h)',
    score: 23,
    received: '06:40 AM',
  },
  {
    company: 'WIPRO (507685)',
    announcement: 'Leadership Change',
    reason: 'No Background Verification',
    score: 28,
    received: '06:30 AM',
  },
];

function RegulatorDashboard() {
  const navigate = useNavigate();
  const [showFullQueue, setShowFullQueue] = useState(false);
  const extraCount = Math.max(priorityQueue.length - 3, 0);
  const visibleQueue = showFullQueue ? priorityQueue : priorityQueue.slice(0, 3);
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="reg-dashboard">
      <div className="reg-dashboard-header">
        <div className="reg-header-left">
          <div>
            <h1>Today&apos;s Overview</h1>
            <p>{formattedDate} · Last updated: just now</p>
          </div>
          <button className="refresh-icon-button" aria-label="Refresh data">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
        <div className="reg-market-toolbar">
          <div className="reg-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search Scrip Code, ISIN, or Keyword..."
              className="reg-search-input"
            />
          </div>
          <div className="reg-market-status-card">
            <span className="reg-market-status-label">Market Status</span>
            <span className="reg-market-status-value">
              OPEN <span className="reg-market-status-change">(+0.4%)</span>
            </span>
          </div>
        </div>
      </div>

      <div className="reg-metrics-grid">
        {regulatorMetrics.map((metric) => (
          <div key={metric.key} className={`reg-metric-card ${metric.variant} ${metric.borderClass}`}>
            <div className="reg-metric-header">
              <span>{metric.title}</span>
              {metric.badge && <span className="reg-metric-badge">{metric.badge}</span>}
            </div>
            <div className="reg-metric-value">{metric.value}</div>
            <div className={`reg-metric-subtitle ${metric.subtitleClass}`}>
              {metric.key === 'low' ? (
                <button type="button" className="reg-metric-link">
                  {metric.subtitle}
                </button>
              ) : (
                metric.subtitle
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="reg-section">
        <div className="reg-section-header">
          <div>
            <h3>Compliance Score Trends (Market Wide)</h3>
          </div>
          <select className="reg-range-select" defaultValue="">
            <option value="">Select range</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>
        <div className="reg-trend-tiles">
          {complianceTrendTiles.map((tile) => (
            <div key={tile.key} className="reg-trend-tile">
              <div className="trend-tile-header">
                <span>{tile.title}</span>
                {tile.tag && <span className="trend-tag">{tile.tag}</span>}
              </div>
              <div className="trend-tile-chart">
                <div className="trend-stack">
                  <span className="trend-segment safe" style={{ height: `${tile.safe}%` }}></span>
                  <span className="trend-segment warning" style={{ height: `${tile.warning}%` }}></span>
                  <span className="trend-segment critical" style={{ height: `${tile.critical}%` }}></span>
                </div>
                <div className="trend-metrics">
                  <span className="metric safe">{tile.safe}% Safe</span>
                  <span className="metric warning">{tile.warning}% Warning</span>
                  <span className="metric critical">{tile.critical}% Critical</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="reg-legend">
          <span><span className="legend-dot safe"></span>Safe (80-100)</span>
          <span><span className="legend-dot warning"></span>Warning (50-80)</span>
          <span><span className="legend-dot critical"></span>Critical (&lt; 50)</span>
        </div>
      </div>

      <div className="reg-section">
        <div className="reg-section-header">
          <div>
            <h3>Priority Attention</h3>
            <p>Top disclosures flagged by AI that require regulator review.</p>
          </div>
                {extraCount > 0 && (
                  <button
                    className="view-queue-button"
                    type="button"
                    onClick={() => setShowFullQueue((prev) => !prev)}
                  >
                    {showFullQueue ? 'Show Top Alerts' : `View Full Queue (${extraCount} more items)`}
                  </button>
                )}
        </div>
        <div className="reg-table-wrapper">
          <table className="reg-priority-table">
            <thead>
              <tr>
                <th>Compliance Score</th>
                <th>Scrip / Company</th>
                <th>Announcement</th>
                <th>AI Flag Reason</th>
                <th>Rec’d Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
                      {visibleQueue.map((row) => (
                        <tr key={`${row.company}-${row.reason}`}>
                  <td>
                            <span className="priority-score score-critical">
                              <span className="score-indicator score-poor"></span>
                              {row.score} / 100
                    </span>
                  </td>
                  <td>
                    <div className="priority-company">{row.company}</div>
                  </td>
                  <td>{row.announcement}</td>
                  <td className="priority-reason">{row.reason}</td>
                  <td>{row.received}</td>
                  <td>
                    <button className="review-link" onClick={() => navigate('/regulator/review')}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

