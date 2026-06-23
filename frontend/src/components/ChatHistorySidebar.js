import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import './ChatHistorySidebar.css';
import apiService from '../services/api';

const ChatHistorySidebar = forwardRef(function ChatHistorySidebar({
  currentSessionId, 
  onSelectSession, 
  onCreateNewChat,
  pdfDocumentId 
}, ref) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const lastLoadedDocumentIdRef = useRef(null);

  // Initial load - load ALL user sessions on mount (not filtered by document)
  // This ensures the sidebar always shows all chats, preventing it from disappearing
  useEffect(() => {
    // Load all sessions on initial mount
    if (sessions.length === 0) {
      loadChatSessions();
    }
  }, []); // Only run once on mount

  // Note: We don't reload when pdfDocumentId changes to prevent sidebar from disappearing
  // The sidebar shows all sessions, and filtering by document is handled client-side if needed

  // Reload when currentSessionId changes (new session created)
  // Use a ref to track previous session ID to detect new sessions
  const prevSessionIdRef = useRef(null);
  useEffect(() => {
    // If session ID changed and it's a new one (not just switching), reload
    if (currentSessionId && currentSessionId !== prevSessionIdRef.current) {
      // Check if this is a new session (not in current list)
      const isNewSession = !sessions.some(s => s.session_id === currentSessionId);
      if (isNewSession) {
        // New session created - reload after a delay to ensure backend has updated
        const timer = setTimeout(() => {
          loadChatSessions(true); // Force reload for new session
        }, 1000);
        prevSessionIdRef.current = currentSessionId;
        return () => clearTimeout(timer);
      } else {
        // Just switching sessions - update ref but don't reload
        // This prevents the sidebar from disappearing when switching
        prevSessionIdRef.current = currentSessionId;
      }
    } else if (!currentSessionId) {
      // Session cleared - reset ref
      prevSessionIdRef.current = null;
    }
  }, [currentSessionId]); // Removed 'sessions' from dependencies to avoid unnecessary reloads

  const loadChatSessions = async (forceReload = false) => {
    try {
      // Only show loading if we don't have sessions yet or force reload
      if (sessions.length === 0 || forceReload) {
        setLoading(true);
      }
      
      // Always load ALL user sessions (not filtered by document)
      // This prevents the sidebar from disappearing when switching between chats
      const data = await apiService.getUserChatSessions(null); // null = get all sessions
      
      // Only update if we got valid data (array)
      // Don't clear sessions if data is undefined or null - keep existing list
      if (Array.isArray(data)) {
        if (data.length > 0) {
          // We have new data - update the list
          setSessions(data);
        } else if (forceReload && sessions.length === 0) {
          // Only set empty array if we're forcing a reload AND had no sessions
          setSessions([]);
        }
        // If data is empty but we have existing sessions, keep existing sessions
      }
      // If data is undefined/null, keep existing sessions (don't clear)
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      // Don't clear sessions on error - keep existing list
      // This ensures sessions persist even if API call fails
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        setLoading(true);
        await apiService.deleteChatSession(sessionId);
        await loadChatSessions();
        if (currentSessionId === sessionId) {
          onCreateNewChat();
        }
      } catch (error) {
        console.error('Failed to delete chat session:', error);
        alert('Failed to delete chat session');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  };

  // Expose loadChatSessions to parent component via ref
  useImperativeHandle(ref, () => ({
    reload: () => loadChatSessions(true) // Force reload when called from parent
  }));

  // Also expose globally for backward compatibility
  useEffect(() => {
    window.chatHistoryReload = () => loadChatSessions(true);
  }, []);

  return (
    <div className={`chat-history-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-history-header">
        <button 
          className="new-chat-button"
          onClick={onCreateNewChat}
          title="New Chat"
        >
          <span className="new-chat-icon">+</span>
          <span className="new-chat-text">New Chat</span>
        </button>
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>

      {isOpen && (
        <div className="chat-history-list">
          {loading ? (
            <div className="chat-history-loading">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="chat-history-empty">
              <p>No chat history yet</p>
              <p className="empty-subtitle">Start a new conversation</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                className={`chat-history-item ${
                  currentSessionId === session.session_id ? 'active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectSession(session.session_id);
                }}
              >
                <div className="chat-history-item-content">
                  <div className="chat-history-item-title">
                    {session.title || session.pdf_file_name || 'New Chat'}
                  </div>
                  <div className="chat-history-item-date">
                    {formatDate(session.updated_at)}
                  </div>
                </div>
                <button
                  className="chat-history-item-delete"
                  onClick={(e) => handleDeleteSession(e, session.session_id)}
                  title="Delete chat"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

export default ChatHistorySidebar;

