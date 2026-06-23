<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadDisclosure.css';
import { useDisclosures } from './context/DisclosuresContext';

const CHAT_HISTORY_KEY = 'ai_agent_chat_history';

function UploadDisclosure() {
  const navigate = useNavigate();
  const { addDisclosure, disclosures } = useDisclosures();
=======
import React, { useState, useRef, useEffect, useCallback, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadDisclosure.css';
import { useDisclosures } from './context/DisclosuresContext';
import apiService from './services/api';
import pollingService from './services/pollingService';
import ChatHistorySidebar from './components/ChatHistorySidebar';

const CHAT_HISTORY_KEY = 'ai_agent_chat_history';
const CURRENT_SESSION_KEY = 'ai_agent_current_session';
const CURRENT_DOCUMENT_KEY = 'ai_agent_current_document';

function UploadDisclosure() {
  const navigate = useNavigate();
  const { addDisclosure, disclosures, startPollingForDocument } = useDisclosures();
>>>>>>> dev
  const [selectedFile, setSelectedFile] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [dateOfEvent, setDateOfEvent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showFormFields, setShowFormFields] = useState(false);
  const [isInteractMode, setIsInteractMode] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
<<<<<<< HEAD
  // Initialize chatMessages from localStorage using lazy initialization
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const storedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          return parsedHistory;
        }
      }
    } catch (error) {
      console.error('Failed to load chat history on init', error);
    }
    return [];
  });
  const [disclosureId, setDisclosureId] = useState(null);
  const [validationComplete, setValidationComplete] = useState(false);
  const [progressMessageId, setProgressMessageId] = useState(null);
  const scoreSetRef = useRef(false);
=======
  const [chatMessages, setChatMessages] = useState([]);
  const [disclosureId, setDisclosureId] = useState(null);
  const [validationComplete, setValidationComplete] = useState(false);
  const [selectedMandate, setSelectedMandate] = useState(null); // Will store mandate ID
  const [selectedSubmissionType, setSelectedSubmissionType] = useState(null); // Will store submission type ID
  const [mandates, setMandates] = useState([]); // List of available mandates
  const [submissionTypes, setSubmissionTypes] = useState([]); // List of available submission types
  const [progressMessageId, setProgressMessageId] = useState(null);
  const [documentId, setDocumentId] = useState(() => {
    // Restore documentId from localStorage
    try {
      const stored = localStorage.getItem(CURRENT_DOCUMENT_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });
  const [requestId, setRequestId] = useState(null);
  const [currentChatSessionId, setCurrentChatSessionId] = useState(() => {
    // Restore session ID from localStorage
    try {
      return localStorage.getItem(CURRENT_SESSION_KEY) || null;
    } catch {
      return null;
    }
  });
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const scoreSetRef = useRef(false);
  const firstPdfNameRef = useRef(null); // Track the first PDF name for chat title
>>>>>>> dev
  const hasLoadedHistoryRef = useRef(true); // Set to true since we load via lazy init
  const isInitialMountRef = useRef(true);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const questionInputRef = useRef(null);
<<<<<<< HEAD

  // Restore state from chat history on mount
  useEffect(() => {
    if (chatMessages.length === 0) return;
    
    // Check if validation is complete
    const hasValidationComplete = chatMessages.some(msg => 
      msg.isProgress && 
      msg.content && 
      msg.content.includes('Validation completed successfully')
    );
    
    if (hasValidationComplete) {
      setValidationComplete(true);
      // Try to extract disclosureId from messages
      const progressMsg = chatMessages.find(msg => msg.isProgress && msg.viewReportPath);
      if (progressMsg && progressMsg.viewReportPath) {
        const match = progressMsg.viewReportPath.match(/\/validation\/(.+)/);
        if (match) {
          setDisclosureId(match[1]);
=======
  const pollingIntervalRef = useRef(null);
  const chatHistorySidebarRef = useRef(null);
  const savedMessageIdsRef = useRef(new Set()); // Track which messages have been saved to backend
  const recentUploadsRef = useRef(new Map()); // Track recent uploads: fileName -> { documentId, timestamp }
  const restoreStateCalledRef = useRef(false); // Prevent duplicate restoreStateFromMessages calls

  // Load chat session from backend on mount
  useEffect(() => {
    const loadSessionOnMount = async () => {
      // If we have a session ID, try to load it from backend
      if (currentChatSessionId) {
        try {
          setIsLoadingSession(true);
          
          // Reset state before loading
          firstPdfNameRef.current = null;
          
          const session = await apiService.getChatSession(currentChatSessionId);
          
          // Set first PDF name from session title (source of truth)
          if (session.title && session.title !== 'New Chat') {
            firstPdfNameRef.current = session.title;
          }
          
          // Convert backend messages to frontend format
          const rawMessages = session.messages.map(msg => {
            const metadata = msg.metadata || {};
            const progressSteps = metadata.progressSteps || [];
            
            // If this is a progress message with completed validation, ensure all steps are revealed
            let lastRevealedStepIndex = metadata.lastRevealedStepIndex;
            if (metadata.isProgress && progressSteps.length > 0) {
              // Check if validation is complete by looking at content or progress percentage
              const isComplete = metadata.progressPercentage === 100 || 
                                (msg.content && msg.content.includes('Validation completed successfully'));
              
              if (isComplete && (lastRevealedStepIndex === undefined || lastRevealedStepIndex < progressSteps.length - 1)) {
                // All steps should be visible for completed validations
                lastRevealedStepIndex = progressSteps.length - 1;
              } else if (lastRevealedStepIndex === undefined || lastRevealedStepIndex === -1) {
                // If not set, show all steps that are done
                const doneStepsCount = progressSteps.filter(s => s.status === 'done').length;
                lastRevealedStepIndex = doneStepsCount > 0 ? doneStepsCount - 1 : 0;
              }
            }
            
            return {
              id: msg.id,
              type: msg.role === 'user' ? 'user' : 'system',
              role: msg.role,
              content: msg.content,
              timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
              isProgress: metadata.isProgress || false,
              progressSteps: progressSteps,
              lastRevealedStepIndex: lastRevealedStepIndex,
              fileInfo: metadata.fileInfo,
              progressPercentage: metadata.progressPercentage || 0,
              complianceScore: metadata.complianceScore,
              viewReportPath: metadata.viewReportPath,
              metadata: metadata,
            };
          });
          
          // CRITICAL FIX: Deduplicate messages from backend
          // Keep only the first occurrence of each unique message (by type + content)
          // This prevents duplicate messages that may have been stored due to bugs
          const seenMessages = new Set();
          const messages = rawMessages.filter(msg => {
            // For progress messages, use fileInfo.fileName as unique key
            let uniqueKey;
            if (msg.isProgress && msg.fileInfo?.fileName) {
              uniqueKey = `progress:${msg.fileInfo.fileName}`;
            } else {
              uniqueKey = `${msg.type}:${msg.content}`;
            }
            
            if (seenMessages.has(uniqueKey)) {
              console.log('[loadSessionOnMount] Filtering duplicate message:', msg.content?.substring(0, 50));
              return false;
            }
            seenMessages.add(uniqueKey);
            return true;
          });
          
          setChatMessages(messages);
          
          // Restore state from messages (async - don't await, let it run in background)
          // Note: restoreStateFromMessages will be called again when mandates are loaded
          restoreStateFromMessages(messages).catch(err => {
            console.error('[loadSessionOnMount] Error restoring state:', err);
          });
          
          // Update documentId if available
          if (session.pdf_document_id) {
            setDocumentId(session.pdf_document_id);
            localStorage.setItem(CURRENT_DOCUMENT_KEY, session.pdf_document_id.toString());
          }
        } catch (error) {
          // Session doesn't exist in database - this is normal if it was never created or was deleted
          // Silently clear the invalid session ID from localStorage
          const isNotFoundError = error.message && (
            error.message.includes('Chat session not found') || 
            error.message.includes('404') ||
            error.message.includes('Not Found')
          );
          
          if (isNotFoundError) {
            // This is expected - session doesn't exist, just clear it silently
            // Don't log as error since this is normal behavior
            setCurrentChatSessionId(null);
            localStorage.removeItem(CURRENT_SESSION_KEY);
          } else {
            // Unexpected error - log it
            console.error('Failed to load session on mount:', error);
          }
          
          // Try to load most recent session (all sessions, not just for this document)
          await loadMostRecentSession();
        } finally {
          setIsLoadingSession(false);
        }
      } else {
        // No session ID in localStorage - load the most recent session
        await loadMostRecentSession();
      }
    };

    loadSessionOnMount();
  }, []); // Run only once on mount

  // Load mandates and submission types on mount
  useEffect(() => {
    const loadMandatesAndTypes = async () => {
      try {
        const mandatesData = await apiService.getMandates();
        setMandates(mandatesData || []);
        
        // After mandates are loaded, try to restore state from messages
        if (chatMessages.length > 0) {
          restoreStateFromMessages(chatMessages).catch(err => {
            console.error('[loadMandates] Error restoring state:', err);
          });
        }
      } catch (error) {
        console.error('[UploadDisclosure] Failed to load mandates:', error);
        setMandates([]);
      }
    };
    loadMandatesAndTypes();
  }, []); // Only run once on mount

  // Load submission types when mandate is selected
  useEffect(() => {
    const loadSubmissionTypes = async () => {
      if (selectedMandate) {
        try {
          const typesData = await apiService.getSubmissionTypes(selectedMandate);
          setSubmissionTypes(typesData || []);
        } catch (error) {
          console.error('[UploadDisclosure] Failed to load submission types:', error);
          setSubmissionTypes([]);
        }
      } else {
        setSubmissionTypes([]);
      }
    };
    loadSubmissionTypes();
  }, [selectedMandate]);

  // CRITICAL: Save restored submission type to database when documentId becomes available
  // This handles cases where submission type was restored from chat history but documentId wasn't available yet
  useEffect(() => {
    if (documentId && window.__restoredSubmissionType && selectedSubmissionType) {
      const { mandateId, submissionTypeId } = window.__restoredSubmissionType;
      // Only save if the submission type matches what we restored
      if (submissionTypeId === selectedSubmissionType) {
        apiService.saveDocumentSelection(documentId, mandateId, submissionTypeId)
          .then(() => {
            delete window.__restoredSubmissionType; // Clean up
          })
          .catch(err => {
            console.error(`[UploadDisclosure] Failed to save restored submission type to database:`, err);
          });
      }
    }
  }, [documentId, selectedSubmissionType]);

  // Helper function to add message without duplicates
  const addMessageWithoutDuplicate = useCallback((newMessage, messages) => {
    // Check if message already exists (same type, content, and within 2 seconds)
    const isDuplicate = messages.some(msg => {
      if (msg.type !== newMessage.type || msg.content !== newMessage.content) {
        return false;
      }
      // Check if timestamps are very close (within 2 seconds) - likely duplicate
      const timeDiff = Math.abs(
        (msg.timestamp ? new Date(msg.timestamp).getTime() : 0) - 
        (newMessage.timestamp ? new Date(newMessage.timestamp).getTime() : 0)
      );
      return timeDiff < 2000; // 2 seconds
    });
    
    if (isDuplicate) {
      console.log('[UploadDisclosure.addMessageWithoutDuplicate] Skipping duplicate message:', newMessage.content);
      return messages;
    }
    
    return [...messages, newMessage];
  }, []);

  // Helper function to get the correct documentId for the current file
  // CRITICAL FIX: This prevents using the wrong documentId when multiple files are uploaded in the same chat session
  // When multiple files are uploaded, the global documentId state points to the latest file
  // But when user selects mandate/submission type in dropdown, we need the documentId for the CURRENT file being processed
  const getDocumentIdForCurrentFile = useCallback(() => {
    console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== FINDING DOCUMENT ID =====');
    console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Input state:', {
      hasSelectedFile: !!selectedFile,
      selectedFileName: selectedFile?.name,
      chatMessagesCount: chatMessages.length,
      globalDocumentId: documentId,
      mappingSize: window.fileNameToDocumentIdMap?.size || 0
    });
    
    // Strategy 0: If selectedFile is available, use fileName mapping (most reliable)
    if (selectedFile?.name) {
      const currentFileName = selectedFile.name;
      console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Strategy 0: Using selectedFile mapping');
      console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Current file name:', currentFileName);
      
      // Check fileName -> documentId mapping first (fastest, most reliable)
      if (window.fileNameToDocumentIdMap && window.fileNameToDocumentIdMap.has(currentFileName)) {
        const mappedDocId = window.fileNameToDocumentIdMap.get(currentFileName);
        console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ✓ Found in fileName mapping:', mappedDocId);
        console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 0 - Mapping) =====');
        return mappedDocId;
      }
      
      // Also try with normalized file name (case-insensitive, trimmed)
      const normalizedFileName = currentFileName.toLowerCase().trim();
      if (window.fileNameToDocumentIdMap) {
        for (const [fileName, docId] of window.fileNameToDocumentIdMap.entries()) {
          if (fileName.toLowerCase().trim() === normalizedFileName) {
            console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ✓ Found in fileName mapping (normalized match):', docId);
            // Update mapping with exact file name for future lookups
            window.fileNameToDocumentIdMap.set(currentFileName, docId);
            console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 0 - Mapping Normalized) =====');
            return docId;
          }
        }
      }
      
      console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Not found in fileName mapping, checking recentUploadsRef...');
      
      // ENHANCED: Check recentUploadsRef for immediate access to recent uploads
      if (recentUploadsRef.current.has(currentFileName)) {
        const recentUpload = recentUploadsRef.current.get(currentFileName);
        const docId = recentUpload.documentId;
        console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ✓ Found in recentUploadsRef:', docId);
        // Also update the mapping for future use
        if (!window.fileNameToDocumentIdMap) {
          window.fileNameToDocumentIdMap = new Map();
        }
        window.fileNameToDocumentIdMap.set(currentFileName, docId);
        console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 0 - Recent Uploads Ref) =====');
        return docId;
      }
      
      // Also try normalized file name in recentUploadsRef
      // Note: normalizedFileName was already declared above
      for (const [fileName, uploadData] of recentUploadsRef.current.entries()) {
        if (fileName.toLowerCase().trim() === normalizedFileName) {
          const docId = uploadData.documentId;
          console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ✓ Found in recentUploadsRef (normalized match):', docId);
          // Update mapping with exact file name
          if (!window.fileNameToDocumentIdMap) {
            window.fileNameToDocumentIdMap = new Map();
          }
          window.fileNameToDocumentIdMap.set(currentFileName, docId);
          recentUploadsRef.current.set(currentFileName, uploadData); // Update ref with exact name
          console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 0 - Recent Uploads Ref Normalized) =====');
          return docId;
        }
      }
      
      console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Not found in recentUploadsRef, checking progress messages...');
      
      // If mapping not found, try to find it in progress messages
      if (chatMessages.length > 0) {
        // Find progress messages that match the selectedFile name
        const matchingProgressMessages = chatMessages
          .filter(msg => {
            const isProgressMsg = msg.isProgress || msg.metadata?.isProgress;
            if (!isProgressMsg) return false;
            
            const msgFileName = msg.fileInfo?.fileName || msg.metadata?.fileInfo?.fileName;
            if (!msgFileName) return false;
            
            // Normalize file names for comparison
            return msgFileName.toLowerCase().trim() === normalizedFileName;
          })
          .sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA; // Latest first
          });

        console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Found', matchingProgressMessages.length, 'matching progress messages');

        if (matchingProgressMessages.length > 0) {
          const latestMsg = matchingProgressMessages[0];
          const msgDocId = latestMsg.metadata?.documentId || latestMsg.documentId || latestMsg._uploadingFile?.documentId;
          console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Latest message document ID:', msgDocId);
          if (msgDocId) {
            const docId = parseInt(msgDocId, 10);
            if (!isNaN(docId) && docId > 0) {
              // Also update the mapping for future use
              if (!window.fileNameToDocumentIdMap) {
                window.fileNameToDocumentIdMap = new Map();
              }
              window.fileNameToDocumentIdMap.set(currentFileName, docId);
              console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ✓ Found in progress messages, updating mapping:', docId);
              console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 0 - Progress Messages) =====');
              return docId;
            }
          }
        }
      }
      
      // ENHANCED FALLBACK: If we have a global documentId, verify it belongs to this file
      if (documentId) {
        console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Checking if global documentId belongs to this file...');
        // Check if any progress message with this documentId matches the current file
        const docIdMatches = chatMessages
          .filter(msg => {
            const isProgressMsg = msg.isProgress || msg.metadata?.isProgress;
            if (!isProgressMsg) return false;
            
            const msgDocId = msg.metadata?.documentId || msg.documentId || msg._uploadingFile?.documentId;
            if (parseInt(msgDocId, 10) !== documentId) return false;
            
            const msgFileName = msg.fileInfo?.fileName || msg.metadata?.fileInfo?.fileName;
            if (!msgFileName) return false;
            
            return msgFileName.toLowerCase().trim() === normalizedFileName;
          });
        
        if (docIdMatches.length > 0) {
          console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ✓ Global documentId verified to belong to this file:', documentId);
          // Update mapping for future use
          if (!window.fileNameToDocumentIdMap) {
            window.fileNameToDocumentIdMap = new Map();
          }
          window.fileNameToDocumentIdMap.set(currentFileName, documentId);
          console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 0 - Global Verified) =====');
          return documentId;
        } else {
          console.warn('[UploadDisclosure.getDocumentIdForCurrentFile] ⚠️ Global documentId does NOT belong to this file!');
        }
      }
      
      // CRITICAL FIX: If selectedFile is set but we can't find its documentId, return null
      // This prevents saving to the wrong document when multiple files are uploaded
      console.error('[UploadDisclosure.getDocumentIdForCurrentFile] ❌ ERROR: selectedFile is set but documentId not found!');
      console.error('[UploadDisclosure.getDocumentIdForCurrentFile] File name:', currentFileName);
      console.error('[UploadDisclosure.getDocumentIdForCurrentFile] Available mappings:', Array.from(window.fileNameToDocumentIdMap?.entries() || []));
      console.error('[UploadDisclosure.getDocumentIdForCurrentFile] This prevents saving to wrong document when multiple files uploaded');
      console.error('[UploadDisclosure.getDocumentIdForCurrentFile] Returning null to prevent incorrect document association');
      console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 0 - NULL) =====');
      return null;
    }

    // Strategy 1: Find the most recent file upload from chat messages
    // This is ONLY used when selectedFile is NOT available
    console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Strategy 1: selectedFile not available, using fallback');
    if (chatMessages.length > 0) {
      // Look for the most recent progress message with documentId
      const progressMessagesWithDocId = chatMessages
        .filter(msg => {
          const isProgressMsg = msg.isProgress || msg.metadata?.isProgress;
          if (!isProgressMsg) return false;
          const msgDocId = msg.metadata?.documentId || msg.documentId || msg._uploadingFile?.documentId;
          return msgDocId != null;
        })
        .sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA; // Latest first
        });

      console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Found', progressMessagesWithDocId.length, 'progress messages with documentId');

      if (progressMessagesWithDocId.length > 0) {
        const latestMsg = progressMessagesWithDocId[0];
        const msgDocId = latestMsg.metadata?.documentId || latestMsg.documentId || latestMsg._uploadingFile?.documentId;
        if (msgDocId) {
          const docId = parseInt(msgDocId, 10);
          if (!isNaN(docId) && docId > 0) {
            console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ✓ Found in progress messages (fallback):', docId);
            console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 1 - Progress Messages) =====');
            return docId;
          }
        }
      }
    }

    // Final fallback: Use global documentId (ONLY when selectedFile is NOT set)
    console.log('[UploadDisclosure.getDocumentIdForCurrentFile] Strategy 2: Using global documentId as final fallback:', documentId);
    console.log('[UploadDisclosure.getDocumentIdForCurrentFile] ===== END (Strategy 2 - Global Fallback) =====');
    return documentId;
  }, [selectedFile, chatMessages, documentId]);

  // Helper function to restore state from messages
  const restoreStateFromMessages = async (messages, forceRestore = false) => {
    if (!messages || messages.length === 0) {
      return;
    }

    // Prevent duplicate calls (unless forced, e.g., when switching sessions)
    if (restoreStateCalledRef.current && !forceRestore) {
      console.log('[UploadDisclosure.restoreStateFromMessages] Skipping - already called for this session');
      return;
    }
    restoreStateCalledRef.current = true;

    // CRITICAL FIX: Rebuild fileName -> documentId mapping from progress messages
    // This ensures the mapping is available when user navigates back to chat
    console.log('[UploadDisclosure.restoreStateFromMessages] Rebuilding fileName -> documentId mapping...');
    if (!window.fileNameToDocumentIdMap) {
      window.fileNameToDocumentIdMap = new Map();
    }
    
    const progressMessages = messages.filter(msg => msg.isProgress || msg.metadata?.isProgress);
    let mappingRebuiltCount = 0;
    let refRebuiltCount = 0;
    
    for (const msg of progressMessages) {
      const msgFileName = msg.fileInfo?.fileName || msg.metadata?.fileInfo?.fileName;
      const msgDocId = msg.metadata?.documentId || msg.documentId || msg._uploadingFile?.documentId;
      
      if (msgFileName && msgDocId) {
        const docId = parseInt(msgDocId, 10);
        if (!isNaN(docId) && docId > 0) {
          // Only update if not already set (preserve existing mappings)
          if (!window.fileNameToDocumentIdMap.has(msgFileName)) {
            window.fileNameToDocumentIdMap.set(msgFileName, docId);
            mappingRebuiltCount++;
            console.log('[UploadDisclosure.restoreStateFromMessages] Rebuilt mapping:', msgFileName, '->', docId);
          }
          
          // Also populate recentUploadsRef (use message timestamp or current time)
          const msgTimestamp = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();
          if (!recentUploadsRef.current.has(msgFileName)) {
            recentUploadsRef.current.set(msgFileName, {
              documentId: docId,
              timestamp: msgTimestamp,
              requestId: msg.metadata?.requestId || null
            });
            refRebuiltCount++;
            console.log('[UploadDisclosure.restoreStateFromMessages] Rebuilt recentUploadsRef:', msgFileName, '->', docId);
          }
>>>>>>> dev
        }
      }
    }
    
<<<<<<< HEAD
    // Check if we're in interact mode (has user questions)
    const hasUserQuestions = chatMessages.some(msg => msg.type === 'user');
    if (hasUserQuestions && !hasValidationComplete) {
      setIsInteractMode(true);
    }
  }, []); // Run only once on mount

  // Persist chat history whenever it changes (skip initial mount to avoid overwriting)
  useEffect(() => {
    // Skip persistence on initial mount since we just loaded from localStorage
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    
    // Only persist if we have messages (don't save empty arrays)
    if (chatMessages.length > 0) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages));
      } catch (error) {
        console.error('Failed to persist chat history', error);
      }
    }
  }, [chatMessages]);
=======
    console.log('[UploadDisclosure.restoreStateFromMessages] Mapping rebuild complete. Added', mappingRebuiltCount, 'new entries. Total mappings:', window.fileNameToDocumentIdMap.size);
    console.log('[UploadDisclosure.restoreStateFromMessages] RecentUploadsRef rebuild complete. Added', refRebuiltCount, 'new entries. Total ref entries:', recentUploadsRef.current.size);

    // Restore selected mandate and submission type from user messages
    // Note: We need mandates to be loaded before we can restore by name
    // But don't return early - continue with validation state restoration
    if (mandates.length > 0) {
      let restoredMandateName = null;
      let restoredSubmissionTypeName = null;
      
      for (const msg of messages) {
        if (msg.type === 'user' && msg.content) {
          if (msg.content.startsWith('Selected Mandate:')) {
            const mandateMatch = msg.content.match(/Selected Mandate:\s*(.+)/);
            if (mandateMatch) {
              restoredMandateName = mandateMatch[1].trim();
            }
          } else if (msg.content.startsWith('Selected Type of Submission:')) {
            const submissionMatch = msg.content.match(/Selected Type of Submission:\s*(.+)/);
            if (submissionMatch) {
              restoredSubmissionTypeName = submissionMatch[1].trim();
            }
          }
        }
      }
      
      // Find mandate by name and set its ID
      if (restoredMandateName) {
        const mandate = mandates.find(m => m.name === restoredMandateName);
        if (mandate) {
          setSelectedMandate(mandate.id);
          
          // Load submission types for this mandate
          apiService.getSubmissionTypes(mandate.id).then(types => {
            setSubmissionTypes(types || []);
            
            // Now restore submission type if we found one
            if (restoredSubmissionTypeName && types.length > 0) {
              const submissionType = types.find(st => st.name === restoredSubmissionTypeName);
              if (submissionType) {
                setSelectedSubmissionType(submissionType.id);
                
                // Store restored values for later saving when documentId is available
                // We'll save it after documentId is extracted from progress messages
                window.__restoredSubmissionType = { mandateId: mandate.id, submissionTypeId: submissionType.id };
              }
            }
          }).catch(err => {
            console.error('[restoreStateFromMessages] Failed to load submission types:', err);
          });
        }
      }
    }

    // Find ALL progress messages to restore state properly
    // Note: progressMessages was already declared above when rebuilding the mapping
    // Reuse the existing progressMessages variable
    
    // Find the most recent progress message
    const latestProgressMsg = progressMessages.length > 0 
      ? progressMessages[progressMessages.length - 1] 
      : null;
    
    // Find the first progress message for file info
    const firstProgressMsg = progressMessages.length > 0 
      ? progressMessages[0] 
      : null;
    
    if (latestProgressMsg) {
      // Latest progress message found
    }
    
    // Restore file info from first progress message (or latest if no first)
    const fileInfoMsg = firstProgressMsg || latestProgressMsg;
    if (fileInfoMsg && fileInfoMsg.fileInfo) {
      setAnnouncementTitle(fileInfoMsg.fileInfo.title || '');
      setDateOfEvent(fileInfoMsg.fileInfo.eventDate || '');
      
      // Restore selectedFile state - use the LATEST file (most recent upload)
      if (latestProgressMsg && latestProgressMsg.fileInfo && latestProgressMsg.fileInfo.fileName) {
        const dummyFile = {
          name: latestProgressMsg.fileInfo.fileName,
          type: 'application/pdf',
        };
        setSelectedFile(dummyFile);
      } else if (fileInfoMsg.fileInfo.fileName) {
        const dummyFile = {
          name: fileInfoMsg.fileInfo.fileName,
          type: 'application/pdf',
        };
        setSelectedFile(dummyFile);
      }
    }
    
    // Check if validation is complete - PRIMARY CHECK: Are ALL processing steps "done"?
    let hasValidationComplete = false;
    let allStepsDone = false;
    let calculatedProgressFromSteps = 0;
    
    if (latestProgressMsg && latestProgressMsg.progressSteps && latestProgressMsg.progressSteps.length > 0) {
      const doneCount = latestProgressMsg.progressSteps.filter(s => s.status === 'done').length;
      const totalCount = latestProgressMsg.progressSteps.length;
      calculatedProgressFromSteps = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
      allStepsDone = doneCount === totalCount && totalCount > 0;
      
    }
    
    // Check multiple conditions to ensure we detect completion
    hasValidationComplete = latestProgressMsg && (
      allStepsDone || // PRIMARY: All steps are done
      latestProgressMsg.progressPercentage === 100 ||
      latestProgressMsg.metadata?.progressPercentage === 100 ||
      latestProgressMsg.metadata?.validationComplete === true ||
      latestProgressMsg.complianceScore !== undefined && latestProgressMsg.complianceScore !== null || // Has compliance score = completed
      (latestProgressMsg.content && latestProgressMsg.content.includes('Validation completed successfully'))
    );
    
    // Restore validation state
    if (hasValidationComplete && latestProgressMsg) {
      setValidationComplete(true);
      setIsValidating(false);
      
      // CRITICAL FIX: Ensure "Upload another PDF" message exists when validation is complete
      // Check if it already exists in messages
      const hasCompletionMsg = messages.some(
        msg => msg.type === 'system' && 
               msg.content === 'Would you like to upload another PDF document?'
      );
      
      if (!hasCompletionMsg) {
        // Add the completion message after a short delay to ensure state is updated
        setTimeout(() => {
          setChatMessages((prev) => {
            const alreadyHasMsg = prev.some(
              msg => msg.type === 'system' && 
                     msg.content === 'Would you like to upload another PDF document?'
            );
            if (!alreadyHasMsg) {
              const completionMsg = {
                type: 'system',
                content: 'Would you like to upload another PDF document?',
                timestamp: new Date(),
              };
              return [...prev, completionMsg];
            }
            return prev;
          });
        }, 100);
      }
      
      // Restore progress percentage - if all steps are done, MUST be 100%
      let progressToRestore = 100; // Default to 100% if complete
      
      // Use calculated progress from steps if available and all steps are done
      if (allStepsDone && calculatedProgressFromSteps === 100) {
        progressToRestore = 100;
      } else if (latestProgressMsg.metadata?.progressPercentage !== undefined) {
        progressToRestore = Math.max(latestProgressMsg.metadata.progressPercentage, calculatedProgressFromSteps);
      } else if (latestProgressMsg.progressPercentage !== undefined) {
        progressToRestore = Math.max(latestProgressMsg.progressPercentage, calculatedProgressFromSteps);
      } else if (calculatedProgressFromSteps > 0) {
        progressToRestore = calculatedProgressFromSteps;
      }
      
      // Ensure progress is 100 if validation is complete (all steps done)
      if (allStepsDone) {
        progressToRestore = 100;
      }
      
      setProgressPercentage(progressToRestore);
      
      // Restore document ID from viewReportPath or metadata - use multiple sources
      let restoredDocId = null;
      if (latestProgressMsg.viewReportPath) {
        const match = latestProgressMsg.viewReportPath.match(/\/validation\/(.+)/);
        if (match) {
          restoredDocId = match[1];
        }
      }
      
      // Also try to extract from metadata
      if (!restoredDocId && latestProgressMsg.metadata?.viewReportPath) {
        const match = latestProgressMsg.metadata.viewReportPath.match(/\/validation\/(.+)/);
        if (match) {
          restoredDocId = match[1];
        }
      }
      
      // Also check metadata for documentId directly
      if (!restoredDocId && latestProgressMsg.metadata?.documentId) {
        restoredDocId = latestProgressMsg.metadata.documentId;
      }
      
      // If still no document ID, try to find it by matching file name with disclosures
      if (!restoredDocId && latestProgressMsg.fileInfo?.fileName && disclosures && disclosures.length > 0) {
        // Normalize file names for comparison (case-insensitive, handle spaces)
        const msgFileName = latestProgressMsg.fileInfo.fileName.toLowerCase().trim();
        const matchingDisclosure = disclosures.find(d => {
          if (!d.fileName) return false;
          const disclosureFileName = d.fileName.toLowerCase().trim();
          // Exact match or match without .pdf extension
          return disclosureFileName === msgFileName || 
                 disclosureFileName.replace(/\.pdf$/, '') === msgFileName.replace(/\.pdf$/, '');
        });
        
        if (matchingDisclosure && matchingDisclosure.documentId) {
          restoredDocId = matchingDisclosure.documentId.toString();
        }
      }
      
      // Set disclosureId and documentId if we found a valid document ID
      if (restoredDocId) {
        setDisclosureId(restoredDocId);
        // Don't override documentId if it's already set from session, but log if different
        if (!documentId) {
          setDocumentId(restoredDocId);
        } else if (documentId.toString() !== restoredDocId.toString()) {
          setDocumentId(restoredDocId);
        }
        
        // CRITICAL: Save restored submission type to database if we have one
        // This ensures existing documents get their submission type saved when restoring from chat history
        if (window.__restoredSubmissionType) {
          const { mandateId, submissionTypeId } = window.__restoredSubmissionType;
          apiService.saveDocumentSelection(restoredDocId, mandateId, submissionTypeId)
            .then(() => {
              delete window.__restoredSubmissionType; // Clean up
            })
            .catch(err => {
              console.error(`[restoreStateFromMessages] Failed to save restored submission type to database:`, err);
            });
        }
      }
      
      // Restore compliance score - try multiple sources
      let complianceScoreToRestore = latestProgressMsg.complianceScore;
      
      // If not in message, try to extract from content string
      if (complianceScoreToRestore === undefined || complianceScoreToRestore === null) {
        const content = latestProgressMsg.content || '';
        const scoreMatch = content.match(/Compliance Score:\s*(\d+(?:\.\d+)?)%?/i);
        if (scoreMatch) {
          complianceScoreToRestore = parseFloat(scoreMatch[1]);
        }
      }
      
      // If still not found and we have documentId, fetch from document details
      // IMPORTANT: Prefer restoredDocId (from latest message) over global documentId to avoid wrong document
      if ((complianceScoreToRestore === undefined || complianceScoreToRestore === null)) {
        let docIdToUse = null;
        if (restoredDocId) {
          docIdToUse = restoredDocId;
        } else if (documentId) {
          docIdToUse = documentId;
        }
        
        if (docIdToUse) {
          try {
            const docDetails = await apiService.getDocumentDetails(docIdToUse);
            if (docDetails && docDetails.compliance_score !== undefined && docDetails.compliance_score !== null) {
              complianceScoreToRestore = docDetails.compliance_score;
              
              // Update the message with the compliance score and add it to content if not present
              setChatMessages((prev) => {
                return prev.map((msg) => {
                  if (msg.id === latestProgressMsg.id && msg.isProgress) {
                    // Check if compliance score line already exists in content
                    const hasComplianceScoreLine = msg.content && msg.content.includes('Compliance Score:');
                    const hasViewReport = msg.content && msg.content.includes('View Report');
                    
                    // If not present, add it to the content
                    let updatedContent = msg.content;
                    let contentChanged = false;
                    
                    // Ensure View Report is present if we have docIdToUse
                    if (!hasViewReport && docIdToUse) {
                      updatedContent = `${updatedContent}\n    View Report`;
                      contentChanged = true;
                    }
                    
                    if (!hasComplianceScoreLine && complianceScoreToRestore !== null) {
                      // Format score to 2 decimal places
                      const formattedScore = typeof complianceScoreToRestore === 'number' 
                        ? complianceScoreToRestore.toFixed(2) 
                        : parseFloat(complianceScoreToRestore || 0).toFixed(2);
                      // Add compliance score line before "View Report" if it exists, otherwise at the end
                      if (updatedContent.includes('View Report')) {
                        updatedContent = updatedContent.replace(
                          /(\n\s*View Report)/,
                          `\n    Compliance Score: ${formattedScore}%$1`
                        );
                      } else {
                        updatedContent = `${updatedContent}\n    Compliance Score: ${formattedScore}%`;
                      }
                      contentChanged = true;
                    }
                    
                    return {
                      ...msg,
                      content: updatedContent,
                      complianceScore: complianceScoreToRestore,
                      viewReportPath: msg.viewReportPath || (docIdToUse ? `/validation/${docIdToUse}` : null),
                      metadata: {
                        ...msg.metadata,
                        complianceScore: complianceScoreToRestore,
                        viewReportPath: docIdToUse ? `/validation/${docIdToUse}` : (msg.metadata?.viewReportPath || null),
                        documentId: docIdToUse ? docIdToUse.toString() : (msg.metadata?.documentId || null),
                      }
                    };
                  }
                  return msg;
                });
              });
            }
          } catch (error) {
            console.error('[restoreStateFromMessages] Failed to fetch compliance score:', error);
          }
        }
      }
      
      if (complianceScoreToRestore !== undefined && complianceScoreToRestore !== null) {
        scoreSetRef.current = true;
      }
      
      // FIX: Process ALL progress messages to fetch compliance scores for each file
      // This ensures that when multiple files are uploaded in one chat, all files get their compliance scores
      for (const progressMsg of progressMessages) {
        // Skip if this message already has a compliance score
        if (progressMsg.complianceScore !== undefined && progressMsg.complianceScore !== null) {
          continue;
        }
        
        // Check if this progress message represents a completed validation
        const msgProgressSteps = progressMsg.progressSteps || [];
        const msgDoneCount = msgProgressSteps.filter(s => s.status === 'done').length;
        const msgTotalCount = msgProgressSteps.length;
        const msgAllStepsDone = msgDoneCount === msgTotalCount && msgTotalCount > 0;
        const msgIsComplete = msgAllStepsDone || 
                             progressMsg.progressPercentage === 100 ||
                             progressMsg.metadata?.progressPercentage === 100 ||
                             (progressMsg.content && progressMsg.content.includes('Validation completed successfully'));
        
        if (!msgIsComplete) {
          continue;
        }
        
        // Extract document ID from this specific progress message's viewReportPath
        let msgDocId = null;
        if (progressMsg.viewReportPath) {
          const match = progressMsg.viewReportPath.match(/\/validation\/(.+)/);
          if (match) {
            msgDocId = match[1];
          }
        }
        
        // Also try to extract from metadata
        if (!msgDocId && progressMsg.metadata?.viewReportPath) {
          const match = progressMsg.metadata.viewReportPath.match(/\/validation\/(.+)/);
          if (match) {
            msgDocId = match[1];
          }
        }
        
        // Also check metadata for documentId directly
        if (!msgDocId && progressMsg.metadata?.documentId) {
          msgDocId = progressMsg.metadata.documentId;
        }
        
        // If still no document ID, try to find it from the rebuilt fileName -> documentId mapping
        if (!msgDocId && progressMsg.fileInfo?.fileName) {
          const msgFileName = progressMsg.fileInfo.fileName;
          
          // Check window.fileNameToDocumentIdMap first (was just rebuilt above)
          if (window.fileNameToDocumentIdMap && window.fileNameToDocumentIdMap.has(msgFileName)) {
            msgDocId = window.fileNameToDocumentIdMap.get(msgFileName).toString();
            console.log('[restoreStateFromMessages] Found docId from fileNameToDocumentIdMap:', msgFileName, '->', msgDocId);
          }
          
          // Also check recentUploadsRef
          if (!msgDocId && recentUploadsRef.current.has(msgFileName)) {
            const uploadData = recentUploadsRef.current.get(msgFileName);
            if (uploadData && uploadData.documentId) {
              msgDocId = uploadData.documentId.toString();
              console.log('[restoreStateFromMessages] Found docId from recentUploadsRef:', msgFileName, '->', msgDocId);
            }
          }
        }
        
        // If still no document ID, try to find it by matching file name with disclosures
        if (!msgDocId && progressMsg.fileInfo?.fileName && disclosures && disclosures.length > 0) {
          // Normalize file names for comparison (case-insensitive, handle spaces)
          const msgFileName = progressMsg.fileInfo.fileName.toLowerCase().trim();
          const matchingDisclosure = disclosures.find(d => {
            if (!d.fileName) return false;
            const disclosureFileName = d.fileName.toLowerCase().trim();
            // Exact match or match without .pdf extension
            return disclosureFileName === msgFileName || 
                   disclosureFileName.replace(/\.pdf$/, '') === msgFileName.replace(/\.pdf$/, '');
          });
          
          if (matchingDisclosure && matchingDisclosure.documentId) {
            msgDocId = matchingDisclosure.documentId.toString();
          }
        }
        
        // If we have a document ID, fetch the compliance score for THIS specific document
        if (msgDocId) {
          try {
            const docDetails = await apiService.getDocumentDetails(msgDocId);
            if (docDetails && docDetails.compliance_score !== undefined && docDetails.compliance_score !== null) {
              const fetchedScore = docDetails.compliance_score;
              
              // Update THIS specific progress message with its compliance score
              setChatMessages((prev) => {
                return prev.map((msg) => {
                  if (msg.id === progressMsg.id && msg.isProgress) {
                    // Check if compliance score line already exists in content
                    const hasComplianceScoreLine = msg.content && msg.content.includes('Compliance Score:');
                    const hasViewReport = msg.content && msg.content.includes('View Report');
                    
                    // If not present, add it to the content
                    let updatedContent = msg.content;
                    let contentChanged = false;
                    
                    // Ensure View Report is present if we have msgDocId
                    if (!hasViewReport && msgDocId) {
                      updatedContent = `${updatedContent}\n    View Report`;
                      contentChanged = true;
                    }
                    
                    if (!hasComplianceScoreLine && fetchedScore !== null) {
                      // Format score to 2 decimal places
                      const formattedScore = typeof fetchedScore === 'number' 
                        ? fetchedScore.toFixed(2) 
                        : parseFloat(fetchedScore || 0).toFixed(2);
                      // Add compliance score line before "View Report" if it exists, otherwise at the end
                      if (updatedContent.includes('View Report')) {
                        updatedContent = updatedContent.replace(
                          /(\n\s*View Report)/,
                          `\n    Compliance Score: ${formattedScore}%$1`
                        );
                      } else {
                        updatedContent = `${updatedContent}\n    Compliance Score: ${formattedScore}%`;
                      }
                      contentChanged = true;
                    }
                    
                    return {
                      ...msg,
                      content: updatedContent,
                      complianceScore: fetchedScore,
                      viewReportPath: msg.viewReportPath || (msgDocId ? `/validation/${msgDocId}` : null),
                      metadata: {
                        ...msg.metadata,
                        complianceScore: fetchedScore,
                        viewReportPath: msgDocId ? `/validation/${msgDocId}` : (msg.metadata?.viewReportPath || null),
                        documentId: msgDocId ? msgDocId.toString() : (msg.metadata?.documentId || null),
                      }
                    };
                  }
                  return msg;
                });
              });
            }
          } catch (error) {
            console.error(`[restoreStateFromMessages] Failed to fetch compliance score for document ${msgDocId}:`, error);
          }
        }
      }
      
      // Restore progress message ID
      if (latestProgressMsg.id) {
        setProgressMessageId(latestProgressMsg.id);
      }
      
      // Ensure all steps are revealed when validation is complete
      if (latestProgressMsg.progressSteps && latestProgressMsg.progressSteps.length > 0 && allStepsDone) {
        // Update the message to reveal all steps
        setChatMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === latestProgressMsg.id && msg.isProgress) {
              return {
                ...msg,
                lastRevealedStepIndex: latestProgressMsg.progressSteps.length - 1
              };
            }
            return msg;
          });
        });
      }
      
      // CRITICAL FIX: Ensure View Report and Compliance Score are in message content for completed validations
      if (hasValidationComplete && latestProgressMsg && restoredDocId) {
        setChatMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === latestProgressMsg.id && msg.isProgress) {
              const hasViewReport = msg.content && msg.content.includes('View Report');
              const hasComplianceScore = msg.content && msg.content.includes('Compliance Score:');
              
              // If both are already present, no need to update
              if (hasViewReport && hasComplianceScore) {
                return msg;
              }
              
              let updatedContent = msg.content;
              let needsUpdate = false;
              
              // Ensure View Report is present
              if (!hasViewReport) {
                updatedContent = `${updatedContent}\n    View Report`;
                needsUpdate = true;
              }
              
              // Ensure Compliance Score is present if we have it
              if (!hasComplianceScore && complianceScoreToRestore !== null && complianceScoreToRestore !== undefined) {
                const formattedScore = typeof complianceScoreToRestore === 'number' 
                  ? complianceScoreToRestore.toFixed(2) 
                  : parseFloat(complianceScoreToRestore || 0).toFixed(2);
                
                if (updatedContent.includes('View Report')) {
                  updatedContent = updatedContent.replace(
                    /(\n\s*View Report)/,
                    `\n    Compliance Score: ${formattedScore}%$1`
                  );
                } else {
                  updatedContent = `${updatedContent}\n    Compliance Score: ${formattedScore}%`;
                }
                needsUpdate = true;
              }
              
              // Only update if content changed or metadata needs updating
              if (needsUpdate || !msg.viewReportPath || (msg.complianceScore === undefined && complianceScoreToRestore !== null)) {
                return {
                  ...msg,
                  content: updatedContent,
                  complianceScore: msg.complianceScore !== undefined ? msg.complianceScore : complianceScoreToRestore,
                  viewReportPath: msg.viewReportPath || (restoredDocId ? `/validation/${restoredDocId}` : null),
                  metadata: {
                    ...msg.metadata,
                    complianceScore: msg.metadata?.complianceScore !== undefined ? msg.metadata.complianceScore : complianceScoreToRestore,
                    viewReportPath: restoredDocId ? `/validation/${restoredDocId}` : (msg.metadata?.viewReportPath || null),
                    documentId: restoredDocId ? restoredDocId.toString() : (msg.metadata?.documentId || null),
                  }
                };
              }
            }
            return msg;
          });
        });
      }
    } else {
      // If not complete, restore progress state from latest progress message
      if (latestProgressMsg) {
        // Get progress percentage from metadata or direct property
        let progressToRestore = latestProgressMsg.metadata?.progressPercentage !== undefined 
          ? latestProgressMsg.metadata.progressPercentage 
          : (latestProgressMsg.progressPercentage !== undefined ? latestProgressMsg.progressPercentage : 0);
        
        // If we have progress steps, calculate progress from done steps (use as source of truth)
        if (latestProgressMsg.progressSteps && latestProgressMsg.progressSteps.length > 0) {
          // Use calculated progress from steps as the primary source
          if (calculatedProgressFromSteps > progressToRestore) {
            progressToRestore = calculatedProgressFromSteps;
          }
        }
        
        setProgressPercentage(progressToRestore);
        
        if (latestProgressMsg.id) {
          setProgressMessageId(latestProgressMsg.id);
        }
        // If progress is > 0 but < 100, we're still validating
        if (progressToRestore > 0 && progressToRestore < 100) {
          setIsValidating(true);
        } else {
          setIsValidating(false);
        }
      } else {
        setProgressPercentage(0);
      }
      setValidationComplete(false);
    }
    
    // Check if we're in interact mode
    const hasUserQuestions = messages.some(msg => msg.type === 'user' && msg.content !== 'Get Compliance Score');
    if (hasUserQuestions && !hasValidationComplete) {
      setIsInteractMode(true);
    } else {
      setIsInteractMode(false);
    }
    
    // CRITICAL FIX: After restoring from messages, check current backend status
    // This ensures that if processing completed while user was away, we update the UI
    if (latestProgressMsg) {
      // Try to get document ID from the progress message
      let docIdToCheck = null;
      
      // Extract from viewReportPath
      if (latestProgressMsg.viewReportPath) {
        const match = latestProgressMsg.viewReportPath.match(/\/validation\/(.+)/);
        if (match) {
          docIdToCheck = match[1];
        }
      }
      
      // Extract from metadata
      if (!docIdToCheck && latestProgressMsg.metadata?.viewReportPath) {
        const match = latestProgressMsg.metadata.viewReportPath.match(/\/validation\/(.+)/);
        if (match) {
          docIdToCheck = match[1];
        }
      }
      
      // Extract from metadata.documentId
      if (!docIdToCheck && latestProgressMsg.metadata?.documentId) {
        docIdToCheck = latestProgressMsg.metadata.documentId;
      }
      
      // Fallback to global documentId
      if (!docIdToCheck && documentId) {
        docIdToCheck = documentId.toString();
      }
      
      // If we have a document ID, check current backend status
      if (docIdToCheck) {
        try {
          const statusResponse = await apiService.getProcessingStatus(docIdToCheck);
          const backendStatus = statusResponse.status || statusResponse.validation_status || statusResponse.overall_status;
          const backendProgress = statusResponse.progress || 0;
          const backendSteps = statusResponse.steps || [];
          
          
          // Check if we need to fetch result (backend completed but no compliance score)
          const needsResultFetch = (backendStatus === 'COMPLETED' || backendStatus === 'completed' || backendStatus === 'SUCCESS') &&
                                   (latestProgressMsg.complianceScore === undefined || latestProgressMsg.complianceScore === null);
          
          // If backend shows completed but our restored state doesn't, update it
          // OR if backend is completed but we don't have a compliance score yet
          if (((backendStatus === 'COMPLETED' || backendStatus === 'completed' || backendStatus === 'SUCCESS') && 
              !validationComplete && latestProgressMsg.progressPercentage < 100) || needsResultFetch) {
            
            // Update progress to 100% if not already
            if (latestProgressMsg.progressPercentage < 100) {
              setProgressPercentage(100);
              setValidationComplete(true);
              setIsValidating(false);
              
              // Update progress message with completed status
              setChatMessages((prev) => {
                return prev.map((msg) => {
                  if (msg.id === latestProgressMsg.id && msg.isProgress) {
                    // Map backend steps to our progress steps format
                    const updatedSteps = msg.progressSteps.map((step) => {
                      const backendStep = backendSteps.find(s => 
                        s.step === step.name || s.step_name === step.name
                      );
                      if (backendStep && (backendStep.status === 'DONE' || backendStep.status === 'done')) {
                        return { ...step, status: 'done' };
                      }
                      return step;
                    });
                    
                    // If all steps are done, mark all as done
                    const allDone = backendSteps.every(s => s.status === 'DONE' || s.status === 'done');
                    if (allDone) {
                      updatedSteps.forEach(step => {
                        step.status = 'done';
                      });
                    }
                    
                    // Build content with completed status
                    const stepsContent = updatedSteps
                      .map((s) => `    ${s.name} ${s.status === 'done' ? 'DONE' : ''}`)
                      .join('\n');
                    
                    const content = `File: ${msg.fileInfo.fileName}\nTitle: ${msg.fileInfo.title}\nEvent Date: ${formatDate(msg.fileInfo.eventDate)}\nProgress: 100%\n\n${stepsContent}\n    Validation completed successfully DONE`;
                    
                    return {
                      ...msg,
                      content,
                      progressSteps: updatedSteps,
                      progressPercentage: 100,
                      lastRevealedStepIndex: updatedSteps.length - 1,
                    };
                  }
                  return msg;
                });
              });
            } else {
              // Progress is already 100%, just ensure validation is marked complete
              setValidationComplete(true);
              setIsValidating(false);
            }
            
            // Always try to fetch result and compliance score when backend is completed
            try {
              const resultResponse = await apiService.getProcessingResult(docIdToCheck);
              const resultData = resultResponse.data || {};
              
              // CRITICAL FIX: Extract compliance score - handle nested structures for JSE
              let complianceScore = null;
              
              // Check if result_data has numeric keys (multiple results format)
              const numericKeys = resultData && typeof resultData === 'object' 
                ? Object.keys(resultData).filter(key => /^\d+$/.test(key))
                : [];
              
              if (numericKeys.length > 0) {
                // Multiple results format - get score from first result
                const firstResultKey = numericKeys.sort((a, b) => parseInt(a) - parseInt(b))[0];
                const firstResult = resultData[firstResultKey];
                if (firstResult && typeof firstResult === 'object' && 'score' in firstResult) {
                  const scoreValue = firstResult.score;
                  if (scoreValue != null && !isNaN(scoreValue)) {
                    complianceScore = parseFloat(scoreValue);
                  }
                }
              } else {
                // Single result format
                if (resultData && typeof resultData === 'object' && 'score' in resultData) {
                  const scoreValue = resultData.score;
                  if (scoreValue != null && !isNaN(scoreValue)) {
                    complianceScore = parseFloat(scoreValue);
                  }
                }
              }
              
              // Wait a moment for backend to save the score, then fetch document details
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Fetch document details to get saved compliance score
              const docDetails = await apiService.getDocumentDetails(docIdToCheck);
              let finalComplianceScore = docDetails.compliance_score || complianceScore;
              
              // CRITICAL FIX: Also check result_data in document details for nested scores (JSE)
              if (!finalComplianceScore && docDetails && docDetails.result_data && typeof docDetails.result_data === 'object') {
                const docNumericKeys = Object.keys(docDetails.result_data).filter(key => /^\d+$/.test(key));
                if (docNumericKeys.length > 0) {
                  const firstDocResultKey = docNumericKeys.sort((a, b) => parseInt(a) - parseInt(b))[0];
                  const firstDocResult = docDetails.result_data[firstDocResultKey];
                  if (firstDocResult && typeof firstDocResult === 'object' && 'score' in firstDocResult) {
                    const scoreValue = firstDocResult.score;
                    if (scoreValue != null && !isNaN(scoreValue)) {
                      finalComplianceScore = parseFloat(scoreValue);
                    }
                  }
                } else if (docDetails.result_data.score !== undefined) {
                  finalComplianceScore = parseFloat(docDetails.result_data.score);
                }
              }
              
              if (finalComplianceScore !== null && finalComplianceScore !== undefined) {
                
                // Update message with compliance score
                setChatMessages((prev) => {
                  return prev.map((msg) => {
                    if (msg.id === latestProgressMsg.id && msg.isProgress) {
                      const hasComplianceScoreLine = msg.content && msg.content.includes('Compliance Score:');
                      let updatedContent = msg.content;
                      
                      if (!hasComplianceScoreLine) {
                        // Format score to 2 decimal places
                        const formattedScore = typeof finalComplianceScore === 'number' 
                          ? finalComplianceScore.toFixed(2) 
                          : parseFloat(finalComplianceScore || 0).toFixed(2);
                        if (updatedContent.includes('View Report')) {
                          updatedContent = updatedContent.replace(
                            /(\n\s*View Report)/,
                            `\n    Compliance Score: ${formattedScore}%$1`
                          );
                        } else {
                          updatedContent = `${updatedContent}\n    Compliance Score: ${formattedScore}%`;
                        }
                      }
                      
                      // Ensure View Report link is added if not present
                      let finalContent = updatedContent;
                      if (!finalContent.includes('View Report') && docIdToCheck) {
                        finalContent = `${finalContent}\n    View Report`;
                      }
                      
                      return {
                        ...msg,
                        content: finalContent,
                        complianceScore: finalComplianceScore,
                        viewReportPath: docIdToCheck ? `/validation/${docIdToCheck}` : msg.viewReportPath,
                        metadata: {
                          ...msg.metadata,
                          complianceScore: finalComplianceScore,
                          viewReportPath: docIdToCheck ? `/validation/${docIdToCheck}` : msg.metadata?.viewReportPath,
                          documentId: docIdToCheck ? docIdToCheck.toString() : msg.metadata?.documentId,
                          progressPercentage: 100,
                          validationComplete: true,
                        }
                      };
                    }
                    return msg;
                  });
                });
                
                setDisclosureId(docIdToCheck);
                setDocumentId(parseInt(docIdToCheck, 10));
              } else {
                // Even if no score, ensure viewReportPath is set
                setChatMessages((prev) => {
                  return prev.map((msg) => {
                    if (msg.id === latestProgressMsg.id && msg.isProgress && !msg.viewReportPath) {
                      return {
                        ...msg,
                        viewReportPath: docIdToCheck ? `/validation/${docIdToCheck}` : null,
                        metadata: {
                          ...msg.metadata,
                          viewReportPath: docIdToCheck ? `/validation/${docIdToCheck}` : msg.metadata?.viewReportPath,
                        }
                      };
                    }
                    return msg;
                  });
                });
              }
              
              // CRITICAL FIX: Ensure "Upload another PDF" message exists if validation is complete
              setChatMessages((prev) => {
                const hasCompletionMsg = prev.some(
                  msg => msg.type === 'system' && 
                         msg.content === 'Would you like to upload another PDF document?'
                );
                
                if (!hasCompletionMsg && validationComplete) {
                  const completionMsg = {
                    type: 'system',
                    content: 'Would you like to upload another PDF document?',
                    timestamp: new Date(),
                  };
                  return [...prev, completionMsg];
                }
                return prev;
              });
            } catch (resultError) {
              console.error(`[restoreStateFromMessages] Failed to fetch result:`, resultError);
            }
          } else if (backendStatus === 'PROCESSING' || backendStatus === 'processing') {
            // Backend is still processing, update progress from backend
            if (backendProgress > latestProgressMsg.progressPercentage) {
              setProgressPercentage(backendProgress);
              
              // Update steps from backend
              if (backendSteps.length > 0) {
                setChatMessages((prev) => {
                  return prev.map((msg) => {
                    if (msg.id === latestProgressMsg.id && msg.isProgress) {
                      const updatedSteps = msg.progressSteps.map((step) => {
                        const backendStep = backendSteps.find(s => 
                          s.step === step.name || s.step_name === step.name
                        );
                        if (backendStep) {
                          if (backendStep.status === 'DONE' || backendStep.status === 'done') {
                            return { ...step, status: 'done' };
                          } else if (backendStep.status === 'PROCESSING' || backendStep.status === 'processing') {
                            return { ...step, status: 'processing' };
                          }
                        }
                        return step;
                      });
                      
                      return {
                        ...msg,
                        progressSteps: updatedSteps,
                        progressPercentage: backendProgress,
                      };
                    }
                    return msg;
                  });
                });
              }
              
              // Resume polling if not already polling
              if (!isValidating && backendProgress < 100) {
                setIsValidating(true);
                setProgressMessageId(latestProgressMsg.id);
                // Start polling
                if (!pollingIntervalRef.current) {
                  pollingIntervalRef.current = setInterval(() => {
                    pollProcessingStatus(parseInt(docIdToCheck, 10), latestProgressMsg.id);
                  }, 5000);
                }
              }
            }
          }
        } catch (statusError) {
          console.error(`[restoreStateFromMessages] Failed to check backend status:`, statusError);
          // Don't throw - continue with restored state even if status check fails
        }
      }
    }
    
    // Final check: Save restored submission type if documentId is available but we haven't saved yet
    // This handles cases where documentId was already set before restoration
    if (window.__restoredSubmissionType && documentId) {
      const { mandateId, submissionTypeId } = window.__restoredSubmissionType;
      apiService.saveDocumentSelection(documentId, mandateId, submissionTypeId)
        .then(() => {
          delete window.__restoredSubmissionType; // Clean up
        })
        .catch(err => {
          console.error(`[restoreStateFromMessages] Failed to save restored submission type to database:`, err);
        });
    }
    
  };

  // Load most recent session for current document or all sessions
  const loadMostRecentSession = async () => {
    try {
      setIsLoadingSession(true);
      
      // Fetch sessions - if we have documentId, filter by it, otherwise get all sessions
      const sessions = documentId 
        ? await apiService.getUserChatSessions(documentId)
        : await apiService.getUserChatSessions(null); // null = get all sessions
      
      if (sessions && sessions.length > 0) {
        // Load the most recent session (first in the list since they're ordered by most recent)
        const mostRecentSession = sessions[0];
        await handleSelectChatSession(mostRecentSession.session_id);
      } else {
        // No sessions found - clear any stale session ID
        setCurrentChatSessionId(null);
        localStorage.removeItem(CURRENT_SESSION_KEY);
        setIsLoadingSession(false);
      }
    } catch (error) {
      console.error('Failed to load most recent session:', error);
      // Clear invalid session ID on error
      setCurrentChatSessionId(null);
      localStorage.removeItem(CURRENT_SESSION_KEY);
      setIsLoadingSession(false);
    }
  };

  // Persist session ID and document ID whenever they change
  useEffect(() => {
    if (currentChatSessionId) {
      localStorage.setItem(CURRENT_SESSION_KEY, currentChatSessionId);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  }, [currentChatSessionId]);

  useEffect(() => {
    if (documentId) {
      localStorage.setItem(CURRENT_DOCUMENT_KEY, documentId.toString());
    } else {
      localStorage.removeItem(CURRENT_DOCUMENT_KEY);
    }
  }, [documentId]);

  // Persist chat messages to localStorage as backup (only if we have a session)
  useEffect(() => {
    if (currentChatSessionId && chatMessages.length > 0) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages));
      } catch (error) {
        console.error('Failed to persist chat history to localStorage', error);
      }
    }
  }, [chatMessages, currentChatSessionId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0 && !isLoadingSession) {
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages.length, isLoadingSession]);
>>>>>>> dev

  // Watch for compliance score updates - only run once when score becomes available
  useEffect(() => {
    if (disclosureId && progressMessageId && validationComplete) {
      const disclosure = disclosures.find(d => d.id === disclosureId);
      const complianceScore = disclosure?.complianceScore;
      
      if (complianceScore != null && !scoreSetRef.current) {
        setChatMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === progressMessageId && msg.isProgress) {
              // Check if score is already in content
              const hasScoreInContent = msg.content && msg.content.includes('Compliance Score:');
<<<<<<< HEAD
              
              // If score is already in content, don't do anything
              if (hasScoreInContent) {
                scoreSetRef.current = true;
                return msg;
              }
              
              // Only add score if it's not already there
              // Append to existing content instead of rebuilding
              const content = `${msg.content}\n    Compliance Score: ${complianceScore}%`;
              scoreSetRef.current = true;
              return {
                ...msg,
                content,
                complianceScore,
                viewReportPath: msg.viewReportPath || (disclosureId ? `/validation/${disclosureId}` : null),
              };
=======
              const hasViewReport = msg.content && msg.content.includes('View Report');
              
              // Format score to 2 decimal places
              const formattedScore = typeof complianceScore === 'number' 
                ? complianceScore.toFixed(2) 
                : parseFloat(complianceScore || 0).toFixed(2);
              
              let updatedContent = msg.content;
              let contentChanged = false;
              
              // Always ensure View Report link is present if we have disclosureId
              if (!hasViewReport && disclosureId) {
                updatedContent = `${updatedContent}\n    View Report`;
                contentChanged = true;
              }
              
              // Add compliance score if not already present
              if (!hasScoreInContent) {
                // Append compliance score before View Report if it exists, otherwise at the end
                if (updatedContent.includes('View Report')) {
                  updatedContent = updatedContent.replace(
                    /(\n\s*View Report)/,
                    `\n    Compliance Score: ${formattedScore}%$1`
                  );
                } else {
                  updatedContent = `${updatedContent}\n    Compliance Score: ${formattedScore}%`;
                }
                contentChanged = true;
              }
              
              // Only mark as set if we made changes OR if both are already present
              if (contentChanged || (hasScoreInContent && hasViewReport)) {
                scoreSetRef.current = true;
              }
              
              // Update message if content changed or if metadata needs updating
              if (contentChanged || !msg.viewReportPath || !msg.complianceScore) {
                return {
                  ...msg,
                  content: updatedContent,
                  complianceScore,
                  viewReportPath: msg.viewReportPath || (disclosureId ? `/validation/${disclosureId}` : null),
                  metadata: {
                    ...msg.metadata,
                    complianceScore: complianceScore,
                    viewReportPath: disclosureId ? `/validation/${disclosureId}` : (msg.metadata?.viewReportPath || null),
                    documentId: disclosureId ? disclosureId.toString() : (msg.metadata?.documentId || null),
                  }
                };
              }
              
              return msg;
>>>>>>> dev
            }
            return msg;
          });
        });
      }
    }
  }, [disclosures, disclosureId, progressMessageId, validationComplete]);
<<<<<<< HEAD
=======
  
  // CRITICAL FIX: Ensure "Upload another PDF" message appears when validation is complete
  useEffect(() => {
    if (validationComplete && chatMessages.length > 0) {
      const hasCompletionMsg = chatMessages.some(
        msg => msg.type === 'system' && 
               msg.content === 'Would you like to upload another PDF document?'
      );
      
      if (!hasCompletionMsg) {
        // Add completion message after a short delay
        setTimeout(() => {
          setChatMessages((prev) => {
            const alreadyHasMsg = prev.some(
              msg => msg.type === 'system' && 
                     msg.content === 'Would you like to upload another PDF document?'
            );
            if (!alreadyHasMsg) {
              const completionMsg = {
                type: 'system',
                content: 'Would you like to upload another PDF document?',
                timestamp: new Date(),
              };
              return [...prev, completionMsg];
            }
            return prev;
          });
        }, 200);
      }
    }
  }, [validationComplete, chatMessages.length]);
>>>>>>> dev

  const progressSteps = [
    { name: 'OCR Extraction', id: 'ocr' },
    { name: 'Text Embedding', id: 'embedding' },
    { name: 'Regulation Matching', id: 'matching' },
    { name: 'Compliance Analysis', id: 'analysis' },
    { name: 'Rule Validation', id: 'validation' },
    { name: 'Report Generation', id: 'report' },
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (isInteractMode && questionInputRef.current) {
      questionInputRef.current.focus();
    }
  }, [isInteractMode]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

<<<<<<< HEAD
  const handleFileSelect = (file) => {
    const isPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setSelectedFile(file);
      setValidationComplete(false);
      setDisclosureId(null);
      setChatMessages((prev) => [
        ...prev,
        {
          type: 'system',
          content: `File "${file.name}" uploaded successfully. What would you like to do?`,
          timestamp: new Date(),
        },
      ]);
=======
  const handleFileSelect = async (file) => {
    const isPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      // Track first PDF name for chat title (only if this is the first PDF in this session)
      if (!firstPdfNameRef.current && currentChatSessionId) {
        // Get first PDF name from existing messages
        const firstProgressMsg = chatMessages.find(msg => msg.isProgress && msg.fileInfo?.fileName);
        if (firstProgressMsg?.fileInfo?.fileName) {
          firstPdfNameRef.current = firstProgressMsg.fileInfo.fileName.replace(/\.pdf$/i, '');
        } else {
          // This is the first PDF, use current file name
          firstPdfNameRef.current = file.name.replace(/\.pdf$/i, '');
        }
      } else if (!firstPdfNameRef.current) {
        // No session yet, this will be the first PDF
        firstPdfNameRef.current = file.name.replace(/\.pdf$/i, '');
      }
      
      // Reset validation state for new file (but keep session and documentId)
      setSelectedFile(file);
      setValidationComplete(false);
      setDisclosureId(null);
      // Don't reset documentId - we want to keep the same session for multiple PDFs
      // setDocumentId(null); // REMOVED - keep existing documentId/session
      setRequestId(null);
      setIsValidating(false);
      setProgressPercentage(0);
      setCurrentStep(0);
      setProgressMessageId(null);
      setIsInteractMode(false);
      // Show form fields so user can see and click "Run Validation" button
      setShowFormFields(true);
      setSelectedMandate(null);
      setSelectedSubmissionType(null);
      scoreSetRef.current = false;
      
      // Stop any ongoing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Set default values for form fields
      const defaultTitle = `Disclosure - ${file.name.replace('.pdf', '')}`;
      const today = new Date();
      const defaultDate = today.toISOString().split('T')[0];
      setAnnouncementTitle(defaultTitle);
      setDateOfEvent(defaultDate);
      
      // Show a message that file is selected and ready to upload
      const message = {
          type: 'system',
          content: `File "${file.name}" selected. Please fill in the details below and click "Get Compliance Score" to upload and process the file.`,
          timestamp: new Date(),
      };
      setChatMessages((prev) => addMessageWithoutDuplicate(message, prev));
      
      // Save message to backend if session exists
      // If no session exists yet, it will be created when user clicks "Get Compliance Score"
      // and then we'll save all pending messages
      if (currentChatSessionId) {
        await saveMessageToBackend('assistant', message.content);
      } else {
      }
>>>>>>> dev
    } else {
      alert('Please upload a PDF file.');
    }
  };

<<<<<<< HEAD
  const handleUploadAnotherPDF = () => {
    setSelectedFile(null);
    setValidationComplete(false);
    setDisclosureId(null);
    setShowFormFields(false);
    setIsInteractMode(false);
    setAnnouncementTitle('');
    setDateOfEvent('');
    // Keep chat history - just add a new message
    setChatMessages((prev) => [
      ...prev,
      {
        type: 'system',
        content: 'Please upload a new PDF document to continue.',
        timestamp: new Date(),
      },
    ]);
=======
  const handleUploadAnotherPDF = async () => {
    // Reset validation-related state for new PDF upload (but keep session)
    setSelectedFile(null);
    setValidationComplete(false);
    setDisclosureId(null);
    // Don't reset documentId - keep the same session for multiple PDFs
    // setDocumentId(null); // REMOVED - keep existing documentId/session
    setRequestId(null);
    setShowFormFields(false);
    setIsInteractMode(false);
    setIsValidating(false);
    setProgressPercentage(0);
    setCurrentStep(0);
    setProgressMessageId(null);
    setAnnouncementTitle('');
    setDateOfEvent('');
    setSelectedMandate(null);
    setSelectedSubmissionType(null);
    scoreSetRef.current = false;
    
    // Clear saved message tracking for new file upload
    savedMessageIdsRef.current.clear();
    
    // Stop any ongoing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Keep chat history - just add a new message
    const message = {
        type: 'system',
        content: 'Please upload a new PDF document to continue.',
        timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, message]);
    
    // Save message to backend if session exists
    if (currentChatSessionId) {
      await saveMessageToBackend('assistant', message.content);
    }
    
>>>>>>> dev
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

<<<<<<< HEAD
=======
  // Chat session handlers
  const handleCreateNewChat = async () => {
    // COMPLETELY reset all state for new chat
    firstPdfNameRef.current = null;
    setCurrentChatSessionId(null);
    localStorage.removeItem(CURRENT_SESSION_KEY);
    setChatMessages([]);
    setSelectedFile(null);
    setValidationComplete(false);
    setDisclosureId(null);
    setDocumentId(null);
    localStorage.removeItem(CURRENT_DOCUMENT_KEY);
    setRequestId(null);
    setShowFormFields(false);
    setIsInteractMode(false);
    setIsValidating(false);
    setProgressPercentage(0);
    setCurrentStep(0);
    setProgressMessageId(null);
    setAnnouncementTitle('');
    setDateOfEvent('');
    scoreSetRef.current = false;
    restoreStateCalledRef.current = false; // Reset to allow restoration for new chat
    
    // Stop any ongoing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Clear saved message tracking
    savedMessageIdsRef.current.clear();
    
    // Note: We don't create a session here - it will be created when the first PDF is uploaded
    // This ensures the chat name will be based on the first PDF uploaded in this new chat
  };

  const handleSelectChatSession = async (sessionId) => {
    // Prevent multiple simultaneous loads
    if (isLoadingSession) return;
    
    try {
      setIsLoadingSession(true);
      
      // FIRST: Completely reset all state before loading new chat
      setSelectedFile(null);
      setValidationComplete(false);
      setDisclosureId(null);
      setRequestId(null);
      setShowFormFields(false);
      setIsInteractMode(false);
      setIsValidating(false);
      setProgressPercentage(0);
      setCurrentStep(0);
      setProgressMessageId(null);
      setAnnouncementTitle('');
      setDateOfEvent('');
      scoreSetRef.current = false;
      restoreStateCalledRef.current = false; // Reset to allow restoration for new session
      setChatMessages([]); // Clear messages first
      
      // Stop any ongoing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Load session from backend
      const session = await apiService.getChatSession(sessionId);
      
      
      // Update session ID and save to localStorage
      setCurrentChatSessionId(sessionId);
      localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      
      // Update documentId if available
      if (session.pdf_document_id) {
        setDocumentId(session.pdf_document_id);
        localStorage.setItem(CURRENT_DOCUMENT_KEY, session.pdf_document_id.toString());
      }
      
      // Reset first PDF name
      firstPdfNameRef.current = null;
      
      // Convert backend messages to frontend format
      // Use ProcessingStep data to enhance progress messages (source of truth for progress state)
      const processingSteps = session.processing_steps || [];
      
      const rawMessages = (session.messages || []).map(msg => {
        const metadata = msg.metadata || {};
        let progressSteps = metadata.progressSteps || [];
        
        // Enhance progress steps with ProcessingStep data from backend (source of truth)
        if (metadata.isProgress && processingSteps.length > 0) {
          
          // Use ProcessingStep data to update progress steps
          const enhancedSteps = processingSteps.map(ps => {
            // Find matching step in metadata or create new one
            const existingStep = progressSteps.find(s => s.name === ps.step_name);
            return {
              name: ps.step_name,
              status: ps.status, // Use status from ProcessingStep (source of truth)
              order: ps.step_order
            };
          });
          
          // Update metadata with enhanced steps
          progressSteps = enhancedSteps;
          metadata.progressSteps = enhancedSteps;
          
          // Recalculate progress percentage from ProcessingStep statuses
          const doneCount = enhancedSteps.filter(s => s.status === 'done').length;
          const totalCount = enhancedSteps.length;
          metadata.progressPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          
        }
        
        // If this is a progress message with completed validation, ensure all steps are revealed
        let lastRevealedStepIndex = metadata.lastRevealedStepIndex;
        if (metadata.isProgress && progressSteps.length > 0) {
          // Check if all steps are done (primary indicator of completion)
          const allStepsDone = progressSteps.every(s => s.status === 'done');
          const doneStepsCount = progressSteps.filter(s => s.status === 'done').length;
          
          // Check if validation is complete by looking at content, progress percentage, or all steps done
          const isComplete = allStepsDone || 
                            metadata.progressPercentage === 100 || 
                            (msg.content && msg.content.includes('Validation completed successfully'));
          
          if (isComplete && (lastRevealedStepIndex === undefined || lastRevealedStepIndex < progressSteps.length - 1)) {
            // All steps should be visible for completed validations
            lastRevealedStepIndex = progressSteps.length - 1;
          } else if (lastRevealedStepIndex === undefined || lastRevealedStepIndex === -1) {
            // If not set, show all steps that are done (or all steps if all are done)
            if (allStepsDone) {
              lastRevealedStepIndex = progressSteps.length - 1;
            } else {
              lastRevealedStepIndex = doneStepsCount > 0 ? doneStepsCount - 1 : 0;
            }
          }
        }
        
        return {
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'system',
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
          isProgress: metadata.isProgress || false,
          progressSteps: progressSteps,
          lastRevealedStepIndex: lastRevealedStepIndex,
          fileInfo: metadata.fileInfo,
          progressPercentage: metadata.progressPercentage || 0,
          complianceScore: metadata.complianceScore,
          viewReportPath: metadata.viewReportPath,
          metadata: metadata,
        };
      });
      
      // CRITICAL FIX: Deduplicate messages from backend
      // Keep only the first occurrence of each unique message (by type + content)
      // This prevents duplicate messages that may have been stored due to bugs
      const seenMessages = new Set();
      const messages = rawMessages.filter(msg => {
        // For progress messages, use fileInfo.fileName as unique key
        let uniqueKey;
        if (msg.isProgress && msg.fileInfo?.fileName) {
          uniqueKey = `progress:${msg.fileInfo.fileName}`;
        } else {
          uniqueKey = `${msg.type}:${msg.content}`;
        }
        
        if (seenMessages.has(uniqueKey)) {
          console.log('[handleSelectChatSession] Filtering duplicate message:', msg.content?.substring(0, 50));
          return false;
        }
        seenMessages.add(uniqueKey);
        return true;
      });
      
      // Set first PDF name from session title (this is the source of truth)
      if (session.title && session.title !== 'New Chat') {
        firstPdfNameRef.current = session.title;
      } else if (messages.length > 0) {
        // If no title but we have messages, try to get from first progress message
        const firstProgressMsg = messages.find(msg => msg.isProgress && msg.fileInfo?.fileName);
        if (firstProgressMsg?.fileInfo?.fileName) {
          firstPdfNameRef.current = firstProgressMsg.fileInfo.fileName.replace(/\.pdf$/i, '');
        }
      }
      
      // Set messages (even if empty, to show the session exists)
      setChatMessages(messages.length > 0 ? messages : []);
      
      // Restore state from messages AFTER setting messages (async - don't await, let it run in background)
      if (messages.length > 0) {
        restoreStateFromMessages(messages, true).catch(err => { // forceRestore=true since we're switching sessions
          console.error('[handleSelectChatSession] Error restoring state:', err);
        });
      } else {
        // If no messages, ensure UI states are reset
        setValidationComplete(false);
        setIsInteractMode(false);
        setShowFormFields(false);
        setSelectedFile(null);
      }
      
      // Scroll to bottom after loading with smooth animation
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
    } catch (error) {
      console.error('Failed to load chat session:', error);
      // Don't clear messages on error - keep what we have
      alert('Failed to load chat session. Please try again.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Save message to backend
  const saveMessageToBackend = async (role, content, metadata = {}, sessionIdOverride = null) => {
    // Use provided sessionId or fall back to currentChatSessionId from state
    const sessionId = sessionIdOverride || currentChatSessionId;
    if (!sessionId) {
      return;
    }
    
    // Create a unique key for this message to prevent duplicates
    const messageKey = `${sessionId}_${role}_${content.substring(0, 50)}_${JSON.stringify(metadata).substring(0, 50)}`;
    
    // Check if we've already saved this message
    if (savedMessageIdsRef.current.has(messageKey)) {
      return;
    }
    
    try {
      
      const response = await apiService.saveChatMessage(sessionId, role, content, metadata);
      // Mark as saved
      savedMessageIdsRef.current.add(messageKey);
    } catch (error) {
      console.error('[saveMessageToBackend] ✗ FAILED to save message to backend:', error);
      console.error('[saveMessageToBackend] Error details:', {
        message: error.message,
        sessionId,
        role,
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
        metadata: JSON.stringify(metadata)
      });
      // Don't throw - allow UI to continue working even if backend save fails
      // But log the error for debugging
      if (error.message && error.message.includes('Chat session not found')) {
      }
    }
  };

>>>>>>> dev
  const generateDummyAnswer = (question) => {
    const lowerQuestion = question.toLowerCase();
    const answers = [
      'Based on the document analysis, the information you\'re looking for appears in section 3.2 of the PDF. The relevant details indicate compliance with Regulation 30 requirements.',
      'The document shows that the announcement was made within the required 24-hour timeframe as per SEBI guidelines. The disclosure includes all mandatory fields.',
      'According to the extracted text, the credit rating information is present and matches the format specified in Schedule III Part A. The document appears to be compliant.',
      'The PDF contains the necessary regulatory references and includes proper signatory authorization. All required disclosures are present in the document.',
      'Based on my analysis, the document meets the compliance criteria for the specified regulations. The formatting and content align with SEBI LODR requirements.',
      'The document analysis reveals that all mandatory sections are completed. The date of event, announcement title, and regulatory references are all properly documented.',
    ];
    
    // Try to match question keywords to provide more relevant answers
    if (lowerQuestion.includes('summary') || lowerQuestion.includes('overview')) {
      return 'This document is a regulatory disclosure related to credit rating changes. It includes details about the rating agency, the nature of the rating change, and compliance with SEBI LODR regulations. The document appears to be properly formatted and contains all required information.';
    }
    if (lowerQuestion.includes('regulation') || lowerQuestion.includes('compliance')) {
      return 'The document references Regulation 30 and Schedule III Part A. Based on the analysis, it appears to comply with the disclosure requirements, including timely submission and proper formatting as per SEBI guidelines.';
    }
    if (lowerQuestion.includes('date') || lowerQuestion.includes('when')) {
      return 'The document indicates the event date and announcement date are within the acceptable timeframe. The dates mentioned align with the regulatory requirements for timely disclosure.';
    }
    if (lowerQuestion.includes('rating') || lowerQuestion.includes('credit')) {
      return 'The credit rating information is clearly stated in the document. It includes details about the rating agency, the type of rating, and any changes or revisions to the rating status.';
    }
    
    // Return random answer if no keyword match
    return answers[Math.floor(Math.random() * answers.length)];
  };

  const handleInteractWithPDF = () => {
    setIsInteractMode(true);
    setShowFormFields(false);
    setChatMessages((prev) => [
      ...prev,
      {
        type: 'user',
        content: 'Interact with PDF',
        timestamp: new Date(),
      },
      {
        type: 'system',
        content: 'I\'m ready to help you understand your PDF document. Ask me any questions about the content, compliance requirements, or specific details you\'d like to know.',
        timestamp: new Date(),
      },
    ]);
  };

<<<<<<< HEAD
  const handleQuestionSubmit = (e) => {
=======
  const handleQuestionSubmit = async (e) => {
>>>>>>> dev
    e.preventDefault();
    if (!questionInput.trim()) return;

    const question = questionInput.trim();
<<<<<<< HEAD
    setChatMessages((prev) => [
      ...prev,
      {
        type: 'user',
        content: question,
        timestamp: new Date(),
      },
    ]);
=======
    const userMessage = {
        type: 'user',
        content: question,
        timestamp: new Date(),
    };
    
    setChatMessages((prev) => [...prev, userMessage]);
    
    // Save user message to backend
    await saveMessageToBackend('user', question);
>>>>>>> dev

    // Generate dummy answer
    const answer = generateDummyAnswer(question);
    
    // Simulate thinking delay
<<<<<<< HEAD
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          type: 'system',
          content: answer,
          timestamp: new Date(),
        },
      ]);
=======
    setTimeout(async () => {
      const assistantMessage = {
          type: 'system',
          content: answer,
          timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      
      // Save assistant message to backend
      await saveMessageToBackend('assistant', answer);
>>>>>>> dev
    }, 500);

    setQuestionInput('');
  };

<<<<<<< HEAD
  const handleGetComplianceScore = () => {
=======
  const handleGetComplianceScore = async () => {
>>>>>>> dev
    if (!selectedFile) {
      alert('Please upload a PDF file first');
      return;
    }
    
<<<<<<< HEAD
=======
    // Check if "Get Compliance Score" message already exists for THIS specific file
    // Allow multiple compliance score requests if different files are uploaded
    const hasComplianceScoreRequestForThisFile = chatMessages.some(
      msg => msg.type === 'user' && 
             msg.content === 'Get Compliance Score' &&
             msg.metadata?.fileName === selectedFile.name
    );
    
    if (hasComplianceScoreRequestForThisFile) {
      // Already requested for this file, don't add duplicate
      return;
    }
    
>>>>>>> dev
    setIsInteractMode(false);
    setShowFormFields(false);
    
    // Generate dummy title and date
    const dummyTitle = `Disclosure - ${selectedFile.name.replace('.pdf', '')}`;
    const today = new Date();
    const dummyDate = today.toISOString().split('T')[0];
    
    setAnnouncementTitle(dummyTitle);
    setDateOfEvent(dummyDate);
    
<<<<<<< HEAD
    setChatMessages((prev) => [
      ...prev,
      {
        type: 'user',
        content: 'Get Compliance Score',
        timestamp: new Date(),
      },
    ]);
=======
    const complianceScoreMsg = {
        type: 'user',
        content: 'Get Compliance Score',
        timestamp: new Date(),
      metadata: { fileName: selectedFile.name }, // Track which file this request is for
    };
    
    setChatMessages((prev) => [...prev, complianceScoreMsg]);
    
    // Don't save message here - it will be saved after session is created in handleRunValidationWithData
    // The message is already in the UI, we'll save it to backend once session exists
>>>>>>> dev
    
    // Directly trigger validation
    setTimeout(() => {
      handleRunValidationWithData(dummyTitle, dummyDate);
    }, 100);
  };

<<<<<<< HEAD
  const handleRunValidationWithData = (titleOverride = null, dateOverride = null) => {
=======
  // Extract success handling to separate function for reuse
  const handlePollingSuccess = async (docId, messageId, statusResponse) => {
    try {
      const resultResponse = await apiService.getProcessingResult(docId);
      const resultData = resultResponse.data || {};
      
      // Get requestId from status response if available
      const requestIdFromStatus = statusResponse.request_id || requestId;

      // CRITICAL FIX: Extract compliance_score from result_data - try multiple sources
      // For JSE, result_data might have nested structures like {'0': {score: 75}, '1': {score: 80}}
      let complianceScore = null;
      // Track which result index we're using (for View Report link)
      let resultIndexForViewReport = null;
      
      // First, check if result_data has numeric keys (multiple results format)
      const numericKeys = resultData && typeof resultData === 'object' 
        ? Object.keys(resultData).filter(key => /^\d+$/.test(key))
        : [];
      
      if (numericKeys.length > 0) {
        // Multiple results format - try to get score from first result (or aggregate)
        // For chat display, we'll use the first result's score
        const firstResultKey = numericKeys.sort((a, b) => parseInt(a) - parseInt(b))[0];
        resultIndexForViewReport = firstResultKey; // Store for View Report link
        const firstResult = resultData[firstResultKey];
        if (firstResult && typeof firstResult === 'object' && 'score' in firstResult) {
          const scoreValue = firstResult.score;
          if (scoreValue != null && !isNaN(scoreValue)) {
            complianceScore = parseFloat(scoreValue);
          }
        }
      } else {
        // Single result format - try to get score from result_data.score (top level)
        if (resultData && typeof resultData === 'object' && 'score' in resultData) {
          const scoreValue = resultData.score;
          if (scoreValue != null && !isNaN(scoreValue)) {
            complianceScore = parseFloat(scoreValue);
          }
        }
      }
      
      // Fallback: Calculate from validation_status if score not available
      if (complianceScore === null) {
        let passCount = 0;
        let totalCount = 0;
        const dataToProcess = numericKeys.length > 0 && resultData[numericKeys[0]] 
          ? resultData[numericKeys[0]] 
          : resultData;
        
        Object.values(dataToProcess || {}).forEach((rule) => {
          if (rule && typeof rule === 'object' && rule.validation_status) {
            totalCount++;
            if (rule.validation_status === 'SUCCESS') {
              passCount++;
            }
          }
        });
        complianceScore = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : null;
        if (complianceScore !== null) {
        }
      }
      
      // CRITICAL FIX: Also try fetching from document details (backend might have saved it)
      // This is especially important for JSE where the score might be stored differently
      if (complianceScore === null || complianceScore === undefined) {
        try {
          // Wait a moment for backend to save the score
          await new Promise(resolve => setTimeout(resolve, 1000));
          const docDetails = await apiService.getDocumentDetails(docId);
          if (docDetails && docDetails.compliance_score !== null && docDetails.compliance_score !== undefined) {
            complianceScore = docDetails.compliance_score;
          } else {
            // Try checking result_data in document details for nested scores
            if (docDetails && docDetails.result_data && typeof docDetails.result_data === 'object') {
              const docNumericKeys = Object.keys(docDetails.result_data).filter(key => /^\d+$/.test(key));
              if (docNumericKeys.length > 0) {
                const firstDocResultKey = docNumericKeys.sort((a, b) => parseInt(a) - parseInt(b))[0];
                resultIndexForViewReport = firstDocResultKey; // Set result index for View Report link
                const firstDocResult = docDetails.result_data[firstDocResultKey];
                if (firstDocResult && typeof firstDocResult === 'object' && 'score' in firstDocResult) {
                  const scoreValue = firstDocResult.score;
                  if (scoreValue != null && !isNaN(scoreValue)) {
                    complianceScore = parseFloat(scoreValue);
                  }
                }
              } else if (docDetails.result_data.score !== undefined) {
                complianceScore = parseFloat(docDetails.result_data.score);
              }
            }
          }
        } catch (error) {
          console.error('[handlePollingSuccess] Failed to fetch compliance score from document details:', error);
        }
      }

      // Update disclosure in context
      addDisclosure({
        announcementTitle: announcementTitle.trim(),
        dateOfEvent: dateOfEvent,
        fileName: selectedFile.name,
        documentId: docId,
        requestId: requestIdFromStatus || requestId,
        status: 'completed',
        complianceScore: complianceScore,
        resultData: resultData,
      });
      setDisclosureId(docId);
      setDocumentId(docId);

      // Update progress message with completion using startTransition
      startTransition(() => {
        setChatMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === messageId && msg.isProgress) {
              const stepsContent = msg.progressSteps
                .map((s) => `    ${s.name} DONE`)
                .join('\n');
              // CRITICAL FIX: Always include View Report link and ensure compliance score is shown
              const viewReportLink = docId ? `\n    View Report` : '';
              const formattedScore = complianceScore != null 
                ? (typeof complianceScore === 'number' ? complianceScore.toFixed(2) : parseFloat(complianceScore || 0).toFixed(2))
                : null;
              const scoreLine = formattedScore != null ? `\n    Compliance Score: ${formattedScore}%` : '';
              // Ensure View Report comes after compliance score if score exists, otherwise after validation completed
              const content = formattedScore != null
                ? `File: ${msg.fileInfo.fileName}\nTitle: ${msg.fileInfo.title}\nEvent Date: ${formatDate(msg.fileInfo.eventDate)}\nProgress: 100%\n\n${stepsContent}\n    Validation completed successfully DONE${scoreLine}${viewReportLink}`
                : `File: ${msg.fileInfo.fileName}\nTitle: ${msg.fileInfo.title}\nEvent Date: ${formatDate(msg.fileInfo.eventDate)}\nProgress: 100%\n\n${stepsContent}\n    Validation completed successfully DONE${viewReportLink}`;
              scoreSetRef.current = true;
              
              // Save final progress message to backend
              if (currentChatSessionId) {
                const completedSteps = msg.progressSteps.map(step => ({
                  ...step,
                  status: 'done'
                }));
                
                // For JSE files with multiple results, include result_index in the path
                let viewReportPathForBackend = docId ? `/validation/${docId}` : null;
                if (viewReportPathForBackend && resultIndexForViewReport !== null) {
                  viewReportPathForBackend = `${viewReportPathForBackend}?result_index=${resultIndexForViewReport}`;
                }
                
                saveMessageToBackend('assistant', content, {
                  isProgress: true,
                  progressSteps: completedSteps,
                  lastRevealedStepIndex: msg.progressSteps.length - 1,
                  fileInfo: msg.fileInfo,
                  progressPercentage: 100,
                  complianceScore: complianceScore,
                  viewReportPath: viewReportPathForBackend,
                  documentId: docId ? docId.toString() : null,
                  resultIndex: resultIndexForViewReport,
                  validationComplete: true,
                });
              }
              
              // CRITICAL FIX: Ensure metadata is also updated with viewReportPath and documentId
              // For JSE files with multiple results, include result_index in the path
              let viewReportPath = docId ? `/validation/${docId}` : null;
              if (viewReportPath && resultIndexForViewReport !== null) {
                viewReportPath = `${viewReportPath}?result_index=${resultIndexForViewReport}`;
              }
              
              return {
                ...msg,
                content,
                progressPercentage: 100,
                complianceScore: complianceScore,
                viewReportPath: viewReportPath,
                metadata: {
                  ...msg.metadata,
                  complianceScore: complianceScore,
                  viewReportPath: viewReportPath,
                  documentId: docId ? docId.toString() : (msg.metadata?.documentId || null),
                  resultIndex: resultIndexForViewReport,
                  progressPercentage: 100,
                  validationComplete: true,
                }
              };
            }
            return msg;
          });
        });
      });

      // Add completion message
      setTimeout(() => {
        startTransition(() => {
          setChatMessages((prev) => {
            const hasCompletionMsg = prev.some(
              msg => msg.type === 'system' && 
                     msg.content === 'Would you like to upload another PDF document?'
            );
            
            if (hasCompletionMsg) {
              return prev;
            }
            
            const completionMsg = {
              type: 'system',
              content: 'Would you like to upload another PDF document?',
              timestamp: new Date(),
            };
            
            if (currentChatSessionId) {
              saveMessageToBackend('assistant', completionMsg.content);
            }
            
            return [...prev, completionMsg];
          });
        });
      }, 500);
    } catch (error) {
      console.error('Failed to fetch result:', error);
      startTransition(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            type: 'system',
            content: 'Validation completed but failed to fetch detailed results.',
            timestamp: new Date(),
          },
        ]);
      });
    }
  };

  // Cleanup polling on unmount
  // Note: Global polling service continues even after component unmounts
  useEffect(() => {
    return () => {
      // Clean up local interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // Note: We don't stop global polling here - it continues in background
      // Global polling will stop automatically when document completes or on logout
    };
  }, []);

  // Note: Removed visibility change handler - polling continues regardless of tab visibility
  // This ensures processing continues even when user navigates away or works on other tabs

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const updateProgressMessage = (messageId, progress, steps, overallStatus) => {
    // Use startTransition to batch updates and prevent flicker
    startTransition(() => {
      setChatMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === messageId && msg.isProgress) {
            // Map external API steps to our progress steps
            const updatedSteps = msg.progressSteps.map((step) => {
              const apiStep = steps.find((s) => s.step === step.name);
              if (apiStep) {
                if (apiStep.status === 'DONE') {
                  return { ...step, status: 'done' };
                } else {
                  return { ...step, status: 'processing' };
                }
              }
              return step;
            });

          // Find the highest step index that is done or processing
          let highestActiveIndex = -1;
          for (let i = 0; i < updatedSteps.length; i++) {
            if (updatedSteps[i].status === 'done' || updatedSteps[i].status === 'processing') {
              highestActiveIndex = i;
            }
          }

          // Get the last revealed step index (initialize if not exists)
          let lastRevealedIndex = msg.lastRevealedStepIndex !== undefined ? msg.lastRevealedStepIndex : -1;

          // Reveal steps one by one - increment by 1 each time to show sequential progress
          // This creates the "AI brain working" effect where steps appear one at a time
          if (highestActiveIndex >= 0) {
            // If this is the first update, reveal the first step immediately
            if (lastRevealedIndex === -1) {
              lastRevealedIndex = 0;
            } else if (highestActiveIndex > lastRevealedIndex) {
              // Reveal one more step with a delay for visual effect
              const newRevealedIndex = lastRevealedIndex + 1;
              
              // Schedule the reveal of the next step with smoother timing
              setTimeout(() => {
                setChatMessages((prevMsgs) => {
                  return prevMsgs.map((m) => {
                    if (m.id === messageId && m.isProgress) {
                      return { ...m, lastRevealedStepIndex: newRevealedIndex };
                    }
                    return m;
                  });
                });
              }, 300); // Reduced delay for smoother, more responsive feel
            }
          }

          // Show steps up to the last revealed index + current processing step
          const maxVisibleIndex = Math.max(lastRevealedIndex, highestActiveIndex >= 0 ? highestActiveIndex : -1);
          const visibleSteps = updatedSteps.slice(0, maxVisibleIndex + 1);
          
          const stepsContent = visibleSteps
            .map((s, idx) => {
              // Show processing indicator only for the currently processing step
              if (s.status === 'processing' && idx === highestActiveIndex) {
                return `    ${s.name}...`;
              }
              if (s.status === 'done') {
                return `    ${s.name} DONE`;
              }
              return `    ${s.name}`;
            })
            .join('\n');

          const content = `File: ${msg.fileInfo.fileName}\nTitle: ${msg.fileInfo.title}\nEvent Date: ${formatDate(msg.fileInfo.eventDate)}\nProgress: ${progress}%\n\n${stepsContent}`;

          return {
            ...msg,
            progressSteps: updatedSteps,
            content,
            progressPercentage: progress,
            lastRevealedStepIndex: Math.max(lastRevealedIndex, highestActiveIndex >= 0 ? highestActiveIndex : -1),
          };
        }
        return msg;
      });
    });
    });
  };

  const pollProcessingStatus = async (docId, messageId) => {
    // Continue polling even when tab is hidden - backend processing continues
    // Just log it for debugging
    if (document.hidden) {
    }
    
    try {
      const statusResponse = await apiService.getProcessingStatus(docId);
      const { overall_status, progress, steps } = statusResponse;

      // Use startTransition to prevent blocking updates and reduce flicker
      startTransition(() => {
        setProgressPercentage(progress);
        updateProgressMessage(messageId, progress, steps || [], overall_status);
      });
      
      // Save progress update to backend (only on significant changes to avoid too many API calls)
      // Skip saving here if status is SUCCESS - we'll save the final message in the completion section
      if (currentChatSessionId && overall_status !== 'SUCCESS' && (progress % 25 === 0 || overall_status === 'FAILED')) {
        // Use setTimeout to ensure state is updated before reading
        setTimeout(async () => {
          setChatMessages((currentMsgs) => {
            const progressMsg = currentMsgs.find(m => m.id === messageId && m.isProgress);
            if (progressMsg) {
              saveMessageToBackend('assistant', progressMsg.content, {
                isProgress: true,
                progressSteps: progressMsg.progressSteps || [],
                lastRevealedStepIndex: progressMsg.lastRevealedStepIndex,
                fileInfo: progressMsg.fileInfo,
                progressPercentage: progress,
              });
            }
            return currentMsgs; // Return unchanged to avoid triggering re-render
          });
        }, 100);
      }

      if (overall_status === 'SUCCESS') {
        // Stop local polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Stop global polling for this document (if using global service)
        // Note: Global service will continue for other callbacks if any

        // Small delay for smooth transition
        startTransition(() => {
          setTimeout(() => {
            setIsValidating(false);
            setValidationComplete(true);
          }, 200);
        });

        // Use extracted function to handle success
        handlePollingSuccess(docId, messageId, statusResponse);
      }
    } catch (error) {
      console.error('Failed to poll status:', error);
      // Continue polling even on error
    }
  };

  const handleRunValidationWithData = async (titleOverride = null, dateOverride = null) => {
>>>>>>> dev
    const finalTitle = titleOverride || announcementTitle.trim();
    const finalDate = dateOverride || dateOfEvent;
    
    if (!finalTitle) {
      alert('Please enter an Announcement Title');
      return;
    }
    if (!finalDate) {
      alert('Please enter a Date of Event');
      return;
    }
    if (!selectedFile) {
      alert('Please upload a PDF file');
      return;
    }
    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      alert('Only PDF uploads are supported at the moment');
      return;
    }

<<<<<<< HEAD
    const disclosureResult = addDisclosure({
      announcementTitle: finalTitle,
      dateOfEvent: finalDate,
      fileName: selectedFile.name,
    });

    const newDisclosureId = disclosureResult.id;
    const immediateComplianceScore = disclosureResult.complianceScore;
    setDisclosureId(newDisclosureId);
=======
>>>>>>> dev
    setIsValidating(true);
    setCurrentStep(0);
    setProgressPercentage(0);
    setShowFormFields(false);

<<<<<<< HEAD
    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      } catch {
        return dateString;
      }
    };

    // Add single progress message that will be updated
    const newProgressMessageId = `progress-${Date.now()}`;
    setProgressMessageId(newProgressMessageId);
    scoreSetRef.current = false; // Reset ref for new validation
    const initialContent = `File: ${selectedFile.name}\nTitle: ${finalTitle}\nEvent Date: ${formatDate(finalDate)}\nProgress: 0%\n\n${progressSteps.map((s) => `    ${s.name}`).join('\n')}`;
    
=======
    // Add initial progress message
    const newProgressMessageId = `progress-${Date.now()}`;
    setProgressMessageId(newProgressMessageId);
    scoreSetRef.current = false;

    const initialContent = `File: ${selectedFile.name}\nTitle: ${finalTitle}\nEvent Date: ${formatDate(finalDate)}\nProgress: 0%\n\n${progressSteps.map((s) => `    ${s.name}`).join('\n')}`;
    
    // CRITICAL FIX: Store a reference to the file being uploaded
    // This will be updated with documentId after upload completes
    const fileBeingUploaded = {
      fileName: selectedFile.name,
      documentId: null, // Will be set after upload
      timestamp: new Date(),
    };
    
>>>>>>> dev
    setChatMessages((prev) => [
      ...prev,
      {
        id: newProgressMessageId,
        type: 'system',
        content: initialContent,
        timestamp: new Date(),
        isProgress: true,
        progressSteps: progressSteps.map((step) => ({ ...step, status: 'pending' })),
<<<<<<< HEAD
=======
        lastRevealedStepIndex: -1, // Initialize to -1 so steps appear one by one
>>>>>>> dev
        fileInfo: {
          fileName: selectedFile.name,
          title: finalTitle,
          eventDate: finalDate,
        },
        progressPercentage: 0,
<<<<<<< HEAD
      },
    ]);

    // Progress steps in chat - 6 steps, 1 second each
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex++;
      setCurrentStep(stepIndex);
      const percentage = Math.round((stepIndex / progressSteps.length) * 100);
      setProgressPercentage(percentage);

      // Update the progress message with current step
      const step = progressSteps[stepIndex - 1];
      const formatDateForUpdate = (dateString) => {
        if (!dateString) return '';
        try {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        } catch {
          return dateString;
        }
      };
      
      setChatMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === newProgressMessageId && msg.isProgress) {
            // Create new progressSteps array with updated status
            const updatedSteps = msg.progressSteps.map((s, idx) => {
              if (idx === stepIndex - 1) {
                return { ...s, status: 'processing' };
              }
              return s;
            });
            // Build content string with file info and steps
            const stepsContent = updatedSteps
              .map((s) => {
                if (s.status === 'processing') return `    ${s.name}...`;
                if (s.status === 'done') return `    ${s.name} DONE`;
                return `    ${s.name}`;
              })
              .join('\n');
            const content = `File: ${msg.fileInfo.fileName}\nTitle: ${msg.fileInfo.title}\nEvent Date: ${formatDateForUpdate(msg.fileInfo.eventDate)}\nProgress: ${percentage}%\n\n${stepsContent}`;
            return {
              ...msg,
              progressSteps: updatedSteps,
              content,
              progressPercentage: percentage,
            };
          }
          return msg;
        });
      });

      // After a brief delay, mark step as done
    setTimeout(() => {
        const formatDateForUpdate = (dateString) => {
          if (!dateString) return '';
          try {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
          } catch {
            return dateString;
          }
        };
        
        setChatMessages((prev) => {
          return prev.map((msg) => {
              if (msg.id === newProgressMessageId && msg.isProgress) {
              // Create new progressSteps array with updated status
              const updatedSteps = msg.progressSteps.map((s, idx) => {
                if (idx === stepIndex - 1) {
                  return { ...s, status: 'done' };
                }
                return s;
              });
              // Build content string with file info and steps
              const stepsContent = updatedSteps
                .map((s) => {
                  if (s.status === 'processing') return `    ${s.name}...`;
                  if (s.status === 'done') return `    ${s.name} DONE`;
                  return `    ${s.name}`;
                })
                .join('\n');
              const currentPercentage = Math.round((stepIndex / progressSteps.length) * 100);
              const content = `File: ${msg.fileInfo.fileName}\nTitle: ${msg.fileInfo.title}\nEvent Date: ${formatDateForUpdate(msg.fileInfo.eventDate)}\nProgress: ${currentPercentage}%\n\n${stepsContent}`;
              return {
                ...msg,
                progressSteps: updatedSteps,
                content,
                progressPercentage: currentPercentage,
              };
            }
            return msg;
          });
        });
      }, 800);

      if (stepIndex >= progressSteps.length) {
        clearInterval(stepInterval);
      setIsValidating(false);
        setValidationComplete(true);
        
        // Add "Validation completed successfully" as the last step in the same message
        setTimeout(() => {
          const formatDateForFinal = (dateString) => {
            if (!dateString) return '';
            try {
              const [year, month, day] = dateString.split('-');
              return `${day}/${month}/${year}`;
            } catch {
              return dateString;
            }
          };
          
          // Update with completion message - use the compliance score returned from addDisclosure
          const complianceScore = immediateComplianceScore;
          
          setChatMessages((prev) => {
            return prev.map((msg) => {
              if (msg.id === newProgressMessageId && msg.isProgress) {
                const stepsContent = msg.progressSteps
                  .map((s) => `    ${s.name} DONE`)
                  .join('\n');
                const viewReportLink = newDisclosureId ? `\n    View Report` : '';
                const scoreLine = complianceScore != null ? `\n    Compliance Score: ${complianceScore}%` : '';
                const content = `File: ${msg.fileInfo.fileName}\nTitle: ${msg.fileInfo.title}\nEvent Date: ${formatDateForFinal(msg.fileInfo.eventDate)}\nProgress: 100%\n\n${stepsContent}\n    Validation completed successfully DONE${scoreLine}${viewReportLink}`;
                // Mark that score has been set to prevent useEffect from overwriting
                if (complianceScore != null) {
                  scoreSetRef.current = true;
                }
                return {
                  ...msg,
                  content,
                  progressPercentage: 100,
                  complianceScore: complianceScore || msg.complianceScore,
                  viewReportPath: newDisclosureId ? `/validation/${newDisclosureId}` : null,
                };
              }
              return msg;
            });
          });
          
          // Add next steps message
          setTimeout(() => {
            setChatMessages((prev) => [
              ...prev,
              {
                type: 'system',
                content: 'Would you like to upload another PDF document?',
                timestamp: new Date(),
              },
            ]);
          }, 500);
        }, 800);
      }
    }, 1000);
=======
        // Store reference to file being uploaded (will be updated with documentId)
        _uploadingFile: fileBeingUploaded,
      },
    ]);

    try {
      // CRITICAL FIX: Capture mandate and submission type values at the START of upload
      // This prevents race conditions when multiple files are uploaded in the same chat session
      // Each file should use its own selected values, not stale values from previous files
      const currentMandateId = selectedMandate;
      const currentSubmissionTypeId = selectedSubmissionType;
      const currentMandateName = currentMandateId ? (mandates.find(m => m.id === currentMandateId)?.name || 'UNKNOWN') : null;
      const currentSubmissionTypeName = currentSubmissionTypeId ? (submissionTypes.find(st => st.id === currentSubmissionTypeId)?.name || 'UNKNOWN') : null;
      
      
      // Upload PDF to backend (send mandate_id instead of mandate name)
      console.log('[UploadDisclosure.handleRunValidationWithData] ===== STARTING UPLOAD PROCESS =====');
      console.log('[UploadDisclosure.handleRunValidationWithData] About to upload file:', {
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        announcementTitle: finalTitle,
        dateOfEvent: finalDate,
        mandateId: currentMandateId,
        submissionTypeId: currentSubmissionTypeId
      });
      console.log('[UploadDisclosure.handleRunValidationWithData] WHY WE NEED DOCUMENT ID:');
      console.log('  1. Backend creates a NEW PDFDocument record in database');
      console.log('  2. Backend returns the document_id (primary key) of this new record');
      console.log('  3. We need this ID to:');
      console.log('     - Save mandate/submission type selections (saveDocumentSelection)');
      console.log('     - Check processing status (getProcessingStatus)');
      console.log('     - Get validation results (getProcessingResult)');
      console.log('     - Create chat sessions linked to this document');
      console.log('     - Track which file is being processed');
      console.log('  4. Without document ID, we cannot link any operations to the uploaded file!');
      
      const uploadResponse = await apiService.uploadPDF(selectedFile, finalTitle, finalDate, currentMandateId);
      const docId = uploadResponse.document_id;
      const reqId = uploadResponse.request_id;
      
      console.log('[UploadDisclosure.handleRunValidationWithData] ===== UPLOAD RESPONSE RECEIVED =====');
      console.log('[UploadDisclosure.handleRunValidationWithData] Document ID extracted from response:', docId);
      console.log('[UploadDisclosure.handleRunValidationWithData] Request ID:', reqId);
      console.log('[UploadDisclosure.handleRunValidationWithData] Full upload response:', uploadResponse);
      
      // CRITICAL FIX: Store fileName -> documentId mapping IMMEDIATELY after upload
      // This ensures we can find the correct documentId even before progress messages are created
      if (docId && selectedFile?.name) {
        console.log('[UploadDisclosure.handleRunValidationWithData] Storing fileName -> documentId mapping:', {
          fileName: selectedFile.name,
          documentId: docId
        });
        if (!window.fileNameToDocumentIdMap) {
          window.fileNameToDocumentIdMap = new Map();
        }
        window.fileNameToDocumentIdMap.set(selectedFile.name, docId);
        console.log('[UploadDisclosure.handleRunValidationWithData] Mapping stored. Current map size:', window.fileNameToDocumentIdMap.size);
        
        // ALSO store in ref for immediate access (before mapping might be lost or not yet accessible)
        recentUploadsRef.current.set(selectedFile.name, {
          documentId: docId,
          timestamp: Date.now(),
          requestId: reqId
        });
        console.log('[UploadDisclosure.handleRunValidationWithData] Stored in recentUploadsRef. Recent uploads count:', recentUploadsRef.current.size);
        
        // REMOVED: The "uploaded successfully" message was confusing because:
        // 1. It appears while processing is still happening
        // 2. It asks "What would you like to do?" when the answer is already "processing"
        // 3. The progress message already shows the file is being processed
        // The file selection message is already filtered out when the progress message is shown
        
        // CRITICAL: Also update the progress message we just created with the documentId
        // This ensures getDocumentIdForCurrentFile() can find it
        setChatMessages((prev) => prev.map(msg => {
          if (msg.id === newProgressMessageId) {
            return {
              ...msg,
              metadata: {
                ...(msg.metadata || {}),
                documentId: docId.toString(),
              },
              documentId: docId,
              _uploadingFile: {
                ...(msg._uploadingFile || {}),
                documentId: docId,
              },
            };
          }
          return msg;
        }));
      }
      
      // Save mandate and submission type selection AFTER document is uploaded (now we have docId)
      // CRITICAL: Use CAPTURED values to prevent race conditions with multiple file uploads
      // Save if we have either mandate OR submission type to ensure both are saved
      console.log('[UploadDisclosure.handleRunValidationWithData] Checking if we need to save document selection...');
      console.log('[UploadDisclosure.handleRunValidationWithData] Conditions:', {
        hasDocId: !!docId,
        hasMandateId: !!currentMandateId,
        hasSubmissionTypeId: !!currentSubmissionTypeId,
        willSave: !!(docId && (currentMandateId || currentSubmissionTypeId))
      });
      
      if (docId && (currentMandateId || currentSubmissionTypeId)) {
        console.log('[UploadDisclosure.handleRunValidationWithData] ===== SAVING DOCUMENT SELECTION =====');
        console.log('[UploadDisclosure.handleRunValidationWithData] WHY WE NEED DOCUMENT ID HERE:');
        console.log('  - We need to tell the backend: "For document ID X, save mandate Y and submission type Z"');
        console.log('  - Without document ID, backend cannot know which document to update');
        console.log('[UploadDisclosure.handleRunValidationWithData] About to save selection with:', {
          documentId: docId,
          mandateId: currentMandateId,
          submissionTypeId: currentSubmissionTypeId
        });
        
        try {
          
          // Validate mandate exists before sending (if provided)
          if (currentMandateId) {
            const mandateObj = mandates.find(m => m.id === currentMandateId);
            if (!mandateObj) {
              console.error('[handleRunValidationWithData] ERROR: Captured mandate ID not found in mandates list:', currentMandateId);
              throw new Error(`Invalid mandate ID: ${currentMandateId}`);
            }
            console.log('[UploadDisclosure.handleRunValidationWithData] Mandate validated:', mandateObj.name);
          }
          
          // Validate submission type exists before sending (if provided)
          if (currentSubmissionTypeId) {
            const submissionTypeObj = submissionTypes.find(st => st.id === currentSubmissionTypeId);
            if (!submissionTypeObj) {
              console.error('[handleRunValidationWithData] ERROR: Captured submission type ID not found in submission types list:', currentSubmissionTypeId);
              throw new Error(`Invalid submission type ID: ${currentSubmissionTypeId}`);
            }
            console.log('[UploadDisclosure.handleRunValidationWithData] Submission type validated:', submissionTypeObj.name);
          }
          
          // Use CAPTURED values, not current state (which might have changed)
          await apiService.saveDocumentSelection(docId, currentMandateId || null, currentSubmissionTypeId || null);
          console.log('[UploadDisclosure.handleRunValidationWithData] Document selection saved successfully!');
        } catch (error) {
          console.error('[handleRunValidationWithData] Failed to save selection after upload:', error);
          // Don't throw - mandate is already saved during upload, this is just a backup
        }
      } else if (docId && !currentMandateId && !currentSubmissionTypeId) {
        console.log('[UploadDisclosure.handleRunValidationWithData] No mandate or submission type to save (user will select later)');
      } else if (!docId) {
        console.error('[UploadDisclosure.handleRunValidationWithData] ERROR: No document ID received from upload! Cannot save selection.');
      }

      // Update documentId for this PDF (but keep session)
      // Note: Each PDF gets its own documentId, but they share the same chat session
      console.log('[UploadDisclosure.handleRunValidationWithData] Setting document ID in component state:', docId);
      console.log('[UploadDisclosure.handleRunValidationWithData] This document ID will be used throughout the component for:');
      console.log('  - Polling processing status');
      console.log('  - Fetching validation results');
      console.log('  - Creating/updating chat sessions');
      console.log('  - Displaying document-specific information');
      setDocumentId(docId);
      setRequestId(reqId);
      console.log('[UploadDisclosure.handleRunValidationWithData] ===== UPLOAD PROCESS COMPLETE =====');
      
      // CRITICAL FIX: Store the documentId for THIS specific file upload in the progress message metadata
      // This ensures we can retrieve it later when the user selects mandate/submission type
      // Update the progress message we just created with the documentId
      setChatMessages((prev) => prev.map(msg => {
        if (msg.id === newProgressMessageId) {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              documentId: docId ? docId.toString() : null,
            },
            documentId: docId, // Also store directly on message for easier access
          };
        }
        return msg;
      }));
      
      // Note: fileName -> documentId mapping was already set immediately after upload (above)

      // Create chat session only if no session exists (first PDF)
      let sessionCreated = false;
      let newSessionId = null;
      if (docId && !currentChatSessionId) {
        try {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          // Use first PDF filename for chat title (tracked in firstPdfNameRef)
          // If not set yet, use current PDF filename
          const pdfFileName = firstPdfNameRef.current || 
            (selectedFile?.name ? selectedFile.name.replace(/\.pdf$/i, '') : null) ||
            finalTitle || 
            'New Chat';
          const sessionTitle = pdfFileName;
          
          // Set first PDF name if not already set
          if (!firstPdfNameRef.current && selectedFile?.name) {
            firstPdfNameRef.current = selectedFile.name.replace(/\.pdf$/i, '');
          }
          
          const session = await apiService.createChatSession(docId, sessionId, sessionTitle);
          newSessionId = session.session_id;
          
          setCurrentChatSessionId(newSessionId);
          localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
          sessionCreated = true;
          
          // Reload sessions list
          setTimeout(() => {
            if (chatHistorySidebarRef.current?.reload) {
              chatHistorySidebarRef.current.reload();
            } else if (window.chatHistoryReload) {
              window.chatHistoryReload();
            }
          }, 300);
          
          // Now that session is created, save all pending messages immediately
          
          // Save all messages that were added before session was created
          for (const msg of chatMessages) {
            try {
              if (msg.type === 'user') {
                await saveMessageToBackend('user', msg.content, {}, newSessionId);
              } else if (msg.type === 'system' && !msg.isProgress) {
                await saveMessageToBackend('assistant', msg.content, {}, newSessionId);
              }
            } catch (error) {
              console.error('[handleRunValidationWithData] Failed to save pending message:', error);
            }
          }
        } catch (error) {
          console.error('[handleRunValidationWithData] Failed to create chat session on upload:', error);
        }
      }

      // Use the existing session ID (don't create new session for subsequent PDFs)
      const sessionIdToUse = currentChatSessionId || newSessionId;
      
      // Note: If session was just created above, messages were already saved there
      // Only save pending messages if session already existed (not just created)
      if (sessionIdToUse && !sessionCreated && chatMessages.length > 0) {
        
        // Save all messages that haven't been saved yet
        for (const msg of chatMessages) {
          try {
            if (msg.type === 'user') {
              await saveMessageToBackend('user', msg.content, {}, sessionIdToUse);
            } else if (msg.type === 'system' && !msg.isProgress) {
              // Save system messages that aren't progress messages (they'll be saved separately)
              await saveMessageToBackend('assistant', msg.content, {}, sessionIdToUse);
            }
          } catch (error) {
            console.error('[handleRunValidationWithData] Failed to save pending message:', error);
          }
        }
      }

      // Check if this is a duplicate upload (after session is created so we can save it)
      if (uploadResponse.is_duplicate) {
        const duplicateMsg = {
          type: 'system',
          content: `This file was recently uploaded. Using existing processing (Document ID: ${docId}).`,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, duplicateMsg]);
        
        // Save duplicate message to backend if session exists
        if (sessionIdToUse) {
          await saveMessageToBackend('assistant', duplicateMsg.content, {}, sessionIdToUse);
        }
      }

      // Save initial progress message to backend
      if (sessionIdToUse) {
        await saveMessageToBackend('assistant', initialContent, {
          isProgress: true,
          progressSteps: progressSteps.map((step) => ({ ...step, status: 'pending' })),
          lastRevealedStepIndex: -1,
          fileInfo: {
            fileName: selectedFile.name,
            title: finalTitle,
            eventDate: finalDate,
          },
          progressPercentage: 0,
          documentId: docId ? docId.toString() : null, // Store documentId for easier retrieval
        }, sessionIdToUse);
        
        // CRITICAL FIX: Also update the local chat message with documentId after saving to backend
        // This ensures the message has the documentId when getDocumentIdForCurrentFile() is called
        setChatMessages((prev) => prev.map(msg => {
          if (msg.id === newProgressMessageId) {
            return {
              ...msg,
              metadata: {
                ...msg.metadata,
                documentId: docId ? docId.toString() : null,
              },
              documentId: docId,
            };
          }
          return msg;
        }));
      }

      // Start global polling service (continues even when user navigates away or component unmounts)
      if (docId) {
        
        // Create callback for polling updates
        const pollingCallback = (statusResponse) => {
          const { overall_status, progress, steps } = statusResponse;
          
          // Use startTransition to prevent blocking updates and reduce flicker
          startTransition(() => {
            setProgressPercentage(progress);
            updateProgressMessage(newProgressMessageId, progress, steps || [], overall_status);
          });
          
          // Handle completion
          if (overall_status === 'SUCCESS') {
            // Stop this specific callback (polling service will continue for other callbacks if any)
            pollingService.stopPolling(docId, pollingCallback);
            
            // Process completion in a transition to prevent flicker
            startTransition(() => {
              setTimeout(() => {
                setIsValidating(false);
                setValidationComplete(true);
              }, 200);
            });
            
            // Fetch and process result
            handlePollingSuccess(docId, newProgressMessageId, statusResponse);
          }
        };
        
        // Start global polling (continues even when component unmounts)
        pollingService.startPolling(docId, pollingCallback, 5000);
        
        // Also start local polling for immediate UI updates (will be cleaned up on unmount)
        if (reqId || uploadResponse.status === 'processing' || uploadResponse.status === 'completed') {
          pollingIntervalRef.current = setInterval(() => {
            pollProcessingStatus(docId, newProgressMessageId);
          }, 5000);
          
          // Poll immediately
          pollProcessingStatus(docId, newProgressMessageId);
        } else {
          // If no request_id yet, wait a bit and try again
          setTimeout(() => {
            pollProcessingStatus(docId, newProgressMessageId);
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Failed to upload PDF:', error);
      setIsValidating(false);
      
      // Extract error message from response if available
      let errorMessage = error.message || 'Unknown error occurred';
      let documentId = null;
      
      // Check if error has response details from backend
      if (error.response) {
        if (error.response.document_id) {
          documentId = error.response.document_id;
          setDocumentId(documentId);
        }
        if (error.response.error) {
          errorMessage = error.response.error;
        } else if (error.response.message) {
          errorMessage = error.response.message;
        }
      }
      
      // Check if it's a timeout or connection error
      if (error.message && (error.message.includes('timeout') || error.message.includes('Connection') || error.message.includes('timed out') || error.message.includes('Max retries exceeded'))) {
        errorMessage = 'Connection to processing service timed out. The PDF has been saved. Please try again in a moment or check if the processing service is available.';
      } else if (error.message && error.message.includes('Failed to process PDF')) {
        // Extract the actual error from the backend response
        errorMessage = error.message.replace('Failed to process PDF: ', '');
      }
      
      const errorMsg = {
        type: 'system',
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
      
      // Save error message to backend
      if (currentChatSessionId) {
        await saveMessageToBackend('assistant', errorMsg.content);
      }
      
      if (documentId) {
        const docIdMsg = {
                type: 'system',
          content: `Document ID: ${documentId}. You can try uploading the file again or contact support if the issue persists.`,
                timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, docIdMsg]);
        
        // Save message to backend
        if (currentChatSessionId) {
          await saveMessageToBackend('assistant', docIdMsg.content);
        }
      } else {
        const retryMsg = {
          type: 'system',
          content: 'You can try uploading the file again or contact support if the issue persists.',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, retryMsg]);
        
        // Save message to backend
        if (currentChatSessionId) {
          await saveMessageToBackend('assistant', retryMsg.content);
        }
      }
    }
>>>>>>> dev
  };

  // Wrapper function for form submission
  const handleRunValidation = () => {
    handleRunValidationWithData();
  };

  // Helper function to render a single chat message
  const renderMessage = (msg, idx) => {
    const trimmedLine = (line) => line.trim();
    const isFileDetail = (line) => line.startsWith('File:') || line.startsWith('Title:') || line.startsWith('Event Date:');
    const isProgress = (line) => line.startsWith('Progress:');
    const hasDone = (line) => line.includes('DONE');
    const isEmpty = (line) => line.trim() === '';
    const isComplianceScore = (line) => line.startsWith('Compliance Score:');
    const isViewReport = (line) => line.startsWith('View Report');
<<<<<<< HEAD
=======
    const isProcessing = (line) => line.includes('...') && !line.includes('DONE');
>>>>>>> dev

    return (
      <div key={idx} className={`chat-message ${msg.type === 'user' ? 'user-message' : 'system-message'}`}>
        {msg.type === 'system' && <div className="message-avatar">AI</div>}
        <div className="message-content">
          {msg.isLink ? (
            <button
              className="view-report-link"
              onClick={() => navigate(msg.linkPath)}
            >
              {msg.content}
            </button>
          ) : msg.isProgress ? (
            <div className="progress-steps-container">
<<<<<<< HEAD
              {msg.content.split('\n').map((line, lineIdx) => {
                const trimmed = trimmedLine(line);
                return (
                  <div key={lineIdx} className={`progress-step-line ${isFileDetail(trimmed) ? 'file-detail' : ''} ${isProgress(trimmed) ? 'progress-line' : ''} ${hasDone(line) ? 'step-done' : ''} ${isEmpty(trimmed) ? 'empty-line' : ''} ${isComplianceScore(trimmed) ? 'compliance-score-line' : ''} ${isViewReport(trimmed) ? 'view-report-line' : ''}`}>
=======
              {(() => {
                // Track which steps we've already rendered to avoid duplicates
                const renderedSteps = new Set();
                
                return msg.content.split('\n').map((line, lineIdx) => {
                const trimmed = trimmedLine(line);
                  
                  // Check if this line matches a progress step name
                  let matchingStep = null;
                  let isStepLine = false;
                  if (msg.progressSteps && msg.progressSteps.length > 0) {
                    // Check if trimmed line matches any step name (remove leading spaces/tabs for comparison)
                    const normalizedLine = trimmed.trim();
                    matchingStep = msg.progressSteps.find(step => {
                      // Check if line contains step name (with or without DONE/...)
                      const stepNameMatch = normalizedLine.includes(step.name) || step.name.includes(normalizedLine);
                      if (stepNameMatch) {
                        isStepLine = true;
                      }
                      return stepNameMatch;
                    });
                  }
                  
                  // Skip rendering if this is a step line - we'll render steps separately based on progressSteps
                  // But only render each step once, even if it appears multiple times in content
                  if (isStepLine && matchingStep) {
                    // Check if we've already rendered this step
                    if (renderedSteps.has(matchingStep.name)) {
                      // Skip duplicate - return null to render nothing
                      return null;
                    }
                    
                    // Mark this step as rendered
                    renderedSteps.add(matchingStep.name);
                    
                    // Determine step status from progressSteps array (source of truth)
                    const stepStatus = matchingStep.status;
                    const isStepDone = stepStatus === 'done';
                    const isStepProcessing = stepStatus === 'processing';
                    
                return (
                      <div key={lineIdx} className={`progress-step-line step-done`}>
                        <span>
                          {matchingStep.name}
                          {isStepDone && <span className="done-text"> DONE</span>}
                          {isStepProcessing && <span>...</span>}
                        </span>
                      </div>
                    );
                  }
                
                // Determine step status from progressSteps array (source of truth) for non-step lines
                const stepStatus = matchingStep ? matchingStep.status : null;
                const isStepDone = stepStatus === 'done';
                const isStepProcessing = stepStatus === 'processing';
                
                return (
                  <div key={lineIdx} className={`progress-step-line ${isFileDetail(trimmed) ? 'file-detail' : ''} ${isProgress(trimmed) ? 'progress-line' : ''} ${(hasDone(line) || isStepDone) ? 'step-done' : ''} ${isEmpty(trimmed) ? 'empty-line' : ''} ${isComplianceScore(trimmed) ? 'compliance-score-line' : ''} ${isViewReport(trimmed) ? 'view-report-line' : ''} ${(isProcessing(line) || isStepProcessing) ? 'processing-step' : ''}`}>
>>>>>>> dev
                    {isFileDetail(trimmed) ? (
                      <span>{line}</span>
                    ) : isProgress(trimmed) ? (
                      <div className="progress-line-container">
<<<<<<< HEAD
                        <span className="progress-text">{line}</span>
=======
                        <span className="progress-text">Progress: {msg.progressPercentage || 0}%</span>
>>>>>>> dev
                        <div className="progress-bar-wrapper">
                          <div className="progress-bar" style={{ width: `${msg.progressPercentage || 0}%` }}></div>
                        </div>
                      </div>
                    ) : isComplianceScore(trimmed) ? (() => {
                      const scoreText = trimmed.replace('Compliance Score: ', '').replace('%', '').trim();
                      const score = msg.complianceScore != null ? msg.complianceScore : (scoreText ? parseInt(scoreText, 10) : null);
                      const scoreClass = score != null && !isNaN(score) ? getScoreIndicatorClass(score) : '';
                      return (
                        <span className={`compliance-score-display ${scoreClass}`}>
                          {scoreClass && <span className={`score-indicator ${scoreClass}`} />}
                          <span className="compliance-score-text">{trimmed}</span>
                        </span>
                      );
                    })() : isViewReport(trimmed) ? (
                      <button
                        className="view-report-link-inline"
                        onClick={() => {
<<<<<<< HEAD
                          const path = msg.viewReportPath || (disclosureId ? `/validation/${disclosureId}` : '/validation');
=======
                          // CRITICAL FIX: Ensure we always have a valid path with result_index if available
                          // Try multiple sources: msg.viewReportPath, msg.metadata.viewReportPath, disclosureId, msg.metadata.documentId
                          let path = msg.viewReportPath;
                          if (!path && msg.metadata?.viewReportPath) {
                            path = msg.metadata.viewReportPath;
                          }
                          if (!path && disclosureId) {
                            // Check if result_index is available in metadata
                            const resultIndex = msg.metadata?.resultIndex ?? msg.resultIndex;
                            path = resultIndex !== null && resultIndex !== undefined
                              ? `/validation/${disclosureId}?result_index=${resultIndex}`
                              : `/validation/${disclosureId}`;
                          }
                          if (!path && msg.metadata?.documentId) {
                            const resultIndex = msg.metadata?.resultIndex ?? msg.resultIndex;
                            path = resultIndex !== null && resultIndex !== undefined
                              ? `/validation/${msg.metadata.documentId}?result_index=${resultIndex}`
                              : `/validation/${msg.metadata.documentId}`;
                          }
                          if (!path) {
                            console.error('[View Report] No valid path found for View Report link');
                            return;
                          }
>>>>>>> dev
                          navigate(path);
                        }}
                      >
                        {trimmed}
                      </button>
                    ) : hasDone(line) ? (
                      <span>
                        {line.split('DONE').map((part, partIdx, arr) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < arr.length - 1 && <span className="done-text">DONE</span>}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span>{line}</span>
                    )}
                  </div>
                );
<<<<<<< HEAD
              })}
=======
                }).filter(Boolean); // Remove null entries (duplicate steps)
              })()}
>>>>>>> dev
            </div>
          ) : (
            <p>{msg.content}</p>
          )}
        </div>
        {msg.type === 'user' && <div className="message-avatar user-avatar">You</div>}
      </div>
    );
  };

  return (
<<<<<<< HEAD
    <div className="chat-upload-container">
      <h1 className="chat-page-title">Upload Disclosure</h1>
      
      <div className="chat-container" ref={chatContainerRef}>
=======
    <div className="chat-upload-container-with-sidebar">
      <ChatHistorySidebar
        ref={chatHistorySidebarRef}
        currentSessionId={currentChatSessionId}
        onSelectSession={handleSelectChatSession}
        onCreateNewChat={handleCreateNewChat}
        pdfDocumentId={documentId}
      />
      <div className="chat-upload-main-content">
      <h1 className="chat-page-title">Upload Disclosure</h1>
      
        {isLoadingSession && (
          <div className="chat-loading-overlay">
            <div className="chat-loading-spinner"></div>
            <p>Loading chat history...</p>
          </div>
        )}
        
        <div className={`chat-container ${isLoadingSession ? 'loading' : ''}`} ref={chatContainerRef}>
>>>>>>> dev
        {/* Show upload area only if no chat history */}
        {!selectedFile && chatMessages.length === 0 && (
          <div className="chat-message system-message">
            <div className="message-avatar">AI</div>
            <div className="message-content">
              <p>Welcome! Please upload a PDF document to get started.</p>
              <div
                className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf"
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <p className="upload-instruction">
                  Drag and drop a file here or click to upload
                </p>
                <p className="upload-formats">(.PDF files only)</p>
              </div>
            </div>
          </div>
        )}

        {/* Render all chat messages once */}
        {chatMessages.length > 0 && (
          <>
            {chatMessages.map((msg, idx) => renderMessage(msg, idx))}
            
            {/* Show upload area only if the last message is the upload prompt */}
            {chatMessages[chatMessages.length - 1]?.content === 'Please upload a new PDF document to continue.' && (
              <div className="chat-message system-message">
                <div className="message-avatar">AI</div>
                <div className="message-content">
                  <div
                    className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadClick}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".pdf"
                      style={{ display: 'none' }}
                    />
                    <div className="upload-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <p className="upload-instruction">
                      Drag and drop a file here or click to upload
                    </p>
                    <p className="upload-formats">(.PDF files only)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action areas based on state */}
            {showFormFields && !isValidating && (
              <>
                <div className="chat-message system-message">
                  <div className="message-avatar">AI</div>
                  <div className="message-content form-content">
                    <div className="form-fields">
                      <div className="form-field">
                        <label htmlFor="announcement-title" className="field-label">
<<<<<<< HEAD
                          Announcement Title <span className="required">*</span>
=======
                          File Name <span className="required">*</span>
>>>>>>> dev
                        </label>
                        <input
                          type="text"
                          id="announcement-title"
                          className="form-input"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          placeholder="Enter announcement title"
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="date-of-event" className="field-label">
<<<<<<< HEAD
                          Date of Event <span className="required">*</span>
=======
                          Date of Upload <span className="required">*</span>
>>>>>>> dev
                        </label>
                        <input
                          type="date"
                          id="date-of-event"
                          className="form-input"
                          value={dateOfEvent}
                          onChange={(e) => setDateOfEvent(e.target.value)}
                          required
                        />
                      </div>
                    </div>
<<<<<<< HEAD
=======
                    
                    {/* Show mandate and submission type dropdowns BEFORE upload */}
                    {selectedFile && (
                      <>
                        {/* Step 1: Select Mandate - Only show if not selected */}
                        {!selectedMandate && (
                          <div className="selection-container" style={{ marginTop: '20px' }}>
                            <div className="selection-title">Select Mandate:</div>
                            <select
                              className="selection-dropdown"
                              value={selectedMandate || ''}
                              onChange={(e) => {
                                const mandateId = e.target.value ? parseInt(e.target.value, 10) : null;
                                if (!mandateId) return;
                                
                                const selectedMandateObj = mandates.find(m => m.id === mandateId);
                                if (!selectedMandateObj) return;
                                
                                setSelectedMandate(mandateId);
                                setSelectedSubmissionType(null); // Reset submission type when mandate changes
                                
                                // Add user message to chat (with duplicate check)
                                const userMessage = {
                                  type: 'user',
                                  content: `Selected Mandate: ${selectedMandateObj.name}`,
                                  timestamp: new Date(),
                                };
                                setChatMessages((prev) => addMessageWithoutDuplicate(userMessage, prev));
                                
                                // Add assistant confirmation message (with duplicate check)
                                const assistantMessage = {
                                  type: 'system',
                                  content: selectedMandateObj.name === 'JSE' 
                                    ? `Mandate "${selectedMandateObj.name}" selected. You can now get the compliance score.`
                                    : `Mandate "${selectedMandateObj.name}" selected. Please select the type of submission.`,
                                  timestamp: new Date(),
                                };
                                setChatMessages((prev) => addMessageWithoutDuplicate(assistantMessage, prev));
                                
                                // Note: Selections will be saved to backend AFTER upload completes in handleRunValidationWithData
                                // when documentId is available
                              }}
                            >
                              <option value="">-- Select Mandate --</option>
                              {mandates.map(mandate => (
                                <option key={mandate.id} value={mandate.id}>
                                  {mandate.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Step 2: Select Type of Submission (only if mandate with submission types is selected - JSE doesn't require it) */}
                        {selectedMandate && submissionTypes.length > 0 && (
                          <div className="selection-container" style={{ marginTop: '20px' }}>
                            <div className="selection-title">Select Type of Submission:</div>
                            <select
                              className="selection-dropdown"
                              value={selectedSubmissionType || ''}
                              onChange={(e) => {
                                const submissionTypeId = e.target.value ? parseInt(e.target.value, 10) : null;
                                if (!submissionTypeId) return;
                                
                                const selectedSubmissionTypeObj = submissionTypes.find(st => st.id === submissionTypeId);
                                if (!selectedSubmissionTypeObj) return;
                                
                                setSelectedSubmissionType(submissionTypeId);
                                
                                // Add user message to chat (with duplicate check)
                                const userMessage = {
                                  type: 'user',
                                  content: `Selected Type of Submission: ${selectedSubmissionTypeObj.name}`,
                                  timestamp: new Date(),
                                };
                                setChatMessages((prev) => addMessageWithoutDuplicate(userMessage, prev));
                                
                                // Add assistant confirmation message (with duplicate check)
                                const assistantMessage = {
                                  type: 'system',
                                  content: `Type of Submission "${selectedSubmissionTypeObj.name}" selected. You can now get the compliance score.`,
                                  timestamp: new Date(),
                                };
                                setChatMessages((prev) => addMessageWithoutDuplicate(assistantMessage, prev));
                                
                                // Note: Selections will be saved to backend AFTER upload completes in handleRunValidationWithData
                                // when documentId is available
                              }}
                            >
                              <option value="">-- Select Type of Submission --</option>
                              {submissionTypes.map(submissionType => (
                                <option key={submissionType.id} value={submissionType.id}>
                                  {submissionType.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    
>>>>>>> dev
                    <button
                      className="run-validation-button"
                      onClick={handleRunValidation}
                      disabled={isValidating}
<<<<<<< HEAD
                    >
                      {isValidating ? 'Processing...' : 'Submit for Validation'}
=======
                      style={{ marginTop: '20px' }}
                    >
                      {isValidating ? 'Processing...' : 'Get Compliance Score'}
>>>>>>> dev
                    </button>
                  </div>
                </div>
                <div className="action-buttons-container">
<<<<<<< HEAD
                  <button className="action-button upload-another-button" onClick={handleUploadAnotherPDF}>
=======
                  <button 
                    className="action-button upload-another-button"
                    onClick={handleUploadAnotherPDF}
                    disabled={!validationComplete}
                    title={!validationComplete ? "Please wait for compliance score to be generated" : ""}
                  >
>>>>>>> dev
                    Upload Another PDF
                  </button>
                </div>
              </>
            )}

            {validationComplete && (
              <div className="action-buttons-container">
<<<<<<< HEAD
=======
                {/* <button className="action-button interact-button" onClick={handleInteractWithPDF}>
                  Interact with PDF
                </button> */}
>>>>>>> dev
                <button className="action-button upload-another-button" onClick={handleUploadAnotherPDF}>
                  Upload Another PDF
                </button>
              </div>
            )}

            {isInteractMode && !validationComplete && !showFormFields && (
              <>
                <div className="chat-input-container">
                  <form onSubmit={handleQuestionSubmit} className="question-form">
                    <input
                      ref={questionInputRef}
                      type="text"
                      className="question-input"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="Ask a question about your PDF..."
                    />
                    <button type="submit" className="question-submit-button" disabled={!questionInput.trim()}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polyline points="22 2 15 22 11 13 2 9 22 2"></polyline>
                      </svg>
                    </button>
                  </form>
                </div>
                <div className="compliance-button-sticky">
<<<<<<< HEAD
                  <button className="action-button compliance-button" onClick={handleGetComplianceScore}>
                    Get Compliance Score
                  </button>
                  <button className="action-button upload-another-button" onClick={handleUploadAnotherPDF}>
=======
                  {/* <button className="action-button interact-button" onClick={handleInteractWithPDF}>
                    Interact with PDF
                  </button> */}
                  <button 
                    className="action-button upload-another-button" 
                    onClick={handleUploadAnotherPDF}
                    disabled={!validationComplete}
                    title={!validationComplete ? "Please wait for compliance score to be generated" : ""}
                  >
>>>>>>> dev
                    Upload Another PDF
                  </button>
                </div>
              </>
            )}

<<<<<<< HEAD
            {selectedFile && !showFormFields && !isInteractMode && !validationComplete && !isValidating && (
              <div className="action-buttons-container">
                <button className="action-button interact-button" onClick={handleInteractWithPDF}>
                  Interact with PDF
                </button>
                <button className="action-button compliance-button" onClick={handleGetComplianceScore}>
                  Get Compliance Score
                </button>
              </div>
            )}
          </>
        )}
=======
            {/* REMOVED: This entire section was showing duplicate dropdowns after upload starts.
                Dropdowns should ONLY appear in the form section before upload (when showFormFields is true).
                After upload starts and processing begins, users should NOT see duplicate dropdowns.
                The selections are already made and saved before upload, so no need to show them again. */}
          </>
        )}
        </div>
>>>>>>> dev
      </div>
    </div>
  );
}

const getScoreIndicatorClass = (score) => {
  if (score >= 80) return 'score-good';
  if (score >= 50) return 'score-warning';
  return 'score-poor';
};

export default UploadDisclosure;
