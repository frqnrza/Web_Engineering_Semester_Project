import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Calendar, DollarSign, Clock, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import PropTypes from 'prop-types';

export function BrowseProjectsPage({ onNavigate, currentUser, userType }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetRange, setBudgetRange] = useState([0, 1000000]);
  const [selectedTimelines, setSelectedTimelines] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const categories = [
    { id: 'web', label: 'Web Development' },
    { id: 'mobile', label: 'Mobile Apps' },
    { id: 'marketing', label: 'Digital Marketing' },
    { id: 'design', label: 'UI/UX Design' },
    { id: 'other', label: 'Other' }
  ];

  const timelines = [
    { id: '1-2weeks', label: '1-2 weeks' },
    { id: '3-4weeks', label: '3-4 weeks' },
    { id: '1-3months', label: '1-3 months' },
    { id: '3-6months', label: '3-6 months' },
    { id: '6+months', label: '6+ months' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      queryParams.append('status', 'posted');
      
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

      const response = await fetch(`http://localhost:5000/api/projects?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch projects');

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Fetch projects error:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(project.category);

      const projectBudgetMin = project.budget?.min || 0;
      const projectBudgetMax = project.budget?.max || 1000000;
      const matchesBudget = 
        (projectBudgetMin >= budgetRange[0] && projectBudgetMin <= budgetRange[1]) ||
        (projectBudgetMax >= budgetRange[0] && projectBudgetMax <= budgetRange[1]) ||
        (projectBudgetMin <= budgetRange[0] && projectBudgetMax >= budgetRange[1]);

      return matchesSearch && matchesCategory && matchesBudget;
    });
  }, [projects, searchQuery, selectedCategories, budgetRange]);

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

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTimelines([]);
    setBudgetRange([0, 1000000]);
    setSearchQuery('');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-[#0A2540] mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label
                htmlFor={category.id}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[#0A2540] mb-3">Budget Range</h3>
        <div className="space-y-4">
          <Slider
            min={0}
            max={1000000}
            step={50000}
            value={budgetRange}
            onValueChange={setBudgetRange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>PKR {(budgetRange[0] / 1000).toFixed(0)}K</span>
            <span>PKR {(budgetRange[1] / 1000).toFixed(0)}K</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[#0A2540] mb-3">Timeline</h3>
        <div className="space-y-2">
          {timelines.map((timeline) => (
            <div key={timeline.id} className="flex items-center space-x-2">
              <Checkbox
                id={timeline.id}
                checked={selectedTimelines.includes(timeline.id)}
                onCheckedChange={() => handleTimelineToggle(timeline.id)}
              />
              <Label
                htmlFor={timeline.id}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {timeline.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {(selectedCategories.length > 0 || selectedTimelines.length > 0 || budgetRange[0] > 0 || budgetRange[1] < 1000000) && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A2540] mb-2">
            Browse Projects
          </h1>
          <p className="text-gray-600">
            Find projects that match your expertise and submit competitive bids
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search projects by keywords..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal size={20} />
          </Button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0A2540]">Filters</h2>
                {(selectedCategories.length > 0 || selectedTimelines.length > 0 || budgetRange[0] > 0 || budgetRange[1] < 1000000) && (
                  <span className="bg-[#008C7E] text-white text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <FilterPanel />
            </div>
          </div>

          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileFilters(false)}>
              <div 
                className="bg-white w-80 h-full p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#0A2540]">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileFilters(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                <FilterPanel />
              </div>
            </div>
          )}

          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${filteredProjects.length} ${filteredProjects.length === 1 ? 'project' : 'projects'} found`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008C7E]"></div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <Card key={project._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 
                            className="text-xl font-semibold text-[#0A2540] mb-2 hover:text-[#008C7E] cursor-pointer"
                            onClick={() => onNavigate('project-detail', project._id)}
                          >
                            {project.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="secondary" className="capitalize">
                              {project.category}
                            </Badge>
                            {project.techStack?.slice(0, 3).map((tech, idx) => (
                              <Badge key={idx} variant="outline">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#0A2540]">
                            PKR {project.budget?.range || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {project.bids?.length || 0} bids
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          Posted {getTimeAgo(project.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {project.timeline?.value} {project.timeline?.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {project.viewCount || 0} views
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => onNavigate('project-detail', project._id)}
                          className="flex-1"
                        >
                          View Details
                        </Button>
                        <Button
                          className="bg-[#008C7E] hover:bg-[#007a6d] flex-1"
                          onClick={() => onNavigate('project-detail', project._id)}
                        >
                          Submit Bid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">No projects match your filters</p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

BrowseProjectsPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  userType: PropTypes.string
};