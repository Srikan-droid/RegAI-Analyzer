const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('access_token');
    this.refreshTimer = null;
    this.inactivityTimer = null;
    this.warningTimer = null;
    this.lastActivity = Date.now();
    this.INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.WARNING_TIME = 14 * 60 * 1000; // 14 minutes - show warning 1 minute before
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('access_token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    // Dispatch custom event to notify components of logout
    window.dispatchEvent(new Event('userLogout'));
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.resetInactivityTimer();
  }

  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    
    // Set warning timer (14 minutes)
    this.warningTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, this.WARNING_TIME);
    
    // Set logout timer (15 minutes)
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.INACTIVITY_TIMEOUT);
  }

  showInactivityWarning() {
    // Show alert/modal warning user
    const userConfirmed = window.confirm(
      'You have been inactive for 14 minutes. You will be logged out in 1 minute due to inactivity. Click OK to stay logged in.'
    );
    
    if (userConfirmed) {
      // User wants to stay logged in, reset timer
      this.resetInactivityTimer();
    }
  }

  handleInactivityTimeout() {
    this.clearToken();
    // Redirect to login page
    window.location.href = 'http://20.193.250.79:3000/';
  }

  setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true);
    });
    this.resetInactivityTimer();
  }

  async request(endpoint, options = {}) {
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${API_BASE_URL}${apiEndpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        this.clearToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred', error: 'An error occurred' }));
        throw new Error(error.error || error.detail || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
      this.refreshTokenValue = response.refresh_token;
    }
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  async microsoftLogin(code) {
    const response = await this.request('/auth/microsoft/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    this.setToken(response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
      this.refreshTokenValue = response.refresh_token;
    }
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  async guestLogin(email, name) {
    const response = await this.request('/auth/guest/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    this.setToken(response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
      this.refreshTokenValue = response.refresh_token;
    }
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  async verifyOTP(email, otpCode) {
    const response = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: otpCode }),
    });
    this.setToken(response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
      this.refreshTokenValue = response.refresh_token;
    }
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  async resendOTP(email) {
    return await this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getMicrosoftAuthUrl() {
    const response = await this.request('/auth/microsoft/authorize');
    return response.authorization_url;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (response.access) {
      this.setToken(response.access);
      // Optionally update refresh token if provided
      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
        this.refreshTokenValue = response.refresh;
      }
    }
    return response;
  }

  // User endpoints
  async getCurrentUser() {
    return await this.request('/users/me');
  }

  async setPassword(password, confirmPassword) {
    return await this.request('/users/me/set-password', {
      method: 'POST',
      body: JSON.stringify({ password, confirm_password: confirmPassword }),
    });
  }

  async resetPassword(oldPassword, newPassword, confirmPassword) {
    return await this.request('/users/me/reset-password', {
      method: 'POST',
      body: JSON.stringify({ 
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword 
      }),
    });
  }

  async forgotPassword(email) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetOTP(email, otpCode, newPassword, confirmPassword) {
    return await this.request('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ 
        email,
        otp_code: otpCode,
        new_password: newPassword,
        confirm_password: confirmPassword 
      }),
    });
  }

  // PDF Processing endpoints
  async uploadPDF(file, announcementTitle, dateOfEvent, mandateId = null) {
    console.log('[apiService.uploadPDF] ===== STARTING FILE UPLOAD =====');
    console.log('[apiService.uploadPDF] File details:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      announcementTitle: announcementTitle,
      dateOfEvent: dateOfEvent,
      mandateId: mandateId,
      mandateIdType: typeof mandateId
    });
    
    const formData = new FormData();
    formData.append('file', file);
    if (announcementTitle) {
      formData.append('announcement_title', announcementTitle);
    }
    if (dateOfEvent) {
      formData.append('date_of_event', dateOfEvent);
    }
    if (mandateId) {
      formData.append('mandate_id', mandateId.toString()); // Send as string in form-data
      console.log('[apiService.uploadPDF] Adding mandate_id to form-data:', mandateId);
    } else {
      console.log('[apiService.uploadPDF] WARNING: No mandate_id provided - this is OK for new uploads');
    }

    const apiEndpoint = '/api/pdf/upload';
    const url = `${API_BASE_URL}${apiEndpoint}`;
    const token = this.getToken();
    
    console.log('[apiService.uploadPDF] Sending upload request to:', url);
    console.log('[apiService.uploadPDF] Why we need document ID: The backend creates a NEW PDFDocument record and returns its ID. This ID is required for all subsequent operations (saving selections, checking status, getting results, etc.)');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (response.status === 401) {
      console.error('[apiService.uploadPDF] Unauthorized - token expired or invalid');
      this.clearToken();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred', error: 'An error occurred' }));
      const errorMessage = error.error || error.detail || 'Request failed';
      console.error('[apiService.uploadPDF] Upload failed:', {
        status: response.status,
        error: errorMessage,
        fullError: error
      });
      const errorObj = new Error(errorMessage);
      // Attach additional error details for better error handling
      errorObj.status = response.status;
      errorObj.response = error;
      throw errorObj;
    }

    const responseData = await response.json();
    console.log('[apiService.uploadPDF] ===== UPLOAD SUCCESSFUL =====');
    console.log('[apiService.uploadPDF] Response from backend:', {
      document_id: responseData.document_id,
      request_id: responseData.request_id,
      status: responseData.status,
      is_duplicate: responseData.is_duplicate,
      message: responseData.message,
      fullResponse: responseData
    });
    console.log('[apiService.uploadPDF] Document ID received:', responseData.document_id);
    console.log('[apiService.uploadPDF] This document ID will be used for:');
    console.log('  - Saving mandate/submission type selections (saveDocumentSelection)');
    console.log('  - Checking processing status (getProcessingStatus)');
    console.log('  - Getting processing results (getProcessingResult)');
    console.log('  - Creating chat sessions (createChatSession)');
    console.log('  - All other document-related operations');
    console.log('[apiService.uploadPDF] ===== END UPLOAD =====');
    
    return responseData;
  }

  async getProcessingStatus(documentId) {
    return await this.request(`/pdf/${documentId}/status`);
  }

  async saveDocumentSelection(documentId, mandateId, typeOfSubmissionId) {
    console.log('[apiService.saveDocumentSelection] ===== SAVING DOCUMENT SELECTION =====');
    console.log('[apiService.saveDocumentSelection] Why we need document ID here:');
    console.log('  - The backend needs to know WHICH document to associate the mandate/submission type with');
    console.log('  - Without document ID, the backend cannot link the selection to the uploaded file');
    console.log('[apiService.saveDocumentSelection] Sending request:', {
      documentId: documentId,
      mandateId: mandateId,
      typeOfSubmissionId: typeOfSubmissionId,
      documentIdType: typeof documentId,
      mandateIdType: typeof mandateId,
      typeOfSubmissionIdType: typeof typeOfSubmissionId
    });
    
    const response = await this.request('/pdf/selection', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        mandate_id: mandateId,
        type_of_submission_id: typeOfSubmissionId
      }),
    });
    
    console.log('[apiService.saveDocumentSelection] Selection saved successfully:', response);
    console.log('[apiService.saveDocumentSelection] ===== END SAVE SELECTION =====');
    
    return response;
  }

  async getExtractedData(requestId) {
    return await this.request(`/pdf/extracted-data?request_id=${encodeURIComponent(requestId)}`, {
      method: 'GET',
    });
  }

  async getMandates() {
    return await this.request('/pdf/mandates', {
      method: 'GET',
    });
  }

  async getSubmissionTypes(mandateId = null) {
    let url = '/pdf/submission-types';
    if (mandateId) {
      url += `?mandate_id=${mandateId}`;
    }
    return await this.request(url, {
      method: 'GET',
    });
  }

  async getProcessingResult(documentId) {
    return await this.request(`/pdf/${documentId}/result`);
  }

  async refreshRecommendations(documentId, resultIndex = null) {
    const url = resultIndex != null 
      ? `/pdf/${documentId}/refresh-recommendations?result_index=${resultIndex}`
      : `/pdf/${documentId}/refresh-recommendations`;
    return await this.request(url, {
      method: 'POST',
    });
  }

  async listPDFDocuments(page = 1, pageSize = 10, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.scoreFilter) {
        params.append('scoreFilter', filters.scoreFilter);
      }
      
      const response = await this.request(`/pdf/documents?${params.toString()}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to list PDF documents:', error);
      throw error;
    }
  }

  async getComplianceMetrics() {
    try {
      const response = await this.request('/pdf/compliance-metrics', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch compliance metrics:', error);
      throw error;
    }
  }

  async getDocumentDetails(documentId, resultIndex = null) {
    try {
      let url = `/pdf/${documentId}/detail`;
      if (resultIndex != null) {
        url += `?result_index=${resultIndex}`;
      }
      const response = await this.request(url, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch document details:', error);
      throw error;
    }
  }

  async getValidationRuleCondition(ruleId) {
    try {
      const response = await this.request(`/pdf/validation-rule/${ruleId}/condition`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch validation rule condition:', error);
      throw error;
    }
  }

  // Chat endpoints
  async createChatSession(pdfDocumentId, sessionId = null, title = 'New Chat') {
    try {
      return await this.request('/chat/session', {
        method: 'POST',
        body: JSON.stringify({ 
          pdf_document_id: pdfDocumentId, 
          session_id: sessionId,
          title: title
        }),
      });
    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw error;
    }
  }

  async getChatSession(sessionId) {
    try {
      return await this.request(`/chat/session/${sessionId}`);
    } catch (error) {
      // Don't log 404 errors as they're expected when session doesn't exist
      // Only log unexpected errors
      const isNotFoundError = error.message && (
        error.message.includes('Chat session not found') || 
        error.message.includes('404') ||
        error.message.includes('Not Found')
      );
      
      if (!isNotFoundError) {
        console.error('Failed to get chat session:', error);
      }
      throw error;
    }
  }

  async saveChatMessage(sessionId, role, content, metadata = {}) {
    try {
      return await this.request('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, role, content, metadata }),
      });
    } catch (error) {
      console.error('Failed to save chat message:', error);
      throw error;
    }
  }

  async saveChatMessagesBatch(sessionId, messages) {
    try {
      return await this.request('/chat/messages/batch', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, messages }),
      });
    } catch (error) {
      console.error('Failed to save chat messages batch:', error);
      throw error;
    }
  }

  async getUserChatSessions(pdfDocumentId = null) {
    try {
      const url = pdfDocumentId 
        ? `/chat/sessions?pdf_document_id=${pdfDocumentId}`
        : '/chat/sessions';
      return await this.request(url);
    } catch (error) {
      console.error('Failed to get user chat sessions:', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId) {
    try {
      return await this.request(`/chat/session/${sessionId}/delete`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      throw error;
    }
  }

  // RKB Knowledge Center endpoints
  async getCreditRatingTable(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.regulation_id) {
        params.append('regulation_id', filters.regulation_id);
      }
      if (filters.rule_id) {
        params.append('rule_id', filters.rule_id);
      }
      if (filters.domain) {
        params.append('domain', filters.domain);
      }
      
      const queryString = params.toString();
      const url = queryString 
        ? `/rkb/credit-rating-table?${queryString}`
        : '/rkb/credit-rating-table';
      
      return await this.request(url);
    } catch (error) {
      console.error('Failed to fetch credit rating table:', error);
      throw error;
    }
  }

  // Download endpoints
  async downloadJSON(data) {
    try {
      const apiEndpoint = '/api/download_json';
      const url = `${API_BASE_URL}${apiEndpoint}`;
      const token = this.getToken();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        this.clearToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred', error: 'An error occurred' }));
        throw new Error(error.error || error.detail || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to download JSON:', error);
      throw error;
    }
  }

  async downloadExcel(data) {
    try {
      const apiEndpoint = '/api/download_excel';
      const url = `${API_BASE_URL}${apiEndpoint}`;
      const token = this.getToken();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        this.clearToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred', error: 'An error occurred' }));
        throw new Error(error.error || error.detail || 'Request failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download Excel:', error);
      throw error;
    }
  }
}

export default new ApiService();



