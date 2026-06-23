import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisclosures } from '../context/DisclosuresContext';
import './QuickUploadModal.css';

function QuickUploadModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { addDisclosure, getLastUploadData } = useDisclosures();
  const [selectedFile, setSelectedFile] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [dateOfEvent, setDateOfEvent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-fill fields with last upload data when modal opens
  useEffect(() => {
    if (isOpen) {
      const lastData = getLastUploadData();
      setAnnouncementTitle(lastData.announcementTitle || '');
      setDateOfEvent(lastData.dateOfEvent || '');
    }
  }, [isOpen, getLastUploadData]);

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

  const handleFileSelect = (file) => {
    const isPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setSelectedFile(file);
    } else {
      alert('Please upload a PDF file.');
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

  const handleRunValidation = () => {
    if (!announcementTitle.trim()) {
      alert('Please enter an Announcement Title');
      return;
    }
    if (!dateOfEvent.trim()) {
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

    addDisclosure({
      announcementTitle: announcementTitle.trim(),
      dateOfEvent,
      fileName: selectedFile.name,
    });

    setShowNotification(true);
    setSelectedFile(null);
    setAnnouncementTitle('');
    setDateOfEvent('');
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
    // Modal stays open, form is already cleared
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="quick-upload-modal-overlay" onClick={onClose}>
        <div className="quick-upload-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="quick-upload-modal-header">
            <h2>Quick Upload</h2>
            <button className="quick-upload-modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="quick-upload-modal-body">
            <div
              className={`file-upload-area ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
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
              {selectedFile && (
                <p className="selected-file-name">{selectedFile.name}</p>
              )}
            </div>

            <div className="form-fields">
              <div className="form-field">
                <label htmlFor="quick-announcement-title" className="field-label">
                  Announcement Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="quick-announcement-title"
                  className="form-input"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="quick-date-of-event" className="field-label">
                  Date of Event <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="quick-date-of-event"
                  className="form-input"
                  value={dateOfEvent}
                  onChange={(e) => setDateOfEvent(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="action-section">
              <button
                className="run-validation-button"
                onClick={handleRunValidation}
              >
                Run AI Validation
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNotification && (
        <div className="notification-overlay" onClick={handleCloseNotification}>
          <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
            <div className="notification-header">
              <div className="notification-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <button className="notification-close" onClick={handleCloseNotification}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="notification-body">
              <h3 className="notification-title">Validation in Progress</h3>
              <p className="notification-message">
                Your file is being validated. Please check the status in{' '}
                <button 
                  className="notification-link" 
                  onClick={() => {
                    handleCloseNotification();
                    navigate('/validation');
                  }}
                >
                  Validation History
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickUploadModal;

