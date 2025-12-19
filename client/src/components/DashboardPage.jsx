import { useState, useEffect } from "react";
import { 
  Briefcase, MessageSquare, User, Settings, Plus, Edit, Eye, MoreVertical, 
  Clock, DollarSign, TrendingUp, Award, Users, Calendar, CheckCircle, 
  XCircle, Bell, Shield, FileText, BarChart3, Target, Zap, Star, 
  TrendingDown, RefreshCw, Package, FileCheck, AlertCircle, Send, Filter,
  ThumbsUp, ThumbsDown, Download, Search, ArrowUpRight, ArrowDownRight,
  Heart, ShieldCheck, TrendingUp as TrendingUpIcon, Percent
} from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useToast } from 'C:\\Users\\user\\Desktop\\Web_Engineering_Semester_Project\\client\\src\\contexts\\ToastContext.jsx';
import { projectAPI, notificationAPI, companyAPI, bidAPI, userAPI } from "../services/api";
import BidCard from "./BidCard";
import BidModal from "./BidModal";
import PropTypes from "prop-types";

export function DashboardPage({ onNavigate, userType = 'client', currentUser }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);
  const [isEditBid, setIsEditBid] = useState(false);
  
  // Enhanced Stats states
  const [clientStats, setClientStats] = useState({
    openProjects: 0,
    totalBids: 0,
    activeProjects: 0,
    totalSpent: 0,
    avgBidAmount: 0,
    pendingInvitations: 0,
    completedProjects: 0,
    projectStats: [],
    recentProjects: [],
    recentBids: [],
    topCompanies: [],
    bidComparisonData: []
  });

  const [companyStats, setCompanyStats] = useState({
    totalBids: 0,
    acceptedBids: 0,
    activeProjects: 0,
    totalEarned: 0,
    avgProjectValue: 0,
    successRate: 0,
    responseTime: 0,
    pendingInvitations: 0,
    profileCompletion: 0,
    verificationStatus: 'pending',
    bidStats: [],
    recentBids: [],
    activeProjectsList: [],
    performanceMetrics: {}
  });

  const [companyProfile, setCompanyProfile] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBidComparison, setShowBidComparison] = useState(false);
  const [selectedBidsForComparison, setSelectedBidsForComparison] = useState([]);
  const [bidsFilter, setBidsFilter] = useState('all');
  const [projectsFilter, setProjectsFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');


  const ensureCompanyExists = async () => {
    // ✅ FIX: Use currentUser instead of user
    if (currentUser?.type !== 'company') return;

    try {
      console.log('🔍 Checking if company profile exists...');
  
      // Try to get or create company profile
      const response = await fetch('http://localhost:5000/api/company-setup/my-company', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
  
      const data = await response.json();
  
      if (data.success && data.company) {
        console.log('✅ Company profile ready:', data.company._id);
    
        // ✅ FIX: Update localStorage with companyId
        const updatedUser = { ...currentUser, companyId: data.company._id };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
        // ✅ Note: We can't update the currentUser prop directly since it comes from parent
        // The parent (App.jsx) will re-read from localStorage on next mount
      
        return data.company._id;
      }
    } catch (error) {
      console.error('❌ Failed to ensure company exists:', error);
    }
  };


  // Fetch data on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
  
    if (!token || !savedUser) {
      console.warn('⚠️ User not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please sign in to access the dashboard",
        variant: "destructive"
      });
      // ✅ FIX: Navigate to home instead of showing sign-in modal
      onNavigate('home');
      return;
    }
    
    console.log('✅ User authenticated, fetching dashboard data');
  
    // âœ… FIX: Ensure company exists first for company users
    const initDashboard = async () => {
      if (currentUser?.type === 'company') {
        await ensureCompanyExists();
      }
    
      fetchDashboardData();
      fetchNotifications();
    
      if (currentUser?.type === 'client') {
        fetchClientProfile();
      } else if (currentUser?.type === 'company') {
        fetchCompanyProfile();
      }
    };
  
    initDashboard();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (userType === 'client') {
        // Enhanced client data fetching
        const [projectsData, invitationsData, analyticsData] = await Promise.all([
          projectAPI.getUserProjects(),
          companyAPI.getInvitations(),
          userAPI.getClientAnalytics()
        ]);
        
        const projects = projectsData.projects || [];
        const invitations = invitationsData.invitations || [];
        
        // Calculate comprehensive stats
        const allBids = projects.flatMap(p => 
          (p.bids || []).map(bid => ({
            ...bid,
            projectId: p._id,
            projectTitle: p.title,
            projectCategory: p.category
          }))
        );
        
        const acceptedBids = allBids.filter(b => b.status === 'accepted');
        const avgBidAmount = allBids.length > 0 
          ? allBids.reduce((acc, b) => acc + (b.amount || 0), 0) / allBids.length 
          : 0;
        
        // Get top companies by bid count
        const companyBidCount = {};
        allBids.forEach(bid => {
          if (bid.companyId?._id) {
            const companyId = bid.companyId._id;
            companyBidCount[companyId] = (companyBidCount[companyId] || 0) + 1;
          }
        });
        
        const topCompanies = Object.entries(companyBidCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([companyId, count]) => {
            const company = allBids.find(b => b.companyId?._id === companyId)?.companyId;
            return { company, bidCount: count };
          });
        
        const stats = {
          openProjects: projects.filter(p => p.status === 'posted' || p.status === 'bidding').length,
          totalBids: allBids.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          completedProjects: projects.filter(p => p.status === 'completed').length,
          totalSpent: acceptedBids.reduce((acc, b) => acc + (b.amount || 0), 0),
          avgBidAmount: Math.round(avgBidAmount),
          pendingInvitations: invitations.length,
          projectStats: projects,
          recentProjects: projects.slice(0, 5),
          recentBids: allBids.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
          topCompanies,
          bidComparisonData: allBids.map(bid => ({
            id: bid._id,
            companyName: bid.companyId?.name,
            amount: bid.amount,
            timeline: bid.proposedTimeline?.value,
            rating: bid.companyId?.ratings?.average || 0,
            score: calculateBidScore(bid)
          }))
        };
        
        setClientStats(stats);
      } else if (userType === 'company') {
        // Enhanced company data fetching
        const [bidsData, projectsData, invitationsData, analyticsData] = await Promise.all([
          bidAPI.getCompanyBids(),
          projectAPI.getCompanyProjects(),
          projectAPI.getCompanyInvitations(),
          userAPI.getCompanyAnalytics()
        ]);
        
        const allBids = bidsData.bids || [];
        const activeProjects = projectsData.projects || [];
        const invitations = invitationsData.invitations || [];
        
        // Calculate comprehensive stats
        const acceptedBids = allBids.filter(b => b.status === 'accepted');
        const pendingBids = allBids.filter(b => b.status === 'pending' || b.status === 'submitted');
        const rejectedBids = allBids.filter(b => b.status === 'rejected');
        
        const totalEarned = acceptedBids.reduce((acc, b) => acc + (b.amount || 0), 0);
        const avgProjectValue = acceptedBids.length > 0 
          ? totalEarned / acceptedBids.length 
          : 0;
        
        const successRate = allBids.length > 0 
          ? Math.round((acceptedBids.length / allBids.length) * 100) 
          : 0;
        
        // Calculate average response time (time from project posting to bid submission)
        let totalResponseTime = 0;
        let responseCount = 0;
        
        allBids.forEach(bid => {
          if (bid.project?.createdAt && bid.createdAt) {
            const responseTime = new Date(bid.createdAt) - new Date(bid.project.createdAt);
            totalResponseTime += responseTime;
            responseCount++;
          }
        });
        
        const avgResponseTime = responseCount > 0 
          ? Math.round(totalResponseTime / responseCount / (1000 * 60 * 60)) // Convert to hours
          : 0;
        
        const stats = {
          totalBids: allBids.length,
          acceptedBids: acceptedBids.length,
          activeProjects: activeProjects.length,
          totalEarned: totalEarned,
          avgProjectValue: Math.round(avgProjectValue),
          successRate: successRate,
          responseTime: avgResponseTime,
          pendingInvitations: invitations.length,
          bidStats: allBids,
          recentBids: allBids.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
          activeProjectsList: activeProjects,
          performanceMetrics: analyticsData.metrics || {}
        };
        
        setCompanyStats(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Failed to load dashboard",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
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
          { field: 'name', weight: 10 },
          { field: 'description', weight: 15, minLength: 50 },
          { field: 'services', weight: 15, isArray: true },
          { field: 'location', weight: 10 },
          { field: 'startingPrice', weight: 5 },
          { field: 'category', weight: 5 },
          { field: 'portfolio', weight: 20, isArray: true },
          { field: 'teamSize', weight: 5 },
          { field: 'yearsInBusiness', weight: 5 },
          { field: 'logo', weight: 10 },
          { field: 'tagline', weight: 5 }
        ];
        
        let completionScore = 0;
        let totalWeight = 0;
        
        requiredFields.forEach(({ field, weight, minLength, isArray }) => {
          totalWeight += weight;
          const value = profileData.company[field];
          
          if (isArray) {
            if (Array.isArray(value) && value.length > 0) {
              completionScore += weight;
            }
          } else if (minLength) {
            if (typeof value === 'string' && value.length >= minLength) {
              completionScore += weight;
            }
          } else if (value) {
            if (typeof value === 'string' && value.trim().length > 0) {
              completionScore += weight;
            } else if (value !== null && value !== undefined) {
              completionScore += weight;
            }
          }
        });
        
        const completion = Math.round((completionScore / totalWeight) * 100);
        setCompanyStats(prev => ({
          ...prev,
          profileCompletion: completion,
          verificationStatus: profileData.company.verificationStatus || 'pending'
        }));
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const fetchClientProfile = async () => {
    try {
      const profileData = await userAPI.getProfile();
      setClientProfile(profileData.user);
    } catch (error) {
      console.error('Error fetching client profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsData = await notificationAPI.getNotifications({ 
        limit: 10,
        unreadOnly: false 
      });
      setNotifications(notificationsData.notifications || []);
      setUnreadCount(notificationsData.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleBidSubmit = async (bidData) => {
    try {
      if (isEditBid && selectedBid) {
        await bidAPI.update(selectedProject._id, selectedBid._id, bidData);
        toast({
          title: "Bid Updated",
          description: "Your bid has been updated successfully",
        });
      } else {
        await bidAPI.submit(selectedProject._id, bidData);
        toast({
          title: "Bid Submitted",
          description: "Your bid has been submitted successfully",
        });
      }
      
      fetchDashboardData();
      setBidModalOpen(false);
      setSelectedProject(null);
      setSelectedBid(null);
      setIsEditBid(false);
    } catch (error) {
      toast({
        title: "Bid Submission Failed",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleAcceptBid = async (projectId, bidId) => {
    try {
      await bidAPI.accept(projectId, bidId);
      toast({
        title: "Bid Accepted",
        description: "The bid has been accepted and project is now active",
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Failed to Accept Bid",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleRejectBid = async (projectId, bidId, reason) => {
    try {
      await bidAPI.reject(projectId, bidId, { reason });
      toast({
        title: "Bid Rejected",
        description: "The bid has been rejected",
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Failed to Reject Bid",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawBid = async (projectId, bidId) => {
    try {
      await bidAPI.withdraw(projectId, bidId);
      toast({
        title: "Bid Withdrawn",
        description: "Your bid has been withdrawn",
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Failed to Withdraw Bid",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleInviteCompany = async (projectId, companyId) => {
    try {
      await projectAPI.inviteCompany(projectId, companyId);
      toast({
        title: "Invitation Sent",
        description: "Company has been invited to bid on your project",
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Failed to Send Invitation",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleBidComparison = (bid) => {
    if (selectedBidsForComparison.some(b => b._id === bid._id)) {
      setSelectedBidsForComparison(prev => prev.filter(b => b._id !== bid._id));
    } else if (selectedBidsForComparison.length < 3) {
      setSelectedBidsForComparison(prev => [...prev, bid]);
    } else {
      toast({
        title: "Maximum reached",
        description: "You can compare up to 3 bids at a time",
        variant: "destructive"
      });
    }
  };

  const calculateBidScore = (bid) => {
    let score = 100;
    
    // Company rating bonus
    if (bid.companyId?.ratings?.average) {
      score += bid.companyId.ratings.average * 10;
    }
    
    // Proposal length bonus
    if (bid.proposal?.length >= 100 && bid.proposal.length <= 500) {
      score += 20;
    } else if (bid.proposal?.length > 500) {
      score += 10;
    }
    
    // Milestones bonus
    if (bid.milestones?.length >= 3) {
      score += 15;
    }
    
    // Attachments bonus
    if (bid.attachments?.length > 0) {
      score += 10;
    }
    
    // Invited bid bonus
    if (bid.isInvited) {
      score += 25;
    }
    
    return Math.min(score, 200);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "posted":
      case "open":
      case "pending":
      case "draft":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "active":
      case "in_progress":
      case "reviewed":
      case "submitted":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "completed":
      case "closed":
      case "accepted":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "rejected":
      case "cancelled":
      case "withdrawn":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "expired":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "posted":
      case "open":
        return <Target className="h-4 w-4" />;
      case "active":
      case "in_progress":
        return <RefreshCw className="h-4 w-4" />;
      case "completed":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "accepted":
        return <ThumbsUp className="h-4 w-4" />;
      case "rejected":
        return <ThumbsDown className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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

  const renderClientDashboard = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{clientStats.openProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Projects accepting bids</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#008C7E]">{clientStats.totalBids}</div>
            <p className="text-xs text-gray-500 mt-1">Bids received</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FF8A2B]">{clientStats.activeProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Projects in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{formatCurrency(clientStats.totalSpent)}</div>
            <p className="text-xs text-gray-500 mt-1">Total investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          className="h-auto py-6 bg-gradient-to-r from-[#FF8A2B] to-orange-500 hover:from-[#e67a1f] hover:to-orange-600 text-white flex flex-col items-center justify-center"
          onClick={() => onNavigate('post-project')}
        >
          <Plus className="h-8 w-8 mb-2" />
          <span className="font-semibold">Post New Project</span>
          <span className="text-sm opacity-90 mt-1">Get quotes from companies</span>
        </Button>
        
        <Button 
          className="h-auto py-6 bg-gradient-to-r from-[#008C7E] to-teal-600 hover:from-[#007066] hover:to-teal-700 text-white flex flex-col items-center justify-center"
          onClick={() => onNavigate('browse')}
        >
          <Eye className="h-8 w-8 mb-2" />
          <span className="font-semibold">Browse Companies</span>
          <span className="text-sm opacity-90 mt-1">Find verified providers</span>
        </Button>
        
        {clientStats.pendingInvitations > 0 && (
          <Button 
            className="h-auto py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex flex-col items-center justify-center"
            onClick={() => onNavigate('invitations')}
          >
            <Bell className="h-8 w-8 mb-2" />
            <span className="font-semibold">View Invitations</span>
            <span className="text-sm opacity-90 mt-1">{clientStats.pendingInvitations} pending</span>
          </Button>
        )}
      </div>

      {/* Recent Bids Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Bids</CardTitle>
              <CardDescription>Latest bids on your projects</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={bidsFilter} onValueChange={setBidsFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter bids" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bids</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {selectedBidsForComparison.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowBidComparison(true)}
                >
                  Compare ({selectedBidsForComparison.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008C7E] mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading bids...</p>
            </div>
          ) : clientStats.recentBids.length > 0 ? (
            <div className="space-y-4">
              {clientStats.recentBids
                .filter(bid => bidsFilter === 'all' || bid.status === bidsFilter)
                .map(bid => (
                  <BidCard
                    key={bid._id}
                    bid={bid}
                    project={{ _id: bid.projectId, title: bid.projectTitle }}
                    company={bid.companyId}
                    isClientView={true}
                    onStatusChange={fetchDashboardData}
                    onViewDetails={() => onNavigate('bid-detail', bid._id)}
                    onSendMessage={(companyId) => onNavigate('messages', companyId)}
                    onCompare={() => handleBidComparison(bid)}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bids yet</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Bids will appear here once companies start bidding on your projects</p>
              <Button onClick={() => onNavigate('post-project')}>
                <Plus className="h-4 w-4 mr-2" />
                Post a Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Companies Section */}
      {clientStats.topCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Bidding Companies</CardTitle>
            <CardDescription>Companies most active on your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientStats.topCompanies.map(({ company, bidCount }, index) => (
                <div key={company._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                    <Avatar>
                      <AvatarImage src={company.logo} />
                      <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{company.name}</h4>
                        {company.verified && (
                          <Badge variant="outline" className="border-green-200 text-green-700 dark:text-green-300">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{company.services?.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{bidCount} bids</div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {company.ratings?.average?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>Your posted projects</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={projectsFilter} onValueChange={setProjectsFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clientStats.recentProjects
            .filter(project => 
              (projectsFilter === 'all' || project.status === projectsFilter) &&
              (searchQuery === '' || project.title.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map(project => (
              <div key={project._id} className="border rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(project.status).split(' ')[0]}`}>
                      {getStatusIcon(project.status)}
                    </div>
                    <div>
                      <h4 className="font-medium">{project.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="capitalize">{project.category}</span>
                        <span>•</span>
                        <span>{project.bids?.length || 0} bids</span>
                        <span>•</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-medium">{formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Timeline</p>
                    <p className="font-medium">{project.timeline?.value} {project.timeline?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg. Bid</p>
                    <p className="font-medium">
                      {project.bids?.length > 0 
                        ? formatCurrency(project.bids.reduce((acc, bid) => acc + bid.amount, 0) / project.bids.length)
                        : 'No bids'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onNavigate('project-detail', project._id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {project.status === 'posted' && (
                    <Button 
                      size="sm"
                      onClick={() => onNavigate('browse')}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Invite Companies
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onNavigate('project-detail', project._id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onNavigate('edit-project', project._id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/project/${project._id}`);
                        toast({ title: "Link copied to clipboard" });
                      }}>
                        <FileText className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderCompanyDashboard = () => (
    <div className="space-y-6">
      {/* Company Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bids</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{companyStats.totalBids}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={(companyStats.acceptedBids / companyStats.totalBids) * 100 || 0} className="h-1" />
              <span className="text-xs text-gray-500">{companyStats.acceptedBids} accepted</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</CardTitle>
              <Percent className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#008C7E]">{companyStats.successRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Bid acceptance rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FF8A2B]">{companyStats.activeProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Projects in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{formatCurrency(companyStats.totalEarned)}</div>
            <p className="text-xs text-gray-500 mt-1">Avg: {formatCurrency(companyStats.avgProjectValue)}/project</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          className="h-auto py-6 bg-gradient-to-r from-[#0A2540] to-gray-800 hover:from-[#0a2540]/90 hover:to-gray-900 text-white flex flex-col items-center justify-center"
          onClick={() => onNavigate('browse-projects')}
        >
          <Eye className="h-8 w-8 mb-2" />
          <span className="font-semibold">Browse Projects</span>
          <span className="text-sm opacity-90 mt-1">Find new opportunities</span>
        </Button>
        
        <Button 
          className="h-auto py-6 bg-gradient-to-r from-[#008C7E] to-teal-600 hover:from-[#007066] hover:to-teal-700 text-white flex flex-col items-center justify-center"
          onClick={() => setActiveTab("profile")}
        >
          <User className="h-8 w-8 mb-2" />
          <span className="font-semibold">Company Profile</span>
          <span className="text-sm opacity-90 mt-1">{companyStats.profileCompletion}% complete</span>
        </Button>
        
        {companyStats.pendingInvitations > 0 ? (
          <Button 
            className="h-auto py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex flex-col items-center justify-center"
            onClick={() => onNavigate('invitations')}
          >
            <Send className="h-8 w-8 mb-2" />
            <span className="font-semibold">Project Invitations</span>
            <span className="text-sm opacity-90 mt-1">{companyStats.pendingInvitations} pending</span>
          </Button>
        ) : (
          <Button 
            className="h-auto py-6 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white flex flex-col items-center justify-center"
            onClick={() => onNavigate('messages')}
          >
            <MessageSquare className="h-8 w-8 mb-2" />
            <span className="font-semibold">Messages</span>
            <span className="text-sm opacity-90 mt-1">{unreadCount} unread</span>
          </Button>
        )}
      </div>

      {/* Profile Completion Alert */}
      {companyStats.profileCompletion < 80 && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Complete Your Profile</h4>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                    Complete your profile to increase client trust and get more projects. 
                    {companyStats.verificationStatus !== 'approved' && ' Complete verification to get the verified badge.'}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Progress value={companyStats.profileCompletion} className="w-48 h-2" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{companyStats.profileCompletion}%</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-600 hover:text-white"
                onClick={() => setActiveTab("profile")}
              >
                Complete Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bid Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Bids */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bids</CardTitle>
            <CardDescription>Your latest bid submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008C7E] mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading bids...</p>
              </div>
            ) : companyStats.recentBids.length > 0 ? (
              <div className="space-y-3">
                {companyStats.recentBids.map(bid => (
                  <div key={bid._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">{bid.project?.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(bid.amount)}</span>
                        <span>•</span>
                        <span>{bid.proposedTimeline?.value} {bid.proposedTimeline?.unit}</span>
                        <span>•</span>
                        <span>{formatDate(bid.createdAt)}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(bid.status)}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No bids submitted yet</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onNavigate('browse-projects')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit New Bid
            </Button>
          </CardFooter>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Projects you're currently working on</CardDescription>
          </CardHeader>
          <CardContent>
            {companyStats.activeProjectsList.length > 0 ? (
              <div className="space-y-3">
                {companyStats.activeProjectsList.map(project => (
                  <div key={project._id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{project.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {project.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Client: {project.clientId?.name || 'Unknown'}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Budget: {formatCurrency(project.budget?.min)}</span>
                      <span>Due: {formatDate(project.deadline)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No active projects</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Your bidding performance analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-[#008C7E]">{companyStats.successRate}%</div>
              <p className="text-sm text-gray-600 mt-1">Acceptance Rate</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-[#FF8A2B]">{companyStats.responseTime}h</div>
              <p className="text-sm text-gray-600 mt-1">Avg. Response Time</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{formatCurrency(companyStats.avgProjectValue)}</div>
              <p className="text-sm text-gray-600 mt-1">Avg. Project Value</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{companyStats.pendingInvitations}</div>
              <p className="text-sm text-gray-600 mt-1">Pending Invitations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] dark:text-white mb-2">
                  {userType === 'client' ? 'Client Dashboard' : 'Company Dashboard'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  {userType === 'client' 
                    ? 'Manage your projects and track bids from companies' 
                    : 'Track your bids, manage projects, and grow your business'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchDashboardData()}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
                
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveTab("notifications")}
                    className="relative hover:bg-gray-100 dark:hover:bg-gray-700"
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
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-gray-100 dark:bg-gray-800 w-full">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="profile"
                  className="data-[state=active]:bg-[#0A2540] data-[state=active]:text-white text-sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="messages"
                  className="data-[state=active]:bg-[#FF8A2B] data-[state=active]:text-white text-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Dashboard Content */}
          {activeTab === "overview" ? (
            userType === 'client' ? renderClientDashboard() : renderCompanyDashboard()
          ) : (
            <div className="space-y-6">
              {/* Render other tabs (profile, messages, notifications, settings) */}
              {/* Add your existing code for other tabs here */}
            </div>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      <BidModal
        project={selectedProject}
        company={companyProfile}
        isOpen={bidModalOpen}
        onClose={() => {
          setBidModalOpen(false);
          setSelectedProject(null);
          setSelectedBid(null);
          setIsEditBid(false);
        }}
        onBidSubmit={handleBidSubmit}
        isEdit={isEditBid}
        existingBid={selectedBid}
      />
    </>
  );
}

DashboardPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  userType: PropTypes.string,
  currentUser: PropTypes.object
};

export default DashboardPage;