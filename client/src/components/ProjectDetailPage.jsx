import { useState, useEffect } from 'react';
import { 
  Calendar, DollarSign, Clock, MapPin, Tag, Paperclip, MessageSquare, 
  ArrowLeft, Edit, XCircle, CheckCircle, AlertCircle, Loader2, Eye,
  Users, Shield, Award, TrendingUp, FileText, Briefcase, Zap, Star,
  Download, Share2, Heart, Flag, MoreVertical, Filter, BarChart,
  MessageCircle, Phone, Mail, ExternalLink, ChevronRight, ChevronDown,
  Building2, Globe, Linkedin, Twitter, Facebook, Instagram, Lock
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from 'C:\\Users\\user\\Desktop\\Web_Engineering_Semester_Project\\client\\src\\contexts\\ToastContext.jsx';
import BidModal from './BidModal';
import BidCard from './BidCard';
import { projectAPI, companyAPI, bidAPI, userAPI } from '../services/api';
import PropTypes from 'prop-types';

export function ProjectDetailPage({ projectId, onNavigate, currentUser, userType }) {
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBids, setLoadingBids] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [isEditBid, setIsEditBid] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [bidFilter, setBidFilter] = useState('all');
  const [showAllBids, setShowAllBids] = useState(false);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      loadSavedStatus();
    }
  }, [projectId]);

  useEffect(() => {
    if (project) {
      fetchSimilarProjects();
      fetchQuestions();
    }
  }, [project]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch project details
      const projectData = await projectAPI.getById(projectId);
      if (projectData.project) {
        setProject(projectData.project);
        await fetchBids(projectData.project._id);
        
        // Fetch client profile if not project owner
        if (userType !== 'client' || projectData.project.clientId !== currentUser?._id) {
          fetchClientProfile(projectData.project.clientId);
        }
        
        if (userType === 'company') {
          fetchCompanyProfile();
        }
      }
    } catch (error) {
      console.error('Fetch project error:', error);
      setError({
        warning: false,
        message: `Failed to load project: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async (projectId) => {
    try {
      setLoadingBids(true);
      const bidsData = await projectAPI.getBids(projectId);
      setBids(bidsData.bids || []);
    } catch (error) {
      console.error('Fetch bids error:', error);
      toast({
        title: "Failed to load bids",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingBids(false);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      if (currentUser?.companyId) {
        const profileData = await companyAPI.getById(currentUser.companyId);
        setCompanyProfile(profileData.company);
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const fetchClientProfile = async (clientId) => {
    try {
      const profileData = await userAPI.getById(clientId);
      setClientProfile(profileData.user);
    } catch (error) {
      console.error('Error fetching client profile:', error);
    }
  };

  const fetchSimilarProjects = async () => {
    try {
      const query = new URLSearchParams({
        category: project.category,
        limit: 3,
        exclude: project._id
      });
      const data = await projectAPI.getAll(query.toString());
      setSimilarProjects(data.projects?.slice(0, 3) || []);
    } catch (error) {
      console.error('Error fetching similar projects:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      // In production, this would be an API call
      // For now, using mock data
      const mockQuestions = [
        {
          id: 1,
          question: "Do you have any design files or wireframes ready?",
          askedBy: { name: "Design Studio", type: "company" },
          askedAt: new Date(Date.now() - 3600000),
          answer: "Yes, we have complete wireframes ready for review.",
          answeredBy: { name: "Retail Pro", type: "client" },
          answeredAt: new Date(Date.now() - 1800000)
        },
        {
          id: 2,
          question: "What payment gateway do you prefer?",
          askedBy: { name: "Tech Solutions", type: "company" },
          askedAt: new Date(Date.now() - 7200000),
          answer: "We prefer JazzCash integration, but open to alternatives.",
          answeredBy: { name: "Retail Pro", type: "client" },
          answeredAt: new Date(Date.now() - 3600000)
        }
      ];
      setQuestions(mockQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const loadSavedStatus = () => {
    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    setIsSaved(savedProjects.includes(projectId));
  };

  const handleSaveProject = () => {
    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    let newSaved;
    
    if (isSaved) {
      newSaved = savedProjects.filter(id => id !== projectId);
      toast({
        title: "Project removed",
        description: "Project removed from your saved list",
      });
    } else {
      newSaved = [...savedProjects, projectId];
      toast({
        title: "Project saved",
        description: "Project added to your saved list",
      });
    }
    
    localStorage.setItem('savedProjects', JSON.stringify(newSaved));
    setIsSaved(!isSaved);
  };

  const handleBidSubmit = async (bidData) => {
    try {
      if (isEditBid && selectedBid) {
        await bidAPI.update(project._id, selectedBid._id, bidData);
        toast({
          title: "Bid Updated",
          description: "Your bid has been updated successfully",
        });
      } else {
        await bidAPI.submit(project._id, bidData);
        toast({
          title: "Bid Submitted",
          description: "Your bid has been submitted successfully",
        });
      }
      
      await fetchProjectDetails();
      setBidModalOpen(false);
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

  const handleBidAction = async (bidId, action) => {
    try {
      setSubmittingAction(true);
      
      if (action === 'accept') {
        await bidAPI.accept(project._id, bidId);
        toast({
          title: "Bid Accepted",
          description: "The bid has been accepted and project is now active",
        });
      } else if (action === 'reject') {
        await bidAPI.reject(project._id, bidId);
        toast({
          title: "Bid Rejected",
          description: "The bid has been rejected",
        });
      } else if (action === 'withdraw') {
        await bidAPI.withdraw(project._id, bidId);
        toast({
          title: "Bid Withdrawn",
          description: "Your bid has been withdrawn",
        });
      }
      
      await fetchProjectDetails();
    } catch (error) {
      toast({
        title: "Action Failed",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive"
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleInviteCompanies = async (companyIds) => {
    try {
      for (const companyId of companyIds) {
        await projectAPI.inviteCompany(project._id, companyId);
      }
      
      toast({
        title: "Invitations Sent",
        description: `Invited ${companyIds.length} companies to bid`,
      });
      setShowInviteModal(false);
    } catch (error) {
      toast({
        title: "Failed to Send Invitations",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    
    const newQuestionObj = {
      id: questions.length + 1,
      question: newQuestion.trim(),
      askedBy: { 
        name: userType === 'company' ? companyProfile?.name : currentUser?.name,
        type: userType
      },
      askedAt: new Date(),
      answer: null,
      answeredBy: null,
      answeredAt: null
    };
    
    setQuestions(prev => [newQuestionObj, ...prev]);
    setNewQuestion('');
    
    toast({
      title: "Question Submitted",
      description: "Your question has been submitted to the client",
    });
  };

  const handleAnswerQuestion = (questionId, answer) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            answer,
            answeredBy: { name: currentUser?.name, type: userType },
            answeredAt: new Date()
          }
        : q
    );
    
    setQuestions(updatedQuestions);
    toast({
      title: "Answer Submitted",
      description: "Your answer has been posted",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      bidding: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'posted': return <Zap className="h-4 w-4" />;
      case 'bidding': return <TrendingUp className="h-4 w-4" />;
      case 'active': return <Briefcase className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Negotiable';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  const isProjectOwner = currentUser && project && 
    (project.clientId?._id === currentUser._id || project.clientId === currentUser._id);
  
  const isCompanyVerified = companyProfile?.verified && companyProfile?.verificationStatus === 'approved';
  const canBid = userType === 'company' && project && 
    (project.status === 'posted' || project.status === 'bidding') && 
    isCompanyVerified;
  
  const hasAlreadyBid = userType === 'company' && project && bids.some(bid => 
    bid.company?._id === companyProfile?._id || bid.companyId === companyProfile?._id
  );
  
  const companyBid = bids.find(bid => 
    bid.company?._id === companyProfile?._id || bid.companyId === companyProfile?._id
  );
  
  const isInvited = project?.isInviteOnly && project?.invitedCompanies?.includes(companyProfile?._id);
  const canBidOnInviteOnly = !project?.isInviteOnly || isInvited;

  const filteredBids = bids.filter(bid => {
    if (bidFilter === 'all') return true;
    if (bidFilter === 'pending') return bid.status === 'pending' || bid.status === 'submitted';
    if (bidFilter === 'accepted') return bid.status === 'accepted';
    if (bidFilter === 'rejected') return bid.status === 'rejected';
    return true;
  });

  const displayedBids = showAllBids ? filteredBids : filteredBids.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008C7E] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Project Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <div className="space-y-3">
            <Button 
              className="w-full bg-[#008C7E] hover:bg-[#007066]"
              onClick={() => onNavigate(userType === 'company' ? 'browse-projects' : 'dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => onNavigate(userType === 'company' ? 'browse-projects' : 'dashboard')}
                className="self-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveProject}
                  className={isSaved ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}
                >
                  <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copied to clipboard" });
                  }}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.print()}>
                      <FileText className="h-4 w-4 mr-2" />
                      Print Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* Export as PDF */}}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* Report project */}}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1">{project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}</span>
                  </Badge>
                  
                  {project.isInviteOnly && (
                    <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300">
                      <Lock className="h-3 w-3 mr-1" />
                      Invite Only
                    </Badge>
                  )}
                  
                  {project.featured && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-[#0A2540] dark:text-white mb-4">
                  {project.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Posted {formatDate(project.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {project.timeline?.value} {project.timeline?.unit}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {project.viewCount || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {bids.length} bids
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {isProjectOwner && project.status === 'posted' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate('edit-project', project._id)}
                      disabled={submittingAction}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Project
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Invite Companies
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Companies to Bid</DialogTitle>
                          <DialogDescription>
                            Select companies to invite them to bid on this project.
                          </DialogDescription>
                        </DialogHeader>
                        {/* Add invite company form here */}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={async () => {
                        if (!confirm('Are you sure you want to cancel this project? All bids will be rejected.')) return;
                        try {
                          setSubmittingAction(true);
                          await projectAPI.cancel(project._id);
                          toast({
                            title: "Project Cancelled",
                            description: "Project has been cancelled successfully",
                          });
                          onNavigate('dashboard');
                        } catch (error) {
                          toast({
                            title: "Failed to cancel project",
                            description: error.response?.data?.error || "Please try again",
                            variant: "destructive"
                          });
                        } finally {
                          setSubmittingAction(false);
                        }
                      }}
                      disabled={submittingAction}
                    >
                      {submittingAction ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Cancel Project
                    </Button>
                  </>
                )}
                
                {canBid && canBidOnInviteOnly && !hasAlreadyBid && (
                  <Button
                    className="bg-gradient-to-r from-[#008C7E] to-teal-600 hover:from-[#007066] hover:to-teal-700"
                    onClick={() => setBidModalOpen(true)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Submit Bid
                  </Button>
                )}
                
                {hasAlreadyBid && companyBid && (
                  <div className="flex flex-col gap-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Bid Submitted: {formatCurrency(companyBid.amount)}
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBid(companyBid);
                        setIsEditBid(true);
                        setBidModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Bid
                    </Button>
                  </div>
                )}
                
                {!canBidOnInviteOnly && userType === 'company' && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <Lock className="h-3 w-3 mr-1" />
                    Invitation Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="bids">
                Bids {bids.length > 0 && `(${bids.length})`}
              </TabsTrigger>
              <TabsTrigger value="qna">Q&A</TabsTrigger>
              <TabsTrigger value="similar">Similar Projects</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Project Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Description</CardTitle>
                      <CardDescription>
                        Detailed project requirements and scope
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`prose dark:prose-invert max-w-none ${!isExpanded && 'line-clamp-6'}`}>
                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                          {project.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-4"
                      >
                        {isExpanded ? 'Show Less' : 'Read More'}
                        {isExpanded ? 
                          <ChevronDown className="h-4 w-4 ml-2" /> : 
                          <ChevronRight className="h-4 w-4 ml-2" />
                        }
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Tech Stack & Requirements */}
                  {project.techStack && project.techStack.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Technology Stack</CardTitle>
                        <CardDescription>
                          Required technologies and skills
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {project.techStack.map((tech, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm py-1.5">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Attachments */}
                  {project.attachments && project.attachments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Files</CardTitle>
                        <CardDescription>
                          Download project briefs and documents
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {project.attachments.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded">
                                  <Paperclip className="h-4 w-4 text-gray-500" />
                                </div>
                                <div>
                                  <p className="font-medium">{file.originalName}</p>
                                  <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB • {file.fileType || 'Document'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Project Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Category</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {project.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Budget Range</Label>
                        <div className="text-lg font-bold text-[#0A2540] dark:text-white mt-1">
                          {formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Timeline</Label>
                        <div className="text-lg font-bold text-[#0A2540] dark:text-white mt-1 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {project.timeline?.value} {project.timeline?.unit}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Deadline</Label>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {project.expiresAt ? 
                            `${formatDate(project.expiresAt)} (${Math.ceil((new Date(project.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days left)` : 
                            'Open ended'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Payment Method</Label>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 capitalize">
                          {project.paymentMethod}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {clientProfile?.name?.charAt(0) || project.clientInfo?.name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-[#0A2540] dark:text-white">
                            {clientProfile?.name || project.clientInfo?.name || 'Client'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {clientProfile?.email || project.clientInfo?.email || 'No email provided'}
                          </div>
                          {clientProfile?.verified && (
                            <Badge className="mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified Client
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {!isProjectOwner && (
                        <div className="space-y-2">
                          <Button 
                            className="w-full bg-[#008C7E] hover:bg-[#007066]"
                            onClick={() => onNavigate('messages', project.clientId?._id || project.clientId)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message Client
                          </Button>
                          {clientProfile?.phone && (
                            <Button variant="outline" className="w-full">
                              <Phone className="h-4 w-4 mr-2" />
                              Call Client
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Client Stats</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-lg font-bold text-[#0A2540] dark:text-white">
                              {clientProfile?.stats?.completedProjects || '0'}
                            </div>
                            <div className="text-xs text-gray-500">Projects</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-lg font-bold text-[#0A2540] dark:text-white">
                              {clientProfile?.stats?.avgRating?.toFixed(1) || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Rating</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Bids Tab */}
            <TabsContent value="bids" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Project Bids</CardTitle>
                      <CardDescription>
                        {bids.length} {bids.length === 1 ? 'bid' : 'bids'} submitted
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Select value={bidFilter} onValueChange={setBidFilter}>
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
                      
                      {isProjectOwner && (
                        <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                          <Users className="h-4 w-4 mr-2" />
                          Invite More
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {loadingBids ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                      <p className="text-gray-500 mt-2">Loading bids...</p>
                    </div>
                  ) : filteredBids.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Bids Yet</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {isProjectOwner ? 
                          "No companies have bid on your project yet. Try inviting companies or wait for bids to come in." :
                          "Be the first to bid on this project and get the opportunity to work with the client."
                        }
                      </p>
                      {canBid && canBidOnInviteOnly && !hasAlreadyBid && (
                        <Button onClick={() => setBidModalOpen(true)}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Submit First Bid
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Bid Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-[#0A2540] dark:text-white">{filteredBids.length}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Bids</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">
                              {filteredBids.filter(b => b.status === 'accepted').length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Accepted</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">
                              {filteredBids.filter(b => b.status === 'pending' || b.status === 'submitted').length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-gray-600">
                              {formatCurrency(
                                filteredBids.reduce((sum, bid) => sum + (bid.amount || 0), 0) / filteredBids.length || 0
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Bid</div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Bid List */}
                      <div className="space-y-4">
                        {displayedBids.map((bid) => (
                          <BidCard
                            key={bid._id}
                            bid={bid}
                            project={project}
                            company={bid.company}
                            isClientView={isProjectOwner}
                            isCompanyView={userType === 'company' && companyProfile?._id === bid.company?._id}
                            onStatusChange={fetchProjectDetails}
                            onViewDetails={() => {/* Show bid details modal */}}
                            onSendMessage={(userId) => onNavigate('messages', userId)}
                            onCompare={() => {/* Add to comparison */}}
                          />
                        ))}
                      </div>
                      
                      {filteredBids.length > 5 && (
                        <div className="text-center mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setShowAllBids(!showAllBids)}
                          >
                            {showAllBids ? 'Show Less' : `Show All ${filteredBids.length} Bids`}
                            {showAllBids ? 
                              <ChevronDown className="h-4 w-4 ml-2" /> : 
                              <ChevronRight className="h-4 w-4 ml-2" />
                            }
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Q&A Tab */}
            <TabsContent value="qna" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Questions & Answers</CardTitle>
                  <CardDescription>
                    Ask questions or provide clarifications about this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Ask Question Form */}
                  {!isProjectOwner && (
                    <div className="mb-8">
                      <Label htmlFor="question" className="text-sm font-medium mb-2 block">
                        Ask a Question
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="question"
                          placeholder="Ask the client a question about this project..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && handleSubmitQuestion()}
                        />
                        <Button onClick={handleSubmitQuestion} disabled={!newQuestion.trim()}>
                          Ask
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Questions List */}
                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Questions Yet</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {isProjectOwner ? 
                          "No one has asked any questions yet. Questions will appear here when companies ask about your project." :
                          "Be the first to ask a question. Get clarifications before submitting your bid."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {questions.map((question) => (
                        <div key={question.id} className="border rounded-lg p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {question.askedBy.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{question.askedBy.name}</div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(question.askedAt)} • {question.askedBy.type}
                                </div>
                              </div>
                            </div>
                            {isProjectOwner && !question.answer && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm">Answer</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Answer Question</DialogTitle>
                                    <DialogDescription>
                                      Provide a helpful answer to this question.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Textarea 
                                    placeholder="Type your answer here..."
                                    className="min-h-[100px]"
                                    id={`answer-${question.id}`}
                                  />
                                  <Button onClick={() => {
                                    const answer = document.getElementById(`answer-${question.id}`).value;
                                    handleAnswerQuestion(question.id, answer);
                                  }}>
                                    Submit Answer
                                  </Button>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold text-[#0A2540] dark:text-white mb-2">Question:</h4>
                            <p className="text-gray-700 dark:text-gray-300">{question.question}</p>
                          </div>
                          
                          {question.answer && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Answered by {question.answeredBy.name}</span>
                                <span className="text-sm text-gray-500 ml-auto">
                                  {formatDate(question.answeredAt)}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{question.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Similar Projects Tab */}
            <TabsContent value="similar" className="mt-6">
              {similarProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Similar Projects Found</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Check back later for more projects in this category.
                    </p>
                    <Button onClick={() => onNavigate('browse-projects')}>
                      Browse All Projects
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {similarProjects.map((similarProject) => (
                    <Card key={similarProject._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div 
                          className="mb-4"
                          onClick={() => onNavigate('project-detail', similarProject._id)}
                        >
                          <h4 className="font-bold text-lg text-[#0A2540] dark:text-white hover:text-[#008C7E] mb-2">
                            {similarProject.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                            {similarProject.description}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Budget</span>
                            <span className="font-semibold">
                              {formatCurrency(similarProject.budget?.min)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Timeline</span>
                            <span className="font-semibold">
                              {similarProject.timeline?.value} {similarProject.timeline?.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Bids</span>
                            <span className="font-semibold">
                              {similarProject.bids?.length || 0}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full mt-4"
                          variant="outline"
                          onClick={() => onNavigate('project-detail', similarProject._id)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bid Modal */}
      <BidModal
        project={project}
        company={companyProfile}
        isOpen={bidModalOpen}
        onClose={() => {
          setBidModalOpen(false);
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

ProjectDetailPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  userType: PropTypes.string
};

export default ProjectDetailPage;