<<<<<<< HEAD
import React, { useMemo } from 'react';
import './DisclosureDetailsModal.css';
import { formatDisplayDate } from '../data/disclosures';
import { generateRuleResults } from '../utils/ruleUtils';
import { findRuleMetadata } from '../constants/validationRules';

function DisclosureDetailsModal({ disclosure, onClose }) {
  const derivedRules = useMemo(() => {
    if (!disclosure) {
      return [];
    }

    const { complianceScore, ruleResults = [] } = disclosure;
    if (ruleResults.length) {
      return ruleResults;
    }
    if (complianceScore != null) {
      const { ruleResults: generatedRules } = generateRuleResults(complianceScore);
      return generatedRules;
    }
    return [];
  }, [disclosure]);

  if (!disclosure) {
    return null;
  }

  const { announcementTitle, dateOfEvent, complianceScore, regulations = [] } = disclosure;
  const scoreClass =
    complianceScore != null ? `compliance-score ${getScoreIndicatorClass(complianceScore)}` : '';
=======
import React from 'react';
import './DisclosureDetailsModal.css';
import { formatDisplayDate } from '../data/disclosures';

function DisclosureDetailsModal({ documentData, onClose }) {
  const { rules = [], regulations = [], compliance_score, announcement_title, date_of_event, recommendation = [], rules_summary = {} } = documentData || {};

  // Helper function to format extracted_data for display in a systematic, easy-to-understand way
  const formatExtractedData = (extractedData) => {
    if (!extractedData) return 'Not available';
    
    if (typeof extractedData === 'string') {
      return extractedData;
    }
    
    if (typeof extractedData === 'number' || typeof extractedData === 'boolean') {
      return String(extractedData);
    }
    
    if (typeof extractedData === 'object') {
      // Handle arrays
      if (Array.isArray(extractedData)) {
        if (extractedData.length === 0) return 'Not available';
        return extractedData.map((item, idx) => {
          if (typeof item === 'object' && item !== null) {
            return `Item ${idx + 1}: ${JSON.stringify(item)}`;
          }
          return `• ${String(item)}`;
        }).join('\n');
      }
      
      // Handle null
      if (extractedData === null) {
        return 'Not available';
      }
      
      // Format object as key-value pairs with proper handling of nested objects
      const entries = Object.entries(extractedData);
      if (entries.length === 0) return 'Not available';
      
      // Recursive function to format values with proper indentation
      const formatValue = (val, key = '', indentLevel = 0) => {
        const indent = '  '.repeat(indentLevel);
        
        if (val === null || val === undefined) {
          return 'N/A';
        }
        
        if (typeof val === 'boolean') {
          return val ? 'Yes' : 'No';
        }
        
        if (typeof val === 'number') {
          // Special handling for Content Matching - add percentage sign
          if (key === 'content_matching' || key.toLowerCase().includes('content matching')) {
            return `${val}%`;
          }
          // Format large numbers with commas
          return val.toLocaleString();
        }
        
        if (typeof val === 'string') {
          // Special handling for Content Matching if it's a string number
          if (key === 'content_matching' || key.toLowerCase().includes('content matching')) {
            const numValue = parseFloat(val);
            if (!isNaN(numValue)) {
              return `${numValue}%`;
            }
          }
          return val;
        }
        
        if (Array.isArray(val)) {
          if (val.length === 0) return 'None';
          // Check if all items are simple (not objects)
          const allSimple = val.every(item => {
            const itemType = typeof item;
            return itemType !== 'object' || item === null;
          });
          
          if (allSimple) {
            // All simple values - show each on a new line with proper indentation
            return val.map(item => {
              if (item === null || item === undefined) return 'N/A';
              if (typeof item === 'number') {
                // Format numbers with commas for readability
                return `${indent}${item.toLocaleString()}`;
              }
              return `${indent}${String(item)}`;
            }).join('\n');
          } else {
            // Has complex items - show numbered on separate lines with indentation
            return val.map((item, idx) => {
              if (typeof item === 'object' && item !== null) {
                // Recursively format nested objects
                const nestedIndent = indent + '  ';
                const nestedEntries = Object.entries(item);
                const nestedFormatted = nestedEntries.map(([k, v]) => {
                  const formattedK = k.trim().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return `${nestedIndent}${formattedK}: ${formatValue(v, k, indentLevel + 2)}`;
                }).join('\n');
                return `${indent}${idx + 1}. ${nestedFormatted}`;
              }
              return `${indent}${idx + 1}. ${String(item)}`;
            }).join('\n');
          }
        }
        
        if (typeof val === 'object') {
          // Format nested objects with indentation
          const nestedEntries = Object.entries(val);
          if (nestedEntries.length === 0) return 'None';
          
          return nestedEntries.map(([k, v]) => {
            const formattedK = k.trim().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const formattedV = formatValue(v, k, indentLevel + 1);
            return `${indent}${formattedK}: ${formattedV}`;
          }).join('\n');
        }
        
        return String(val);
      };
      
      return entries.map(([key, value]) => {
        // Format key to be more readable (Title Case)
        const formattedKey = key.trim().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Format value based on its type
        const formattedValue = formatValue(value, key, 1);
        
        // For nested objects, add newline before the value
        const separator = (typeof value === 'object' && value !== null && !Array.isArray(value)) ? ':\n' : ': ';
        
        return `${formattedKey}${separator}${formattedValue}`;
      }).join('\n\n'); // Double newline between main entries for better separation
    }
    
    return 'Not available';
  };

  // Get recommendations from top-level recommendation array (new structure)
  // Fallback to old structure (recommendations in rules) for backward compatibility
  const recommendations = recommendation && recommendation.length > 0
    ? recommendation.map(rec => ({
        ruleId: rec.rule_id,
        suggestion: rec.suggestion,
        // Try to find the rule message for additional context
        message: rules.find(r => r.rule_id === rec.rule_id)?.message || ''
      }))
    : rules
        .filter(rule => rule.recommendation && rule.recommendation.trim())
        .map(rule => ({
          ruleId: rule.rule_id,
          suggestion: rule.recommendation, // Use recommendation as suggestion for old structure
          message: rule.message
        }));

  // Debug logging
  // console.log('[DisclosureDetailsModal] Recommendations:', {
  //   rawRecommendation: recommendation,
  //   rawCount: recommendation?.length || 0,
  //   processedCount: recommendations.length,
  //   recommendations: recommendations
  // });

  // Check if we should show loading state
  const failCount = rules_summary?.fail_count || 0;
  const shouldShowLoading = 
    compliance_score !== null &&
    compliance_score < 100 &&
    recommendations.length < failCount;

  if (!documentData) {
    return null;
  }

  const scoreClass = compliance_score != null ? `compliance-score ${getScoreIndicatorClass(compliance_score)}` : '';
>>>>>>> dev

  return (
    <div className="disclosure-modal-overlay" onClick={onClose}>
      <div className="disclosure-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="disclosure-modal-header">
          <div>
<<<<<<< HEAD
            <h3>{announcementTitle}</h3>
            <p className="disclosure-meta">
              Date: <span>{formatDisplayDate(dateOfEvent)}</span> • Source: <span>Upload</span>
=======
            <h3>{announcement_title}</h3>
            <p className="disclosure-meta">
              Date: <span>{date_of_event ? formatDisplayDate(date_of_event) : '-'}</span> • Source: <span>Upload</span>
>>>>>>> dev
            </p>
          </div>
          <button className="disclosure-modal-close" onClick={onClose} aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="disclosure-summary">
          <div>
            <span className="summary-label">Compliance Score</span>
            <div className={`summary-value ${scoreClass}`}>
<<<<<<< HEAD
              {complianceScore != null ? `${complianceScore}%` : '-'}
=======
              {compliance_score != null ? `${typeof compliance_score === 'number' ? compliance_score.toFixed(2) : parseFloat(compliance_score || 0).toFixed(2)}%` : '-'}
>>>>>>> dev
            </div>
          </div>
          <div>
            <span className="summary-label">Regulations</span>
            <div className="regulation-pill-container">
              {regulations.length ? (
<<<<<<< HEAD
                regulations.map((reg) => (
                  <span key={reg} className="regulation-pill">
=======
                regulations.map((reg, index) => (
                  <span key={index} className="regulation-pill">
>>>>>>> dev
                    {reg}
                  </span>
                ))
              ) : (
                <span className="regulation-pill muted">Not available</span>
              )}
            </div>
          </div>
        </div>

        <div className="rule-section">
          <div className="rule-section-header">
            <h4>Rules Validated</h4>
<<<<<<< HEAD
            <span className="rule-count">{derivedRules.length || 0} checks</span>
          </div>
          {derivedRules.length ? (
=======
            <span className="rule-count">{rules.length || 0} checks</span>
          </div>
          {rules.length > 0 ? (
>>>>>>> dev
            <table className="rule-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
<<<<<<< HEAD
                  <th>Rule Description</th>
                  <th>Extracted Evidence</th>
=======
                  <th>Message</th>
                  <th>Extracted Data</th>
                  <th>Score</th>
>>>>>>> dev
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
<<<<<<< HEAD
                {derivedRules.map((rule) => {
                  const ruleIdLabel = getRuleIdLabel(rule);
                  return (
                    <tr key={rule.id}>
                      <td className="rule-id-cell">
                        {ruleIdLabel ? <span className="rule-id-pill">{ruleIdLabel}</span> : '—'}
                      </td>
                      <td>
                        <span className="rule-name">{rule.name}</span>
                      </td>
                      <td>{rule.detail || 'Context extracted from PDF submission'}</td>
                      <td>
                        <span className={`rule-status ${rule.status.toLowerCase()}`}>
                          {rule.status}
=======
                {rules.map((rule, index) => {
                  const ruleId = rule.rule_id || '';
                  const isCRRule = ruleId.startsWith('CR_');
                  const extractedData = formatExtractedData(rule.extracted_data);
                  const ruleScore = rule.rule_score || '—';
                  const statusText = rule.validation_status === 'SUCCESS' ? 'Pass' : rule.validation_status === 'FAIL' ? 'Fail' : rule.validation_status;
                  
                  return (
                    <tr key={index} className="rule-table-row">
                      <td className="rule-id-cell">
                        <span className={`rule-id-pill ${isCRRule ? 'cr-rule' : 'ec-rule'}`}>
                          {ruleId || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="rule-name">{rule.message || '—'}</span>
                      </td>
                      <td className="extracted-data-cell">{extractedData}</td>
                      <td>
                        <span className="rule-score">{ruleScore}</span>
                      </td>
                      <td>
                        <span className={`rule-status ${getRuleStatusClass(rule.validation_status)}`}>
                          {statusText}
>>>>>>> dev
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="rule-empty-state">Validation results will appear once processing ends.</div>
          )}
        </div>
<<<<<<< HEAD
=======

        {/* AI Recommendation section */}
        {(recommendations.length > 0 || shouldShowLoading) && (
          <div className="rule-section">
            <div className="rule-section-header">
              <h4>AI Recommendation</h4>
            </div>
            {recommendations.length > 0 ? (
              <div className="recommendations-list">
                {recommendations.map((rec) => (
                  <div key={rec.ruleId || `rec-${rec.ruleId}`} className="recommendation-item">
                    <div className="recommendation-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="recommendation-icon">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                      <span className="recommendation-rule-id">{rec.ruleId}</span>
                    </div>
                    <p className="recommendation-text">{rec.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : shouldShowLoading ? (
              <div className="recommendations-loading">
                <div className="loading-spinner"></div>
                <p className="loading-text">
                  AI generating suggestions<span className="loading-dots">...</span>
                </p>
                <p className="loading-subtext">
                  {failCount > 0 ? (
                    <>
                      {recommendations.length === 0 
                        ? `Waiting for recommendations... (0/${failCount})`
                        : recommendations.length < failCount
                        ? `Received ${recommendations.length} out of ${failCount} recommendations (${recommendations.length}/${failCount})`
                        : `All recommendations received! (${recommendations.length}/${failCount})`
                      }
                    </>
                  ) : (
                    'This may take a few moments.'
                  )}
                </p>
              </div>
            ) : null}
          </div>
        )}
>>>>>>> dev
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default DisclosureDetailsModal;

const getRuleIdLabel = (rule) => {
  if (!rule) return '';
  if (rule.ruleId) return rule.ruleId;
  const metadata = findRuleMetadata(rule.ruleId || rule.name || rule.check);
  return metadata?.id || '';
};

=======
>>>>>>> dev
const getScoreIndicatorClass = (score) => {
  if (score >= 80) return 'score-good';
  if (score >= 50) return 'score-warning';
  return 'score-poor';
};
<<<<<<< HEAD
=======

const getRuleStatusClass = (status) => {
  if (status === 'SUCCESS') return 'pass';
  if (status === 'FAIL') return 'fail';
  return '';
};

export default DisclosureDetailsModal;
>>>>>>> dev
