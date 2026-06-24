import React, { useMemo, useState, useEffect, useCallback, startTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ValidationHistory.css';
import { formatDisplayDate, formatDisplayDateTime } from './data/disclosures';
import { useDisclosures } from './context/DisclosuresContext';
import apiService from './services/api';

function ValidationHistory() {
  const { disclosures } = useDisclosures();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [eventDateFrom, setEventDateFrom] = useState('');
  const [eventDateTo, setEventDateTo] = useState('');
  const [uploadedDateFrom, setUploadedDateFrom] = useState('');
  const [uploadedDateTo, setUploadedDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedDisclosures, setPaginatedDisclosures] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set()); // Track selected items by unique key
  const pageSize = 10;

  // Read scoreFilter from URL query params on mount and when URL changes
  useEffect(() => {
    const scoreFilterParam = searchParams.get('scoreFilter');
    if (scoreFilterParam && ['80-plus', '50-79', 'below-50', 'all'].includes(scoreFilterParam)) {
      setScoreFilter(scoreFilterParam);
      // Show filters when coming from dashboard tile click
      setFiltersVisible(true);
    }
  }, [searchParams]);

  // Load paginated documents from backend
  const loadDocuments = useCallback(async (isPolling = false) => {
    // CRITICAL FIX: Don't set loading state during polling to prevent blinking
    if (!isPolling) {
      setLoading(true);
    }
    try {
      const filters = {};
      
      // Map status filter
      if (statusFilter !== 'all') {
        // statusFilter is already uppercase from dropdown
        filters.status = statusFilter;
      }
      
      // Map score filter
      if (scoreFilter !== 'all' && scoreFilter !== 'no-score') {
        filters.scoreFilter = scoreFilter;
      }
      
      const response = await apiService.listPDFDocuments(currentPage, pageSize, filters);
      if (response.results) {
        // Map backend data to frontend format
        const mappedDisclosures = response.results.map(doc => {
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
          
          return {
            id: doc.id,
            documentId: doc.id,
            announcementTitle: regTitle || doc.file_name.replace('.pdf', ''),
            dateOfEvent: doc.date_of_event,
            uploadedDate: doc.uploaded_at,
            requestId: doc.request_id,
            fileStatus: doc.validation_status, // Already mapped by backend
            complianceScore: doc.compliance_score,
            fileName: doc.file_name,
            resultData: doc.result_data,
            mandate: doc.mandate,
            typeOfSubmission: doc.type_of_submission,
            resultIndex: doc.result_index, // Index for multiple validation results
          };
        });
        
        // CRITICAL FIX: Count how many results exist for each document ID
        // Only show result index if there are multiple results for the same document
        const documentResultCounts = {};
        mappedDisclosures.forEach(item => {
          const key = item.documentId || item.id;
          if (!documentResultCounts[key]) {
            documentResultCounts[key] = 0;
          }
          documentResultCounts[key]++;
        });
        
        // Update mappedDisclosures to include hasMultipleResults flag
        mappedDisclosures.forEach(item => {
          const key = item.documentId || item.id;
          item.hasMultipleResults = documentResultCounts[key] > 1;
        });
        
        // Apply client-side filters for date ranges and search (since backend doesn't support these yet)
        let filtered = mappedDisclosures;
          
          // Filter by score if no-score
          if (scoreFilter === 'no-score') {
            filtered = filtered.filter(item => item.complianceScore == null);
          }
          
          // Filter by date ranges
          if (eventDateFrom || eventDateTo) {
            filtered = filtered.filter(item => {
              if (!item.dateOfEvent) return false;
              const date = new Date(item.dateOfEvent);
              const fromDate = eventDateFrom ? new Date(eventDateFrom) : null;
              const toDate = eventDateTo ? new Date(eventDateTo) : null;
              if (fromDate && date < fromDate) return false;
              if (toDate && date > toDate) return false;
              return true;
            });
          }
          
          if (uploadedDateFrom || uploadedDateTo) {
            filtered = filtered.filter(item => {
              if (!item.uploadedDate) return false;
              const date = new Date(item.uploadedDate);
              const fromDate = uploadedDateFrom ? new Date(uploadedDateFrom) : null;
              const toDate = uploadedDateTo ? new Date(uploadedDateTo) : null;
              if (fromDate && date < fromDate) return false;
              if (toDate && date > toDate) return false;
              return true;
            });
          }
          
          // Filter by search term
          if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(item => {
              const haystack = [
                item.announcementTitle,
                item.fileName,
                item.requestId || ''
              ].join(' ').toLowerCase();
              return haystack.includes(term);
            });
          }
          
          // CRITICAL FIX: Use startTransition for state updates during polling to prevent blinking
          if (isPolling) {
            startTransition(() => {
              setPaginatedDisclosures(filtered);
              setTotalPages(response.total_pages || 1);
            });
          } else {
            setPaginatedDisclosures(filtered);
            setTotalPages(response.total_pages || 1);
          }
        }
        
        // Clear selections when data changes (but keep if items still exist)
        setSelectedItems(prev => {
          const newSet = new Set();
          const currentItems = response.results ? 
            response.results.map(doc => {
              const regTitle = doc.announcement_title || doc.file_name.replace('.pdf', '');
              return {
                id: doc.id,
                documentId: doc.id,
                announcementTitle: regTitle,
                dateOfEvent: doc.date_of_event,
                uploadedDate: doc.uploaded_at,
                requestId: doc.request_id,
                fileStatus: doc.validation_status,
                complianceScore: doc.compliance_score,
                fileName: doc.file_name,
                resultData: doc.result_data,
                mandate: doc.mandate,
                typeOfSubmission: doc.type_of_submission,
                resultIndex: doc.result_index,
              };
            }) : [];
          
          // Keep selections that still exist in current items
          prev.forEach(key => {
            const [id, resultIndex] = key.split('_');
            const exists = currentItems.some(item => 
              item.id.toString() === id && 
              (item.resultIndex || 'single') === (resultIndex || 'single')
            );
            if (exists) {
              newSet.add(key);
            }
          });
          return newSet;
        });
      } catch (error) {
        console.error('Failed to load documents:', error);
        if (!isPolling) {
          setPaginatedDisclosures([]);
          setTotalPages(1);
        }
      } finally {
        if (!isPolling) {
          setLoading(false);
        }
      }
    }, [currentPage, pageSize, statusFilter, scoreFilter, eventDateFrom, eventDateTo, uploadedDateFrom, uploadedDateTo, searchTerm]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Real-time polling for processing documents - refresh every 10 seconds
  useEffect(() => {
    // Check if there are any processing documents
    const hasProcessingDocs = paginatedDisclosures.some(
      doc => doc.fileStatus === 'PROCESSING' || doc.fileStatus === 'Processing' || doc.fileStatus === 'PENDING'
    );

    if (!hasProcessingDocs) {
      return; // No processing documents, no need to poll
    }

    //console.log('[ValidationHistory] Starting real-time polling for processing documents');
    const intervalId = setInterval(() => {
      // CRITICAL FIX: Pass isPolling=true to prevent loading state changes
      loadDocuments(true);
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [paginatedDisclosures, loadDocuments]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setScoreFilter('all');
    setEventDateFrom('');
    setEventDateTo('');
    setUploadedDateFrom('');
    setUploadedDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
    // Clear URL parameters
    setSearchParams({});
  };

  const handlePageChange = (direction) => {
    setCurrentPage((prev) => {
      if (direction === 'prev') {
        return Math.max(1, prev - 1);
      }
      if (direction === 'next') {
        return Math.min(totalPages, prev + 1);
      }
      return prev;
    });
  };

  return (
    <div className="validation-history-content">
      <h1 className="validation-history-title">Validation History</h1>

      <div className="filters-header">
        {/* EXPORT JSON and EXCEL Buttons - Only show when JSE entries are selected */}
        {selectedItems.size > 0 && (() => {
          const selectedJSEItems = paginatedDisclosures.filter(item => {
            const itemKey = `${item.id}_${item.resultIndex || 'single'}`;
            return selectedItems.has(itemKey) && item.mandate === 'JSE';
          });
          
          if (selectedJSEItems.length > 0) {
            const requestIds = selectedJSEItems.map(item => item.requestId).filter(Boolean);
            
            return (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="export-json-button"
                  onClick={async () => {
                    try {
                      const response = await apiService.downloadJSON({
                        request_ids: requestIds,
                        mandate: 'JSE'
                      });
                      
                      // Create blob from response and download
                      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `jse_export_${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Failed to export JSON:', error);
                      alert('Failed to export JSON. Please try again.');
                    }
                  }}
                >
                  Export JSON ({selectedJSEItems.length} JSE {selectedJSEItems.length === 1 ? 'entry' : 'entries'})
                </button>
                
                <button
                  className="export-json-button"
                  style={{ background: 'linear-gradient(135deg, #1e5f8b 0%, #4e9f3d 100%)' }}
                  onClick={async () => {
                    try {
                      const blob = await apiService.downloadExcel({
                        request_ids: requestIds,
                        mandate: 'JSE'
                      });
                      
                      // Download the blob as Excel file
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `jse_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Failed to export Excel:', error);
                      alert('Failed to export Excel. Please try again.');
                    }
                  }}
                >
                  Export Excel ({selectedJSEItems.length} JSE {selectedJSEItems.length === 1 ? 'entry' : 'entries'})
                </button>
              </div>
            );
          }
          return null;
        })()}
        
        <button
          className="toggle-filters-btn"
          onClick={() => setFiltersVisible((prev) => !prev)}
        >
          {filtersVisible ? 'Hide Filters' : 'Show Filters'}
          <span className={`chevron ${filtersVisible ? 'expanded' : ''}`}>&#9662;</span>
        </button>
      </div>

      {filtersVisible && (
        <div className="filters-panel">
          <div className="filter-group compact">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="ERROR">Error</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="filter-group compact offset">
            <label>Compliance Score</label>
            <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)}>
              <option value="all">All Scores</option>
              <option value="80-plus">80% &amp; above</option>
              <option value="50-79">50% - 79%</option>
              <option value="below-50">Below 50%</option>
              <option value="no-score">No Score</option>
            </select>
          </div>

          <div className="filter-group full-width">
            <label>Date of Event</label>
            <div className="date-input-row">
              <div className="date-input">
                <span className="date-label">From</span>
                <input
                  type="date"
                  value={eventDateFrom}
                  onChange={(e) => setEventDateFrom(e.target.value)}
                />
              </div>
              <div className="date-input">
                <span className="date-label">To</span>
                <input
                  type="date"
                  value={eventDateTo}
                  onChange={(e) => setEventDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="filter-group full-width">
            <label>Uploaded Date</label>
            <div className="date-input-row">
              <div className="date-input">
                <span className="date-label">From</span>
                <input
                  type="date"
                  value={uploadedDateFrom}
                  onChange={(e) => setUploadedDateFrom(e.target.value)}
                />
              </div>
              <div className="date-input">
                <span className="date-label">To</span>
                <input
                  type="date"
                  value={uploadedDateTo}
                  onChange={(e) => setUploadedDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="filter-group search-group full-width">
            <label>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, regulation, file name"
            />
          </div>

          <div className="filter-actions full-width">
            <button className="reset-button small" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="validation-table-container">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className="validation-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  {(() => {
                    const jseItems = paginatedDisclosures.filter(item => item.mandate === 'JSE');
                    const allJSESelected = jseItems.length > 0 && jseItems.every(item => {
                      const itemKey = `${item.id}_${item.resultIndex || 'single'}`;
                      return selectedItems.has(itemKey);
                    });
                    
                    if (jseItems.length > 0) {
                      return (
                        <input
                          type="checkbox"
                          checked={allJSESelected}
                          onChange={(e) => {
                            const newSelected = new Set(selectedItems);
                            if (e.target.checked) {
                              // Select all JSE items
                              jseItems.forEach(item => {
                                const itemKey = `${item.id}_${item.resultIndex || 'single'}`;
                                newSelected.add(itemKey);
                              });
                            } else {
                              // Deselect all JSE items
                              jseItems.forEach(item => {
                                const itemKey = `${item.id}_${item.resultIndex || 'single'}`;
                                newSelected.delete(itemKey);
                              });
                            }
                            setSelectedItems(newSelected);
                          }}
                          title="Select all JSE entries"
                        />
                      );
                    }
                    return null;
                  })()}
                </th>
                <th>Announcement Title</th>
                <th>Mandate</th>
                <th>Type of Submission</th>
                <th>Request ID</th>
                <th>Status</th>
                <th>Compliance Score</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDisclosures.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No disclosures found
                  </td>
                </tr>
              ) : (
                paginatedDisclosures.map((item) => {
                  const isClickable = item.fileStatus === 'COMPLETED';
                  const displayTitle = item.announcementTitle || `Disclosure - ${item.fileName?.replace('.pdf', '') || 'Document'}`;
                  const itemKey = `${item.id}_${item.resultIndex || 'single'}`;
                  const isSelected = selectedItems.has(itemKey);
                  const isJSE = item.mandate === 'JSE';
                  
                  return (
                    <tr key={itemKey} className={isSelected ? 'selected-row' : ''}>
                      <td>
                        {isJSE && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSelected = new Set(selectedItems);
                              if (e.target.checked) {
                                newSelected.add(itemKey);
                              } else {
                                newSelected.delete(itemKey);
                              }
                              setSelectedItems(newSelected);
                            }}
                            title="Select for JSON export"
                          />
                        )}
                      </td>
                      <td>
                        <div className="announcement-cell">
                          <button
                            className={`disclosure-link ${!isClickable ? 'disabled' : ''}`}
                            onClick={() => {
                              if (isClickable) {
                                const url = item.resultIndex != null 
                                  ? `/validation/${item.id}?result_index=${item.resultIndex}`
                                  : `/validation/${item.id}`;
                                navigate(url, { state: { from: 'validation' } });
                              }
                            }}
                            disabled={!isClickable}
                          >
                            {displayTitle} {item.hasMultipleResults && item.resultIndex != null ? `(Result ${parseInt(item.resultIndex) + 1})` : ''}
                          </button>
                          <button
                            type="button"
                            className="info-tooltip"
                            aria-label={`File name ${item.fileName || 'not available'}, uploaded ${item.uploadedDate ? formatDisplayDateTime(item.uploadedDate) : 'date not available'}`}
                            data-tooltip={`File: ${item.fileName || 'Not available'} • Uploaded: ${item.uploadedDate ? formatDisplayDateTime(item.uploadedDate) : 'Not available'}`}
                          >
                            i
                          </button>
                        </div>
                      </td>
                      <td>{item.mandate || '-'}</td>
                      <td>{item.typeOfSubmission || '-'}</td>
                      <td>{item.requestId || '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(item.fileStatus)}`}>
                          {item.fileStatus}
                        </span>
                      </td>
                      <td>
                        {item.fileStatus === 'COMPLETED' && item.complianceScore != null ? (
                          <span className="compliance-score">
                            <span
                              className={`score-indicator ${getScoreIndicatorClass(item.complianceScore)}`}
                            />
                            {typeof item.complianceScore === 'number' 
                              ? item.complianceScore.toFixed(2) 
                              : parseFloat(item.complianceScore || 0).toFixed(2)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination-bar">
        <button
          className="pagination-button"
          onClick={() => handlePageChange('prev')}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-button"
          onClick={() => handlePageChange('next')}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

    </div>
  );
}

const getStatusClass = (status) => {
  const normalizedStatus = status || 'PROCESSING';
  switch (normalizedStatus) {
    case 'COMPLETED':
    case 'Completed':
    case 'completed':
      return 'status-completed';
    case 'PROCESSING':
    case 'Processing':
    case 'processing':
      return 'status-processing';
    case 'PENDING':
    case 'Pending':
    case 'pending':
      return 'status-pending';
    case 'ERROR':
    case 'Error':
    case 'error':
      return 'status-error';
    case 'CANCELLED':
    case 'Cancelled':
    case 'cancelled':
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


export default ValidationHistory;
