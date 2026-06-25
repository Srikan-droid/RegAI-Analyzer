import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Dashboard.css';

const MOCK_ANALYSES = [
  { id: 1, title: 'Q3 Earnings Call Transcript Analysis', status: 'COMPLETED', score: 92 },
  { id: 2, title: 'Annual Report Risk Factor Review', status: 'COMPLETED', score: 78 },
  { id: 3, title: 'Board Resolution Pattern Scan', status: 'PROCESSING', score: null },
  { id: 4, title: 'Related Party Transaction Deep Dive', status: 'COMPLETED', score: 65 },
  { id: 5, title: 'Material Event Sentiment Analysis', status: 'COMPLETED', score: 88 },
];

function AnalyzerDashboard() {
  const navigate = useNavigate();

  const metrics = {
    totalAnalyses: 24,
    scoreHigh: 14,
    scoreMid: 7,
    scoreLow: 3,
  };

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="entity-overview-section">
        <h2 className="section-title">Analysis Overview</h2>
        <div className="metrics-container">
          <div className="metric-card total-announcements clickable" onClick={() => navigate('/analyzer/history')}>
            <div className="metric-value">{metrics.totalAnalyses}</div>
            <div className="metric-label">Total Analyses</div>
          </div>
          <div className="metric-card score-high clickable" onClick={() => navigate('/analyzer/history')}>
            <div className="metric-value">{metrics.scoreHigh}</div>
            <div className="metric-label">Insight Score ≥ 80%</div>
          </div>
          <div className="metric-card score-mid clickable" onClick={() => navigate('/analyzer/history')}>
            <div className="metric-value">{metrics.scoreMid}</div>
            <div className="metric-label">Insight Score 50–79%</div>
          </div>
          <div className="metric-card score-low clickable" onClick={() => navigate('/analyzer/history')}>
            <div className="metric-value">{metrics.scoreLow}</div>
            <div className="metric-label">Insight Score &lt; 50%</div>
          </div>
        </div>
        <div className="quick-upload-container">
          <button className="quick-upload-button" onClick={() => navigate('/analyzer/insight')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            New Insight
          </button>
        </div>
      </div>

      <div className="latest-disclosures-section">
        <h2 className="section-title">Recent Analyses</h2>
        <div className="disclosures-table-container">
          <table className="disclosures-table">
            <thead>
              <tr>
                <th>Analysis Title</th>
                <th>Status</th>
                <th>Insight Score</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ANALYSES.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button type="button" className="disclosure-link" onClick={() => navigate('/analyzer/history')}>
                      {item.title}
                    </button>
                  </td>
                  <td>
                    <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                  </td>
                  <td>
                    {item.score != null ? (
                      <span className="compliance-score">
                        <span className={`score-indicator ${item.score >= 80 ? 'score-good' : item.score >= 50 ? 'score-warning' : 'score-poor'}`} />
                        {item.score}%
                      </span>
                    ) : (
                      '-'
                    )}
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

export default AnalyzerDashboard;
