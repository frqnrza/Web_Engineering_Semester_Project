import { useState, useEffect, useMemo } from "react";
import { 
  Search, SlidersHorizontal, X, Loader2, Filter, Star, Shield, 
  MapPin, Users, Calendar, Award, TrendingUp, Zap, Eye, Plus,
  Building2, Briefcase, CheckCircle, DollarSign, Clock, Heart,
  TrendingDown, AlertCircle, MessageSquare, Send, Download, Share2
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CompanyCard } from "./CompanyCard";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from 'C:\\Users\\user\\Desktop\\Web_Engineering_Semester_Project\\client\\src\\contexts\\ToastContext.jsx';
import { companyAPI, projectAPI } from "../services/api";
import PropTypes from 'prop-types';

export function BrowsePage({ onNavigate, currentUser, userType }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('rating');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showRecentlyJoined, setShowRecentlyJoined] = useState(false);
  const [viewType, setViewType] = useState('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [stats, setStats] = useState(null);
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState([]);

  // Available services based on market data
  const availableServices = [
    "Web Development", "Mobile App Development", "E-commerce", "UI/UX Design",
    "Digital Marketing", "SEO", "Content Writing", "Video Production",
    "Social Media Marketing", "Branding", "Cloud Services", "DevOps",
    "AI/ML Development", "Blockchain", "Cybersecurity", "IT Consulting"
  ];

  // Available locations in Pakistan
  const availableLocations = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot",
    "Gujranwala", "Bahawalpur", "Sargodha", "Sukkur", "Larkana"
  ];

  useEffect(() => {
    fetchCompanies();
    loadSavedCompanies();
    loadRecentlyViewed();
    fetchStats();
  }, []);

  useEffect(() => {
    updateAppliedFilters();
  }, [selectedCategories, priceRange, searchQuery, showVerifiedOnly, selectedServices, selectedLocations]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (selectedCategories.length > 0) {
        queryParams.append('category', selectedCategories.join(','));
      }
      
      if (selectedServices.length > 0) {
        queryParams.append('services', selectedServices.join(','));
      }
      
      if (selectedLocations.length > 0) {
        queryParams.append('location', selectedLocations.join(','));
      }
      
      if (priceRange[0] > 0 || priceRange[1] < 1000000) {
        queryParams.append('minPrice', priceRange[0]);
        queryParams.append('maxPrice', priceRange[1]);
      }
      
      if (showVerifiedOnly) {
        queryParams.append('verified', 'true');
      }
      
      queryParams.append('sortBy', sortBy);
      
      const data = await companyAPI.getAll(queryParams.toString());
      let companiesData = data.companies || [];
      
      // Apply additional filters
      if (showRecentlyJoined) {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        companiesData = companiesData.filter(company => 
          new Date(company.createdAt) > oneMonthAgo
        );
      }
      
      // Sort based on sortBy
      companiesData = sortCompanies(companiesData, sortBy);
      
      setCompanies(companiesData);
      setTotalCompanies(data.total || companiesData.length);
      
      // Track recently viewed
      trackRecentlyViewed(companiesData);
    } catch (error) {
      console.error('Fetch companies error:', error);
      setError('Failed to load companies. Please try again.');
      toast({
        title: "Error loading companies",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // This would typically come from an API endpoint
      const mockStats = {
        totalVerified: 245,
        averageRating: 4.7,
        averageResponseTime: "2 hours",
        totalProjects: 1890,
        successRate: "94%"
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadSavedCompanies = () => {
    const saved = JSON.parse(localStorage.getItem('savedCompanies') || '[]');
    setSavedCompanies(saved);
  };

  const loadRecentlyViewed = () => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewedCompanies') || '[]');
    setRecentlyViewed(viewed);
  };

  const trackRecentlyViewed = (companies) => {
    const viewedIds = companies.slice(0, 5).map(c => c._id);
    localStorage.setItem('recentlyViewedCompanies', JSON.stringify(viewedIds));
    setRecentlyViewed(viewedIds);
  };

  const updateAppliedFilters = () => {
    const filters = [];
    if (selectedCategories.length > 0) {
      filters.push(`${selectedCategories.length} categories`);
    }
    if (selectedServices.length > 0) {
      filters.push(`${selectedServices.length} services`);
    }
    if (selectedLocations.length > 0) {
      filters.push(`${selectedLocations.length} locations`);
    }
    if (priceRange[0] > 0 || priceRange[1] < 1000000) {
      filters.push('Custom price range');
    }
    if (searchQuery) {
      filters.push(`Search: ${searchQuery.substring(0, 15)}...`);
    }
    if (showVerifiedOnly) {
      filters.push('Verified only');
    }
    setAppliedFilters(filters);
  };

  const sortCompanies = (companies, sortMethod) => {
    switch (sortMethod) {
      case 'rating':
        return [...companies].sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
      case 'price_low':
        return [...companies].sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
      case 'price_high':
        return [...companies].sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
      case 'recent':
        return [...companies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'name':
        return [...companies].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return companies;
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleLocationToggle = (location) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedServices([]);
    setSelectedLocations([]);
    setPriceRange([0, 1000000]);
    setSearchQuery("");
    setShowVerifiedOnly(false);
    setShowRecentlyJoined(false);
    setSortBy('rating');
    setAppliedFilters([]);
  };

  const handleViewProfile = (companyId) => {
    onNavigate('company-profile', companyId);
  };

  const handleInviteToBid = async (companyId) => {
    try {
      // First, check if user has any projects
      const projects = await projectAPI.getUserProjects();
      const openProjects = projects.projects?.filter(p => 
        p.status === 'posted' || p.status === 'bidding'
      ) || [];
      
      if (openProjects.length === 0) {
        toast({
          title: "No projects available",
          description: "Please create a project first before inviting companies",
          variant: "destructive"
        });
        return;
      }
      
      // Navigate to project selection for invitation
      onNavigate('select-project-for-invite', companyId);
    } catch (error) {
      console.error('Error checking projects:', error);
      toast({
        title: "Error",
        description: "Failed to check your projects. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveCompany = (companyId) => {
    const newSaved = savedCompanies.includes(companyId)
      ? savedCompanies.filter(id => id !== companyId)
      : [...savedCompanies, companyId];
    
    setSavedCompanies(newSaved);
    localStorage.setItem('savedCompanies', JSON.stringify(newSaved));
    
    toast({
      title: savedCompanies.includes(companyId) ? 'Company removed from saved' : 'Company saved',
      description: savedCompanies.includes(companyId) 
        ? 'Company removed from your saved list' 
        : 'Company added to your saved list',
    });
  };

  const handleExportCompanies = () => {
    const dataToExport = filteredCompanies.map(company => ({
      Name: company.name,
      Category: company.category,
      Services: company.services?.join(', '),
      Location: company.location,
      'Starting Price': company.startingPrice,
      Rating: company.ratings?.average || 'N/A',
      'Review Count': company.ratings?.count || 0,
      'Team Size': company.teamSize,
      'Years in Business': company.yearsInBusiness,
      Verified: company.verified ? 'Yes' : 'No'
    }));
    
    const csvContent = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Export successful",
      description: "Companies data exported as CSV",
    });
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0A2540]">Categories</h3>
          {selectedCategories.length > 0 && (
            <Badge variant="secondary">{selectedCategories.length}</Badge>
          )}
        </div>
        <div className="space-y-2">
          {[
            { id: 'web', label: 'Web Development' },
            { id: 'mobile', label: 'Mobile Apps' },
            { id: 'marketing', label: 'Digital Marketing' },
            { id: 'design', label: 'UI/UX Design' },
            { id: 'other', label: 'Other' }
          ].map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label
                htmlFor={`cat-${category.id}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0A2540]">Services</h3>
          {selectedServices.length > 0 && (
            <Badge variant="secondary">{selectedServices.length}</Badge>
          )}
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {availableServices.map((service) => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service}`}
                checked={selectedServices.includes(service)}
                onCheckedChange={() => handleServiceToggle(service)}
              />
              <Label
                htmlFor={`service-${service}`}
                className="text-sm font-normal cursor-pointer flex-1 truncate"
              >
                {service}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0A2540]">Location</h3>
          {selectedLocations.length > 0 && (
            <Badge variant="secondary">{selectedLocations.length}</Badge>
          )}
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {availableLocations.map((location) => (
            <div key={location} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${location}`}
                checked={selectedLocations.includes(location)}
                onCheckedChange={() => handleLocationToggle(location)}
              />
              <Label
                htmlFor={`location-${location}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {location}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0A2540]">Price Range</h3>
          <Badge variant="outline">
            PKR {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
          </Badge>
        </div>
        <div className="space-y-4">
          <Slider
            min={0}
            max={5000000}
            step={50000}
            value={priceRange}
            onValueChange={setPriceRange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>PKR 0</span>
            <span>PKR 5M</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="verified-only" className="font-semibold text-[#0A2540]">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Verified Companies Only
            </div>
          </Label>
          <Switch
            id="verified-only"
            checked={showVerifiedOnly}
            onCheckedChange={setShowVerifiedOnly}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="recently-joined" className="font-semibold text-[#0A2540]">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Recently Joined (30 days)
            </div>
          </Label>
          <Switch
            id="recently-joined"
            checked={showRecentlyJoined}
            onCheckedChange={setShowRecentlyJoined}
          />
        </div>
      </div>

      {appliedFilters.length > 0 && (
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

  const filteredCompanies = useMemo(() => {
    return sortCompanies(companies, sortBy);
  }, [companies, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#0A2540] dark:text-white mb-2">
                Browse Companies
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Discover verified tech companies for your next project. Filter by services, location, and expertise.
              </p>
            </div>
            
            {userType === 'client' && (
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
                placeholder="Search companies by name, services, or expertise..."
                className="pl-10 h-11 dark:bg-gray-800 dark:border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchCompanies()}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="recent">Recently Joined</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
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
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {appliedFilters.map((filter, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {filter}
                  <button 
                    onClick={() => {
                      // Handle filter removal
                      if (filter.includes('categories')) setSelectedCategories([]);
                      else if (filter.includes('services')) setSelectedServices([]);
                      else if (filter.includes('locations')) setSelectedLocations([]);
                      else if (filter.includes('price')) setPriceRange([0, 1000000]);
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

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <div className="text-lg font-bold">{stats.totalVerified}</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Verified</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <div className="text-lg font-bold">{stats.averageRating}</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div className="text-lg font-bold">{stats.averageResponseTime}</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-500" />
                    <div className="text-lg font-bold">{stats.totalProjects}</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Projects</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-orange-500" />
                    <div className="text-lg font-bold">{stats.successRate}</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </CardContent>
              </Card>
            </div>
          )}
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
              
              {/* Export Button */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportCompanies}
                  disabled={filteredCompanies.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Companies ({filteredCompanies.length})
                </Button>
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

          {/* Companies Grid */}
          <div className="lg:col-span-9">
            {/* Header with counts */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0A2540] dark:text-white mb-1">
                  {loading ? 'Loading...' : `${filteredCompanies.length} Companies`}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {!loading && filteredCompanies.length > 0 && (
                    <>Showing {Math.min(filteredCompanies.length, 12)} of {totalCompanies} companies</>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCompanies}
                  className="dark:border-gray-700"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
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
            ) : error ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Error Loading Companies
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                  <Button onClick={fetchCompanies}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredCompanies.length > 0 ? (
              <div className={`${viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                {filteredCompanies.slice(0, 12).map((company) => (
                  <CompanyCard
                    key={company._id}
                    company={company}
                    isSaved={savedCompanies.includes(company._id)}
                    onViewProfile={() => handleViewProfile(company._id)}
                    onInviteToBid={() => handleInviteToBid(company._id)}
                    onSave={() => handleSaveCompany(company._id)}
                    variant={viewType}
                    showActions={userType === 'client'}
                    recentlyViewed={recentlyViewed.includes(company._id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No companies found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    No companies match your current filters. Try adjusting your search criteria or clear all filters to see all available companies.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                    <Button variant="outline" onClick={fetchCompanies}>
                      <Loader2 className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Load More Button */}
            {!loading && filteredCompanies.length > 12 && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    // In production, implement pagination
                    toast({
                      title: "More companies loaded",
                      description: "Loading additional companies...",
                    });
                  }}
                >
                  Load More Companies
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

BrowsePage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  userType: PropTypes.string
};

export default BrowsePage;