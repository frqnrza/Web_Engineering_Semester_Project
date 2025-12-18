import { useState, useEffect } from 'react';
import { 
  Star, MapPin, Users, Calendar, CheckCircle, 
  ExternalLink, MessageSquare, Award, Briefcase,
  ArrowLeft, Phone, Mail, Globe
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import PropTypes from 'prop-types';

export function CompanyProfilePage({ companyId, onNavigate }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000/api/companies/${companyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch company');
        
        const data = await response.json();
        setCompany(data.company);
      } catch (error) {
        console.error('Fetch company error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) fetchCompany();
  }, [companyId]);

  const handleInviteToBid = () => {
    // This would normally navigate to a project selection page
    onNavigate('post-project');
    alert(`Invitation will be sent to ${company?.name}. First, post your project!`);
  };

  const handleMessage = () => {
    // Navigate to messaging with this company
    onNavigate('messages', { recipientId: company?.userId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008C7E]"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Company not found</p>
          <Button onClick={() => onNavigate('browse')}>Browse Companies</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('browse')}
            className="mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Companies
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                {company.logo?.url ? (
                  <img src={company.logo.url} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Briefcase size={40} className="text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-[#0A2540]">{company.name}</h1>
                  {company.verified && (
                    <Badge className="bg-green-100 text-green-700 px-3 py-1">
                      <CheckCircle size={14} className="mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 text-lg mb-4">{company.tagline}</p>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span>{company.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={16} />
                    <span>{company.teamSize} team members</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span>{company.yearsInBusiness} years in business</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.floor(company.ratings?.average || 0) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                        }
                      />
                    ))}
                    <span className="ml-2 font-medium">
                      {company.ratings?.average?.toFixed(1) || '0.0'}
                      <span className="text-gray-500 text-sm ml-1">
                        ({company.ratings?.count || 0} reviews)
                      </span>
                    </span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">
                    Starting at PKR {company.startingPrice?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleMessage}
                className="border-[#008C7E] text-[#008C7E]"
              >
                <MessageSquare size={16} className="mr-2" />
                Message
              </Button>
              <Button
                onClick={handleInviteToBid}
                className="bg-[#008C7E] hover:bg-[#007066]"
              >
                Invite to Bid
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-[#0A2540] mb-4">About {company.name}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{company.description}</p>
                
                {company.website || company.linkedin ? (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-[#0A2540] mb-3">Contact & Links</h4>
                    <div className="flex gap-4">
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#008C7E] hover:underline">
                          <Globe size={16} />
                          Website
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {company.linkedin && (
                        <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#008C7E] hover:underline">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          LinkedIn
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-[#0A2540] mb-4">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {company.services?.map((service, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            {company.portfolio?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {company.portfolio.map((project, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <h4 className="font-semibold text-[#0A2540] mb-2">{project.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-[#008C7E] text-sm hover:underline flex items-center gap-1">
                            View Live Project <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600">No portfolio projects yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {company.ratings?.reviews?.length > 0 ? (
              <div className="space-y-4">
                {company.ratings.reviews.map((review, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{review.userName}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-gray-300"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600">No reviews yet</p>
                  <p className="text-sm text-gray-500 mt-2">Be the first to review this company</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

CompanyProfilePage.propTypes = {
  companyId: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired
};