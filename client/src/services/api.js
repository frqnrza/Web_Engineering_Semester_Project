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

// âœ… IMPROVED: Cache backend availability longer
let backendAvailable = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds instead of every request

const checkBackendAvailability = async () => {
  const now = Date.now();
  
  // âœ… Return cached result if checked recently
  if (backendAvailable !== null && (now - lastCheckTime) < CHECK_INTERVAL) {
    return backendAvailable;
  }
  
  console.log('🔍 Checking backend availability...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased to 5s
    
    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }).catch(() => ({ ok: false }));
    
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    lastCheckTime = now; // âœ… Update check time
    
    if (!backendAvailable) {
      console.warn('⚠️ Backend not available, using mock mode');
    } else {
      console.log('✅ Backend is available');
    }
    
    return backendAvailable;
  } catch (error) {
    console.log('🔄 Backend check failed, using mock mode');
    backendAvailable = false;
    lastCheckTime = now; // âœ… Update check time even on failure
    return false;
  }
};

// Helper function for fetch with auth token
// Helper function for fetch with auth token
const fetchWithAuth = async (url, options = {}) => {
  const isAvailable = await checkBackendAvailability();
  
  if (!isAvailable) {
    console.log(`🔄 Backend not available for: ${url}`);
    return null;
  }

  const token = getAuthToken();
  
  // âœ… CRITICAL FIX: Check if token exists for protected routes
  if (!token && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    console.warn(`⚠️ No auth token for protected route: ${url}`);
    throw new Error('Not authenticated. Please sign in.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Token attached to request:', token.substring(0, 20) + '...'); // âœ… Debug log
  }

  try {
    console.log(`📡 API Request: ${options.method || 'GET'} ${API_URL}${url}`); // âœ… Debug log
    
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    // Don't intercept 401s for Login endpoints
    const isLoginRequest = url.includes('/auth/login');

    if (response.status === 401 && !isLoginRequest) {
      const data = await response.json().catch(() => ({}));
      
      console.log('❌ 401 Response:', data); // âœ… Debug log
      
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
      
      // âœ… Clear auth data on 401
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
// BID API - ENHANCED SECTION
// ==========================================
export const bidAPI = {
  // Submit bid - FIXED: matches BidModal.jsx call
  async submit(projectId, bidData) {
    console.log('📤 Submitting bid for project:', projectId);
    
    try {
      const data = await fetchWithAuth(`/bids`, {
        method: 'POST',
        body: JSON.stringify({
          ...bidData,
          projectId: projectId,
          // Map timeline to proposedTimeline for your model
          timeline: bidData.proposedTimeline || bidData.timeline
        })
      });
      
      if (data) {
        console.log('✅ Bid submitted via backend:', data);
        return data;
      }
      
      // ... rest of your code ...
    } catch (error) {
      console.error('❌ Bid submission error:', error);
      throw error;
    }
  },

  // Mock submit bid - FIXED
  _mockSubmit(projectId, bidData) {
    console.log('🔄 Mock submitting bid for project:', projectId);
    
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated. Please sign in.');
    }
    
    // For mock mode, just simulate success without saving to localStorage
    const newBid = {
      _id: Date.now().toString(),
      ...bidData,
      companyId: currentUser.companyId || currentUser._id,
      companyName: currentUser.companyName || currentUser.name,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('✅ Mock bid created (not saved to localStorage):', newBid);
    
    // Don't actually save to localStorage for real projects
    // Just return success response
    
    return {
      success: true,
      bid: newBid,
      message: 'Bid submitted successfully (mock mode)'
    };
  },

  // Update bid - FIXED: matches BidModal.jsx call
  async update(projectId, bidId, bidData) {
    console.log('✏️ Updating bid:', bidId);
    
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}`, {
        method: 'PUT',
        body: JSON.stringify(bidData)
      });
      
      if (data) {
        console.log('✅ Bid updated via backend');
        return data;
      }
      
      console.log('🔄 Backend not available, using mock');
      return this._mockUpdate(projectId, bidId, bidData);
    } catch (error) {
      console.log('🔄 Error updating bid:', error.message);
      return this._mockUpdate(projectId, bidId, bidData);
    }
  },

  // Mock update bid
  _mockUpdate(projectId, bidId, bidData) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const bidIndex = projects[projectIndex].bids?.findIndex(b => b._id === bidId);
    
    if (bidIndex === -1 || !projects[projectIndex].bids) {
      throw new Error('Bid not found');
    }
    
    // Check if bid belongs to current user
    const existingBid = projects[projectIndex].bids[bidIndex];
    if (existingBid.companyId !== (currentUser.companyId || currentUser._id)) {
      throw new Error('Not authorized to update this bid');
    }
    
    projects[projectIndex].bids[bidIndex] = {
      ...existingBid,
      ...bidData,
      updatedAt: new Date().toISOString()
    };
    
    projects[projectIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      bid: projects[projectIndex].bids[bidIndex],
      message: 'Bid updated successfully'
    };
  },

  // Accept bid - FIXED: matches DashboardPage.jsx call
  async accept(projectId, bidId) {
    console.log('✅ Accepting bid:', bidId);
    
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}/accept`, {
        method: 'POST'
      });
      
      if (data) {
        console.log('✅ Bid accepted via backend');
        return data;
      }
      
      console.log('🔄 Backend not available, using mock');
      return this._mockAccept(projectId, bidId);
    } catch (error) {
      console.log('🔄 Error accepting bid:', error.message);
      return this._mockAccept(projectId, bidId);
    }
  },

  // Mock accept bid
  _mockAccept(projectId, bidId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const bidIndex = projects[projectIndex].bids?.findIndex(b => b._id === bidId);
    
    if (bidIndex === -1 || !projects[projectIndex].bids) {
      throw new Error('Bid not found');
    }
    
    // Accept this bid
    projects[projectIndex].bids[bidIndex].status = 'accepted';
    projects[projectIndex].bids[bidIndex].acceptedAt = new Date().toISOString();
    
    // Reject all other bids
    projects[projectIndex].bids.forEach((bid, index) => {
      if (index !== bidIndex && bid.status === 'pending') {
        bid.status = 'rejected';
        bid.rejectedAt = new Date().toISOString();
      }
    });
    
    // Update project status
    projects[projectIndex].status = 'active';
    projects[projectIndex].selectedBid = projects[projectIndex].bids[bidIndex];
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      bid: projects[projectIndex].bids[bidIndex],
      project: projects[projectIndex],
      message: 'Bid accepted successfully'
    };
  },

  // Reject bid - FIXED: matches DashboardPage.jsx call
  async reject(projectId, bidId, rejectionData = {}) {
    console.log('❌ Rejecting bid:', bidId);
    
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}/reject`, {
        method: 'POST',
        body: JSON.stringify(rejectionData)
      });
      
      if (data) {
        console.log('✅ Bid rejected via backend');
        return data;
      }
      
      console.log('🔄 Backend not available, using mock');
      return this._mockReject(projectId, bidId, rejectionData);
    } catch (error) {
      console.log('🔄 Error rejecting bid:', error.message);
      return this._mockReject(projectId, bidId, rejectionData);
    }
  },

  // Mock reject bid
  _mockReject(projectId, bidId, rejectionData = {}) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const bidIndex = projects[projectIndex].bids?.findIndex(b => b._id === bidId);
    
    if (bidIndex === -1 || !projects[projectIndex].bids) {
      throw new Error('Bid not found');
    }
    
    projects[projectIndex].bids[bidIndex].status = 'rejected';
    projects[projectIndex].bids[bidIndex].rejectedAt = new Date().toISOString();
    projects[projectIndex].bids[bidIndex].rejectionReason = rejectionData.reason;
    
    projects[projectIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      bid: projects[projectIndex].bids[bidIndex],
      message: 'Bid rejected successfully'
    };
  },

  // Withdraw bid - FIXED: matches DashboardPage.jsx call
  async withdraw(projectId, bidId) {
    console.log('↩️ Withdrawing bid:', bidId);
    
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}/withdraw`, {
        method: 'POST'
      });
      
      if (data) {
        console.log('✅ Bid withdrawn via backend');
        return data;
      }
      
      console.log('🔄 Backend not available, using mock');
      return this._mockWithdraw(projectId, bidId);
    } catch (error) {
      console.log('🔄 Error withdrawing bid:', error.message);
      return this._mockWithdraw(projectId, bidId);
    }
  },

  // Mock withdraw bid
  _mockWithdraw(projectId, bidId) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const bidIndex = projects[projectIndex].bids?.findIndex(b => b._id === bidId);
    
    if (bidIndex === -1 || !projects[projectIndex].bids) {
      throw new Error('Bid not found');
    }
    
    // Check if bid belongs to current user
    const bid = projects[projectIndex].bids[bidIndex];
    if (bid.companyId !== (currentUser.companyId || currentUser._id)) {
      throw new Error('Not authorized to withdraw this bid');
    }
    
    if (bid.status !== 'pending') {
      throw new Error('Only pending bids can be withdrawn');
    }
    
    projects[projectIndex].bids[bidIndex].status = 'withdrawn';
    projects[projectIndex].bids[bidIndex].withdrawnAt = new Date().toISOString();
    
    projects[projectIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      bid: projects[projectIndex].bids[bidIndex],
      message: 'Bid withdrawn successfully'
    };
  },

  // Get company bids - FIXED: matches DashboardPage.jsx call
  async getCompanyBids(filters = {}) {
    console.log('📋 Fetching company bids');
    
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const data = await fetchWithAuth(`/bids/company${queryParams ? `?${queryParams}` : ''}`);
      
      if (data) {
        console.log(`✅ Found ${data.bids?.length || 0} company bids from backend`);
        return data;
      }
      
      console.log('🔄 Backend not available, using mock');
      return this._mockGetCompanyBids(filters);
    } catch (error) {
      console.log('🔄 Error fetching company bids:', error.message);
      return this._mockGetCompanyBids(filters);
    }
  },

  // Mock get company bids
  _mockGetCompanyBids(filters = {}) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    // Get all bids from current company
    const allBids = [];
    
    projects.forEach(project => {
      if (project.bids) {
        project.bids.forEach(bid => {
          if (bid.companyId === (currentUser.companyId || currentUser._id)) {
            allBids.push({
              ...bid,
              projectId: project._id,
              projectTitle: project.title,
              projectCategory: project.category,
              projectStatus: project.status
            });
          }
        });
      }
    });
    
    // Apply filters
    let filteredBids = allBids;
    
    if (filters.status && filters.status !== 'all') {
      filteredBids = filteredBids.filter(b => b.status === filters.status);
    }
    
    return {
      success: true,
      bids: filteredBids,
      total: filteredBids.length,
      stats: {
        pending: allBids.filter(b => b.status === 'pending').length,
        accepted: allBids.filter(b => b.status === 'accepted').length,
        rejected: allBids.filter(b => b.status === 'rejected').length,
        withdrawn: allBids.filter(b => b.status === 'withdrawn').length
      }
    };
  },

  // // Get bid by ID
  // async getById(bidId) {
  //   try {
  //     const data = await fetchWithAuth(`/bids/${bidId}`);
  //     if (data) return data;
      
  //     return this._mockGetById(bidId);
  //   } catch (error) {
  //     return this._mockGetById(bidId);
  //   }
  // },

  // Mock get bid by ID
  _mockGetById(bidId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    for (const project of projects) {
      if (project.bids) {
        const bid = project.bids.find(b => b._id === bidId);
        if (bid) {
          return {
            success: true,
            bid: {
              ...bid,
              projectId: project._id,
              projectTitle: project.title
            }
          };
        }
      }
    }
    
    throw new Error('Bid not found');
  }
};

// ==========================================
// Projects API - ENHANCED SECTION
// ==========================================
export const projectAPI = {
  // ==========================================
  // EXISTING FUNCTIONS (updated)
  // ==========================================

  // Get all projects
  async getAll(filters = {}) {
    console.log('📋 Fetching projects with filters:', filters);
    try {
      const queryParams = new URLSearchParams();
      // const queryParams = new URLSearchParams(filters).toString();

      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });

      const data = await fetchWithAuth(`/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      // const data = await fetchWithAuth(`/projects${queryParams ? `?${queryParams}` : ''}`);
      
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

  // Create new project
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
      return this._mockCreate(projectData);
    }
  },

  // Mock create project
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
      clientName: currentUser.name,
      status: projectData.status || 'posted',
      bids: [],
      invitedCompanies: [],
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

  // Submit bid - Alias for bidAPI.submit()
  async submitBid(projectId, bidData) {
    return bidAPI.submit(projectId, bidData);
  },

  // Update project
  async update(id, projectData) {
    try {
      const data = await fetchWithAuth(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData)
      });
      
      if (data) return data;
      
      return this._mockUpdate(id, projectData);
    } catch (error) {
      return this._mockUpdate(id, projectData);
    }
  },

  // Mock update project
  _mockUpdate(id, projectData) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === id);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const currentUser = authAPI.getCachedUser();
    if (projects[projectIndex].clientId !== currentUser._id) {
      throw new Error('Not authorized to update this project');
    }
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...projectData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      project: projects[projectIndex],
      message: 'Project updated successfully'
    };
  },

  // Cancel/Delete project
  async cancel(id) {
    try {
      const data = await fetchWithAuth(`/projects/${id}`, {
        method: 'DELETE'
      });
      
      if (data) return data;
      
      return this._mockCancel(id);
    } catch (error) {
      return this._mockCancel(id);
    }
  },

  // Mock cancel project
  _mockCancel(id) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === id);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const currentUser = authAPI.getCachedUser();
    if (projects[projectIndex].clientId !== currentUser._id) {
      throw new Error('Not authorized to cancel this project');
    }
    
    projects[projectIndex].status = 'cancelled';
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      message: 'Project cancelled successfully'
    };
  },

  // Update bid status - for compatibility
  async updateBidStatus(projectId, bidId, status) {
    if (status === 'accepted') {
      return bidAPI.accept(projectId, bidId);
    } else if (status === 'rejected') {
      return bidAPI.reject(projectId, bidId, { reason: 'Not selected' });
    } else {
      return bidAPI.update(projectId, bidId, { status });
    }
  },

  // Get company bids - Alias for bidAPI.getCompanyBids()
  async getCompanyBids() {
    return bidAPI.getCompanyBids();
  },

  // Get company projects
  async getCompanyProjects() {
    try {
      const data = await fetchWithAuth('/projects/company/my-projects');
      if (data) return data;
      
      return this._mockGetCompanyProjects();
    } catch (error) {
      return this._mockGetCompanyProjects();
    }
  },

  // Mock get company projects
  _mockGetCompanyProjects() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    // Get projects where company has accepted bid
    const companyProjects = projects.filter(p => 
      p.bids && p.bids.some(bid => 
        bid.companyId === (currentUser.companyId || currentUser._id) && 
        bid.status === 'accepted'
      )
    );
    
    return {
      success: true,
      projects: companyProjects
    };
  },

  // Get company invitations
  async getCompanyInvitations() {
    try {
      const data = await fetchWithAuth('/projects/company/invitations');
      if (data) return data;
      
      return this._mockGetCompanyInvitations();
    } catch (error) {
      return this._mockGetCompanyInvitations();
    }
  },

  // Mock get company invitations
  _mockGetCompanyInvitations() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser || !currentUser.companyId) {
      return { success: true, invitations: [] };
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    const invitations = projects.filter(p => 
      p.invitedCompanies && 
      p.invitedCompanies.includes(currentUser.companyId) &&
      ['posted', 'bidding'].includes(p.status)
    );
    
    return {
      success: true,
      invitations: invitations.map(project => ({
        ...project,
        hasBid: project.bids?.some(bid => bid.companyId === currentUser.companyId) || false
      }))
    };
  },

  // Invite company to bid
  async inviteCompany(projectId, companyId) {
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ companyId })
      });
      
      if (data) return data;
      
      return this._mockInviteCompany(projectId, companyId);
    } catch (error) {
      return this._mockInviteCompany(projectId, companyId);
    }
  },

  // Mock invite company
  _mockInviteCompany(projectId, companyId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    if (!projects[projectIndex].invitedCompanies) {
      projects[projectIndex].invitedCompanies = [];
    }
    
    // Check if already invited
    if (projects[projectIndex].invitedCompanies.includes(companyId)) {
      throw new Error('Company already invited to this project');
    }
    
    projects[projectIndex].invitedCompanies.push(companyId);
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      message: 'Company invited successfully'
    };
  },

  // ==========================================
  // NEW FUNCTIONS (based on backend routes)
  // ==========================================

  // ✅ NEW: Get project bids
  async getProjectBids(projectId) {
    console.log('📋 Fetching bids for project:', projectId);
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids`);
      if (data) {
        console.log(`✅ Found ${data.bids?.length || 0} bids from backend`);
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetProjectBids(projectId);
    } catch (error) {
      console.log('🔄 Error fetching project bids, using mock');
      return this._mockGetProjectBids(projectId);
    }
  },

  // Mock get project bids
  _mockGetProjectBids(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p._id === projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    return {
      success: true,
      bids: project.bids || [],
      projectTitle: project.title,
      isOwner: true // This would need proper auth check
    };
  },

  // ✅ NEW: Get company's bids (different from getCompanyBids)
  async getCompanyMyBids(filters = {}) {
    console.log('📋 Fetching company bids via projects endpoint');
    try {
      const data = await fetchWithAuth('/projects/company/my-bids');
      if (data) {
        console.log(`✅ Found ${data.projects?.length || 0} company bids from backend`);
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetCompanyMyBids(filters);
    } catch (error) {
      console.log('🔄 Error fetching company bids, using mock');
      return this._mockGetCompanyMyBids(filters);
    }
  },

  // Mock get company my bids
  _mockGetCompanyMyBids(filters = {}) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const companyProjects = projects.filter(p => 
      p.bids && p.bids.some(bid => 
        bid.companyId === (currentUser.companyId || currentUser._id)
      )
    );
    
    const projectsWithBids = companyProjects.map(project => {
      const projectObj = { ...project };
      projectObj.myBid = project.bids.find(bid => 
        bid.companyId === (currentUser.companyId || currentUser._id)
      );
      delete projectObj.bids;
      return projectObj;
    });
    
    return {
      success: true,
      projects: projectsWithBids
    };
  },

  // ✅ NEW: Accept bid (client only)
  async acceptBid(projectId, bidId) {
    console.log('✅ Accepting bid:', bidId);
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}/accept`, {
        method: 'POST'
      });
      
      if (data) {
        console.log('✅ Bid accepted via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockAcceptBid(projectId, bidId);
    } catch (error) {
      console.log('🔄 Error accepting bid, using mock');
      return this._mockAcceptBid(projectId, bidId);
    }
  },

  // Mock accept bid
  _mockAcceptBid(projectId, bidId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const bidIndex = projects[projectIndex].bids?.findIndex(b => b._id === bidId);
    
    if (bidIndex === -1 || !projects[projectIndex].bids) {
      throw new Error('Bid not found');
    }
    
    // Accept this bid
    projects[projectIndex].bids[bidIndex].status = 'accepted';
    projects[projectIndex].bids[bidIndex].acceptedAt = new Date().toISOString();
    
    // Reject all other bids
    projects[projectIndex].bids.forEach((bid, index) => {
      if (index !== bidIndex && bid.status === 'pending') {
        bid.status = 'rejected';
        bid.rejectedAt = new Date().toISOString();
      }
    });
    
    // Update project status
    projects[projectIndex].status = 'active';
    projects[projectIndex].selectedBid = projects[projectIndex].bids[bidIndex];
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      project: projects[projectIndex],
      message: 'Bid accepted successfully'
    };
  },

  // ✅ NEW: Reject bid (client only)
  async rejectBid(projectId, bidId, rejectionData = {}) {
    console.log('❌ Rejecting bid:', bidId);
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}/reject`, {
        method: 'POST',
        body: JSON.stringify(rejectionData)
      });
      
      if (data) {
        console.log('✅ Bid rejected via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockRejectBid(projectId, bidId, rejectionData);
    } catch (error) {
      console.log('🔄 Error rejecting bid, using mock');
      return this._mockRejectBid(projectId, bidId, rejectionData);
    }
  },

  // Mock reject bid
  _mockRejectBid(projectId, bidId, rejectionData = {}) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const bidIndex = projects[projectIndex].bids?.findIndex(b => b._id === bidId);
    
    if (bidIndex === -1 || !projects[projectIndex].bids) {
      throw new Error('Bid not found');
    }
    
    projects[projectIndex].bids[bidIndex].status = 'rejected';
    projects[projectIndex].bids[bidIndex].rejectedAt = new Date().toISOString();
    projects[projectIndex].bids[bidIndex].rejectionReason = rejectionData.reason;
    
    projects[projectIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      project: projects[projectIndex],
      message: 'Bid rejected successfully'
    };
  },

  // ✅ NEW: Withdraw bid (company only)
  async withdrawBid(projectId, bidId) {
    console.log('↩️ Withdrawing bid:', bidId);
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/bids/${bidId}/withdraw`, {
        method: 'POST'
      });
      
      if (data) {
        console.log('✅ Bid withdrawn via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockWithdrawBid(projectId, bidId);
    } catch (error) {
      console.log('🔄 Error withdrawing bid, using mock');
      return this._mockWithdrawBid(projectId, bidId);
    }
  },

  // Mock withdraw bid
  _mockWithdrawBid(projectId, bidId) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const bidIndex = projects[projectIndex].bids?.findIndex(b => b._id === bidId);
    
    if (bidIndex === -1 || !projects[projectIndex].bids) {
      throw new Error('Bid not found');
    }
    
    const bid = projects[projectIndex].bids[bidIndex];
    if (bid.companyId !== (currentUser.companyId || currentUser._id)) {
      throw new Error('Not authorized to withdraw this bid');
    }
    
    if (bid.status !== 'pending') {
      throw new Error('Only pending bids can be withdrawn');
    }
    
    projects[projectIndex].bids[bidIndex].status = 'withdrawn';
    projects[projectIndex].bids[bidIndex].withdrawnAt = new Date().toISOString();
    
    projects[projectIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      project: projects[projectIndex],
      message: 'Bid withdrawn successfully'
    };
  },

  // // ✅ NEW: Get invitations (alias for getCompanyInvitations)
  // async getInvitations() {
  //   console.log('📩 Fetching company invitations');
  //   return this.getCompanyInvitations();
  // },

  // ✅ NEW: Get project statistics
  async getStats(projectId) {
    console.log('📊 Fetching project stats for:', projectId);
    try {
      const data = await fetchWithAuth(`/projects/${projectId}/stats`);
      if (data) {
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetStats(projectId);
    } catch (error) {
      console.log('🔄 Error fetching project stats, using mock');
      return this._mockGetStats(projectId);
    }
  },

  // Mock get project stats
  _mockGetStats(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p._id === projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    return {
      success: true,
      stats: {
        totalBids: project.bids?.length || 0,
        pendingBids: project.bids?.filter(b => b.status === 'pending').length || 0,
        acceptedBids: project.bids?.filter(b => b.status === 'accepted').length || 0,
        rejectedBids: project.bids?.filter(b => b.status === 'rejected').length || 0,
        viewCount: project.viewCount || 0,
        avgBidAmount: project.bids?.length > 0 
          ? project.bids.reduce((sum, b) => sum + (b.amount || 0), 0) / project.bids.length 
          : 0
      }
    };
  },

  // // ✅ NEW: Search projects with advanced filters
  // async search(filters = {}) {
  //   console.log('🔍 Searching projects with filters:', filters);
  //   // Use getAll with search filters
  //   return this.getAll(filters);
  // },

  // ✅ NEW: Get project categories
  async getCategories() {
    console.log('📁 Fetching project categories');
    try {
      const data = await fetchWithAuth('/projects/categories');
      if (data) {
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetCategories();
    } catch (error) {
      console.log('🔄 Error fetching categories, using mock');
      return this._mockGetCategories();
    }
  },

  // Mock get categories
  _mockGetCategories() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
    
    return {
      success: true,
      categories: categories.map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        count: projects.filter(p => p.category === cat).length
      }))
    };
  }
};

// ==========================================
// Companies API - ENHANCED SECTION
// ==========================================
export const companyAPI = {
  // ==========================================
  // EXISTING FUNCTIONS (updated)
  // ==========================================

  // Get all companies
  async getAll(filters = {}) {
    console.log('🏢 Fetching companies with filters:', filters);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const data = await fetchWithAuth(`/companies${queryParams ? `?${queryParams}` : ''}`);
      
      if (data) {
        console.log(`✅ Found ${data.companies?.length || 0} companies from backend`);
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetAll(filters);
    } catch (error) {
      console.log('🔄 Error fetching companies, using mock');
      return this._mockGetAll(filters);
    }
  },

  // Mock get all companies
  _mockGetAll(filters = {}) {
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    console.log(`🔄 Using ${companies.length} mock companies from localStorage`);
    
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
    if (filters.location) {
      filteredCompanies = filteredCompanies.filter(c => 
        c.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.minRating) {
      filteredCompanies = filteredCompanies.filter(c => 
        (c.ratings?.average || 0) >= parseFloat(filters.minRating)
      );
    }
    
    return {
      success: true,
      companies: filteredCompanies,
      total: filteredCompanies.length,
      filters: {
        categoryCounts: [],
        priceRanges: []
      }
    };
  },

  // Get company by ID
  async getById(companyId) {
    console.log('🏢 Fetching company by ID:', companyId);
    try {
      const data = await fetchWithAuth(`/companies/${companyId}`);
      if (data) {
        console.log('✅ Found company from backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetById(companyId);
    } catch (error) {
      console.log('🔄 Error fetching company, using mock');
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

  // Get invitations
  async getInvitations() {
    console.log('📩 Fetching company invitations');
  
    try {
      const currentUser = authAPI.getCachedUser();
      if (!currentUser || currentUser.type !== 'company') {
        console.log('⚠️ User is not a company, returning empty invitations');
        return { success: true, invitations: [] };
      }

      // âœ… FIX: Check if companyId exists first
      if (!currentUser.companyId && !currentUser._id) {
        console.warn('⚠️ No companyId found for user');
        return { success: true, invitations: [] };
      }

      const companyId = currentUser.companyId || currentUser._id;
    
      // âœ… FIX: Use the correct endpoint (no company ID in path)
      const data = await fetchWithAuth(`/companies/${companyId}/invitations`);
    
      if (data) {
        console.log(`✅ Found ${data.invitations?.length || 0} invitations from backend`);
        return data;
      }
    
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetCompanyInvitations(companyId);
    
    } catch (error) {
      console.log('🔄 Error fetching invitations:', error.message);
    
      const currentUser = authAPI.getCachedUser();
      if (!currentUser) {
        return { success: true, invitations: [] };
      }
    
      const companyId = currentUser.companyId || currentUser._id;
      return this._mockGetCompanyInvitations(companyId);
    }
  },

  // Mock get invitations
  _mockGetInvitations() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      return { success: true, invitations: [] };
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    const invitations = projects.filter(p => 
      p.invitedCompanies && 
      p.invitedCompanies.includes(currentUser._id) &&
      ['posted', 'bidding'].includes(p.status)
    );
    
    return {
      success: true,
      invitations: invitations.map(project => ({
        ...project,
        hasBid: project.bids?.some(bid => bid.companyId === currentUser._id) || false
      }))
    };
  },

  // Request verification
  async requestVerification(verificationData) {
    console.log('✅ Requesting company verification');
    try {
      const data = await fetchWithAuth('/companies/verification/request', {
        method: 'POST',
        body: JSON.stringify(verificationData)
      });
      
      if (data) {
        console.log('✅ Verification request sent via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockRequestVerification(verificationData);
    } catch (error) {
      console.log('🔄 Error requesting verification, using mock');
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
  },

  // ==========================================
  // NEW FUNCTIONS (based on backend routes)
  // ==========================================

  // ✅ NEW: Create company profile
  async create(companyData) {
    console.log('🏢 Creating company profile:', companyData.name);
    try {
      const data = await fetchWithAuth('/companies', {
        method: 'POST',
        body: JSON.stringify(companyData)
      });
      
      if (data) {
        console.log('✅ Company profile created via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockCreate(companyData);
    } catch (error) {
      console.log('🔄 Error creating company profile, using mock');
      return this._mockCreate(companyData);
    }
  },

  // Mock create company
  _mockCreate(companyData) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser || currentUser.type !== 'company') {
      throw new Error('Only companies can create profiles');
    }
    
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    
    const newCompany = {
      _id: Date.now().toString(),
      userId: currentUser._id,
      ...companyData,
      verified: false,
      verificationStatus: 'pending',
      ratings: {
        average: 0,
        count: 0,
        reviews: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    companies.push(newCompany);
    localStorage.setItem('companies', JSON.stringify(companies));
    
    // Update current user with companyId
    currentUser.companyId = newCompany._id;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    return {
      success: true,
      company: newCompany,
      message: 'Company profile created successfully'
    };
  },

  // ✅ NEW: Update company profile
  async update(companyId, companyData) {
    console.log('✏️ Updating company profile:', companyId);
    try {
      const data = await fetchWithAuth(`/companies/${companyId}`, {
        method: 'PUT',
        body: JSON.stringify(companyData)
      });
      
      if (data) {
        console.log('✅ Company profile updated via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockUpdate(companyId, companyData);
    } catch (error) {
      console.log('🔄 Error updating company profile, using mock');
      return this._mockUpdate(companyId, companyData);
    }
  },

  // Mock update company
  _mockUpdate(companyId, companyData) {
    const currentUser = authAPI.getCachedUser();
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const companyIndex = companies.findIndex(c => c._id === companyId);
    
    if (companyIndex === -1) {
      throw new Error('Company not found');
    }
    
    // Check ownership
    if (companies[companyIndex].userId !== currentUser._id && currentUser.type !== 'admin') {
      throw new Error('Not authorized to update this company');
    }
    
    companies[companyIndex] = {
      ...companies[companyIndex],
      ...companyData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('companies', JSON.stringify(companies));
    
    return {
      success: true,
      company: companies[companyIndex],
      message: 'Company profile updated successfully'
    };
  },

  // ✅ NEW: Get company dashboard stats
  async getDashboard(companyId) {
    console.log('📊 Fetching company dashboard:', companyId);
    try {
      const data = await fetchWithAuth(`/companies/${companyId}/dashboard`);
      if (data) {
        console.log('✅ Dashboard data fetched from backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetDashboard(companyId);
    } catch (error) {
      console.log('🔄 Error fetching dashboard, using mock');
      return this._mockGetDashboard(companyId);
    }
  },

  // Mock get dashboard
  _mockGetDashboard(companyId) {
    const currentUser = authAPI.getCachedUser();
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    const company = companies.find(c => c._id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Calculate stats
    const activeProjects = projects.filter(p => 
      p.bids && p.bids.some(bid => 
        bid.companyId === companyId && 
        bid.status === 'accepted' && 
        p.status === 'active'
      )
    ).length;
    
    const completedProjects = projects.filter(p => 
      p.bids && p.bids.some(bid => 
        bid.companyId === companyId && 
        bid.status === 'accepted' && 
        p.status === 'completed'
      )
    ).length;
    
    const pendingBids = projects.filter(p => 
      p.bids && p.bids.some(bid => 
        bid.companyId === companyId && 
        bid.status === 'pending'
      )
    ).length;
    
    const activeInvitations = projects.filter(p => 
      p.invitedCompanies && 
      p.invitedCompanies.includes(companyId) &&
      ['posted', 'bidding'].includes(p.status)
    ).length;
    
    // Calculate revenue
    const acceptedBids = projects.flatMap(p => 
      (p.bids || []).filter(bid => 
        bid.companyId === companyId && 
        bid.status === 'accepted'
      )
    );
    
    const totalRevenue = acceptedBids.reduce((sum, bid) => sum + (bid.amount || 0), 0);
    
    return {
      success: true,
      dashboard: {
        stats: {
          activeProjects,
          completedProjects,
          pendingBids,
          activeInvitations,
          unreadNotifications: 0
        },
        revenue: {
          totalRevenue,
          avgRevenue: completedProjects > 0 ? totalRevenue / completedProjects : 0,
          projectCount: completedProjects
        },
        recentNotifications: [],
        verificationStatus: company.verificationStatus || 'pending',
        profileCompletion: this._calculateProfileCompletion(company)
      }
    };
  },

  // ✅ NEW: Add portfolio item
  async addPortfolio(companyId, portfolioData) {
    console.log('🎨 Adding portfolio item for company:', companyId);
    try {
      const data = await fetchWithAuth(`/companies/${companyId}/portfolio`, {
        method: 'POST',
        body: JSON.stringify(portfolioData)
      });
      
      if (data) {
        console.log('✅ Portfolio item added via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockAddPortfolio(companyId, portfolioData);
    } catch (error) {
      console.log('🔄 Error adding portfolio item, using mock');
      return this._mockAddPortfolio(companyId, portfolioData);
    }
  },

  // Mock add portfolio
  _mockAddPortfolio(companyId, portfolioData) {
    const currentUser = authAPI.getCachedUser();
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const companyIndex = companies.findIndex(c => c._id === companyId);
    
    if (companyIndex === -1) {
      throw new Error('Company not found');
    }
    
    // Check ownership
    if (companies[companyIndex].userId !== currentUser._id && currentUser.type !== 'admin') {
      throw new Error('Not authorized to add portfolio');
    }
    
    const portfolioItem = {
      ...portfolioData,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    if (!companies[companyIndex].portfolio) {
      companies[companyIndex].portfolio = [];
    }
    
    companies[companyIndex].portfolio.push(portfolioItem);
    companies[companyIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('companies', JSON.stringify(companies));
    
    return {
      success: true,
      portfolioItem,
      message: 'Portfolio item added successfully'
    };
  },

  // ✅ NEW: Respond to invitation (accept/decline)
  async respondToInvitation(companyId, projectId, response, reason = '') {
    console.log(`📩 Responding to invitation: ${response} for project:`, projectId);
    try {
      const data = await fetchWithAuth(`/companies/${companyId}/invitations/${projectId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response, reason })
      });
      
      if (data) {
        console.log('✅ Invitation response sent via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockRespondToInvitation(companyId, projectId, response, reason);
    } catch (error) {
      console.log('🔄 Error responding to invitation, using mock');
      return this._mockRespondToInvitation(companyId, projectId, response, reason);
    }
  },

  // Mock respond to invitation
  _mockRespondToInvitation(companyId, projectId, response, reason) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    if (response === 'decline') {
      // Remove from invited list
      projects[projectIndex].invitedCompanies = 
        projects[projectIndex].invitedCompanies?.filter(id => id !== companyId) || [];
    }
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      message: `Invitation ${response}d successfully${reason ? `: ${reason}` : ''}`,
      data: {
        response,
        projectId,
        companyId,
        reason
      }
    };
  },

  // ✅ NEW: Get company's bids and projects
  async getCompanyBids(companyId, filters = {}) {
    console.log('📋 Fetching company bids for:', companyId);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const data = await fetchWithAuth(`/companies/${companyId}/bids${queryParams ? `?${queryParams}` : ''}`);
      
      if (data) {
        console.log(`✅ Found ${data.bids?.length || 0} company bids from backend`);
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetCompanyBids(companyId, filters);
    } catch (error) {
      console.log('🔄 Error fetching company bids, using mock');
      return this._mockGetCompanyBids(companyId, filters);
    }
  },

  // Mock get company bids
  _mockGetCompanyBids(companyId, filters = {}) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const company = companies.find(c => c._id === companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Get all bids from this company
    const allBids = [];
    
    projects.forEach(project => {
      if (project.bids) {
        project.bids.forEach(bid => {
          if (bid.companyId === companyId) {
            allBids.push({
              ...bid,
              projectId: project._id,
              projectTitle: project.title,
              projectCategory: project.category,
              projectStatus: project.status,
              clientName: project.clientName
            });
          }
        });
      }
    });
    
    // Apply filters
    let filteredBids = allBids;
    
    if (filters.status && filters.status !== 'all') {
      filteredBids = filteredBids.filter(b => b.status === filters.status);
    }
    
    if (filters.type === 'active') {
      filteredBids = filteredBids.filter(b => b.projectStatus === 'active');
    } else if (filters.type === 'completed') {
      filteredBids = filteredBids.filter(b => b.projectStatus === 'completed');
    } else if (filters.type === 'open') {
      filteredBids = filteredBids.filter(b => ['posted', 'bidding'].includes(b.projectStatus));
    }
    
    // Get bid statistics
    const pendingBids = allBids.filter(b => b.status === 'pending').length;
    const acceptedBids = allBids.filter(b => b.status === 'accepted' && b.projectStatus === 'active').length;
    const rejectedBids = allBids.filter(b => b.status === 'rejected').length;
    
    return {
      success: true,
      bids: filteredBids,
      pagination: {
        page: 1,
        limit: filteredBids.length,
        total: filteredBids.length,
        totalPages: 1
      },
      stats: {
        pending: pendingBids,
        accepted: acceptedBids,
        rejected: rejectedBids,
        totalBids: allBids.length
      }
    };
  },

  // ✅ NEW: Invite company to bid on a project (client only)
  async inviteToBid(companyId, projectId, message = '') {
    console.log('🤝 Inviting company to bid:', { companyId, projectId });
    try {
      const data = await fetchWithAuth(`/companies/${companyId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ projectId, message })
      });
      
      if (data) {
        console.log('✅ Invitation sent via backend');
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockInviteToBid(companyId, projectId, message);
    } catch (error) {
      console.log('🔄 Error sending invitation, using mock');
      return this._mockInviteToBid(companyId, projectId, message);
    }
  },

  // Mock invite to bid
  _mockInviteToBid(companyId, projectId, message) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p._id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    if (!projects[projectIndex].invitedCompanies) {
      projects[projectIndex].invitedCompanies = [];
    }
    
    // Check if already invited
    if (projects[projectIndex].invitedCompanies.includes(companyId)) {
      throw new Error('Company already invited to this project');
    }
    
    projects[projectIndex].invitedCompanies.push(companyId);
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    return {
      success: true,
      message: `Invitation sent to company`,
      data: {
        companyId,
        projectId,
        projectTitle: projects[projectIndex].title,
        message
      }
    };
  },

  // ✅ NEW: Get company invitations (specific company)
  async getCompanyInvitations(companyId) {
    console.log('📩 Fetching invitations for company:', companyId);
    try {
      const data = await fetchWithAuth(`/companies/${companyId}/invitations`);
      if (data) {
        console.log(`✅ Found ${data.invitations?.length || 0} invitations from backend`);
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetCompanyInvitations(companyId);
    } catch (error) {
      console.log('🔄 Error fetching company invitations, using mock');
      return this._mockGetCompanyInvitations(companyId);
    }
  },

  // Mock get company invitations
  _mockGetCompanyInvitations(companyId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const company = companies.find(c => c._id === companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    const invitations = projects.filter(p => 
      p.invitedCompanies && 
      p.invitedCompanies.includes(companyId) &&
      ['posted', 'bidding', 'active'].includes(p.status)
    );
    
    const invitationsWithStats = invitations.map(project => {
      const existingBid = project.bids?.find(bid => bid.companyId === companyId);
      const totalBids = project.bids?.length || 0;
      
      return {
        ...project,
        hasBid: !!existingBid,
        bidStatus: existingBid ? existingBid.status : null,
        totalBids,
        daysRemaining: project.expiresAt 
          ? Math.ceil((new Date(project.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      };
    });
    
    return {
      success: true,
      invitations: invitationsWithStats
    };
  },

  // // ✅ NEW: Search companies with advanced filters
  // async search(filters = {}) {
  //   console.log('🔍 Searching companies with filters:', filters);
  //   // Use getAll with search filters
  //   return this.getAll(filters);
  // },

  // ✅ NEW: Get company categories
  async getCategories() {
    console.log('📁 Fetching company categories');
    try {
      const data = await fetchWithAuth('/companies/categories');
      if (data) {
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetCategories();
    } catch (error) {
      console.log('🔄 Error fetching categories, using mock');
      return this._mockGetCategories();
    }
  },

  // Mock get categories
  _mockGetCategories() {
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const categories = [...new Set(companies.map(c => c.category).filter(Boolean))];
    
    return {
      success: true,
      categories: categories.map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        count: companies.filter(c => c.category === cat).length
      }))
    };
  },

  // ✅ NEW: Get verified companies
  async getVerified(filters = {}) {
    console.log('✅ Fetching verified companies');
    return this.getAll({ ...filters, verified: true });
  },

  // ✅ NEW: Get company statistics
  async getStats(companyId) {
    console.log('📊 Fetching company statistics:', companyId);
    try {
      const data = await fetchWithAuth(`/companies/${companyId}/stats`);
      if (data) {
        return data;
      }
      
      console.log('🔄 Backend returned null, using mock');
      return this._mockGetStats(companyId);
    } catch (error) {
      console.log('🔄 Error fetching company stats, using mock');
      return this._mockGetStats(companyId);
    }
  },

  // Mock get company stats
  _mockGetStats(companyId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const company = companies.find(c => c._id === companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Calculate stats
    const companyBids = projects.flatMap(p => 
      (p.bids || []).filter(bid => bid.companyId === companyId)
    );
    
    const acceptedBids = companyBids.filter(b => b.status === 'accepted');
    const pendingBids = companyBids.filter(b => b.status === 'pending');
    const rejectedBids = companyBids.filter(b => b.status === 'rejected');
    
    const totalEarned = acceptedBids.reduce((sum, b) => sum + (b.amount || 0), 0);
    const successRate = companyBids.length > 0 ? 
      (acceptedBids.length / companyBids.length) * 100 : 0;
    
    return {
      success: true,
      stats: {
        totalBids: companyBids.length,
        acceptedBids: acceptedBids.length,
        pendingBids: pendingBids.length,
        rejectedBids: rejectedBids.length,
        totalEarned,
        avgProjectValue: acceptedBids.length > 0 ? 
          totalEarned / acceptedBids.length : 0,
        successRate,
        responseTime: 24
      }
    };
  },

  // ✅ HELPER: Calculate profile completion percentage
  _calculateProfileCompletion(company) {
    const fields = [
      { field: 'name', weight: 10 },
      { field: 'description', weight: 15 },
      { field: 'services', weight: 15, check: (val) => val && val.length > 0 },
      { field: 'portfolio', weight: 20, check: (val) => val && val.length > 0 },
      { field: 'location', weight: 10 },
      { field: 'website', weight: 5 },
      { field: 'teamSize', weight: 5 },
      { field: 'yearsInBusiness', weight: 5 },
      { field: 'logo', weight: 10 },
      { field: 'tagline', weight: 5 }
    ];

    let completion = 0;
    let totalWeight = 0;

    fields.forEach(({ field, weight, check }) => {
      totalWeight += weight;
      if (check) {
        if (check(company[field])) completion += weight;
      } else if (company[field]) {
        completion += weight;
      }
    });

    return Math.round((completion / totalWeight) * 100);
  }
};

// ==========================================
// User API - NEW SECTION (for Dashboard analytics)
// ==========================================
export const userAPI = {
  // Get client analytics - FIXED: matches DashboardPage.jsx call
  async getClientAnalytics() {
    try {
      const data = await fetchWithAuth('/users/analytics/client');
      if (data) return data;
      
      return this._mockGetClientAnalytics();
    } catch (error) {
      return this._mockGetClientAnalytics();
    }
  },

  // Mock get client analytics
  _mockGetClientAnalytics() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser || currentUser.type !== 'client') {
      throw new Error('Not authorized or not a client');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const userProjects = projects.filter(p => p.clientId === currentUser._id);
    
    const totalBids = userProjects.reduce((sum, p) => sum + (p.bids?.length || 0), 0);
    const acceptedBids = userProjects.reduce((sum, p) => 
      sum + (p.bids?.filter(b => b.status === 'accepted').length || 0), 0
    );
    const activeProjects = userProjects.filter(p => p.status === 'active').length;
    const completedProjects = userProjects.filter(p => p.status === 'completed').length;
    
    const totalSpent = userProjects.reduce((sum, p) => {
      const acceptedBid = p.bids?.find(b => b.status === 'accepted');
      return sum + (acceptedBid?.amount || 0);
    }, 0);
    
    return {
      success: true,
      metrics: {
        totalProjects: userProjects.length,
        totalBids,
        acceptedBids,
        activeProjects,
        completedProjects,
        totalSpent,
        avgBidAmount: totalBids > 0 ? 
          userProjects.reduce((sum, p) => 
            sum + (p.bids?.reduce((bidSum, b) => bidSum + b.amount, 0) || 0), 0
          ) / totalBids : 0
      }
    };
  },

  // Get company analytics - FIXED: matches DashboardPage.jsx call
  async getCompanyAnalytics() {
    try {
      const data = await fetchWithAuth('/users/analytics/company');
      if (data) return data;
      
      return this._mockGetCompanyAnalytics();
    } catch (error) {
      return this._mockGetCompanyAnalytics();
    }
  },

  // Mock get company analytics
  _mockGetCompanyAnalytics() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser || currentUser.type !== 'company') {
      throw new Error('Not authorized or not a company');
    }
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const companyBids = projects.flatMap(p => 
      (p.bids || []).filter(b => b.companyId === (currentUser.companyId || currentUser._id))
    );
    
    const acceptedBids = companyBids.filter(b => b.status === 'accepted');
    const pendingBids = companyBids.filter(b => b.status === 'pending');
    const rejectedBids = companyBids.filter(b => b.status === 'rejected');
    
    const totalEarned = acceptedBids.reduce((sum, b) => sum + (b.amount || 0), 0);
    const successRate = companyBids.length > 0 ? 
      (acceptedBids.length / companyBids.length) * 100 : 0;
    
    return {
      success: true,
      metrics: {
        totalBids: companyBids.length,
        acceptedBids: acceptedBids.length,
        pendingBids: pendingBids.length,
        rejectedBids: rejectedBids.length,
        totalEarned,
        avgProjectValue: acceptedBids.length > 0 ? 
          totalEarned / acceptedBids.length : 0,
        successRate,
        responseTime: 24 // Mock average response time in hours
      }
    };
  },

  // Get user profile - FIXED: matches DashboardPage.jsx call
  async getProfile() {
    try {
      const data = await fetchWithAuth('/users/profile');
      if (data) return data;
      
      return this._mockGetProfile();
    } catch (error) {
      return this._mockGetProfile();
    }
  },

  // Mock get profile
  _mockGetProfile() {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    return {
      success: true,
      user: currentUser
    };
  },

  // Update profile
  async updateProfile(profileData) {
    try {
      const data = await fetchWithAuth('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      if (data) return data;
      
      return this._mockUpdateProfile(profileData);
    } catch (error) {
      return this._mockUpdateProfile(profileData);
    }
  },

  // Mock update profile
  _mockUpdateProfile(profileData) {
    const currentUser = authAPI.getCachedUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const updatedUser = { ...currentUser, ...profileData, updatedAt: new Date().toISOString() };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    return {
      success: true,
      user: updatedUser
    };
  }
};

// ==========================================
// Notifications API
// ==========================================
export const notificationAPI = {
  // Get notifications - FIXED: matches DashboardPage.jsx call
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