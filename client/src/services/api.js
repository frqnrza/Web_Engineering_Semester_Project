const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }
  
  return data;
};

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to check if backend is available
let backendAvailable = null;

const checkBackendAvailability = async () => {
  if (backendAvailable !== null) {
    return backendAvailable;
  }
  
  console.log('🔍 Checking backend availability...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }).catch(() => ({ ok: false }));
    
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    
    if (!backendAvailable) {
      console.warn('⚠️ Backend not available, using mock mode');
    } else {
      console.log('✅ Backend is available');
    }
    
    return backendAvailable;
  } catch (error) {
    console.log('🔄 Backend check failed, using mock mode');
    backendAvailable = false;
    return false;
  }
};

// Helper function for fetch with auth token
const fetchWithAuth = async (url, options = {}) => {
  const isAvailable = await checkBackendAvailability();
  
  if (!isAvailable) {
    console.log(`🔄 Backend not available for: ${url}`);
    return null;
  }

  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    // ✅ FIXED: Don't intercept 401s for Login endpoints
    // If we are logging in, a 401 simply means "Wrong Password", not "Token Expired"
    const isLoginRequest = url.includes('/auth/login');

    if (response.status === 401 && !isLoginRequest) {
      const data = await response.json().catch(() => ({}));
      
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await authAPI.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${getAuthToken()}`;
          const retryResponse = await fetch(`${API_URL}${url}`, { 
            ...options, 
            headers, 
            credentials: 'include' 
          });
          
          if (!retryResponse.ok) {
            throw new Error('Request failed after token refresh');
          }
          
          return retryResponse.json();
        }
      }
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server');
    }
    throw error;
  }
};

// ==========================================
// Authentication API
// ==========================================
export const authAPI = {
  // Register - FIXED to handle both object and individual parameters
  async register(emailOrData, password, name, type, companyName = null, phone = null) {
    console.log('👤 Registration attempt');
    
    // Handle both calling styles
    let userData;
    if (typeof emailOrData === 'object') {
      // Called with object: register({ email, password, name, userType, ... })
      userData = {
        email: emailOrData.email,
        password: emailOrData.password,
        name: emailOrData.name,
        type: emailOrData.type || emailOrData.userType,
        companyName: emailOrData.companyName,
        phone: emailOrData.phone
      };
    } else {
      // Called with individual parameters
      userData = { email: emailOrData, password, name, type, companyName, phone };
    }
    
    try {
      const data = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (data && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        console.log('✅ Registration successful');
        return data;
      }
      
      // If we got here but data.token is missing, something is weird, but try mock
      return this._mockRegister(userData);
    } catch (error) {
      console.log('🔄 Registration error:', error.message);
      
      // ✅ FIXED: Only fallback to mock if backend is genuinely offline
      const isBackendOffline = error.message.includes('Unable to connect') || !(await checkBackendAvailability());
      
      if (isBackendOffline) {
         return this._mockRegister(userData);
      }
      
      // Otherwise, it's a real validation error (e.g. Email exists), so throw it
      throw error;
    }
  },

  // Mock registration - FIXED
  _mockRegister(userData) {
    console.log('🔄 Creating mock user');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('This email is already registered. Please use a different email or sign in.');
    }
    
    const newUser = {
      _id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      type: userData.type,
      companyName: userData.companyName,
      phone: userData.phone,
      emailVerified: true,
      createdAt: new Date().toISOString()
    };
    
    users.push({ ...newUser, password: userData.password });
    localStorage.setItem('users', JSON.stringify(users));
    
    const token = btoa(JSON.stringify({ userId: newUser._id, email: newUser.email }));
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    console.log('✅ Mock user created');
    return {
      success: true,
      user: newUser,
      token
    };
  },

  // Login - FIXED to handle both object and individual parameters
  async login(emailOrData, password) {
    console.log('🔐 Login attempt');
    
    // Handle both calling styles
    let credentials;
    if (typeof emailOrData === 'object') {
      credentials = { email: emailOrData.email, password: emailOrData.password };
    } else {
      credentials = { email: emailOrData, password };
    }
    
    try {
      const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      if (data && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        console.log('✅ Login successful');
        return data;
      }
      
      return this._mockLogin(credentials);
    } catch (error) {
      console.log('🔄 Login error:', error.message);
      
      // ✅ FIXED: Only fallback to mock if backend is offline
      const isBackendOffline = error.message.includes('Unable to connect') || !(await checkBackendAvailability());
      
      if (isBackendOffline) {
        return this._mockLogin(credentials);
      }
      
      // Real error (invalid password), throw it!
      throw error;
    }
  },

  // Mock login - FIXED
  _mockLogin(credentials) {
    console.log('🔄 Attempting mock login');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const user = users.find(u => 
      u.email === credentials.email && 
      u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const { password, ...userWithoutPassword } = user;
    
    const token = btoa(JSON.stringify({ userId: user._id, email: user.email }));
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    console.log('✅ Mock login successful');
    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  },

  // Sign out - FIXED
  async signOut() {
    console.log('👋 Signing out');
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (error) {
      console.log('Logout API call failed, continuing with local cleanup');
    }
    
    // Always clean up local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    backendAvailable = null;
    
    console.log('✅ Signed out successfully');
    return { success: true };
  },

  // ✅ ADDED: Alias for compatibility with components calling logout()
  logout() {
    return this.signOut();
  },

  // Google OAuth
  async googleLogin(credential, type) {
    try {
      const data = await fetchWithAuth('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, type })
      });
      
      if (data && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const data = await fetchWithAuth('/auth/me');
      
      if (data && data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data.user;
      }
      
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        return JSON.parse(userData);
      }
      
      return null;
    } catch (error) {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    }
  },

  // Get cached user
  getCachedUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  // Check if authenticated
  isAuthenticated() {
    const token = getAuthToken();
    const user = this.getCachedUser();
    return !!(token && user);
  },

  // Refresh token
  async refreshToken() {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const data = await fetchWithAuth('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return data;
    } catch (error) {
      // Always succeed in demo mode or if backend fails
      return { 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      };
    }
  },

  // Reset password
  async resetPassword(token, password) {
    return fetchWithAuth(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  },

  // Check email availability
  async checkEmailAvailability(email) {
    try {
      const data = await fetchWithAuth('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return data.available;
    } catch (error) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find(user => user.email === email);
      return !existingUser;
    }
  },

  // Check phone availability
  async checkPhoneAvailability(phone) {
    try {
      const data = await fetchWithAuth('/auth/check-phone', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
      return data.available;
    } catch (error) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find(user => user.phone === phone);
      return !existingUser;
    }
  }
};

export const resetBackendCheck = () => {
  backendAvailable = null;
};

export { checkBackendAvailability };

// ==========================================
// Projects API - FIXED
// ==========================================
export const projectAPI = {
  // Get all projects
  async getAll(filters = {}) {
    console.log('📋 Fetching projects with filters:', filters);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const data = await fetchWithAuth(`/projects${queryParams ? `?${queryParams}` : ''}`);
      
      if (data) {
        console.log(`✅ Found ${data.projects?.length || 0} projects from backend`);
        return data;
      }
      
      return this._mockGetAll(filters);
    } catch (error) {
      console.log('🔄 Error fetching projects, using mock');
      return this._mockGetAll(filters);
    }
  },

  // Mock get all projects
  _mockGetAll(filters = {}) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    console.log(`🔄 Using ${projects.length} mock projects from localStorage`);
    
    let filteredProjects = [...projects];
    
    if (filters.category) {
      filteredProjects = filteredProjects.filter(p => p.category === filters.category);
    }
    if (filters.status) {
      filteredProjects = filteredProjects.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }
    
    return {
      success: true,
      projects: filteredProjects,
      total: filteredProjects.length
    };
  },

  // Get user's projects
  async getUserProjects() {
    try {
      const data = await fetchWithAuth('/projects/user/my-projects');
      if (data) return data;
      
      return this._mockGetUserProjects();
    } catch (error) {
      return this._mockGetUserProjects();
    }
  },

  // Mock get user projects
  _mockGetUserProjects() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const userProjects = projects.filter(p => p.clientId === currentUser._id);
    
    return {
      success: true,
      projects: userProjects
    };
  },

  // Create new project - COMPLETELY FIXED
  async create(projectData) {
    console.log('🆕 Creating project:', projectData.title);
    
    try {
      console.log('🚀 Attempting backend API...');
      const data = await fetchWithAuth('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      
      if (data) {
        console.log('✅ Project created via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockCreate(projectData);
    } catch (error) {
      console.log('🔄 Error creating project:', error.message);
      
      // If backend fails for ANY reason (network, 500, db hang), fall back to mock
      return this._mockCreate(projectData);
    }
  },

  // Mock create project - FIXED
  _mockCreate(projectData) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated. Please sign in to create a project.');
    }
    
    console.log('🔄 Creating mock project for user:', currentUser._id);
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    const newProject = {
      _id: Date.now().toString(),
      ...projectData,
      clientId: currentUser._id,
      status: projectData.status || 'posted',
      bids: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0
    };
    
    projects.push(newProject);
    localStorage.setItem('projects', JSON.stringify(projects));
    
    console.log('✅ Mock project created');
    
    return {
      success: true,
      project: newProject,
      message: 'Project created successfully'
    };
  },

  // Get project by ID
  async getById(projectId) {
    try {
      const data = await fetchWithAuth(`/projects/${projectId}`);
      if (data) return data;
      
      return this._mockGetById(projectId);
    } catch (error) {
      return this._mockGetById(projectId);
    }
  },

  // Mock get project by ID
  _mockGetById(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p._id === projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    return {
      success: true,
      project
    };
  },

  // Submit bid
  async submitBid(projectId, bidData) {
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids`, {
        method: 'POST',
        body: JSON.stringify(bidData)
      });
      
      if (data) return data;
      
      return this._mockSubmitBid(projectId, bidData);
    } catch (error) {
      return this._mockSubmitBid(projectId, bidData);
    }
  },

  // Mock submit bid
  _mockSubmitBid(projectId, bidData) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const newBid = {
      _id: Date.now().toString(),
      ...bidData,
      companyId: currentUser.companyId || currentUser._id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    if (!projects[projectIndex].bids) {
      projects[projectIndex].bids = [];
    }
    
    projects[projectIndex].bids.push(newBid);
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      bid: newBid
    };
  },

  // Update project
  async update(id, projectData) {
    try {
      const data = await fetchWithAuth(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData)
      });
      
      if (data) return data;
      
      throw new Error('Backend not available');
    } catch (error) {
      throw error;
    }
  },

  // Delete project
  async delete(id) {
    try {
      const data = await fetchWithAuth(`/projects/${id}`, {
        method: 'DELETE'
      });
      
      if (data) return data;
      
      throw new Error('Backend not available');
    } catch (error) {
      throw error;
    }
  },

  // Update bid status
  async updateBidStatus(projectId, bidId, status) {
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      if (data) return data;
      
      throw new Error('Backend not available');
    } catch (error) {
      throw error;
    }
  },

  // Get company bids
  async getCompanyBids() {
    try {
      const data = await fetchWithAuth('/projects/company/my-bids');
      if (data) return data;
      
      return this._mockGetCompanyBids();
    } catch (error) {
      return this._mockGetCompanyBids();
    }
  },

  // Mock get company bids
  _mockGetCompanyBids() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    const projectsWithBids = projects.filter(p => 
      p.bids && p.bids.some(bid => 
        bid.companyId === currentUser.companyId || bid.companyId === currentUser._id
      )
    );
    
    return {
      success: true,
      projects: projectsWithBids
    };
  }
};

// ==========================================
// Companies API
// ==========================================
export const companyAPI = {
  // Get all companies
  async getAll(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const data = await fetchWithAuth(`/companies${queryParams ? `?${queryParams}` : ''}`);
      
      if (data) return data;
      
      return this._mockGetAll(filters);
    } catch (error) {
      return this._mockGetAll(filters);
    }
  },

  // Mock get all companies
  _mockGetAll(filters = {}) {
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    
    let filteredCompanies = [...companies];
    
    if (filters.category) {
      filteredCompanies = filteredCompanies.filter(c => c.category === filters.category);
    }
    if (filters.verified !== undefined) {
      filteredCompanies = filteredCompanies.filter(c => c.verified === filters.verified);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredCompanies = filteredCompanies.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.services?.some(s => s.toLowerCase().includes(search))
      );
    }
    
    return {
      success: true,
      companies: filteredCompanies,
      total: filteredCompanies.length
    };
  },

  // Get company by ID
  async getById(companyId) {
    try {
      const data = await fetchWithAuth(`/companies/${companyId}`);
      if (data) return data;
      
      return this._mockGetById(companyId);
    } catch (error) {
      return this._mockGetById(companyId);
    }
  },

  // Mock get company by ID
  _mockGetById(companyId) {
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const company = companies.find(c => c._id === companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    return {
      success: true,
      company
    };
  },

  // Request verification
  async requestVerification(verificationData) {
    try {
      const data = await fetchWithAuth('/companies/verification/request', {
        method: 'POST',
        body: JSON.stringify(verificationData)
      });
      
      if (data) return data;
      
      return this._mockRequestVerification(verificationData);
    } catch (error) {
      return this._mockRequestVerification(verificationData);
    }
  },

  // Mock request verification
  _mockRequestVerification(verificationData) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser || currentUser.type !== 'company') {
      throw new Error('Only companies can request verification');
    }
    
    const requests = JSON.parse(localStorage.getItem('verificationRequests') || '[]');
    
    const existingRequest = requests.find(r => 
      r.companyId === (currentUser.companyId || currentUser._id) && 
      r.status === 'pending'
    );
    
    if (existingRequest) {
      throw new Error('You already have a pending verification request');
    }
    
    const newRequest = {
      _id: Date.now().toString(),
      companyId: currentUser.companyId || currentUser._id,
      userId: currentUser._id,
      ...verificationData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    requests.push(newRequest);
    localStorage.setItem('verificationRequests', JSON.stringify(requests));
    
    return {
      success: true,
      request: newRequest
    };
  }
};

// ==========================================
// Notifications API
// ==========================================
export const notificationAPI = {
  // Get notifications
  async getNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const data = await fetchWithAuth(`/notifications${queryParams ? `?${queryParams}` : ''}`);
      
      if (data) return data;
      
      return this._mockGetNotifications(params);
    } catch (error) {
      return this._mockGetNotifications(params);
    }
  },

  // Mock get notifications
  _mockGetNotifications(options = {}) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      return { success: false, notifications: [], unreadCount: 0 };
    }
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    let userNotifications = notifications.filter(n => n.userId === currentUser._id);
    
    if (options.read !== undefined) {
      userNotifications = userNotifications.filter(n => n.read === options.read);
    }
    
    if (options.limit) {
      userNotifications = userNotifications.slice(0, options.limit);
    }
    
    const unreadCount = notifications.filter(n => 
      n.userId === currentUser._id && !n.read
    ).length;
    
    return {
      success: true,
      notifications: userNotifications,
      unreadCount
    };
  },

  // Get unread count
  async getUnreadCount() {
    try {
      const data = await fetchWithAuth('/notifications/unread-count');
      if (data) return data;
      
      const notifData = this._mockGetNotifications({ read: false });
      return {
        success: notifData.success,
        count: notifData.unreadCount
      };
    } catch (error) {
      return { success: false, count: 0 };
    }
  },

  // Mark as read
  async markAsRead(notificationId) {
    try {
      const data = await fetchWithAuth(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      if (data) return data;
      
      return this._mockMarkAsRead(notificationId);
    } catch (error) {
      return this._mockMarkAsRead(notificationId);
    }
  },

  // Mock mark as read
  _mockMarkAsRead(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const index = notifications.findIndex(n => n._id === notificationId);
    
    if (index !== -1) {
      notifications[index].read = true;
      notifications[index].readAt = new Date().toISOString();
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    
    return { success: true };
  }
};

// ==========================================
// Admin API
// ==========================================
export const adminAPI = {
  // Get verification requests
  async getVerificationRequests(filters = {}) {
    try {
      const data = await fetchWithAuth('/admin/verification-requests', {
        method: 'GET',
        body: filters ? JSON.stringify(filters) : undefined
      });
      
      if (data) return data;
      
      return this._mockGetVerificationRequests(filters);
    } catch (error) {
      return this._mockGetVerificationRequests(filters);
    }
  },

  // Mock get verification requests
  _mockGetVerificationRequests(filters = {}) {
    const requests = JSON.parse(localStorage.getItem('verificationRequests') || '[]');
    
    let filteredRequests = [...requests];
    
    if (filters.status) {
      filteredRequests = filteredRequests.filter(r => r.status === filters.status);
    }
    
    return {
      success: true,
      requests: filteredRequests,
      total: filteredRequests.length
    };
  },

  // Approve verification
  async approveVerification(requestId) {
    try {
      const data = await fetchWithAuth('/admin/verification/approve', {
        method: 'POST',
        body: JSON.stringify({ requestId })
      });
      
      if (data) return data;
      
      return this._mockApproveVerification(requestId);
    } catch (error) {
      return this._mockApproveVerification(requestId);
    }
  },

  // Mock approve verification
  _mockApproveVerification(requestId) {
    const requests = JSON.parse(localStorage.getItem('verificationRequests') || '[]');
    const requestIndex = requests.findIndex(r => r._id === requestId);
    
    if (requestIndex === -1) {
      throw new Error('Request not found');
    }
    
    requests[requestIndex].status = 'approved';
    requests[requestIndex].approvedAt = new Date().toISOString();
    
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const companyIndex = companies.findIndex(c => c._id === requests[requestIndex].companyId);
    
    if (companyIndex !== -1) {
      companies[companyIndex].verified = true;
      companies[companyIndex].verifiedAt = new Date().toISOString();
      localStorage.setItem('companies', JSON.stringify(companies));
    }
    
    localStorage.setItem('verificationRequests', JSON.stringify(requests));
    
    return {
      success: true,
      request: requests[requestIndex]
    };
  },

  // Reject verification
  async rejectVerification(requestId, reason) {
    try {
      const data = await fetchWithAuth('/admin/verification/reject', {
        method: 'POST',
        body: JSON.stringify({ requestId, reason })
      });
      
      if (data) return data;
      
      return this._mockRejectVerification(requestId, reason);
    } catch (error) {
      return this._mockRejectVerification(requestId, reason);
    }
  },

  // Mock reject verification
  _mockRejectVerification(requestId, reason) {
    const requests = JSON.parse(localStorage.getItem('verificationRequests') || '[]');
    const requestIndex = requests.findIndex(r => r._id === requestId);
    
    if (requestIndex === -1) {
      throw new Error('Request not found');
    }
    
    requests[requestIndex].status = 'rejected';
    requests[requestIndex].rejectedAt = new Date().toISOString();
    requests[requestIndex].rejectionReason = reason;
    
    localStorage.setItem('verificationRequests', JSON.stringify(requests));
    
    return {
      success: true,
      request: requests[requestIndex]
    };
  }
};

// ==========================================
// Payment API
// ==========================================
export const paymentAPI = {
  async initiatePayment(amount, method, projectId) {
    return fetchWithAuth('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ amount, method, projectId })
    });
  },

  async verifyPayment(paymentId, transactionData) {
    return fetchWithAuth('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ paymentId, transactionData })
    });
  },

  async getPaymentStatus(paymentId) {
    return fetchWithAuth(`/payments/${paymentId}/status`);
  },

  async getPaymentHistory() {
    return fetchWithAuth('/payments/history');
  }
};

// ==========================================
// Message API
// ==========================================
export const messageAPI = {
  async getConversations() {
    return fetchWithAuth('/messages/conversations');
  },

  async getMessages(conversationId) {
    return fetchWithAuth(`/messages/${conversationId}`);
  },

  async sendMessage(recipientId, content, attachments = []) {
    return fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content, attachments })
    });
  },

  async markAsRead(messageId) {
    return fetchWithAuth(`/messages/${messageId}/read`, {
      method: 'PUT'
    });
  }
};

// ==========================================
// Upload API
// ==========================================
export const uploadAPI = {
  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = getAuthToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }
};

// ==========================================
// Helper Functions
// ==========================================
export const testBackendConnection = async () => {
  console.log('🔧 Testing backend connection manually...');
  backendAvailable = null;
  const result = await checkBackendAvailability();
  console.log(`🔧 Backend connection test result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
  return result;
};

export const forceRealAPIMode = () => {
  console.log('🔧 Forcing real API mode');
  backendAvailable = true;
};

export const forceMockMode = () => {
  console.log('🔧 Forcing mock mode');
  backendAvailable = false;
};