import { useState, useEffect } from "react";
import { Briefcase, MessageSquare, User, Settings, Plus, Edit, Eye, MoreVertical, Clock, DollarSign, TrendingUp, Award, Users, Calendar, CheckCircle, XCircle, Bell, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { projectAPI, notificationAPI, companyAPI } from "../services/api";
import { authAPI } from "../services/api";
import PropTypes from "prop-types";

export function DashboardPage({ onNavigate, userType = 'client', currentUser }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Stats states
  const [clientStats, setClientStats] = useState({
    openProjects: 0,
    totalBids: 0,
    activeProjects: 0,
    totalSpent: 0,
    projectStats: [],
    recentProjects: []
  });

  const [companyStats, setCompanyStats] = useState({
    totalBids: 0,
    acceptedBids: 0,
    activeProjects: 0,
    totalEarned: 0,
    bidStats: [],
    recentBids: [],
    profileCompletion: 0
  });

  const [companyProfile, setCompanyProfile] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    
    if (userType === 'company') {
      fetchCompanyProfile();
    } else if (userType === 'client') {
      fetchClientProfile();
    }
  }, [userType]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (userType === 'client') {
        // Fetch client projects
        const projectsData = await projectAPI.getUserProjects();
        const projects = projectsData.projects || [];
        
        const stats = {
          openProjects: projects.filter(p => p.status === 'posted' || p.status === 'bidding').length,
          totalBids: projects.reduce((acc, p) => acc + (p.bids?.length || 0), 0),
          activeProjects: projects.filter(p => p.status === 'active').length,
          totalSpent: projects
            .filter(p => p.status === 'completed')
            .reduce((acc, p) => acc + (p.selectedBid?.amount || 0), 0),
          projectStats: projects,
          recentProjects: projects.slice(0, 5)
        };
        
        setClientStats(stats);
      } else if (userType === 'company') {
        // Fetch company bids
        const bidsData = await projectAPI.getCompanyBids();
        const projectsWithBids = bidsData.projects || [];
        
        // Extract all bids
        const allBids = projectsWithBids.flatMap(p => 
          (p.bids || []).map(bid => ({
            ...bid,
            projectTitle: p.title,
            clientId: p.clientId?._id,
            clientName: p.clientId?.name || 'Unknown Client'
          }))
        );
        
        const stats = {
          totalBids: allBids.length,
          acceptedBids: allBids.filter(b => b.status === 'accepted').length,
          activeProjects: allBids.filter(b => b.status === 'accepted').length,
          totalEarned: allBids
            .filter(b => b.status === 'accepted')
            .reduce((acc, b) => acc + (b.amount || 0), 0),
          bidStats: allBids,
          recentBids: allBids.slice(0, 5)
        };
        
        setCompanyStats(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      if (currentUser?.companyId) {
        const profileData = await companyAPI.getById(currentUser.companyId);
        setCompanyProfile(profileData.company);
        
        // Calculate profile completion percentage
        const requiredFields = [
          'name',
          'description',
          'services',
          'location',
          'startingPrice',
          'category',
          'portfolio'
        ];
        
        const completedFields = requiredFields.filter(field => {
          const value = profileData.company[field];
          return value && 
            (Array.isArray(value) ? value.length > 0 : 
            typeof value === 'string' ? value.trim().length > 0 : 
            value !== null && value !== undefined);
        });
        
        const completion = Math.round((completedFields.length / requiredFields.length) * 100);
        setCompanyStats(prev => ({
          ...prev,
          profileCompletion: completion
        }));
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const fetchClientProfile = async () => {
    try {
      const savedProfile = localStorage.getItem('clientProfile');
      if (savedProfile) {
        setClientProfile(JSON.parse(savedProfile));
      } else if (currentUser) {
        const defaultProfile = {
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          location: '',
          company: '',
          preferences: {
            emailNotifications: true,
            projectAlerts: true
          }
        };
        setClientProfile(defaultProfile);
        localStorage.setItem('clientProfile', JSON.stringify(defaultProfile));
      }
    } catch (error) {
      console.error('Error fetching client profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsData = await notificationAPI.getNotifications({ 
        limit: 5,
        read: false 
      });
      setNotifications(notificationsData.notifications || []);
      setUnreadCount(notificationsData.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "posted":
      case "open":
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "active":
      case "in_progress":
      case "reviewed":
      case "accepted":
        return "bg-blue-100 text-blue-700";
      case "completed":
      case "closed":
        return "bg-green-100 text-green-700";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "posted":
        return "Posted";
      case "bidding":
        return "Bidding";
      case "active":
        return "Active";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderOtherTabs = () => {
    switch (activeTab) {
      case "messages":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0A2540]">Messages</h2>
              <Button onClick={() => setActiveTab("overview")}>
                Back to Dashboard
              </Button>
            </div>
            <div className="bg-white rounded-lg border p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-[#0A2540] font-semibold mb-2">Messages will be available soon</h3>
              <p className="text-gray-600 mb-4">Our messaging system is under development</p>
            </div>
          </div>
        );
        
      case "profile":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0A2540]">
                {userType === 'client' ? 'My Profile' : 'Company Profile'}
              </h2>
              <Button variant="outline" onClick={() => setActiveTab("overview")}>
                Back to Dashboard
              </Button>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              {userType === 'client' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#FF8A2B] to-[#ff7a1b] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0A2540]">{currentUser?.name || 'Client'}</h3>
                      <p className="text-gray-600">{currentUser?.email || 'No email'}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          Client Account
                        </Badge>
                        <span className="text-sm text-gray-500">Member since: {formatDate(currentUser?.createdAt || Date.now())}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-[#0A2540] mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-[#0A2540]">{clientProfile?.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="text-[#0A2540]">{clientProfile?.location || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Company:</span>
                          <span className="text-[#0A2540]">{clientProfile?.company || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-[#0A2540] mb-2">Account Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Projects:</span>
                          <span className="text-[#0A2540]">{clientStats.recentProjects.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Projects:</span>
                          <span className="text-[#0A2540]">{clientStats.activeProjects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Spent:</span>
                          <span className="text-[#0A2540]">{formatCurrency(clientStats.totalSpent)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0A2540] to-[#0a2540]/90 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {companyProfile?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0A2540]">{companyProfile?.name || 'Company Name'}</h3>
                      <p className="text-gray-600">{companyProfile?.tagline || 'Professional services company'}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Company Account
                        </Badge>
                        <span className="text-sm text-gray-500">Profile: {companyStats.profileCompletion}% complete</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-[#0A2540] mb-2">Company Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="text-[#0A2540]">{companyProfile?.location || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Team Size:</span>
                          <span className="text-[#0A2540]">{companyProfile?.teamSize || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Years in Business:</span>
                          <span className="text-[#0A2540]">{companyProfile?.yearsInBusiness || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Starting Price:</span>
                          <span className="text-[#0A2540]">{formatCurrency(companyProfile?.startingPrice || 0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-[#0A2540] mb-2">Business Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Bids:</span>
                          <span className="text-[#0A2540]">{companyStats.totalBids}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accepted Bids:</span>
                          <span className="text-[#0A2540]">{companyStats.acceptedBids}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Projects:</span>
                          <span className="text-[#0A2540]">{companyStats.activeProjects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Earned:</span>
                          <span className="text-[#0A2540]">{formatCurrency(companyStats.totalEarned)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-[#0A2540] mb-2">Services Offered</h4>
                    <div className="flex flex-wrap gap-2">
                      {companyProfile?.services?.map((service, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                          {service}
                        </Badge>
                      )) || (
                        <p className="text-gray-500 text-sm">No services added yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case "settings":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0A2540]">Settings</h2>
              <Button onClick={() => setActiveTab("overview")}>
                Back to Dashboard
              </Button>
            </div>
            <div className="bg-white rounded-lg border p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-[#0A2540] font-semibold mb-2">Settings will be available soon</h3>
              <p className="text-gray-600 mb-4">Account settings are under development</p>
            </div>
          </div>
        );
        
      case "notifications":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0A2540]">Notifications</h2>
              <Button onClick={() => setActiveTab("overview")}>
                Back to Dashboard
              </Button>
            </div>
            {notifications.length > 0 ? (
              <div className="bg-white rounded-lg border">
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div key={notification._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${notification.type?.includes('accepted') ? 'bg-green-100' : notification.type?.includes('rejected') ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {notification.type?.includes('accepted') ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : notification.type?.includes('rejected') ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Bell className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-[#0A2540]">{notification.title}</h4>
                            <span className="text-sm text-gray-500">{formatDate(notification.createdAt)}</span>
                          </div>
                          <p className="text-gray-600">{notification.message}</p>
                          {notification.actionUrl && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-3"
                              onClick={() => notification.actionUrl && onNavigate(notification.actionUrl)}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-[#0A2540] font-semibold mb-2">No notifications yet</h3>
                <p className="text-gray-600 mb-4">You're all caught up!</p>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] mb-2">
                {userType === 'client' ? 'Client Dashboard' : 'Company Dashboard'}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {userType === 'client' 
                  ? 'Manage your projects and track bids' 
                  : 'Track your bids and manage projects'}
              </p>
            </div>
            
            {/* Notifications Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab("notifications")}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tabs Navigation */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-gray-100 w-full">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white text-xs sm:text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="data-[state=active]:bg-[#0A2540] data-[state=active]:text-white text-xs sm:text-sm"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="messages"
                className="data-[state=active]:bg-[#FF8A2B] data-[state=active]:text-white text-xs sm:text-sm"
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="data-[state=active]:bg-[#0A2540] data-[state=active]:text-white text-xs sm:text-sm"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Alerts
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-xs sm:text-sm"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Dashboard Content */}
        {activeTab === "overview" ? (
          <div className="space-y-6">
            {/* Show different content based on user type */}
            {userType === 'client' ? (
              // Client Dashboard
              <div className="space-y-6">
                {/* Client-specific stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#0A2540]">{clientStats.openProjects}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Open Projects</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#008C7E]">{clientStats.totalBids}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Bids Received</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-orange-50">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#FF8A2B]">{clientStats.activeProjects}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Active Projects</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#0A2540]">{formatCurrency(clientStats.totalSpent)}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-auto py-6 bg-[#FF8A2B] hover:bg-[#e67a1f] text-white flex flex-col items-center justify-center"
                    onClick={() => onNavigate('post-project')}
                  >
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <span className="font-semibold text-sm sm:text-base">Post New Project</span>
                    <span className="text-xs sm:text-sm opacity-90 mt-1">Get quotes from companies</span>
                  </Button>
                  
                  <Button 
                    className="h-auto py-6 bg-[#008C7E] hover:bg-[007066] text-white flex flex-col items-center justify-center"
                    onClick={() => onNavigate('browse')}
                  >
                    <Eye className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <span className="font-semibold text-sm sm:text-base">Browse Companies</span>
                    <span className="text-xs sm:text-sm opacity-90 mt-1">Find verified service providers</span>
                  </Button>
                  
                  <Button 
                    className="h-auto py-6 bg-[#0A2540] hover:bg-[#0a2540]/90 text-white flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <span className="font-semibold text-sm sm:text-base">My Profile</span>
                    <span className="text-xs sm:text-sm opacity-90 mt-1">Update personal information</span>
                  </Button>
                </div>

                {/* Client projects list */}
                <div className="bg-white rounded-lg border">
                  <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-[#0A2540] font-semibold">My Projects</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline"
                        onClick={() => onNavigate('post-project')}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        New Project
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => onNavigate('browse-projects')}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        Browse All
                      </Button>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008C7E] mx-auto"></div>
                      <p className="text-gray-600 mt-2 text-sm">Loading projects...</p>
                    </div>
                  ) : clientStats.recentProjects.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {clientStats.recentProjects.map((project) => (
                        <div key={project._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-3">
                            <div className="flex-1 w-full">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <h4 className="text-[#0A2540] font-medium text-sm sm:text-base">{project.title}</h4>
                                <Badge variant="secondary" className={`${getStatusColor(project.status)} text-xs`}>
                                  {getStatusLabel(project.status)}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                                <span className="capitalize">{project.category}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="whitespace-nowrap">{formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{project.bids?.length || 0} bids</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="text-gray-500">Posted {formatDate(project.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onNavigate('project-detail', project._id)}
                                className="flex-1 sm:flex-none text-xs"
                              >
                                <Eye size={14} className="mr-2" />
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical size={18} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onNavigate('project-detail', project._id)}>
                                    <Eye size={14} className="mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onNavigate('edit-project', project._id)}>
                                    <Edit size={14} className="mr-2" />
                                    Edit Project
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onNavigate('browse')}>
                                    <Plus size={14} className="mr-2" />
                                    Invite Companies
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-[#0A2540] font-semibold mb-2">No projects yet</h4>
                      <p className="text-gray-600 mb-4 text-sm">Start by posting your first project</p>
                      <Button 
                        className="bg-[#008C7E] hover:bg-[#007066]"
                        onClick={() => onNavigate('post-project')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Post Your First Project
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Company Dashboard
              <div className="space-y-6">
                {/* Company-specific stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#0A2540]">{companyStats.totalBids}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Bids Submitted</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#008C7E]">{companyStats.acceptedBids}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Accepted Bids</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-orange-50">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#FF8A2B]">{companyStats.activeProjects}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Active Projects</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#0A2540]">{formatCurrency(companyStats.totalEarned)}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Earned</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-auto py-6 bg-[#0A2540] hover:bg-[#0a2540]/90 text-white flex flex-col items-center justify-center"
                    onClick={() => onNavigate('browse-projects')}
                  >
                    <Eye className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <span className="font-semibold text-sm sm:text-base">Browse Projects</span>
                    <span className="text-xs sm:text-sm opacity-90 mt-1">Find new opportunities</span>
                  </Button>
                  
                  <Button 
                    className="h-auto py-6 bg-[#008C7E] hover:bg-[#007066] text-white flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <span className="font-semibold text-sm sm:text-base">Company Profile</span>
                    <span className="text-xs sm:text-sm opacity-90 mt-1">{companyStats.profileCompletion}% complete</span>
                  </Button>
                  
                  <Button 
                    className="h-auto py-6 bg-[#FF8A2B] hover:bg-[#e67a1f] text-white flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("messages")}
                  >
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <span className="font-semibold text-sm sm:text-base">Messages</span>
                    <span className="text-xs sm:text-sm opacity-90 mt-1">{unreadCount} unread messages</span>
                  </Button>
                </div>

                {/* Company profile completion */}
                {companyStats.profileCompletion < 80 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-yellow-800 font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                          Complete Your Profile
                        </h4>
                        <p className="text-yellow-700 text-xs sm:text-sm mb-2">
                          Complete your company profile to attract more clients. Add portfolio, services, and verification documents.
                        </p>
                        <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${companyStats.profileCompletion}%` }}
                          ></div>
                        </div>
                        <p className="text-yellow-800 text-xs mt-1">{companyStats.profileCompletion}% complete</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-yellow-600 text-yellow-700 hover:bg-yellow-600 hover:text-white w-full sm:w-auto"
                        onClick={() => setActiveTab("profile")}
                      >
                        Complete Profile
                      </Button>
                    </div>
                  </div>
                )}

                {/* Company bids list */}
                <div className="bg-white rounded-lg border">
                  <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-[#0A2540] font-semibold">Recent Bids</h3>
                    <Button 
                      className="bg-[#008C7E] hover:bg-[#007066] w-full sm:w-auto text-xs sm:text-sm"
                      onClick={() => onNavigate('browse-projects')}
                    >
                      <Eye size={16} className="mr-2" />
                      Browse New Projects
                    </Button>
                  </div>
                  
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008C7E] mx-auto"></div>
                      <p className="text-gray-600 mt-2 text-sm">Loading bids...</p>
                    </div>
                  ) : companyStats.recentBids.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {companyStats.recentBids.map((bid) => (
                        <div key={bid._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3">
                            <div className="flex-1">
                              <h4 className="text-[#0A2540] font-medium text-sm sm:text-base">{bid.projectTitle}</h4>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                                <span>Client: {bid.clientName || 'Unknown'}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="text-[#008C7E] font-medium">{formatCurrency(bid.amount)}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className={`${getStatusColor(bid.status)} text-xs whitespace-nowrap`}>
                              {getStatusLabel(bid.status)}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm text-gray-500">Submitted {formatDate(bid.createdAt)}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate('project-detail', bid.project)}
                              className="w-full sm:w-auto text-xs"
                            >
                              <Eye size={14} className="mr-2" />
                              View Project
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-[#0A2540] font-semibold mb-2">No bids yet</h4>
                      <p className="text-gray-600 mb-4 text-sm">Start by browsing projects and submitting bids</p>
                      <Button 
                        className="bg-[#008C7E] hover:bg-[#007066]"
                        onClick={() => onNavigate('browse-projects')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Browse Projects
                      </Button>
                    </div>
                  )}
                </div>

                {/* Recent Notifications */}
                {notifications.length > 0 && (
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 sm:p-6 border-b">
                      <h3 className="text-[#0A2540] font-semibold">Recent Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {notifications.slice(0, 3).map((notification) => (
                        <div key={notification._id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${notification.type?.includes('accepted') ? 'bg-green-100' : notification.type?.includes('rejected') ? 'bg-red-100' : 'bg-blue-100'}`}>
                              {notification.type?.includes('accepted') ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : notification.type?.includes('rejected') ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Bell className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-[#0A2540] truncate">{notification.title}</h5>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full text-[#008C7E] text-sm"
                        onClick={() => setActiveTab("notifications")}
                      >
                        View All Notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Render other tabs (profile, messages, settings, notifications)
          renderOtherTabs()
        )}
      </div>
    </div>
  );
}

DashboardPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  userType: PropTypes.string,
  currentUser: PropTypes.object
};