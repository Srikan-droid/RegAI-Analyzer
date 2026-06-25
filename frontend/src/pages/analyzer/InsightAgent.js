import React, { useState } from 'react';
import '../../UploadDisclosure.css';

function InsightAgent() {
  const [questionInput, setQuestionInput] = useState('');
  const [messages] = useState([
    { role: 'assistant', text: 'Welcome to the Insight Agent. Upload a document or ask a question to begin. (Prototype — no backend connected.)' },
  ]);

  return (
    <div className="upload-disclosure-page">
      <div className="upload-header">
        <h1 className="upload-title">Insight Agent</h1>
        <p className="upload-subtitle">Upload filings and interact with the insight assistant</p>
      </div>

      <div className="upload-main-content" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div className="upload-section" style={{ flex: '1 1 320px' }}>
          <div
            className="drop-zone"
            style={{ cursor: 'default' }}
            onClick={() => window.alert('Prototype: file upload is not connected.')}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Drag & drop a document here, or click to browse</p>
            <span className="file-types">PDF, DOC, DOCX, XLS, XLSX</span>
          </div>
          <button
            type="button"
            className="validate-button"
            style={{ marginTop: '16px' }}
            onClick={() => window.alert('Prototype: insight run is not connected.')}
          >
            Run Insight
          </button>
        </div>

        <div className="chat-section" style={{ flex: '2 1 400px' }}>
          <div className="chat-messages" style={{ minHeight: '300px', maxHeight: '400px', overflowY: 'auto' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              window.alert('Prototype: chat is not connected.');
              setQuestionInput('');
            }}
          >
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Ask about your insights..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-button">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InsightAgent;
