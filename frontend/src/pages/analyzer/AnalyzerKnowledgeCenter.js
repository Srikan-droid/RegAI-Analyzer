import React, { useState } from 'react';
import '../../App.css';

const MOCK_REGULATIONS = [
  {
    id: 1,
    title: 'Market Analysis Framework Guidelines',
    category: 'Analysis',
    description: 'Framework for structured market and filing analysis',
    keywords: ['analysis', 'framework', 'market'],
  },
  {
    id: 2,
    title: 'Financial Statement Interpretation Standards',
    category: 'Financial',
    description: 'Standards for interpreting financial disclosures in analysis workflows',
    keywords: ['financial', 'statements', 'interpretation'],
  },
  {
    id: 3,
    title: 'Corporate Event Pattern Recognition',
    category: 'Patterns',
    description: 'Reference patterns for detecting material corporate events',
    keywords: ['events', 'patterns', 'corporate'],
  },
];

function AnalyzerKnowledgeCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const results = searchQuery.trim()
    ? MOCK_REGULATIONS.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="App" style={{ minHeight: 'auto' }}>
      <div className="container">
        {!selected && (
          <div className="homepage-content">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="search-section"
            >
              <div className="search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search analysis knowledge base..."
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  Search
                </button>
              </div>
            </form>

            {searchQuery && results.length > 0 && (
              <div className="search-results">
                <h2 className="results-title">Search Results ({results.length})</h2>
                <div className="results-grid">
                  {results.map((reg) => (
                    <div key={reg.id} className="regulation-card" onClick={() => setSelected(reg)}>
                      <span className="category-badge">{reg.category}</span>
                      <h3 className="card-title">{reg.title}</h3>
                      <p className="card-description">{reg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && results.length === 0 && (
              <div className="no-results">
                <p>No results found for &quot;{searchQuery}&quot;</p>
              </div>
            )}

            {!searchQuery && (
              <>
                <div className="divider"><span>OR</span></div>
                <div className="directory-grid">
                  {MOCK_REGULATIONS.map((reg) => (
                    <div key={reg.id} className="regulation-card" onClick={() => setSelected(reg)}>
                      <span className="category-badge">{reg.category}</span>
                      <h3 className="card-title">{reg.title}</h3>
                      <p className="card-description">{reg.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {selected && (
          <div className="detail-view">
            <button type="button" className="back-button" onClick={() => setSelected(null)}>
              Back
            </button>
            <div className="detail-content">
              <span className="detail-category">{selected.category}</span>
              <h2 className="detail-title">{selected.title}</h2>
              <p className="detail-description">{selected.description}</p>
              <div className="detail-keywords">
                <h3>Keywords</h3>
                <div className="keywords-container">
                  {selected.keywords.map((k) => (
                    <span key={k} className="keyword-tag">{k}</span>
                  ))}
                </div>
              </div>
              <p style={{ marginTop: '16px', color: '#666', fontSize: '0.9rem' }}>
                Prototype: full regulation detail tables are not connected.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyzerKnowledgeCenter;
