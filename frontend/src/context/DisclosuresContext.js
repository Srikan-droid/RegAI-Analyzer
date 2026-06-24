import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { initialDisclosures, REGULATION_OPTIONS } from '../data/disclosures';
import { generateRuleResults, normalizeRuleResults } from '../utils/ruleUtils';
import apiService from '../services/api';

const STORAGE_KEY = 'lodr_disclosures';
const LAST_UPLOAD_KEY = 'lodr_last_upload';

const DisclosuresContext = createContext();

const decorateEntry = (entry) => {
  if (entry.fileStatus === 'Completed' && entry.complianceScore != null) {
    const hasRules = Array.isArray(entry.ruleResults) && entry.ruleResults.length > 0;
    if (hasRules) {
      // Recalculate score based on existing rules to ensure consistency
      const passCount = entry.ruleResults.filter(r => r.status === 'Pass').length;
      const totalCount = entry.ruleResults.length;
      const recalculatedScore = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : entry.complianceScore;
      return {
        ...entry,
        complianceScore: recalculatedScore,
        complianceStatus: getComplianceStatus(recalculatedScore),
        ruleResults: normalizeRuleResults(entry.ruleResults),
      };
    } else {
      // Generate new rules and calculate score
      const { ruleResults, calculatedScore } = generateRuleResults();
      return {
        ...entry,
        complianceScore: calculatedScore,
        complianceStatus: getComplianceStatus(calculatedScore),
        ruleResults: normalizeRuleResults(ruleResults),
      };
    }
  }

  return {
    ...entry,
    ruleResults: normalizeRuleResults(entry.ruleResults || []),
  };
};

const loadInitialDisclosures = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored).map(decorateEntry);
    }
  } catch (error) {
    console.error('Failed to parse stored disclosures', error);
  }
  return initialDisclosures.map(decorateEntry);
};

const getRandomRegulations = () => {
  const count = Math.floor(Math.random() * 2) + 1; // 1 or 2 entries
  const shuffled = [...REGULATION_OPTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getComplianceStatus = (score) => {
  if (score >= 80) return 'Compliant';
  if (score >= 50) return 'Pending Review';
  return 'Non-Compliant';
};

export const DisclosuresProvider = ({ children }) => {
  const [disclosures, setDisclosures] = useState(loadInitialDisclosures);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalsRef = React.useRef(new Map()); // Track polling intervals for each document
  const pollingAttemptsRef = React.useRef(new Map()); // Track polling attempts for completed documents without scores
  const recommendationPollingRef = React.useRef(new Map()); // Track recommendation polling intervals
  const nonExistentDocumentsRef = React.useRef(new Set()); // Track documents that don't exist (404 errors) to prevent re-polling

  // Listen for logout/token removal to stop all polling
  useEffect(() => {
    const handleStorageChange = (e) => {
      // If access_token is removed (logout), stop all polling
      if (e.key === 'access_token' && !e.newValue) {
        //console.log('[DisclosuresContext] Token removed, stopping all polling');
        // Stop all processing polling
        pollingIntervalsRef.current.forEach((intervalId) => {
          clearInterval(intervalId);
        });
        pollingIntervalsRef.current.clear();
        // Stop all recommendation polling
        recommendationPollingRef.current.forEach((intervalId) => {
          clearInterval(intervalId);
        });
        recommendationPollingRef.current.clear();
      }
    };

    // Listen for storage changes (logout clears localStorage)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom logout event (for same-tab logout)
    const handleLogout = () => {
      //console.log('[DisclosuresContext] Logout detected, stopping all polling');
      pollingIntervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      pollingIntervalsRef.current.clear();
      recommendationPollingRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      recommendationPollingRef.current.clear();
    };
    
    window.addEventListener('userLogout', handleLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);

  // Load disclosures from backend on mount (only if authenticated)
  useEffect(() => {
    // Only load if user is authenticated
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      loadDisclosuresFromBackend();
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(disclosures));
    } catch (error) {
      console.error('Failed to persist disclosures', error);
    }
  }, [disclosures]);

  // Background polling for processing documents - continues even when user navigates away
  useEffect(() => {
    // Check if user is authenticated before starting polling
    const token = apiService.getToken();
    if (!token) {
      // No token, stop all polling
      pollingIntervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      pollingIntervalsRef.current.clear();
      return;
    }

    // Find all documents that are still processing OR completed but missing compliance score
    // Exclude documents that we know don't exist (404 errors)
    const processingDocs = disclosures.filter(
      doc => doc.documentId && (
        (doc.fileStatus === 'PROCESSING' || doc.fileStatus === 'Processing' || doc.fileStatus === 'PENDING') ||
        ((doc.fileStatus === 'COMPLETED' || doc.fileStatus === 'Completed') && (doc.complianceScore === null || doc.complianceScore === undefined))
      ) &&
      !nonExistentDocumentsRef.current.has(doc.documentId) // Don't poll for documents we know don't exist
    );

    // Start polling for each processing document that isn't already being polled
    processingDocs.forEach(doc => {
      if (pollingIntervalsRef.current.has(doc.documentId)) {
        return; // Already polling
      }

      //console.log(`[DisclosuresContext] Starting background polling for document ${doc.documentId} (status: ${doc.fileStatus}, hasScore: ${doc.complianceScore !== null && doc.complianceScore !== undefined})`);
      
      const intervalId = setInterval(async () => {
        // Check authentication before each poll
        const currentToken = apiService.getToken();
        if (!currentToken) {
          //console.log(`[DisclosuresContext] No token found, stopping polling for document ${doc.documentId}`);
          if (pollingIntervalsRef.current.has(doc.documentId)) {
            clearInterval(pollingIntervalsRef.current.get(doc.documentId));
            pollingIntervalsRef.current.delete(doc.documentId);
          }
          return;
        }

        try {
          const statusResponse = await apiService.getProcessingStatus(doc.documentId);
          const status = statusResponse.status || statusResponse.validation_status;
          
          // Check if processing is complete
          if (status === 'COMPLETED' || status === 'completed') {
            // First, fetch document details to check if compliance score exists
            try {
              const docDetails = await apiService.getDocumentDetails(doc.documentId);
              
              // Check if we got a compliance score
              const hasComplianceScore = docDetails.compliance_score !== null && docDetails.compliance_score !== undefined;
              
              //console.log(`[DisclosuresContext] Document ${doc.documentId} completed. Compliance score: ${docDetails.compliance_score}, Has score: ${hasComplianceScore}`);
              
              // If no compliance score, try to fetch result from external API
              // This triggers the backend to fetch from external API and save the compliance score
              if (!hasComplianceScore) {
                // Track attempts to prevent infinite polling
                const currentAttempts = pollingAttemptsRef.current.get(doc.documentId) || 0;
                const maxAttempts = 10; // Stop after 10 attempts (100 seconds)
                
                if (currentAttempts >= maxAttempts) {
                  console.warn(`[DisclosuresContext] Stopped polling for document ${doc.documentId} after ${maxAttempts} attempts without compliance score`);
                  if (pollingIntervalsRef.current.has(doc.documentId)) {
                    clearInterval(pollingIntervalsRef.current.get(doc.documentId));
                    pollingIntervalsRef.current.delete(doc.documentId);
                    pollingAttemptsRef.current.delete(doc.documentId);
                  }
                  return;
                }
                
                // Increment attempt counter
                pollingAttemptsRef.current.set(doc.documentId, currentAttempts + 1);
                
                //console.log(`[DisclosuresContext] No compliance score found (attempt ${currentAttempts + 1}/${maxAttempts}), fetching result from external API for document ${doc.documentId}...`);
                try {
                  const resultResponse = await apiService.getProcessingResult(doc.documentId);
                  const resultData = resultResponse.data || {};
                  
                  // Extract compliance score from result data
                  let complianceScore = null;
                  if (resultData && typeof resultData === 'object' && 'score' in resultData) {
                    const scoreValue = resultData.score;
                    if (scoreValue != null && !isNaN(scoreValue)) {
                      complianceScore = parseFloat(scoreValue);
                    }
                  }
                  
                  // Fetch document details again to get the updated compliance score
                  const updatedDocDetails = await apiService.getDocumentDetails(doc.documentId);
                  const updatedComplianceScore = updatedDocDetails.compliance_score;
                  
                  //console.log(`[DisclosuresContext] After fetching result, compliance score: ${updatedComplianceScore}`);
                  
                  // Update disclosure with new status, score, and result data
                  setDisclosures(prev => {
                    return prev.map(d => {
                      if (d.documentId === doc.documentId || d.id === doc.documentId) {
                        return {
                          ...d,
                          fileStatus: 'COMPLETED',
                          complianceScore: updatedComplianceScore !== null && updatedComplianceScore !== undefined 
                            ? updatedComplianceScore 
                            : d.complianceScore,
                          resultData: resultData || updatedDocDetails.result_data || d.resultData,
                        };
                      }
                      return d;
                    });
                  });
                  
                  // Stop polling if we now have a compliance score
                  if (updatedComplianceScore !== null && updatedComplianceScore !== undefined) {
                    if (pollingIntervalsRef.current.has(doc.documentId)) {
                      clearInterval(pollingIntervalsRef.current.get(doc.documentId));
                      pollingIntervalsRef.current.delete(doc.documentId);
                      pollingAttemptsRef.current.delete(doc.documentId);
                      //console.log(`[DisclosuresContext] Stopped polling for completed document ${doc.documentId} (compliance score: ${updatedComplianceScore})`);
                    }
                  } else {
                    //console.log(`[DisclosuresContext] Document ${doc.documentId} still has no compliance score after fetching result, continuing to poll...`);
                  }
                } catch (resultError) {
                  console.error(`[DisclosuresContext] Failed to fetch result for document ${doc.documentId}:`, resultError);
                  // Continue with normal flow even if result fetch fails
                }
              } else {
                // Reset attempt counter if we have a score
                pollingAttemptsRef.current.delete(doc.documentId);
                // Compliance score already exists, just update the disclosure
                setDisclosures(prev => {
                  return prev.map(d => {
                    if (d.documentId === doc.documentId || d.id === doc.documentId) {
                      return {
                        ...d,
                        fileStatus: 'COMPLETED',
                        complianceScore: docDetails.compliance_score,
                        resultData: docDetails.result_data || d.resultData,
                      };
                    }
                    return d;
                  });
                });
                
                // Stop polling for this document - we have everything we need
                if (pollingIntervalsRef.current.has(doc.documentId)) {
                  clearInterval(pollingIntervalsRef.current.get(doc.documentId));
                  pollingIntervalsRef.current.delete(doc.documentId);
                  pollingAttemptsRef.current.delete(doc.documentId);
                  //console.log(`[DisclosuresContext] Stopped polling for completed document ${doc.documentId} (compliance score: ${docDetails.compliance_score})`);
                }
              }
            } catch (error) {
              console.error(`[DisclosuresContext] Failed to fetch details for document ${doc.documentId}:`, error);
              // If unauthorized or document not found (404), stop polling
              const errorMessage = error.message?.toLowerCase() || '';
              const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('document not found');
              if (error.message === 'Unauthorized' || isNotFound) {
                //console.log(`[DisclosuresContext] Stopping polling for document ${doc.documentId} due to error:`, error.message);
                if (pollingIntervalsRef.current.has(doc.documentId)) {
                  clearInterval(pollingIntervalsRef.current.get(doc.documentId));
                  pollingIntervalsRef.current.delete(doc.documentId);
                  pollingAttemptsRef.current.delete(doc.documentId);
                }
                // Mark document as non-existent to prevent re-starting polling
                if (isNotFound) {
                  nonExistentDocumentsRef.current.add(doc.documentId);
                }
              }
              // For other errors, continue polling (might be temporary)
            }
          } else if (status === 'PROCESSING' || status === 'processing') {
            // Still processing, update status (but don't trigger re-render if status is same)
            setDisclosures(prev => {
              return prev.map(d => {
                if ((d.documentId === doc.documentId || d.id === doc.documentId) && d.fileStatus !== 'PROCESSING') {
                  return {
                    ...d,
                    fileStatus: 'PROCESSING',
                  };
                }
                return d;
              });
            });
          }
        } catch (error) {
          console.error(`[DisclosuresContext] Error polling document ${doc.documentId}:`, error);
          // On 401 Unauthorized or 404 Not Found error, stop polling for this document
          const errorMessage = error.message?.toLowerCase() || '';
          const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('document not found');
          if (error.message === 'Unauthorized' || isNotFound) {
            //console.log(`[DisclosuresContext] Stopping polling for document ${doc.documentId} due to error:`, error.message);
            if (pollingIntervalsRef.current.has(doc.documentId)) {
              clearInterval(pollingIntervalsRef.current.get(doc.documentId));
              pollingIntervalsRef.current.delete(doc.documentId);
              pollingAttemptsRef.current.delete(doc.documentId);
            }
            // Mark document as non-existent to prevent re-starting polling
            if (isNotFound) {
              nonExistentDocumentsRef.current.add(doc.documentId);
            }
          } else {
            // For other errors, continue polling (might be temporary network issue)
            //console.log(`[DisclosuresContext] Error polling document ${doc.documentId}, will retry on next interval`);
          }
        }
      }, 10000); // Poll every 10 seconds

      pollingIntervalsRef.current.set(doc.documentId, intervalId);
    });

    // Cleanup: stop polling for documents that are no longer processing AND have compliance score
    const currentProcessingIds = new Set(processingDocs.map(d => d.documentId));
    pollingIntervalsRef.current.forEach((intervalId, docId) => {
      if (!currentProcessingIds.has(docId)) {
        // Check if document now has compliance score
        const doc = disclosures.find(d => (d.documentId === docId || d.id === docId));
        if (doc && (doc.fileStatus === 'COMPLETED' || doc.fileStatus === 'Completed') && 
            (doc.complianceScore !== null && doc.complianceScore !== undefined)) {
          // Document is completed and has score, stop polling
          clearInterval(intervalId);
          pollingIntervalsRef.current.delete(docId);
          pollingAttemptsRef.current.delete(docId);
          //console.log(`[DisclosuresContext] Stopped polling for document ${docId} (completed with compliance score)`);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      // Don't clear all intervals here - only clear on unmount
      // The intervals will be cleaned up individually when documents complete
    };
  }, [disclosures]);

  // Background polling for recommendations - continues even when user navigates away
  useEffect(() => {
    // Check if user is authenticated before starting polling
    const token = apiService.getToken();
    if (!token) {
      // No token, stop all recommendation polling
      recommendationPollingRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      recommendationPollingRef.current.clear();
      return;
    }

    // Find all completed documents that might need recommendations
    // We need to check documents that are COMPLETED, have compliance_score < 100, and might have recommendations
    // Exclude documents that we know don't exist (404 errors)
    const documentsNeedingRecommendations = disclosures.filter(
      doc => doc.documentId && 
             (doc.fileStatus === 'COMPLETED' || doc.fileStatus === 'Completed') &&
             doc.complianceScore !== null && 
             doc.complianceScore < 100 &&
             !nonExistentDocumentsRef.current.has(doc.documentId) // Don't poll for documents we know don't exist
    );

    // Start polling for recommendations for each document that needs them
    documentsNeedingRecommendations.forEach(doc => {
      // Check if we're already polling recommendations for this document
      if (recommendationPollingRef.current.has(doc.documentId)) {
        return; // Already polling
      }

      //console.log(`[DisclosuresContext] Starting background recommendation polling for document ${doc.documentId}`);
      
      const intervalId = setInterval(async () => {
        // Check authentication before each poll
        const currentToken = apiService.getToken();
        if (!currentToken) {
          //console.log(`[DisclosuresContext] No token found, stopping recommendation polling for document ${doc.documentId}`);
          if (recommendationPollingRef.current.has(doc.documentId)) {
            clearInterval(recommendationPollingRef.current.get(doc.documentId));
            recommendationPollingRef.current.delete(doc.documentId);
          }
          return;
        }

        try {
          // Check current recommendation status
          const docDetails = await apiService.getDocumentDetails(doc.documentId);
          
          // If we successfully got document details, remove from non-existent list (in case it was added before)
          nonExistentDocumentsRef.current.delete(doc.documentId);
          
          const currentRecommendations = docDetails.recommendation || [];
          const failCount = docDetails.rules_summary?.fail_count || 0;
          const complianceScore = docDetails.compliance_score;
          
          // Stop polling if:
          // 1. All recommendations received (count >= fail_count and fail_count > 0)
          // 2. fail_count is 0 (no failed rules = no recommendations expected)
          // 3. Score >= 100% (perfect score, no recommendations)
          const shouldStopPolling = 
            (failCount > 0 && currentRecommendations.length >= failCount) ||
            failCount === 0 ||
            (complianceScore !== null && complianceScore >= 100);
          
          if (shouldStopPolling) {
            // console.log(`[DisclosuresContext] Stopping recommendation polling for document ${doc.documentId}. Reason:`, {
            //   recommendations: `${currentRecommendations.length}/${failCount}`,
            //   fail_count: failCount,
            //   score: complianceScore
            // });
            if (recommendationPollingRef.current.has(doc.documentId)) {
              clearInterval(recommendationPollingRef.current.get(doc.documentId));
              recommendationPollingRef.current.delete(doc.documentId);
            }
            
            // Update disclosure with latest recommendations
            setDisclosures(prev => {
              return prev.map(d => {
                if (d.documentId === doc.documentId || d.id === doc.documentId) {
                  return {
                    ...d,
                    resultData: docDetails.result_data || d.resultData,
                  };
                }
                return d;
              });
            });
            return;
          }

          // Try to refresh recommendations
          try {
            const refreshResponse = await apiService.refreshRecommendations(doc.documentId);
            
            // Check if API explicitly says no recommendations expected
            if (refreshResponse.message && refreshResponse.message.includes('No recommendations expected')) {
              //console.log(`[DisclosuresContext] API indicates no recommendations expected for document ${doc.documentId}, stopping polling`);
              if (recommendationPollingRef.current.has(doc.documentId)) {
                clearInterval(recommendationPollingRef.current.get(doc.documentId));
                recommendationPollingRef.current.delete(doc.documentId);
              }
              return;
            }
            
            if (refreshResponse.has_recommendations || refreshResponse.all_recommendations_received) {
              // Fetch updated document details
              const updatedDetails = await apiService.getDocumentDetails(doc.documentId);
              const updatedRecommendations = updatedDetails.recommendation || [];
              const updatedFailCount = updatedDetails.rules_summary?.fail_count || 0;
              const updatedScore = updatedDetails.compliance_score;
              
              //console.log(`[DisclosuresContext] Updated recommendations for document ${doc.documentId}: ${updatedRecommendations.length}/${updatedFailCount}`);
              
              // Update disclosure with latest recommendations
              setDisclosures(prev => {
                return prev.map(d => {
                  if (d.documentId === doc.documentId || d.id === doc.documentId) {
                    return {
                      ...d,
                      resultData: updatedDetails.result_data || d.resultData,
                    };
                  }
                  return d;
                });
              });

              // Stop polling if we have all recommendations or none are expected
              const shouldStop = 
                refreshResponse.all_recommendations_received === true ||
                (updatedFailCount > 0 && updatedRecommendations.length >= updatedFailCount) ||
                updatedFailCount === 0 ||
                (updatedScore !== null && updatedScore >= 100);
              
              if (shouldStop) {
                if (recommendationPollingRef.current.has(doc.documentId)) {
                  clearInterval(recommendationPollingRef.current.get(doc.documentId));
                  recommendationPollingRef.current.delete(doc.documentId);
                  //console.log(`[DisclosuresContext] Stopped recommendation polling for document ${doc.documentId}`);
                }
              }
            }
          } catch (refreshError) {
            console.error(`[DisclosuresContext] Error refreshing recommendations for document ${doc.documentId}:`, refreshError);
            // If unauthorized or document not found (404), stop polling
            const errorMessage = refreshError.message?.toLowerCase() || '';
            const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('document not found');
            if (refreshError.message === 'Unauthorized' || isNotFound) {
              //console.log(`[DisclosuresContext] Stopping recommendation polling for document ${doc.documentId} due to error:`, refreshError.message);
              if (recommendationPollingRef.current.has(doc.documentId)) {
                clearInterval(recommendationPollingRef.current.get(doc.documentId));
                recommendationPollingRef.current.delete(doc.documentId);
              }
              // Mark document as non-existent to prevent re-starting polling
              if (isNotFound) {
                nonExistentDocumentsRef.current.add(doc.documentId);
              }
            }
          }
        } catch (error) {
          console.error(`[DisclosuresContext] Error polling recommendations for document ${doc.documentId}:`, error);
          // If unauthorized or document not found (404), stop polling
          const errorMessage = error.message?.toLowerCase() || '';
          const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('document not found');
          if (error.message === 'Unauthorized' || isNotFound) {
            //console.log(`[DisclosuresContext] Stopping recommendation polling for document ${doc.documentId} due to error:`, error.message);
            if (recommendationPollingRef.current.has(doc.documentId)) {
              clearInterval(recommendationPollingRef.current.get(doc.documentId));
              recommendationPollingRef.current.delete(doc.documentId);
            }
            // Mark document as non-existent to prevent re-starting polling
            if (isNotFound) {
              nonExistentDocumentsRef.current.add(doc.documentId);
            }
          }
        }
      }, 15000); // Poll every 15 seconds for recommendations (less frequent than processing status)

      recommendationPollingRef.current.set(doc.documentId, intervalId);
    });

    // Cleanup: stop polling for documents that no longer need recommendations
    const currentNeedingRecommendationsIds = new Set(documentsNeedingRecommendations.map(d => d.documentId));
    recommendationPollingRef.current.forEach((intervalId, docId) => {
      if (!currentNeedingRecommendationsIds.has(docId)) {
        clearInterval(intervalId);
        recommendationPollingRef.current.delete(docId);
        //console.log(`[DisclosuresContext] Stopped recommendation polling for document ${docId} (no longer needed)`);
      }
    });

    // Cleanup on unmount
    return () => {
      // Intervals will be cleaned up individually when recommendations are complete
    };
  }, [disclosures]);

  const addDisclosure = ({ announcementTitle, dateOfEvent, fileName, documentId, requestId, status, complianceScore, resultData }) => {
    // Save last upload data for quick upload pre-filling
    try {
      localStorage.setItem(LAST_UPLOAD_KEY, JSON.stringify({ announcementTitle, dateOfEvent }));
    } catch (error) {
      console.error('Failed to save last upload data', error);
    }

    // Map backend status to frontend status
    const mapStatus = (backendStatus) => {
      switch (backendStatus) {
        case 'completed':
          return 'Completed';
        case 'processing':
          return 'Processing';
        case 'pending':
          return 'Pending';
        case 'error':
          return 'Error';
        case 'cancelled':
          return 'Cancelled';
        default:
          return 'Processing';
      }
    };

    // Convert result data to rule results format
    const convertResultDataToRules = (data) => {
      if (!data || typeof data !== 'object') return [];
      
      return Object.entries(data).map(([ruleId, ruleData]) => {
        const validationStatus = ruleData.validation_status || 'FAIL';
        return {
          ruleId,
          ruleName: ruleData.reg_title || ruleData.message || ruleId,
          status: validationStatus === 'SUCCESS' ? 'Pass' : 'Fail',
          message: ruleData.message || '',
          details: ruleData,
        };
      });
    };

    const newEntry = {
      id: documentId || Date.now(),
      announcementTitle,
      dateOfEvent,
      uploadedDate: new Date().toISOString().split('T')[0],
      regulations: getRandomRegulations(),
      complianceScore: complianceScore || null,
      complianceStatus: complianceScore != null ? getComplianceStatus(complianceScore) : 'Pending Review',
      fileStatus: status ? mapStatus(status) : 'Processing',
      fileName,
      requestId: requestId || null,
      documentId: documentId || null,
      ruleResults: resultData ? convertResultDataToRules(resultData) : [],
    };

    setDisclosures((prev) => {
      // Check if entry already exists (update) or add new
      const existingIndex = prev.findIndex(d => d.documentId === documentId || d.id === documentId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newEntry };
        return updated;
      }
      return [newEntry, ...prev];
    });

    return { id: newEntry.id, complianceScore: newEntry.complianceScore };
  };

  const loadDisclosuresFromBackend = async () => {
    // Check if user is authenticated before making API call
    const token = localStorage.getItem('access_token');
    if (!token) {
      // User not authenticated, skip backend load
      return;
    }

    try {
      const response = await apiService.listPDFDocuments(1, 100); // Load first 100 for context
      const documents = response.results || [];
      
      documents.forEach((doc) => {
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
        
        addDisclosure({
          announcementTitle: regTitle || doc.file_name.replace('.pdf', ''),
          dateOfEvent: doc.date_of_event || '',
          fileName: doc.file_name || '',
          documentId: doc.id,
          requestId: doc.request_id,
          status: doc.validation_status, // Already mapped by backend
          complianceScore: doc.compliance_score,
          resultData: doc.result_data || null,
        });
      });
    } catch (error) {
      // Silently fail if unauthorized (user not logged in)
      if (error.message === 'Unauthorized') {
        //console.log('User not authenticated, skipping backend load');
        return;
      }
      console.error('Failed to load disclosures from backend:', error);
    }
  };

  const sortedDisclosures = useMemo(
    () => [...disclosures].sort((a, b) => new Date(b.uploadedDate) - new Date(a.uploadedDate)),
    [disclosures]
  );

  const getLastUploadData = () => {
    try {
      const stored = localStorage.getItem(LAST_UPLOAD_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load last upload data', error);
    }
    return { announcementTitle: '', dateOfEvent: '' };
  };

  return (
    <DisclosuresContext.Provider
      value={{
        disclosures: sortedDisclosures,
        addDisclosure,
        getLastUploadData,
        loadDisclosuresFromBackend,
        isLoading,
      }}
    >
      {children}
    </DisclosuresContext.Provider>
  );
};

export const useDisclosures = () => {
  const context = useContext(DisclosuresContext);
  if (!context) {
    throw new Error('useDisclosures must be used within a DisclosuresProvider');
  }
  return context;
};

