import React, { useState } from 'react';
import '../../ValidationHistory.css';

const MOCK_HISTORY = [
  { id: 1, title: 'Q3 Earnings Call Transcript Analysis', eventDate: '2025-09-15', uploaded: '2025-09-16', status: 'COMPLETED', score: 92 },
  { id: 2, title: 'Annual Report Risk Factor Review', eventDate: '2025-08-01', uploaded: '2025-08-02', status: 'COMPLETED', score: 78 },
  { id: 3, title: 'Board Resolution Pattern Scan', eventDate: '2025-07-20', uploaded: '2025-07-21', status: 'PROCESSING', score: null },
  { id: 4, title: 'Related Party Transaction Deep Dive', eventDate: '2025-06-10', uploaded: '2025-06-11', status: 'COMPLETED', score: 65 },
  { id: 5, title: 'Material Event Sentiment Analysis', eventDate: '2025-05-22', uploaded: '2025-05-23', status: 'COMPLETED', score: 88 },
  { id: 6, title: 'Corporate Governance Benchmark', eventDate: '2025-04-05', uploaded: '2025-04-06', status: 'COMPLETED', score: 71 },
  { id: 7, title: 'Insider Trading Disclosure Review', eventDate: '2025-03-18', uploaded: '2025-03-19', status: 'ERROR', score: null },
];

function AnalysisHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = MOCK_HISTORY.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="validation-history-page">
      <div className="validation-header">
        <h1 className="validation-title">Analysis History</h1>
        <p className="validation-subtitle">Review past analysis runs and insight scores</p>
      </div>

      <div className="filters-section" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search analyses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '200px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      <div className="validation-table-container">
        <table className="validation-table">
          <thead>
            <tr>
              <th>Analysis Title</th>
              <th>Event Date</th>
              <th>Uploaded</th>
              <th>Status</th>
              <th>Insight Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <button
                    type="button"
                    className="disclosure-link"
                    onClick={() => window.alert('Prototype: analysis detail view is not connected.')}
                  >
                    {item.title}
                  </button>
                </td>
                <td>{item.eventDate}</td>
                <td>{item.uploaded}</td>
                <td>
                  <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                </td>
                <td>{item.score != null ? `${item.score}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AnalysisHistory;
