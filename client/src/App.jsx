import { useState, useEffect } from "react";
import { Header } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
import { HomePage } from "./components/HomePage.jsx";
import { BrowsePage } from "./components/BrowsePage.jsx";
import { BrowseProjectsPage } from "./components/BrowseProjectsPage.jsx";
import { ProjectDetailPage } from "./components/ProjectDetailPage.jsx";
import { PostProjectPage } from "./components/PostProjectPage.jsx";
import { DashboardPage } from "./components/DashboardPage.jsx";
import { AboutPage } from "./components/AboutPage.jsx";
import { ContactPage } from "./components/ContactPage.jsx";
import { SignInModal } from "./components/SignInModal.jsx";
import { SignUpModal } from "./components/SignUpModal.jsx";
import { AdminLoginModal } from "./components/AdminLoginModal.jsx";
import { Chatbot } from "./components/Chatbot.jsx";
import { AdminDashboard } from "./components/AdminDashboard.jsx";
import { TermsOfServicePage } from "./components/TermsOfServicePage.jsx";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage.jsx";
import { Toast } from "./components/Toast.jsx";
import { TranslationProvider } from "./contexts/TranslationContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { authAPI } from "./services/api.js";
import { CompanyProfilePage } from "./components/CompanyProfilePage.jsx";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [activeFilter, setActiveFilter] = useState(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Separate admin state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  
  const [language, setLanguage] = useState('en');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [signUpDefaultTab, setSignUpDefaultTab] = useState("client");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // ✅ FIXED: Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking authentication status...');
  
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('currentUser');
  
      if (!token || !savedUser) {
        console.log('❌ No token or saved user found');
        setCurrentUser(null);           // ✅ FIXED: was setUser
        setIsLoggedIn(false);            // ✅ ADDED: update login state
        setUserType(null);               // ✅ ADDED: clear user type
        setIsLoadingAuth(false);         // ✅ FIXED: was setLoading
        return;
      }

      try {
        console.log('🔑 Token found:', token.substring(0, 20) + '...');
        console.log('👤 Saved user:', JSON.parse(savedUser).email);
    
        // Try to verify token with backend
        const response = await authAPI.getCurrentUser();
    
        if (response && response.email) {
          console.log('✅ Token verified, user authenticated:', response.email);
          setCurrentUser(response);      // ✅ FIXED: was setUser
          setIsLoggedIn(true);           // ✅ ADDED: update login state
          setUserType(response.type);    // ✅ ADDED: set user type
      
          // Update localStorage with fresh data
          localStorage.setItem('currentUser', JSON.stringify(response));
        } else {
          // Token invalid, clear auth
          console.warn('⚠️ Token verification failed');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);          // ✅ FIXED: was setUser
          setIsLoggedIn(false);          // ✅ ADDED
          setUserType(null);             // ✅ ADDED
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error.message);
    
        // If 401, clear auth and prompt login
        if (error.message.includes('session has expired') || error.message.includes('sign in')) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);          // ✅ FIXED: was setUser
          setIsLoggedIn(false);          // ✅ ADDED
          setUserType(null);             // ✅ ADDED
          showToast('Your session has expired. Please sign in again.', 'error'); // ✅ FIXED: was toast.error
        } else {
          // Other errors, use saved user (offline mode)
          console.log('📴 Backend unavailable, using saved user');
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);    // ✅ FIXED: was setUser
          setIsLoggedIn(true);           // ✅ ADDED
          setUserType(parsedUser.type);  // ✅ ADDED
        }
      } finally {
        setIsLoadingAuth(false);         // ✅ FIXED: was setLoading
      }
    };

    checkAuth();
  }, []); // ✅ Empty dependency array - only run once on mount

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('techconnect_language');
    if (savedLanguage && ['en', 'ur'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleNavigate = (page, params) => {
    console.log(`Navigating to: ${page}`, params);

    // Handle company profile navigation
    if (page === 'company-profile' && params) {
      setSelectedCompanyId(params);
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Handle project ID for project detail page
    if (page === 'project-detail' && params) {
      setSelectedProjectId(params);
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Handle edit project page
    if (page === 'edit-project' && params) {
      setSelectedProjectId(params);
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Admin can ONLY access 'admin', 'home', 'terms', and 'privacy' pages
    if (isAdminLoggedIn && page !== 'admin' && page !== 'home' && page !== 'terms' && page !== 'privacy') {
      console.log('Admin navigation prevented to:', page);
      return;
    }

    // Admin panel requires admin login
    if (page === 'admin' && !isAdminLoggedIn) {
      setShowAdminLoginModal(true);
      return;
    }

    // Other protected pages require regular login
    if ((page === 'dashboard' || page === 'post-project' || page === 'edit-project' || page === 'browse-projects' || page === 'project-detail') && !isLoggedIn && !isAdminLoggedIn) {
      setShowSignInModal(true);
      return;
    }

    // Browse projects page - accessible to logged in users only
    if (page === 'browse-projects') {
      if (!isLoggedIn) {
        setShowSignInModal(true);
        return;
      }
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Terms and Privacy pages are accessible to all
    if (page === 'terms' || page === 'privacy') {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCurrentPage(page);
    
    // Handle filter for browse page
    if (params && page === 'browse') {
      setActiveFilter(params);
    } else {
      setActiveFilter(undefined);
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignIn = async (type, userData = null, isNewUser = false) => {
    // Close ALL modals IMMEDIATELY before any other action
    setShowSignInModal(false);
    setShowSignUpModal(false);
    setShowAdminLoginModal(false);
    
    // Set login state
    setIsLoggedIn(true);
    setUserType(type);
    
    // Show appropriate welcome message
    const userName = userData?.name || 'User';
    if (isNewUser) {
      showToast(`Welcome, ${userName}! Your account has been created successfully.`, 'success');
    } else {
      showToast(`Welcome back, ${userName}!`, 'success');
    }
    
    if (userData) {
      setCurrentUser(userData);
    } else {
      try {
        const user = await authAPI.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        const cachedUser = authAPI.getCachedUser();
        if (cachedUser) {
          setCurrentUser(cachedUser);
        }
      }
    }
    
    // Navigate to dashboard after a short delay
    setTimeout(() => {
      handleNavigate('dashboard');
    }, 100);
  };

  const handleAdminLogin = (adminData) => {
    // Close all modals
    setShowSignInModal(false);
    setShowSignUpModal(false);
    setShowAdminLoginModal(false);
    
    setIsAdminLoggedIn(true);
    setAdminUser(adminData);
    showToast(`Welcome, Admin ${adminData.name}!`, 'success');
    
    setTimeout(() => {
      setCurrentPage('admin');
    }, 100);
  };

  const handleSignOut = async () => {
    try {
      await authAPI.logout();
      setIsLoggedIn(false);
      setUserType(null);
      setCurrentUser(null);
      
      // Navigate to home
      setTimeout(() => {
        handleNavigate('home');
      }, 100);
      
      showToast('You have been signed out successfully', 'info');
    } catch (error) {
      console.error('Sign out error:', error);
      showToast('Error signing out. Please try again.', 'error');
    }
  };

  const handleAdminSignOut = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    
    // Navigate to home page
    setTimeout(() => {
      setCurrentPage('home');
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
    
    showToast('Admin logged out successfully', 'info');
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('techconnect_language', lang);
    
    // Update document direction for RTL languages
    if (lang === 'ur') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ur';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  };

  const handleSwitchToSignUp = (tab = 'client') => {
    setShowSignInModal(false);
    setSignUpDefaultTab(tab);
    // Small delay to prevent overlap
    setTimeout(() => {
      setShowSignUpModal(true);
    }, 150);
  };

  const handleSwitchToSignIn = () => {
    setShowSignUpModal(false);
    // Small delay to prevent overlap
    setTimeout(() => {
      setShowSignInModal(true);
    }, 150);
  };

  // Handle opening signup modal with specific tab
  const handleOpenSignUp = (tab = 'client') => {
    // Close all modals first
    setShowSignInModal(false);
    setShowSignUpModal(false);
    setShowAdminLoginModal(false);
    
    setSignUpDefaultTab(tab);
    setTimeout(() => {
      setShowSignUpModal(true);
    }, 150);
  };

  // ✅ Loading screen
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008C7E] mx-auto mb-4">
            </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <TranslationProvider defaultLanguage={language}>
        <div className={`min-h-screen flex flex-col bg-gray-50 ${language === 'ur' ? 'rtl' : 'ltr'}`}>
          <Header 
            isLoggedIn={isLoggedIn} 
            isAdminLoggedIn={isAdminLoggedIn}
            onNavigate={handleNavigate}
            onSignInClick={() => setShowSignInModal(true)}
            onAdminLoginClick={() => setShowAdminLoginModal(true)}
            onSignOut={handleSignOut}
            onAdminSignOut={handleAdminSignOut}
            language={language}
            onLanguageChange={handleLanguageChange}
            userType={userType}
            currentUser={currentUser}
            adminUser={adminUser}
          />
          
          <main className="flex-1">
            {currentPage === "home" && (
              <HomePage 
                onNavigate={handleNavigate} 
                language={language} 
              />
            )}
            
            {currentPage === "browse" && (
              <BrowsePage 
                onNavigate={handleNavigate} 
                activeFilter={activeFilter} 
                language={language} 
                currentUser={currentUser}
                userType={userType}
                isLoggedIn={isLoggedIn}
              />
            )}
            
            {currentPage === "browse-projects" && isLoggedIn && (
              <BrowseProjectsPage 
                onNavigate={handleNavigate}
                currentUser={currentUser}
                userType={userType}
              />
            )}
            
            {currentPage === "project-detail" && selectedProjectId && isLoggedIn && (
              <ProjectDetailPage
                projectId={selectedProjectId}
                onNavigate={handleNavigate}
                currentUser={currentUser}
                userType={userType}
              />
            )}
            
            {currentPage === "post-project" && isLoggedIn && (
              <PostProjectPage 
                onNavigate={handleNavigate} 
                language={language} 
                currentUser={currentUser}
              />
            )}
            
            {currentPage === "edit-project" && selectedProjectId && isLoggedIn && (
              <PostProjectPage 
                onNavigate={handleNavigate} 
                language={language} 
                currentUser={currentUser}
                projectId={selectedProjectId}
              />
            )}
            
            {currentPage === "dashboard" && isLoggedIn && (
              <DashboardPage 
                onNavigate={handleNavigate} 
                language={language} 
                userType={userType} 
                currentUser={currentUser} 
              />
            )}
            
            {currentPage === "company-profile" && selectedCompanyId && (
              <CompanyProfilePage
                companyId={selectedCompanyId}
                onNavigate={handleNavigate}
                currentUser={currentUser}
                userType={userType}
                isLoggedIn={isLoggedIn}
                language={language}
              />
            )}
            
            {currentPage === "about" && (
              <AboutPage 
                onNavigate={handleNavigate} 
                language={language} 
              />
            )}
            
            {currentPage === "contact" && (
              <ContactPage 
                language={language}
                onNavigate={handleNavigate}
                isLoggedIn={isLoggedIn}
                userType={userType}
                onSignUpClick={handleOpenSignUp}
              />
            )}
            
            {currentPage === "admin" && isAdminLoggedIn && (
              <AdminDashboard 
                language={language} 
                onAdminSignOut={handleAdminSignOut}
                adminUser={adminUser}
                onNavigate={handleNavigate}
              />
            )}
            
            {currentPage === "terms" && (
              <TermsOfServicePage 
                onNavigate={handleNavigate} 
                language={language} 
              />
            )}
            
            {currentPage === "privacy" && (
              <PrivacyPolicyPage 
                onNavigate={handleNavigate} 
                language={language} 
              />
            )}
          </main>

          <Footer language={language} onNavigate={handleNavigate} />

          {/* Modals only open when explicitly triggered */}
          {showSignInModal && (
            <SignInModal 
              open={showSignInModal}
              onClose={() => setShowSignInModal(false)}
              onSignIn={handleSignIn}
              onSwitchToSignUp={handleSwitchToSignUp}
              onNavigate={handleNavigate}
            />
          )}

          {showSignUpModal && (
            <SignUpModal
              open={showSignUpModal}
              onClose={() => setShowSignUpModal(false)}
              onSignUp={handleSignIn}
              onSwitchToSignIn={handleSwitchToSignIn}
              onNavigate={handleNavigate}
              defaultTab={signUpDefaultTab}
            />
          )}

          {showAdminLoginModal && (
            <AdminLoginModal
              open={showAdminLoginModal}
              onClose={() => setShowAdminLoginModal(false)}
              onAdminLogin={handleAdminLogin}
            />
          )}

          <Chatbot language={language} />

          {/* ✅ Keep this Toast component since you're not using ToastContext everywhere yet */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={closeToast}
              duration={3000}
            />
          )}
        </div>
      </TranslationProvider>
    </ToastProvider>
  );
}