import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Checkbox } from './ui/checkbox';
import { translate } from '../services/translations';

const categories = [
  'Web Development',
  'Mobile Apps',
  'Digital Marketing',
  'UI/UX Design',
  'E-commerce',
  'Cloud Services'
];

const locations = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan'
];

export function AdvancedSearch({ onSearch, language }) {
  const [filters, setFilters] = useState({
    query: '',
    minRating: 0,
    maxPrice: 500000,
    services: [],
    sortBy: 'rating'
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      query: '',
      minRating: 0,
      maxPrice: 500000,
      services: [],
      sortBy: 'rating'
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  const toggleService = (service) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            placeholder={language === 'ur' ? 'کمپنیاں تلاش کریں...' : 'Search companies...'}
            className="pl-10 h-12"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          onClick={handleSearch}
          className="bg-[#FF8A2B] hover:bg-[#e67a1f] h-12 px-6"
        >
          {translate('search', language)}
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              {translate('filter', language)}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{language === 'ur' ? 'اعلی درجے کی فلٹرز' : 'Advanced Filters'}</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Category */}
              <div>
                <Label>{translate('category', language)}</Label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={language === 'ur' ? 'زمرہ منتخب کریں' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label>{language === 'ur' ? 'مقام' : 'Location'}</Label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={language === 'ur' ? 'مقام منتخب کریں' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Rating */}
              <div>
                <Label>{translate('rating', language)} (Min: {filters.minRating})</Label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                  min={0}
                  max={5}
                  step={0.5}
                  className="mt-4"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>

              {/* Max Price */}
              <div>
                <Label>
                  {language === 'ur' ? 'زیادہ سے زیادہ قیمت' : 'Maximum Price'}: PKR {filters.maxPrice.toLocaleString()}
                </Label>
                <Slider
                  value={[filters.maxPrice]}
                  onValueChange={([value]) => setFilters(prev => ({ ...prev, maxPrice: value }))}
                  min={50000}
                  max={1000000}
                  step={50000}
                  className="mt-4"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>50K</span>
                  <span>1M</span>
                </div>
              </div>

              {/* Services */}
              <div>
                <Label>{language === 'ur' ? 'خدمات' : 'Services'}</Label>
                <div className="space-y-3 mt-3">
                  {categories.map(service => (
                    <label key={service} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.services.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <Label>{translate('experience', language)}</Label>
                <Select 
                  value={filters.experience} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, experience: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={language === 'ur' ? 'تجربہ منتخب کریں' : 'Select experience'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 {language === 'ur' ? 'سال' : 'years'}</SelectItem>
                    <SelectItem value="3-5">3-5 {language === 'ur' ? 'سال' : 'years'}</SelectItem>
                    <SelectItem value="6+">6+ {language === 'ur' ? 'سال' : 'years'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <Label>{translate('sortBy', language)}</Label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">{translate('rating', language)}</SelectItem>
                    <SelectItem value="price">{translate('price', language)}</SelectItem>
                    <SelectItem value="reviews">{translate('reviews', language)}</SelectItem>
                    <SelectItem value="experience">{translate('experience', language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ur' ? 'ری سیٹ' : 'Reset'}
                </Button>
                <Button
                  onClick={handleSearch}
                  className="flex-1 bg-[#FF8A2B] hover:bg-[#e67a1f]"
                >
                  {language === 'ur' ? 'فلٹرز لاگو کریں' : 'Apply Filters'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {(filters.category || filters.location || filters.services.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <span className="inline-flex items-center gap-1 bg-[#FF8A2B]/10 text-[#FF8A2B] px-3 py-1 rounded-full text-sm">
              {filters.category}
              <button onClick={() => setFilters(prev => ({ ...prev, category: undefined }))}>
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 bg-[#008C7E]/10 text-[#008C7E] px-3 py-1 rounded-full text-sm">
              {filters.location}
              <button onClick={() => setFilters(prev => ({ ...prev, location: undefined }))}>
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.services.map(service => (
            <span key={service} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {service}
              <button onClick={() => toggleService(service)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}