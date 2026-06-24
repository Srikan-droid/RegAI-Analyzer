import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgent } from '../context/AgentContext';
import './AgentPicker.css';

function AgentPicker() {
  const navigate = useNavigate();
  const { setSelectedAgent } = useAgent();

  const handleSelect = (agent) => {
    setSelectedAgent(agent);
    navigate(agent === 'analyzer' ? '/analyzer/home' : '/home');
  };

  return (
    <div className="agent-picker-page">
      <div className="agent-picker-container">
        <div className="agent-picker-header">
          <img src="/iris logo.png" alt="iRIS Logo" className="agent-picker-logo" />
          <h1>Choose your agent</h1>
          <p>Select the module you want to work with</p>
        </div>
        <div className="agent-picker-cards">
          <button
            type="button"
            className="agent-picker-card compliance"
            onClick={() => handleSelect('compliance')}
          >
            <div className="agent-picker-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2>Compliance Agent</h2>
            <p>Validate disclosures, monitor compliance scores, and manage regulatory submissions.</p>
            <span className="agent-picker-cta">Continue →</span>
          </button>
          <button
            type="button"
            className="agent-picker-card analyzer"
            onClick={() => handleSelect('analyzer')}
          >
            <div className="agent-picker-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <h2>Analyzer Agent</h2>
            <p>Run deep analysis on filings, explore patterns, and review analysis history.</p>
            <span className="agent-picker-cta">Continue →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgentPicker;
