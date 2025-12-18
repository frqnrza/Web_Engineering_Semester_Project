import { Monitor, Smartphone, TrendingUp, CheckCircle, Users, Briefcase, Star, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { CompanyCard } from "./CompanyCard";
import { CategoryCard } from "./CategoryCard";
import { TemplateCard } from "./TemplateCard";
import PropTypes from 'prop-types';

export function HomePage({ onNavigate }) {
  const featuredCompanies = [
    {
      name: "Digital Dynamics",
      verified: true,
      tagline: "Full-stack development experts",
      services: ["Web Dev", "UI/UX", "Cloud"],
      rating: 4.8,
      reviewCount: 24,
      startingPrice: 150000,
      matchCount: 12
    },
    {
      name: "Mobile Masters",
      verified: true,
      tagline: "Native & hybrid app specialists",
      services: ["Mobile Dev", "React Native", "iOS/Android"],
      rating: 4.9,
      reviewCount: 31,
      startingPrice: 200000,
      matchCount: 18
    },
    {
      name: "Marketing Mavens",
      verified: true,
      tagline: "ROI-focused digital marketing",
      services: ["SEO", "Social Media", "PPC"],
      rating: 4.7,
      reviewCount: 19,
      startingPrice: 80000,
      matchCount: 22
    },
    {
      name: "Tech Innovators",
      verified: true,
      tagline: "Enterprise software solutions",
      services: ["Web Dev", "Mobile", "Consulting"],
      rating: 4.9,
      reviewCount: 28,
      startingPrice: 250000,
      matchCount: 15
    }
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left */}
            <div className="lg:pr-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0A2540] mb-4">
                Find Verified Pakistani Tech Companies
              </h1>
              <p className="text-gray-600 mb-6 text-base md:text-lg">
                Connect with vetted software development and marketing agencies. Get matched, compare bids, and pay securely through JazzCash or EasyPaisa.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  className="bg-[#FF8A2B] hover:bg-[#e67a1f] text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => onNavigate('post-project')}
                >
                  Post Project
                </Button>
                <Button
                  className="bg-[#008C7E] hover:bg-[#007066] text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => onNavigate('browse')}
                >
                  Explore Companies
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#008C7E]" size={16} />
                  <span>20+ Verified Companies</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#008C7E]" size={16} />
                  <span>5 Successful Matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#008C7E]" size={16} />
                  <span>15 Categories</span>
                </div>
              </div>
            </div>

            {/* Right - Improved Featured Company Card */}
            <div className="lg:pl-8">
              <div className="relative bg-gradient-to-br from-[#0A2540] via-[#006B5E] to-[#008C7E] rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                        <Users className="text-white" size={20} />
                      </div>
                      <span className="text-sm font-semibold bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                        ⭐ Featured Company
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                      <CheckCircle size={16} className="text-green-400" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold mb-2">Digital Dynamics</h3>
                  <p className="text-white/90 mb-4 text-base leading-relaxed">
                    Full-stack web development specialists with 5+ years experience delivering enterprise solutions
                  </p>

                  {/* Services with improved visibility */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium">
                      Web Dev
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium">
                      UI/UX
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium">
                      Cloud
                    </div>
                  </div>

                  {/* Rating and stats */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/20">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-yellow-400" size={18} />
                      <span className="font-bold text-lg">4.8</span>
                      <span className="text-sm text-white/80">(24 reviews)</span>
                    </div>
                    <div className="text-sm text-white/80">
                      12 active projects
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full bg-white text-[#0A2540] hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={() => onNavigate('browse')}
                  >
                    View Full Profile
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A2540] mb-6">Browse by Category</h2>
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4">
            <CategoryCard
              icon={Monitor}
              title="Web Development"
              count={12}
              onClick={() => onNavigate('browse', 'web')}
            />
            <CategoryCard
              icon={Smartphone}
              title="Mobile Apps"
              count={8}
              onClick={() => onNavigate('browse', 'mobile')}
            />
            <CategoryCard
              icon={TrendingUp}
              title="Digital Marketing"
              count={10}
              onClick={() => onNavigate('browse', 'marketing')}
            />
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A2540]">Featured Companies</h2>
            <Button
              variant="link"
              className="text-[#008C7E] hover:text-[#007066] font-semibold"
              onClick={() => onNavigate('browse')}
            >
              View All →
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCompanies.map((company, idx) => (
              <CompanyCard
                key={idx}
                {...company}
                onViewProfile={() => {}}
                onInviteToBid={() => {}}
                variant="grid"
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A2540] text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF8A2B] to-[#e67a1f] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Briefcase className="text-white" size={32} />
              </div>
              <div className="text-lg font-semibold text-[#0A2540] mb-2">1. Post Your Brief</div>
              <p className="text-sm text-gray-600">Share your project requirements and budget</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#008C7E] to-[#006B5E] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="text-white" size={32} />
              </div>
              <div className="text-lg font-semibold text-[#0A2540] mb-2">2. Get Matched</div>
              <p className="text-sm text-gray-600">Receive bids from verified companies</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0A2540] to-[#162f4a] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="text-white" size={32} />
              </div>
              <div className="text-lg font-semibold text-[#0A2540] mb-2">3. Hire & Pay</div>
              <p className="text-sm text-gray-600">Choose the best fit and pay via JazzCash/EasyPaisa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Templates */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A2540] mb-6">Start with a Template</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <TemplateCard
              title="Website Brief"
              description="Template for web development projects"
              onUseTemplate={() => onNavigate('post-project')}
            />
            <TemplateCard
              title="App Brief"
              description="Template for mobile app projects"
              onUseTemplate={() => onNavigate('post-project')}
            />
            <TemplateCard
              title="Marketing Brief"
              description="Template for digital marketing campaigns"
              onUseTemplate={() => onNavigate('post-project')}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A2540] text-center mb-10">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <p className="text-gray-700 mb-4">"Found the perfect development team in 2 days. The verification process gave me confidence."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF8A2B] to-[#e67a1f] rounded-full"></div>
                <div>
                  <div className="text-sm font-semibold text-[#0A2540]">Ahmed Khan</div>
                  <div className="text-xs text-gray-500">E-commerce Startup</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <p className="text-gray-700 mb-4">"JazzCash payment integration made everything smooth. Highly recommend TechConnect."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#008C7E] to-[#006B5E] rounded-full"></div>
                <div>
                  <div className="text-sm font-semibold text-[#0A2540]">Sarah Ali</div>
                  <div className="text-xs text-gray-500">Restaurant Chain</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <p className="text-gray-700 mb-4">"Got 5 quality bids within 24 hours. The platform made comparison easy."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0A2540] to-[#162f4a] rounded-full"></div>
                <div>
                  <div className="text-sm font-semibold text-[#0A2540]">Bilal Sheikh</div>
                  <div className="text-xs text-gray-500">Healthcare SaaS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-gradient-to-br from-[#0A2540] via-[#006B5E] to-[#008C7E] py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Find Your Perfect Tech Partner?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto text-base md:text-lg">
            Join dozens of businesses who found their ideal development team
          </p>
          <Button
            className="bg-[#FF8A2B] hover:bg-[#e67a1f] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={() => onNavigate('post-project')}
          >
            Post Your Project Now
          </Button>
        </div>
      </section>
    </div>
  );
}

HomePage.propTypes = {
  onNavigate: PropTypes.func.isRequired
};