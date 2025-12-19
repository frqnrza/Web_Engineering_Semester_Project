import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, SlidersHorizontal, X, Calendar, DollarSign, Clock, Eye, 
  Filter, Zap, TrendingUp, Award, Shield, Star, Users, MapPin, 
  CheckCircle, AlertCircle, Sparkles, Clock3, Target, Briefcase,
  Plus, MessageSquare, Heart, Download, Share2, SortDesc, Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from 'C:\\Users\\user\\Desktop\\Web_Engineering_Semester_Project\\client\\src\\contexts\\ToastContext.jsx';
import BidModal from './BidModal';
import { projectAPI, companyAPI } from '../services/api';
import PropTypes from 'prop-types';

export function BrowseProjectsPage({ onNavigate, currentUser, userType }) {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetRange, setBudgetRange] = useState([0, 1000000]);
  const [selectedTimelines, setSelectedTimelines] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [viewType, setViewType] = useState('grid');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [savedProjects, setSavedProjects] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState([]);

  const categories = [
    { id: 'web', label: 'Web Development', icon: <Globe className="h-4 w-4" /> },
    { id: 'mobile', label: 'Mobile Apps', icon: <Smartphone className="h-4 w-4" /> },
    { id: 'marketing', label: 'Digital Marketing', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'design', label: 'UI/UX Design', icon: <Palette className="h-4 w-4" /> },
    { id: 'ecommerce', label: 'E-commerce', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'saas', label: 'SaaS Development', icon: <Cloud className="h-4 w-4" /> },
    { id: 'ai-ml', label: 'AI/ML', icon: <Cpu className="h-4 w-4" /> },
    { id: 'other', label: 'Other', icon: <MoreHorizontal className="h-4 w-4" /> }
  ];

  const timelines = [
    { id: 'urgent', label: 'Urgent (1-2 weeks)', icon: <Zap className="h-4 w-4" /> },
    { id: 'short', label: 'Short (2-4 weeks)', icon: <Clock3 className="h-4 w-4" /> },
    { id: 'medium', label: 'Medium (1-3 months)', icon: <Calendar className="h-4 w-4" /> },
    { id: 'long', label: 'Long (3-6 months)', icon: <Clock className="h-4 w-4" /> },
    { id: 'flexible', label: 'Flexible', icon: <Target className="h-4 w-4" /> }
  ];

  const projectStatuses = [
    { id: 'posted', label: 'New Projects', badge: 'New', color: 'bg-green-100 text-green-800' },
    { id: 'bidding', label: 'Active Bidding', badge: 'Hot', color: 'bg-red-100 text-red-800' },
    { id: 'featured', label: 'Featured', badge: 'Featured', color: 'bg-purple-100 text-purple-800' },
    { id: 'invite_only', label: 'Invite Only', badge: 'Private', color: 'bg-blue-100 text-blue-800' }
  ];

  useEffect(() => {
    fetchProjects();
    if (userType === 'company') {
      fetchCompanyProfile();
    }
    loadSavedProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      // Build query based on active tab
      if (activeTab !== 'all') {
        const statusMap = {
          'new': 'posted',
          'bidding': 'bidding',
          'featured': 'posted', // Featured would need special handling
          'invite': 'posted' // Invite-only would need special handling
        };
        if (statusMap[activeTab]) {
          queryParams.append('status', statusMap[activeTab]);
        }
      } else {
        queryParams.append('status', 'posted,bidding');
      }
      
      if (selectedCategories.length > 0) {
        queryParams.append('category', selectedCategories.join(','));
      }
      
      if (selectedTimelines.length > 0) {
        queryParams.append('timeline', selectedTimelines.join(','));
      }
      
      if (budgetRange[0] > 0 || budgetRange[1] < 1000000) {
        queryParams.append('minBudget', budgetRange[0]);
        queryParams.append('maxBudget', budgetRange[1]);
      }
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (showVerifiedOnly) {
        queryParams.append('verifiedClients', 'true');
      }

      const data = await projectAPI.getAllProjects(queryParams.toString());
      let projectsData = data.projects || [];

      // Apply sorting
      projectsData = sortProjects(projectsData, sortBy);
      
      // Apply invite-only filter if needed
      if (activeTab === 'invite') {
        projectsData = projectsData.filter(p => p.isInviteOnly);
      }

      setProjects(projectsData);
      updateAppliedFilters();
    } catch (error) {
      console.error('Fetch projects error:', error);
      toast({
        title: "Failed to load projects",
        description: "Please try again later",
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
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const loadSavedProjects = () => {
    const saved = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    setSavedProjects(saved);
  };

  const sortProjects = (projects, sortMethod) => {
    switch (sortMethod) {
      case 'newest':
        return [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'deadline':
        return [...projects].sort((a, b) => new Date(a.expiresAt || a.deadline) - new Date(b.expiresAt || b.deadline));
      case 'budget_high':
        return [...projects].sort((a, b) => (b.budget?.max || 0) - (a.budget?.max || 0));
      case 'budget_low':
        return [...projects].sort((a, b) => (a.budget?.min || 0) - (b.budget?.min || 0));
      case 'most_bids':
        return [...projects].sort((a, b) => (b.bids?.length || 0) - (a.bids?.length || 0));
      case 'fewest_bids':
        return [...projects].sort((a, b) => (a.bids?.length || 0) - (b.bids?.length || 0));
      default:
        return projects;
    }
  };

  const updateAppliedFilters = () => {
    const filters = [];
    if (selectedCategories.length > 0) {
      filters.push(`${selectedCategories.length} categories`);
    }
    if (selectedTimelines.length > 0) {
      filters.push(`${selectedTimelines.length} timelines`);
    }
    if (budgetRange[0] > 0 || budgetRange[1] < 1000000) {
      filters.push('Custom budget');
    }
    if (searchQuery) {
      filters.push('Search: ' + searchQuery.substring(0, 20) + '...');
    }
    if (showVerifiedOnly) {
      filters.push('Verified only');
    }
    setAppliedFilters(filters);
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.techStack || []).some(tech => 
          tech.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(project.category);

      const projectBudgetMin = project.budget?.min || 0;
      const projectBudgetMax = project.budget?.max || 1000000;
      const matchesBudget = 
        (projectBudgetMin >= budgetRange[0] && projectBudgetMin <= budgetRange[1]) ||
        (projectBudgetMax >= budgetRange[0] && projectBudgetMax <= budgetRange[1]) ||
        (projectBudgetMin <= budgetRange[0] && projectBudgetMax >= budgetRange[1]);

      const matchesTimeline = selectedTimelines.length === 0 || 
        (project.timeline && selectedTimelines.some(timeline => {
          const [min, max] = getTimelineRange(timeline);
          const projectWeeks = convertToWeeks(project.timeline.value, project.timeline.unit);
          return projectWeeks >= min && projectWeeks <= max;
        }));

      return matchesSearch && matchesCategory && matchesBudget && matchesTimeline;
    });

    // Apply sorting
    filtered = sortProjects(filtered, sortBy);
    
    // Apply verified clients filter
    if (showVerifiedOnly) {
      filtered = filtered.filter(project => project.clientId?.verified);
    }

    return filtered;
  }, [projects, searchQuery, selectedCategories, selectedTimelines, budgetRange, sortBy, showVerifiedOnly]);

  const getTimelineRange = (timelineId) => {
    switch (timelineId) {
      case 'urgent': return [1, 2];
      case 'short': return [2, 4];
      case 'medium': return [4, 12];
      case 'long': return [12, 24];
      default: return [0, Infinity];
    }
  };

  const convertToWeeks = (value, unit) => {
    switch (unit) {
      case 'days': return value / 7;
      case 'weeks': return value;
      case 'months': return value * 4;
      default: return value;
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTimelineToggle = (timelineId) => {
    setSelectedTimelines(prev =>
      prev.includes(timelineId)
        ? prev.filter(id => id !== timelineId)
        : [...prev, timelineId]
    );
  };

  const handleProjectSave = (projectId) => {
    const newSaved = savedProjects.includes(projectId)
      ? savedProjects.filter(id => id !== projectId)
      : [...savedProjects, projectId];
    
    setSavedProjects(newSaved);
    localStorage.setItem('savedProjects', JSON.stringify(newSaved));
    
    toast({
      title: savedProjects.includes(projectId) ? 'Project removed from saved' : 'Project saved',
      description: savedProjects.includes(projectId) 
        ? 'Project removed from your saved list' 
        : 'Project added to your saved list',
    });
  };

  const handleBidClick = (project) => {
    if (userType !== 'company') {
      toast({
        title: "Company account required",
        description: "Please login with a company account to submit bids",
        variant: "destructive"
      });
      return;
    }

    if (!companyProfile?.verified) {
      toast({
        title: "Verification required",
        description: "Please complete your company verification to submit bids",
        variant: "destructive"
      });
      return;
    }

    setSelectedProject(project);
    setBidModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTimelines([]);
    setBudgetRange([0, 1000000]);
    setSearchQuery('');
    setShowVerifiedOnly(false);
    setSortBy('newest');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Negotiable';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const ProjectCard = ({ project }) => {
    const isSaved = savedProjects.includes(project._id);
    const hasBid = userType === 'company' && companyProfile && 
      project.bids?.some(bid => bid.companyId === companyProfile._id);
    const isInvited = project.isInviteOnly && project.invitedCompanies?.includes(companyProfile?._id);
    const canBid = !project.isInviteOnly || isInvited;

    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-[#008C7E]/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">
                  {project.category}
                </Badge>
                {project.isInviteOnly && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Invite Only
                  </Badge>
                )}
                {project.status === 'bidding' && project.bids?.length > 5 && (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Hot
                  </Badge>
                )}
                {project.featured && (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <h3 
                className="text-lg font-bold text-[#0A2540] mb-2 hover:text-[#008C7E] cursor-pointer truncate"
                onClick={() => onNavigate('project-detail', project._id)}
              >
                {project.title}
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {project.clientId?.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{project.clientId?.name || 'Client'}</span>
                  {project.clientId?.verified && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {getTimeAgo(project.createdAt)}
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleProjectSave(project._id)}
              className={isSaved ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}
            >
              <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <p className="text-gray-700 mb-4 line-clamp-2 text-sm">
            {project.description}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Tech Stack:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.techStack?.slice(0, 4).map((tech, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {project.techStack?.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{project.techStack.length - 4} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Budget</div>
              <div className="font-bold text-[#0A2540] text-sm">
                {formatCurrency(project.budget?.min)}
                {project.budget?.max && project.budget?.max !== project.budget?.min && (
                  <> - {formatCurrency(project.budget?.max)}</>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Timeline</div>
              <div className="font-bold text-[#0A2540] text-sm flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {project.timeline?.value} {project.timeline?.unit}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Bids</div>
              <div className="font-bold text-[#0A2540] text-sm flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                {project.bids?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 border-t">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => onNavigate('project-detail', project._id)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            {userType === 'company' && (
              <Button
                onClick={() => handleBidClick(project)}
                className={`flex-1 ${
                  !canBid 
                    ? 'bg-gray-400 hover:bg-gray-400' 
                    : hasBid 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-[#008C7E] hover:bg-[#007a6d]'
                }`}
                disabled={!canBid}
              >
                {!canBid ? (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Private
                  </>
                ) : hasBid ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Bid Submitted
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Submit Bid
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Categories
          </h3>
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCategories.length} selected
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label
                htmlFor={`cat-${category.id}`}
                className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
              >
                <span className="text-gray-500">{category.icon}</span>
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0A2540]">Budget Range</h3>
          <Badge variant="outline" className="text-xs">
            {formatCurrency(budgetRange[0])} - {formatCurrency(budgetRange[1])}
          </Badge>
        </div>
        <div className="space-y-4">
          <Slider
            min={0}
            max={5000000}
            step={50000}
            value={budgetRange}
            onValueChange={setBudgetRange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>PKR 0</span>
            <span>PKR 5M</span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </h3>
          {selectedTimelines.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedTimelines.length} selected
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {timelines.map((timeline) => (
            <div key={timeline.id} className="flex items-center space-x-2">
              <Checkbox
                id={`time-${timeline.id}`}
                checked={selectedTimelines.includes(timeline.id)}
                onCheckedChange={() => handleTimelineToggle(timeline.id)}
              />
              <Label
                htmlFor={`time-${timeline.id}`}
                className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
              >
                <span className="text-gray-500">{timeline.icon}</span>
                {timeline.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="verified-only" className="font-semibold text-[#0A2540]">
            Verified Clients Only
          </Label>
          <Switch
            id="verified-only"
            checked={showVerifiedOnly}
            onCheckedChange={setShowVerifiedOnly}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="invite-only" className="font-semibold text-[#0A2540]">
            Show Invite-Only Projects
          </Label>
          <Switch
            id="invite-only"
            checked={activeTab === 'invite'}
            onCheckedChange={(checked) => setActiveTab(checked ? 'invite' : 'all')}
          />
        </div>
      </div>

      {(selectedCategories.length > 0 || selectedTimelines.length > 0 || 
        budgetRange[0] > 0 || budgetRange[1] < 1000000 || searchQuery || showVerifiedOnly) && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#0A2540] dark:text-white mb-2">
                  Browse Projects
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                  Find projects that match your expertise. Submit competitive bids and grow your business with TechConnect.
                </p>
              </div>
              
              {userType === 'company' && companyProfile?.verified && (
                <Button 
                  className="bg-gradient-to-r from-[#FF8A2B] to-orange-500 hover:from-[#e67a1f] hover:to-orange-600"
                  onClick={() => onNavigate('post-project')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post a Project
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <Input
                  placeholder="Search projects by title, description, or tech stack..."
                  className="pl-10 h-11 dark:bg-gray-800 dark:border-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-4 w-4" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="deadline">Closest Deadline</SelectItem>
                    <SelectItem value="budget_high">Highest Budget</SelectItem>
                    <SelectItem value="budget_low">Lowest Budget</SelectItem>
                    <SelectItem value="most_bids">Most Bids</SelectItem>
                    <SelectItem value="fewest_bids">Fewest Bids</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={viewType} onValueChange={setViewType}>
                  <SelectTrigger className="w-[120px] dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  className="md:hidden dark:border-gray-700"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <SlidersHorizontal size={20} />
                </Button>
              </div>
            </div>

            {/* Applied Filters */}
            {appliedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Applied filters:</span>
                {appliedFilters.map((filter, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {filter}
                    <button 
                      onClick={() => {
                        // Handle filter removal
                        if (filter.includes('categories')) clearFilters();
                        else if (filter.includes('timelines')) setSelectedTimelines([]);
                        else if (filter.includes('budget')) setBudgetRange([0, 1000000]);
                        else if (filter.includes('Search')) setSearchQuery('');
                        else if (filter.includes('Verified')) setShowVerifiedOnly(false);
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-red-500 hover:text-red-600"
                >
                  Clear all
                </Button>
              </div>
            )}

            {/* Project Status Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-gray-100 dark:bg-gray-800 w-full">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white text-sm"
                >
                  All Projects
                </TabsTrigger>
                <TabsTrigger 
                  value="new"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    New
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bidding"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-sm"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Hot Bidding
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="featured"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Featured
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="invite"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Invite Only
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Desktop Filter Panel */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#0A2540] dark:text-white flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h2>
                  {appliedFilters.length > 0 && (
                    <Badge className="bg-[#008C7E] text-white">
                      {appliedFilters.length} active
                    </Badge>
                  )}
                </div>
                <FilterPanel />
                
                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-[#0A2540] dark:text-white mb-3">Market Insights</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Projects</span>
                      <span className="font-medium">{projects.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Avg. Budget</span>
                      <span className="font-medium">
                        {formatCurrency(projects.reduce((acc, p) => acc + (p.budget?.min || 0), 0) / projects.length || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Avg. Bids</span>
                      <span className="font-medium">
                        {Math.round(projects.reduce((acc, p) => acc + (p.bids?.length || 0), 0) / projects.length || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Filters Modal */}
            {showMobileFilters && (
              <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileFilters(false)}>
                <div 
                  className="bg-white dark:bg-gray-800 w-80 h-full p-6 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#0A2540] dark:text-white">Filters</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileFilters(false)}
                      className="dark:text-gray-400"
                    >
                      <X size={20} />
                    </Button>
                  </div>
                  <FilterPanel />
                </div>
              </div>
            )}

            {/* Projects Grid */}
            <div className="lg:col-span-9">
              {/* Projects Count and Actions */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {loading ? 'Loading projects...' : `${filteredProjects.length} projects found`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {!loading && filteredProjects.length > 0 && (
                      <>Showing {Math.min(filteredProjects.length, 12)} of {filteredProjects.length} projects</>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchProjects}
                    className="dark:border-gray-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden dark:border-gray-700"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className={`${viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
                  {filteredProjects.slice(0, 12).map((project) => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No projects found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      No projects match your current filters. Try adjusting your search criteria or clear all filters to see all available projects.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={clearFilters}>
                        Clear All Filters
                      </Button>
                      <Button variant="outline" onClick={fetchProjects}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Load More Button */}
              {!loading && filteredProjects.length > 12 && (
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      // In production, implement pagination
                      toast({
                        title: "More projects loaded",
                        description: "Loading additional projects...",
                      });
                    }}
                  >
                    Load More Projects
                  </Button>
                </div>
              )}
            </div>
          </div>
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
        }}
        onBidSubmit={() => {
          toast({
            title: "Bid submitted successfully",
            description: "Your bid has been submitted to the client",
          });
          fetchProjects();
        }}
      />
    </>
  );
}

BrowseProjectsPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  userType: PropTypes.string
};

// Add missing icon components
const Globe = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
const Smartphone = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const Palette = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const ShoppingCart = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const Cloud = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" /></svg>;
const Cpu = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;
const MoreHorizontal = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
const RefreshCw = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

export default BrowseProjectsPage;