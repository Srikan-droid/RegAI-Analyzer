<<<<<<< HEAD
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDisclosures } from '../context/DisclosuresContext';
import { formatDisplayDate } from '../data/disclosures';
import { generateRuleResults } from '../utils/ruleUtils';
import { findRuleMetadata } from '../constants/validationRules';
import DisclosureDetailsModal from '../components/DisclosureDetailsModal';
=======
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatDisplayDate } from '../data/disclosures';
import DisclosureDetailsModal from '../components/DisclosureDetailsModal';
import apiService from '../services/api';
>>>>>>> dev
import './DisclosureDetailsPage.css';

function DisclosureDetailsPage() {
  const { disclosureId } = useParams();
<<<<<<< HEAD
  const navigate = useNavigate();
  const location = useLocation();
  const { disclosures } = useDisclosures();
  const [showModal, setShowModal] = useState(false);

  const disclosure = useMemo(
    () => disclosures.find((item) => String(item.id) === String(disclosureId)),
    [disclosures, disclosureId]
  );

  const derivedRules = useMemo(() => {
    if (!disclosure) return [];
    if (disclosure.ruleResults?.length) return disclosure.ruleResults;
    if (disclosure.complianceScore != null) {
      return generateRuleResults(disclosure.complianceScore);
    }
    return [];
  }, [disclosure]);

  const failedRules = useMemo(() => {
    return derivedRules.filter((rule) => rule.status?.toLowerCase() === 'fail');
  }, [derivedRules]);

  const aiRecommendations = useMemo(() => {
    return failedRules.map((rule) => ({
      ruleName: rule.name,
      recommendation: generateAIRecommendation(rule.name),
    }));
  }, [failedRules]);

  if (!disclosure) {
    return (
      <div className="disclosure-details-page">
        <div className="details-card">
          <p className="details-empty">We couldn't find that disclosure.</p>
          <button className="back-button" onClick={() => navigate('/validation')}>
            Back to Validation History
          </button>
        </div>
      </div>
    );
  }

  const { announcementTitle, dateOfEvent, complianceScore, fileStatus, fileName, regulations = [] } = disclosure;
  const fileUrl = fileName ? `/uploads/${fileName}` : null;
  const isPdfFile = fileName?.toLowerCase().endsWith('.pdf');
=======
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationPollCount, setRecommendationPollCount] = useState(0);
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const resultIndexRef = useRef(null); // Store result_index to use in polling
  const isMountedRef = useRef(true); // Track if component is mounted
  const consecutiveErrorsRef = useRef(0); // Track consecutive errors
  const MAX_CONSECUTIVE_ERRORS = 3; // Stop polling after 3 consecutive errors

  // Helper function to extract data from result_data (reusable for initial load and polling updates)
  const extractDataFromResultData = (data, resultIndex) => {
    let finalComplianceScore = data.compliance_score;
    let extractedRules = data.rules || [];
    let extractedRulesSummary = data.rules_summary || { total_checks: 0, pass_count: 0, fail_count: 0 };
    let extractedRecommendations = data.recommendation || [];
    
    if (data.result_data && typeof data.result_data === 'object') {
      // Check if result_data has numeric keys (multiple results format: "0", "1", etc.)
      const numericKeys = Object.keys(data.result_data).filter(key => /^\d+$/.test(key));
      
      if (numericKeys.length > 0) {
        // Multiple results format - use result_index if provided, otherwise use first result
        const targetKey = resultIndex !== null ? String(resultIndex) : numericKeys.sort((a, b) => parseInt(a) - parseInt(b))[0];
        const targetResult = data.result_data[targetKey];
        
        //console.log(`[DisclosureDetailsPage] Processing result_data with numeric keys: ${numericKeys.join(', ')}, using key: ${targetKey}`);
        
        if (targetResult && typeof targetResult === 'object') {
          // Extract compliance score from target result
          if ('score' in targetResult) {
            const scoreValue = targetResult.score;
            if (scoreValue != null && !isNaN(scoreValue)) {
              finalComplianceScore = parseFloat(parseFloat(scoreValue).toFixed(2));
              //console.log(`[DisclosureDetailsPage] Extracted compliance score from nested result_data[${targetKey}]: ${finalComplianceScore}`);
            }
          }
          
          // Always extract rules from result_data if it exists
          extractedRules = [];
          let passCount = 0;
          let failCount = 0;
          
          Object.keys(targetResult).forEach(ruleId => {
            if (ruleId === 'score' || !targetResult[ruleId] || typeof targetResult[ruleId] !== 'object') {
              return;
            }
            
            const ruleData = targetResult[ruleId];
            const validationStatus = ruleData.validation_status || '';
            
            if (validationStatus === 'SUCCESS') {
              passCount++;
            } else if (validationStatus === 'FAIL') {
              failCount++;
            }
            
            extractedRules.push({
              rule_id: ruleId,
              message: ruleData.message || '',
              validation_status: validationStatus,
              validation: ruleData.validation || '',
              rule_score: ruleData.rule_score || '',
              extracted_data: ruleData.extracted_data || {},
              recommendation: ruleData.recommendation || ''
            });
          });
          
          extractedRulesSummary = {
            total_checks: extractedRules.length,
            pass_count: passCount,
            fail_count: failCount
          };
          
          //console.log(`[DisclosureDetailsPage] Extracted ${extractedRules.length} rules from nested result_data[${targetKey}] (${passCount} pass, ${failCount} fail)`);
        }
      } else {
        // SEBI format - rules are directly in result_data (no numeric keys)
        //console.log(`[DisclosureDetailsPage] SEBI format detected - rules directly in result_data`);
        
        if ('score' in data.result_data) {
          const scoreValue = data.result_data.score;
          if (scoreValue != null && !isNaN(scoreValue)) {
            finalComplianceScore = parseFloat(parseFloat(scoreValue).toFixed(2));
            //console.log(`[DisclosureDetailsPage] Extracted compliance score from result_data.score: ${finalComplianceScore}`);
          }
        }
        
        if ('_recommendations' in data.result_data && Array.isArray(data.result_data._recommendations)) {
          extractedRecommendations = data.result_data._recommendations;
          //console.log(`[DisclosureDetailsPage] Extracted ${extractedRecommendations.length} recommendations from result_data._recommendations`);
        }
        
        extractedRules = [];
        let passCount = 0;
        let failCount = 0;
        
        Object.keys(data.result_data).forEach(ruleId => {
          if (ruleId === 'score' || ruleId === '_recommendations' || !data.result_data[ruleId] || typeof data.result_data[ruleId] !== 'object') {
            return;
          }
          
          const ruleData = data.result_data[ruleId];
          const validationStatus = ruleData.validation_status || '';
          
          if (validationStatus === 'SUCCESS') {
            passCount++;
          } else if (validationStatus === 'FAIL') {
            failCount++;
          }
          
          extractedRules.push({
            rule_id: ruleData.rule_id || ruleId,
            message: ruleData.message || '',
            validation_status: validationStatus,
            validation: ruleData.validation || '',
            rule_score: ruleData.rule_score || '',
            extracted_data: ruleData.extracted_data || {},
            recommendation: ruleData.recommendation || '',
            reg_id: ruleData.reg_id || '',
            reg_title: ruleData.reg_title || '',
            dependent_rule: ruleData.dependent_rule || null,
            announcement_text: ruleData.announcement_text || ''
          });
        });
        
        extractedRulesSummary = {
          total_checks: extractedRules.length,
          pass_count: passCount,
          fail_count: failCount
        };
        
        //console.log(`[DisclosureDetailsPage] Extracted ${extractedRules.length} rules from result_data (${passCount} pass, ${failCount} fail)`);
      }
    }
    
    // Round compliance score to 2 decimal places if it exists
    if (finalComplianceScore !== null && finalComplianceScore !== undefined) {
      finalComplianceScore = parseFloat(finalComplianceScore.toFixed(2));
    }
    if (data.compliance_score !== null && data.compliance_score !== undefined && !isNaN(data.compliance_score)) {
      data.compliance_score = parseFloat(parseFloat(data.compliance_score).toFixed(2));
    }
    
    // Return updated data with extracted values
    return {
      ...data,
      compliance_score: finalComplianceScore !== null && finalComplianceScore !== undefined ? finalComplianceScore : data.compliance_score,
      rules: extractedRules.length > 0 ? extractedRules : data.rules,
      rules_summary: extractedRulesSummary.total_checks > 0 ? extractedRulesSummary : data.rules_summary,
      recommendation: extractedRecommendations.length > 0 ? extractedRecommendations : data.recommendation
    };
  };

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        setLoading(true);
        const resultIndexParam = searchParams.get('result_index');
        // Convert result_index to number if provided, otherwise null
        const resultIndex = resultIndexParam !== null ? resultIndexParam : null;
        // Store result_index in ref for use in polling
        resultIndexRef.current = resultIndex;
        //console.log(`[DisclosureDetailsPage] Fetching document details for ID: ${disclosureId}, result_index: ${resultIndex}`);
        const data = await apiService.getDocumentDetails(disclosureId, resultIndex);
        
        // Use helper function to extract data from result_data
        const updatedData = extractDataFromResultData(data, resultIndex);
        
        // console.log('[DisclosureDetailsPage] Document details received:', {
        //   id: updatedData.id,
        //   validation_status: updatedData.validation_status,
        //   compliance_score: updatedData.compliance_score,
        //   rules: updatedData.rules,
        //   rulesCount: updatedData.rules?.length || 0,
        //   rulesSummary: updatedData.rules_summary,
        //   recommendation: updatedData.recommendation,
        //   recommendationCount: updatedData.recommendation?.length || 0,
        //   hasRecommendations: !!(updatedData.recommendation && updatedData.recommendation.length > 0),
        //   recommendationStructure: updatedData.recommendation ? JSON.stringify(updatedData.recommendation, null, 2) : 'null',
        //   hasResultData: !!updatedData.result_data,
        //   resultDataKeys: updatedData.result_data ? Object.keys(updatedData.result_data) : [],
        //   resultIndex: resultIndex
        // });
        // Only update state if component is still mounted (prevents race conditions)
        if (isMountedRef.current) {
          setDocumentData(updatedData);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch document details:', err);
        setError(err.message || 'Failed to load document details');
      } finally {
        setLoading(false);
      }
    };

    if (disclosureId) {
      fetchDocumentDetails();
    }
  }, [disclosureId, searchParams]);

  // Poll for recommendations if score < 100% and no recommendations yet
  useEffect(() => {
    if (!documentData) return;

    const {
      validation_status,
      compliance_score,
      recommendation = [],
      rules_summary = { fail_count: 0 }
    } = documentData;

    const failCount = rules_summary.fail_count || 0;
    const recommendationCount = recommendation?.length || 0;

    // console.log('[DisclosureDetailsPage] Recommendation check:', {
    //   validation_status,
    //   compliance_score,
    //   recommendationCount,
    //   failCount,
    //   recommendation: recommendation,
    //   isLoadingRecommendations,
    //   isPolling: isPollingRef.current,
    //   allRecommendationsReceived: recommendationCount >= failCount && failCount > 0
    // });

    // Check if we have all recommendations (count matches fail count)
    // For JSE files, recommendations can exist even when failCount is 0
    // Stop polling if:
    // 1. We have all recommendations (failCount > 0 && recommendationCount >= failCount)
    // 2. Score >= 100% (perfect score, no recommendations expected)
    // 3. failCount === 0 AND we already have recommendations (for JSE files, we got what we need)
    // 4. failCount === 0 AND score >= 100% (no failed rules and perfect score)
    const hasAllRecommendations = failCount > 0 && recommendationCount >= failCount;
    const perfectScore = compliance_score !== null && compliance_score >= 100;
    const hasRecommendationsWithZeroFailCount = failCount === 0 && recommendationCount > 0;
    const noRecommendationsExpected = (failCount === 0 && recommendationCount === 0 && perfectScore) || perfectScore;
    const shouldStopPolling = hasAllRecommendations || noRecommendationsExpected || hasRecommendationsWithZeroFailCount;
    
    // If we have all recommendations or none are expected, stop polling
    if (shouldStopPolling) {
      // console.log(`[DisclosureDetailsPage] Stopping polling. Reason:`, {
      //   hasAllRecommendations,
      //   noRecommendationsExpected,
      //   hasRecommendationsWithZeroFailCount,
      //   shouldStopPolling,
      //   recommendationCount,
      //   failCount,
      //   compliance_score
      // });
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
      setIsLoadingRecommendations(false);
      setRecommendationPollCount(0);
      return;
    }

    // Check if we need to poll for recommendations
    // Poll if: completed, score < 100%, and missing recommendations
    // For JSE files: poll if failCount === 0 but we have no recommendations yet (they might still be generating)
    // For regular files: poll if failCount > 0 and recommendationCount < failCount
    const shouldPoll = 
      validation_status === 'COMPLETED' &&
      compliance_score !== null &&
      compliance_score < 100 &&
      (
        (failCount > 0 && recommendationCount < failCount) || // Regular case: missing recommendations
        (failCount === 0 && recommendationCount === 0) // JSE case: no recommendations yet but might be generating
      );
    
    // console.log('[DisclosureDetailsPage] Should poll:', shouldPoll, {
    //   isPolling: isPollingRef.current,
    //   failCount,
    //   recommendationCount,
    //   needMore: failCount > recommendationCount
    // });
    
    // Only start polling if we should poll AND we're not already polling
    if (shouldPoll && !isPollingRef.current) {
      //console.log(`[DisclosureDetailsPage] Starting recommendation polling... (Need ${failCount} recommendations, have ${recommendationCount})`);
      isPollingRef.current = true;
      setIsLoadingRecommendations(true);
      setRecommendationPollCount(0);
      
      // Poll for recommendations continuously until we have all (every 5 seconds)
      let pollCount = 0;
      
      const pollOnce = async () => {
        pollCount++;
        setRecommendationPollCount(pollCount);
        //console.log(`[DisclosureDetailsPage] Polling attempt ${pollCount} for document ${disclosureId} (Need ${failCount} recommendations)`);
        
        try {
          //console.log(`[DisclosureDetailsPage] Calling refreshRecommendations API for document ${disclosureId}, result_index: ${resultIndexRef.current}`);
          const refreshResponse = await apiService.refreshRecommendations(disclosureId, resultIndexRef.current);
          //console.log('[DisclosureDetailsPage] Refresh response:', refreshResponse);
          
          // Reset error counter on successful API call
          consecutiveErrorsRef.current = 0;
          
          // Check if API explicitly says no recommendations expected (score >= 100%)
          if (refreshResponse.message && refreshResponse.message.includes('No recommendations expected')) {
            //console.log('[DisclosureDetailsPage] API indicates no recommendations expected, stopping polling');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            isPollingRef.current = false;
            setIsLoadingRecommendations(false);
            setRecommendationPollCount(0);
            
            // Reload document details to get latest state (CRITICAL: use result_index from ref)
            const rawData = await apiService.getDocumentDetails(disclosureId, resultIndexRef.current);
            const extractedData = extractDataFromResultData(rawData, resultIndexRef.current);
            setDocumentData(extractedData);
            return;
          }
          
          // Reload document details to get updated recommendations count (CRITICAL: use result_index from ref)
          const rawData = await apiService.getDocumentDetails(disclosureId, resultIndexRef.current);
          const extractedData = extractDataFromResultData(rawData, resultIndexRef.current);
          const updatedRecommendationCount = extractedData.recommendation?.length || 0;
          const updatedFailCount = extractedData.rules_summary?.fail_count || 0;
          const updatedComplianceScore = extractedData.compliance_score;
          
          //console.log(`[DisclosureDetailsPage] Current status: ${updatedRecommendationCount}/${updatedFailCount} recommendations, score: ${updatedComplianceScore}`);
          
          // Stop polling if:
          // 1. API says all_recommendations_received is true
          // 2. All recommendations received (count >= fail_count and fail_count > 0)
          // 3. Score >= 100% (perfect score, no recommendations)
          // 4. fail_count is 0 AND we have recommendations (for JSE files, we got what we need)
          // 5. fail_count is 0 AND score >= 100% (no failed rules and perfect score)
          const shouldStopPolling = 
            refreshResponse.all_recommendations_received === true ||
            (updatedFailCount > 0 && updatedRecommendationCount >= updatedFailCount) ||
            (updatedComplianceScore !== null && updatedComplianceScore >= 100) ||
            (updatedFailCount === 0 && updatedRecommendationCount > 0) || // JSE: have recommendations even with 0 fail count
            (updatedFailCount === 0 && updatedComplianceScore !== null && updatedComplianceScore >= 100); // No fails and perfect score
          
          if (shouldStopPolling) {
            // console.log(`[DisclosureDetailsPage] Stopping polling. Reason:`, {
            //   all_recommendations_received: refreshResponse.all_recommendations_received,
            //   recommendations: `${updatedRecommendationCount}/${updatedFailCount}`,
            //   fail_count: updatedFailCount,
            //   score: updatedComplianceScore
            // });
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            isPollingRef.current = false;
            setIsLoadingRecommendations(false);
            setRecommendationPollCount(0);
            
            // Always update document data with latest state (use extracted data)
            //console.log('[DisclosureDetailsPage] Updating document data with latest recommendations:', extractedData.recommendation);
            setDocumentData(extractedData);
          } else if (refreshResponse.has_recommendations || updatedRecommendationCount > 0) {
            // We got some recommendations but not all yet, update and continue polling
            //console.log(`[DisclosureDetailsPage] Got ${updatedRecommendationCount} recommendations, need ${updatedFailCount}. Continuing polling...`);
            setDocumentData(extractedData);
          } else {
            //console.log(`[DisclosureDetailsPage] Recommendations not available yet (attempt ${pollCount}), will continue polling...`);
            // Still update document data to ensure UI reflects current state (use extracted data)
            setDocumentData(extractedData);
          }
        } catch (error) {
          console.error('[DisclosureDetailsPage] Failed to refresh recommendations:', error);
          console.error('[DisclosureDetailsPage] Error details:', error.message, error.stack);
          
          consecutiveErrorsRef.current++;
          
          // Check error type
          const errorMessage = error.message?.toLowerCase() || '';
          const isUnauthorized = error.message === 'Unauthorized' || errorMessage.includes('401');
          const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('document not found');
          const isForbidden = errorMessage.includes('forbidden') || errorMessage.includes('403');
          
          // Stop immediately on auth/not found errors, or after max consecutive errors
          const shouldStop = isUnauthorized || isNotFound || isForbidden || consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS;
          
          if (shouldStop) {
            //console.log(`[DisclosureDetailsPage] Stopping polling due to error (${consecutiveErrorsRef.current} consecutive errors):`, error.message);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            isPollingRef.current = false;
            setIsLoadingRecommendations(false);
            setRecommendationPollCount(0);
            consecutiveErrorsRef.current = 0; // Reset counter
            
            // Show error message to user
            setError(`Failed to fetch recommendations: ${error.message || 'Unknown error'}`);
          } else {
            //console.log(`[DisclosureDetailsPage] Error occurred (${consecutiveErrorsRef.current}/${MAX_CONSECUTIVE_ERRORS}), will continue polling...`);
          }
        }
      };
      
      // Reset error counter when starting new polling session
      consecutiveErrorsRef.current = 0;
      
      // Poll immediately (don't wait 5 seconds for first attempt)
      pollOnce();
      
      // Then set up interval for subsequent polls
      pollingIntervalRef.current = setInterval(pollOnce, 5000); // Poll every 5 seconds
      //console.log('[DisclosureDetailsPage] Polling interval set up, intervalId:', pollingIntervalRef.current);
    } else if (!shouldPoll && isPollingRef.current) {
      // Stop polling if conditions are no longer met
      //console.log('[DisclosureDetailsPage] Stopping polling - conditions no longer met');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
      setIsLoadingRecommendations(false);
      setRecommendationPollCount(0);
    }
    
    // Cleanup function - only runs on unmount or when disclosureId changes
    return () => {
      // Only clean up if component is unmounting or disclosureId changes
      if (pollingIntervalRef.current) {
        //console.log('[DisclosureDetailsPage] Cleaning up polling interval on unmount/disclosureId change');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        isPollingRef.current = false;
      }
    };
  }, [disclosureId, documentData?.validation_status, documentData?.compliance_score, documentData?.recommendation?.length, documentData?.rules_summary?.fail_count]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);
>>>>>>> dev

  const handleBack = () => {
    if (location.state?.from === 'dashboard') {
      navigate('/home');
    } else {
      navigate('/validation');
    }
  };

<<<<<<< HEAD
  return (
    <div className="disclosure-details-page">
      <header className="details-header">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>
    </header>
=======
  if (loading) {
    return (
      <div className="disclosure-details-page">
        <div className="details-card">
          <p className="details-empty">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="disclosure-details-page">
        <div className="details-card">
          <p className="details-empty">{error || 'We couldn\'t find that disclosure.'}</p>
          <button className="back-button" onClick={handleBack}>
            Back to Validation History
          </button>
        </div>
      </div>
    );
  }

  const {
    announcement_title,
    date_of_event,
    uploaded_at,
    validation_status,
    compliance_score,
    file_name,
    file_url,
    regulations = [],
    rules = [],
    rules_summary = { total_checks: 0, pass_count: 0, fail_count: 0 },
    recommendation = []
  } = documentData;

  const isPdfFile = file_name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="disclosure-details-page">
      <header className="details-header">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
      </header>
>>>>>>> dev

      <section className="details-card">
        <div className="details-summary">
          <div className="summary-text">
<<<<<<< HEAD
            <h1>{announcementTitle}</h1>
            <p>
              Date: <span>{formatDisplayDate(dateOfEvent)}</span> • Source: <span>Upload</span>
            </p>
            <p>
              Status: <span className={`status-badge ${getStatusClass(fileStatus)}`}>{fileStatus}</span>
            </p>
            {regulations.length > 0 && (
              <div className="regulations-section">
                <span className="regulations-label">Regulations</span>
                <div className="regulations-list">
                  {regulations.map((reg) => (
                    <span key={reg} className="regulation-pill">
=======
            <h1>{announcement_title}</h1>
            <p>
              Date: <span>{date_of_event ? formatDisplayDate(date_of_event) : '-'}</span> • Source: <span>Upload</span>
            </p>
            <p>
              Status: <span className={`status-badge ${getStatusClass(validation_status)}`}>{validation_status}</span>
            </p>
            {regulations.length > 0 && (
              <div className="regulations-section">
                <span className="regulations-label">REGULATIONS</span>
                <div className="regulations-list">
                  {regulations.map((reg, index) => (
                    <span key={index} className="regulation-pill">
>>>>>>> dev
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="summary-actions">
            <div className="file-actions">
<<<<<<< HEAD
              {isPdfFile && fileUrl ? (
                <>
                  <a
                    className="file-action-btn"
                    href={fileUrl}
=======
              {isPdfFile && file_url ? (
                <>
                  <a
                    className="file-action-btn"
                    href={file_url}
>>>>>>> dev
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View PDF
                  </a>
                  <a
                    className="file-action-btn secondary"
<<<<<<< HEAD
                    href={fileUrl}
                    download={fileName}
=======
                    href={file_url}
                    download={file_name}
>>>>>>> dev
                  >
                    Download
                  </a>
                </>
              ) : (
                <span className="file-action-placeholder">Document not available</span>
              )}
            </div>
            <div className="summary-score">
<<<<<<< HEAD
              <span>Compliance Score</span>
              {complianceScore != null ? (
                <strong className={`compliance-score ${getScoreIndicatorClass(complianceScore)}`}>
                  {complianceScore}%
=======
              <span>COMPLIANCE SCORE</span>
              {compliance_score != null ? (
                <strong className={`compliance-score ${getScoreIndicatorClass(compliance_score)}`}>
                  {typeof compliance_score === 'number' 
                    ? compliance_score.toFixed(2) 
                    : parseFloat(compliance_score || 0).toFixed(2)}%
>>>>>>> dev
                </strong>
              ) : (
                <strong>-</strong>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="details-card">
        <div className="rules-header">
          <h2>Rules Validated</h2>
          <div className="rules-actions">
<<<<<<< HEAD
            <span>{derivedRules.length || 0} checks</span>
            <button className="view-details-link" onClick={() => setShowModal(true)}>
              View details
            </button>
          </div>
        </div>
        <div className="rules-table-wrapper">
          {derivedRules.length ? (
=======
            <span>{rules_summary.total_checks} checks</span>
            {rules_summary.pass_count > 0 && <span className="pass-count">{rules_summary.pass_count} Pass</span>}
            {rules_summary.fail_count > 0 && <span className="fail-count">{rules_summary.fail_count} Fail</span>}
            {rules.length > 0 && (
              <button className="view-details-link" onClick={() => setShowModal(true)}>
                View details
              </button>
            )}
          </div>
        </div>
        <div className="rules-table-wrapper">
          {rules.length > 0 ? (
>>>>>>> dev
            <table className="rule-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
<<<<<<< HEAD
                  <th>Rule Description</th>
=======
                  <th>Message</th>
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
                        <span className="rule-name">{rule.name || 'Rule description unavailable'}</span>
                      </td>
                      <td>
                        <span className={`rule-status ${rule.status?.toLowerCase()}`}>{rule.status}</span>
=======
                {rules.map((rule, index) => {
                  const isCRRule = rule.rule_id?.startsWith('CR_');
                  const statusText = rule.validation_status === 'SUCCESS' ? 'Pass' : rule.validation_status === 'FAIL' ? 'Fail' : rule.validation_status;
                  return (
                    <tr key={index}>
                      <td className="rule-id-cell">
                        <span className={`rule-id-pill ${isCRRule ? 'cr-rule' : 'ec-rule'}`}>
                          {rule.rule_id || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="rule-name">{rule.message || '—'}</span>
                      </td>
                      <td>
                        <span className={`rule-status ${getRuleStatusClass(rule.validation_status)}`}>
                          {statusText}
                        </span>
>>>>>>> dev
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="details-empty">Validation results will appear once processing completes.</p>
          )}
        </div>
      </section>

<<<<<<< HEAD
      {aiRecommendations.length > 0 && (
        <section className="details-card">
          <div className="ai-recommendations-header">
            <h2>AI Recommendation</h2>
          </div>
          <div className="ai-recommendations-list">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className="ai-recommendation-item">
                <div className="recommendation-rule">
                  <span className="recommendation-icon">💡</span>
                  <strong>{rec.ruleName}</strong>
                </div>
                <p className="recommendation-text">{rec.recommendation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {showModal && (
        <DisclosureDetailsModal disclosure={disclosure} onClose={() => setShowModal(false)} />
=======
      {/* AI Recommendation section */}
      {(() => {
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

        // Debug logging to track recommendations
        // console.log('[DisclosureDetailsPage] Recommendations processing:', {
        //   rawRecommendation: recommendation,
        //   rawRecommendationCount: recommendation?.length || 0,
        //   processedRecommendations: recommendations,
        //   processedCount: recommendations.length,
        //   recommendationDetails: recommendations.map(r => ({ 
        //     ruleId: r.ruleId, 
        //     suggestion: r.suggestion?.substring(0, 50) + '...' 
        //   }))
        // });

        // Show loading state if score < 100% and we don't have all recommendations yet
        // Show loading whenever we should be polling (even if polling hasn't started yet)
        const failCount = rules_summary?.fail_count || 0;
        const shouldShowLoading = 
          validation_status === 'COMPLETED' &&
          compliance_score !== null &&
          compliance_score < 100 &&
          failCount > 0 &&
          recommendations.length < failCount;

        // Show "No recommendations" message if score >= 100%
        const shouldShowNoRecommendations = 
          validation_status === 'COMPLETED' &&
          compliance_score !== null &&
          compliance_score >= 100 &&
          recommendations.length === 0;

        // Show recommendations if available
        if (recommendations.length > 0) {
          const currentCount = recommendations.length;
          const totalExpected = failCount;
          const progressText = totalExpected > 0 
            ? `${currentCount}/${totalExpected}` 
            : '0/0';
          const hasMoreLoading = shouldShowLoading; // More recommendations are still loading
          
          return (
            <section className="details-card">
              <div className="ai-recommendations-header">
                <h2>AI Recommendation</h2>
              </div>
              <div className="ai-recommendations-list">
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
              {/* Show loading indicator below recommendations if more are expected */}
              {hasMoreLoading && (
                <div className="recommendations-loading" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                  <div className="loading-spinner"></div>
                  <p className="loading-text">
                    AI generating more suggestions<span className="loading-dots">...</span>
                  </p>
                  <p className="loading-subtext">
                    {totalExpected > 0 ? (
                      `Received ${currentCount} out of ${totalExpected} recommendations (${progressText})`
                    ) : (
                      'This may take a few moments. Please wait.'
                    )}
                  </p>
                </div>
              )}
            </section>
          );
        }

        // Show loading state (when no recommendations yet)
        if (shouldShowLoading) {
          const currentCount = recommendations.length;
          const totalExpected = failCount;
          const progressText = totalExpected > 0 
            ? `${currentCount}/${totalExpected}` 
            : '0/0';
          
          return (
            <section className="details-card">
              <div className="ai-recommendations-header">
                <h2>AI Recommendation</h2>
              </div>
              <div className="recommendations-loading">
                <div className="loading-spinner"></div>
                <p className="loading-text">
                  AI generating suggestions<span className="loading-dots">...</span>
                </p>
                <p className="loading-subtext">
                  {totalExpected > 0 ? (
                    currentCount === 0 
                      ? `Waiting for recommendations... (${progressText})`
                      : `Received ${currentCount} out of ${totalExpected} recommendations (${progressText})`
                  ) : (
                    'This may take a few moments. Please wait.'
                  )}
                </p>
              </div>
            </section>
          );
        }

        // Show "No recommendations needed" for perfect scores
        if (shouldShowNoRecommendations) {
          return (
            <section className="details-card">
              <div className="ai-recommendations-header">
                <h2>AI Recommendation</h2>
              </div>
              <div className="recommendations-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="success-icon">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p className="empty-text">Excellent! Your compliance score is 100%. No recommendations needed.</p>
              </div>
            </section>
          );
        }

        // Don't show anything if still processing
        return null;
      })()}

      {showModal && documentData && (
        <DisclosureDetailsModal documentData={documentData} onClose={() => setShowModal(false)} />
>>>>>>> dev
      )}
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
    case 'Cancelled':
=======
    case 'COMPLETED':
      return 'status-completed';
    case 'PROCESSING':
      return 'status-processing';
    case 'PENDING':
      return 'status-pending';
    case 'ERROR':
      return 'status-error';
    case 'CANCELLED':
>>>>>>> dev
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

<<<<<<< HEAD
const generateAIRecommendation = (ruleName) => {
  const recommendations = {
    'Announcement title matches filing': 'Ensure the announcement title exactly matches the filing document title. Review the submitted document and update the title to reflect the exact wording used in the official filing.',
    'Date of event is within acceptable range': 'Verify that the date of event falls within the regulatory reporting window. If the date is outside the acceptable range, provide justification or correct the date to match the actual event occurrence.',
    'All mandatory fields are present': 'Review the disclosure document and ensure all required fields as per the regulation are completed. Missing mandatory fields may result in non-compliance penalties.',
    'File format is PDF': 'Convert the document to PDF format before submission. PDF format ensures document integrity and compatibility with regulatory systems.',
    'Company name mentioned in document': 'Include the full legal company name as registered with the regulatory authority. Ensure the name appears consistently throughout the document.',
    'Disclosure made within 24 hours of event': 'Submit the disclosure within 24 hours of the event occurrence. Late submissions may require additional justification and could result in penalties.',
    'Relevant regulation cited correctly': 'Verify that the regulation numbers and clauses cited in the document are accurate and current. Cross-reference with the latest regulatory guidelines.',
    'Financial figures are consistent': 'Ensure all financial figures mentioned in the document are consistent across all sections. Verify calculations and cross-check with source documents.',
    'Signatories are authorized personnel': 'Confirm that the signatories listed in the document are authorized to sign on behalf of the company as per the company\'s authorization matrix.',
    'Document is free from typos': 'Perform a thorough review of the document for spelling and grammatical errors. Typos can affect the document\'s credibility and may need to be corrected through an amendment.',
  };

  return recommendations[ruleName] || 'Review the validation rule and ensure all requirements are met. Consult the regulatory guidelines for specific compliance requirements related to this rule.';
};

const getRuleIdLabel = (rule) => {
  if (!rule) return '';
  if (rule.ruleId) return rule.ruleId;
  const metadata = findRuleMetadata(rule.ruleId || rule.name || rule.check);
  return metadata?.id || '';
};

export default DisclosureDetailsPage;

=======
const getRuleStatusClass = (status) => {
  if (status === 'SUCCESS') return 'pass';
  if (status === 'FAIL') return 'fail';
  return '';
};

export default DisclosureDetailsPage;
>>>>>>> dev
