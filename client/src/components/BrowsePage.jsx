import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CompanyCard } from "./CompanyCard";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import PropTypes from 'prop-types';

export function BrowsePage({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch companies from MongoDB
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('http://localhost:5000/api/companies', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }

        const data = await response.json();
        
        // Transform the data to match CompanyCard component expectations
        const transformedCompanies = data.companies?.map(company => ({
          _id: company._id,
          name: company.name,
          verified: company.verified || company.verificationStatus === 'approved',
          tagline: company.tagline || company.description?.substring(0, 100) || "Professional tech services",
          services: company.services || [],
          rating: company.ratings?.average || 4.5,
          reviewCount: company.ratings?.count || 0,
          startingPrice: company.startingPrice || 100000,
          matchCount: Math.floor(Math.random() * 30) + 5, // Random for now
          category: company.category || 'web',
          description: company.description,
          location: company.location,
          teamSize: company.teamSize,
          yearsInBusiness: company.yearsInBusiness,
          portfolio: company.portfolio || []
        })) || [];

        setCompanies(transformedCompanies);
      } catch (error) {
        console.error('Fetch companies error:', error);
        setError('Failed to load companies. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Calculate category counts from fetched data
  const categories = useMemo(() => {
    const categoryCounts = {
      web: { label: "Web Development", count: 0 },
      mobile: { label: "Mobile Apps", count: 0 },
      marketing: { label: "Digital Marketing", count: 0 },
      design: { label: "UI/UX Design", count: 0 },
      other: { label: "Other", count: 0 }
    };

    companies.forEach(company => {
      const category = company.category?.toLowerCase() || 'other';
      if (categoryCounts[category]) {
        categoryCounts[category].count++;
      } else {
        categoryCounts.other.count++;
      }
    });

    return Object.entries(categoryCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([id, data]) => ({
        id,
        label: data.label,
        count: data.count
      }));
  }, [companies]);

  // Filter and search logic
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        company.services.some(service => 
          service.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(company.category);

      // Price filter
      const matchesPrice = company.startingPrice >= priceRange[0] && 
        company.startingPrice <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [companies, searchQuery, selectedCategories, priceRange]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 1000000]);
    setSearchQuery("");
  };

  const handleViewProfile = (companyId) => {
    onNavigate('company-profile', companyId);
  };

  const handleInviteToBid = (companyId) => {
    console.log('Invite to bid:', companyId);
    // You can implement invite logic here
    alert(`Invitation sent to company!`);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category Filter */}
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
                {category.label} ({category.count})
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="font-semibold text-[#0A2540] mb-3">Budget Range</h3>
        <div className="space-y-4">
          <Slider
            min={0}
            max={1000000}
            step={50000}
            value={priceRange}
            onValueChange={setPriceRange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>PKR {(priceRange[0] / 1000).toFixed(0)}K</span>
            <span>PKR {(priceRange[1] / 1000).toFixed(0)}K</span>
          </div>
          {priceRange[0] > 0 || priceRange[1] < 1000000 ? (
            <p className="text-xs text-gray-500">
              Showing companies with starting prices in this range
            </p>
          ) : null}
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000000) && (
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A2540] mb-2">
            Browse Companies
          </h1>
          <p className="text-gray-600">
            Discover verified tech companies for your next project
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search companies, services, or skills..."
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
          {/* Left Sidebar - Filters (Desktop) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#0A2540]">Filters</h2>
                  {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000000) && (
                    <span className="bg-[#008C7E] text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <FilterPanel />
            </div>
          </div>

          {/* Mobile Filters */}
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

          {/* Right Content - Companies Grid */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${filteredCompanies.length} ${filteredCompanies.length === 1 ? 'company' : 'companies'} found`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-[#008C7E] mr-2" size={24} />
                <span>Loading companies...</span>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company._id}
                    {...company}
                    onViewProfile={() => handleViewProfile(company._id)}
                    onInviteToBid={() => handleInviteToBid(company._id)}
                    variant="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">No companies match your filters</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

BrowsePage.propTypes = {
  onNavigate: PropTypes.func.isRequired
};