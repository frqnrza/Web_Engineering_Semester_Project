import { CheckCircle, Target, Users, Shield, Award, Globe, Zap, Heart, TrendingUp } from "lucide-react";
import { Button } from "./ui/button.jsx";
import PropTypes from 'prop-types';

export function AboutPage({ onNavigate }) {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Fixed button colors */}
      <section className="relative bg-gradient-to-br from-[#0A2540] via-[#006B5E] to-[#008C7E] text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              Powering Pakistan's Digital Revolution
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 md:mb-10 leading-relaxed text-white/90 max-w-3xl mx-auto">
              TechConnect is the premier bridge between visionary businesses and Pakistan's most talented technology experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-[#FF8A2B] hover:bg-[#e67a1f] text-white h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => onNavigate('browse')}
              >
                Explore Verified Companies
              </Button>
              <Button
                className="bg-white text-[#0A2540] hover:bg-gray-100 h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => onNavigate('contact')}
              >
                Join Our Mission
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#008C7E] mb-2">100%</div>
              <p className="text-sm md:text-base text-gray-600 font-medium">Verified Tech Partners</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#FF8A2B] mb-2">PKR 500M+</div>
              <p className="text-sm md:text-base text-gray-600 font-medium">Projects Facilitated</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0A2540] mb-2">50+</div>
              <p className="text-sm md:text-base text-gray-600 font-medium">Cities Covered</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#008C7E] mb-2">98%</div>
              <p className="text-sm md:text-base text-gray-600 font-medium">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <span className="inline-block text-xs sm:text-sm font-bold text-[#008C7E] uppercase tracking-wider mb-3 bg-[#008C7E]/10 px-4 py-2 rounded-full">
                Our Origin Story
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A2540] mb-6 leading-tight">
                Born from a Vision of Digital Pakistan
              </h2>
              <div className="space-y-4 text-gray-700 text-base md:text-lg leading-relaxed">
                <p>
                  Founded in 2025 by a team of technology veterans and entrepreneurs, TechConnect emerged from a shared frustration: brilliant Pakistani tech talent was scattered, while businesses struggled to find reliable partners.
                </p>
                <p>
                  What started as a simple idea has grown into Pakistan's most trusted technology marketplace, serving startups, SMEs, and Fortune 500 companies alike. Our journey mirrors Pakistan's own digital transformation—ambitious, resilient, and driven by excellence.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[#FF8A2B] font-semibold text-lg mt-8">
                <Heart className="w-6 h-6" />
                <span>Proudly Made in Pakistan, Serving the World</span>
              </div>
            </div>
            <div className="order-1 lg:order-2 w-full">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#FF8A2B]/20 to-[#008C7E]/20 rounded-3xl blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-200">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#008C7E] to-[#006B5E] rounded-xl flex items-center justify-center">
                        <TrendingUp className="text-white w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-3xl md:text-4xl font-bold text-[#0A2540] mb-1">300+</div>
                        <p className="text-gray-600 font-medium">Jobs Created</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#FF8A2B] to-[#e67a1f] rounded-xl flex items-center justify-center">
                        <Users className="text-white w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-3xl md:text-4xl font-bold text-[#FF8A2B] mb-1">15+</div>
                        <p className="text-gray-600 font-medium">Global Clients</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#0A2540] to-[#162f4a] rounded-xl flex items-center justify-center">
                        <Shield className="text-white w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-3xl md:text-4xl font-bold text-[#0A2540] mb-1">24/7</div>
                        <p className="text-gray-600 font-medium">Support Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem We Solve */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <span className="inline-block text-xs sm:text-sm font-bold text-[#FF8A2B] uppercase tracking-wider mb-3 bg-[#FF8A2B]/10 px-4 py-2 rounded-full">
              The Challenge
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A2540] mb-6 leading-tight">
              The Tech Talent Gap Was Costing Pakistan Billions
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              Before TechConnect, businesses faced a fragmented market with no quality assurance, while talented developers and agencies struggled to gain visibility beyond their immediate networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8 hover:border-[#008C7E] hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
                <Zap className="text-red-500 w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-[#0A2540] mb-4">Wasted Time & Resources</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Companies spent 3-6 months searching for reliable tech partners, often ending up with mismatched expectations and failed projects.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8 hover:border-[#008C7E] hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                <Shield className="text-blue-500 w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-[#0A2540] mb-4">Trust Deficit</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Lack of transparency and verification led to project failures, costing businesses millions and damaging Pakistan's tech reputation.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8 hover:border-[#008C7E] hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                <Globe className="text-green-500 w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-[#0A2540] mb-4">Global Missed Opportunities</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                World-class Pakistani tech talent remained invisible to international clients, limiting growth and global impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#008C7E]/20 to-[#FF8A2B]/20 rounded-3xl blur-2xl"></div>
                <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-6 md:p-10 shadow-xl">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#0A2540] mb-6">The TechConnect Difference</h3>
                  <p className="text-gray-700 text-base md:text-lg mb-6 leading-relaxed">
                    We don't just connect—we curate, verify, and guarantee. Our platform combines cutting-edge technology with human expertise to create perfect matches that drive success.
                  </p>
                  <ul className="space-y-4">
                    {[
                      'AI-powered matching algorithm',
                      '5-stage verification process',
                      'Dedicated project success managers',
                      'Escrow payment protection'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="text-[#008C7E] flex-shrink-0 mt-1 w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-gray-700 text-base md:text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block text-xs sm:text-sm font-bold text-[#008C7E] uppercase tracking-wider mb-3 bg-[#008C7E]/10 px-4 py-2 rounded-full">
                Our Solution
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A2540] mb-6 leading-tight">
                Building Bridges, Ensuring Success
              </h2>
              <p className="text-gray-700 text-base md:text-lg mb-8 leading-relaxed">
                We've created a comprehensive ecosystem where trust is built-in, quality is guaranteed, and success is the only outcome. From initial discovery to final delivery, we're with you every step of the way.
              </p>
              <Button
                className="bg-gradient-to-r from-[#008C7E] to-[#006B5E] text-white hover:shadow-lg h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-semibold transition-all"
                onClick={() => onNavigate('browse')}
              >
                Explore Our Verified Network
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <span className="inline-block text-xs sm:text-sm font-bold text-[#008C7E] uppercase tracking-wider mb-3 bg-[#008C7E]/10 px-4 py-2 rounded-full">
              Our Vision
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A2540] mb-6 leading-tight">
              Building the Digital Backbone of Pakistan
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              We envision a Pakistan where every business has access to world-class technology solutions, and every tech professional can thrive without borders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Target,
                color: 'from-[#0A2540] to-[#162f4a]',
                title: '2025 Vision',
                desc: 'Become the default platform for all tech partnerships in Pakistan, processing PKR 1 Billion+ in projects annually.'
              },
              {
                icon: Globe,
                color: 'from-[#008C7E] to-[#006B5E]',
                title: 'Global Expansion',
                desc: 'Launch in MENA and South Asian markets, becoming the gateway to Pakistani tech talent for the world.'
              },
              {
                icon: Award,
                color: 'from-[#FF8A2B] to-[#e67a1f]',
                title: 'Talent Development',
                desc: 'Establish TechConnect Academy to train 10,000+ Pakistani developers for global market needs.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 border-2 border-gray-200 hover:border-[#008C7E] hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6`}>
                  <item.icon className="text-white w-7 h-7 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#0A2540] mb-4">{item.title}</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Fixed button color */}
      <section className="bg-gradient-to-br from-[#0A2540] via-[#006B5E] to-[#008C7E] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Be Part of Pakistan's Digital Future
          </h2>
          <p className="text-white/90 text-base md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you're building the next unicorn or seeking your next career-defining project, join the community that's redefining what's possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-[#FF8A2B] hover:bg-[#e67a1f] text-white h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => onNavigate('post-project')}
            >
              Start Your Project
            </Button>
            <Button
              className="bg-white text-[#0A2540] hover:bg-gray-100 h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => onNavigate('contact')}
            >
              Get Company Verified
            </Button>
          </div>
          <p className="text-white/70 mt-10 md:mt-12 text-sm md:text-base">
            🇵🇰 <span className="font-semibold">TechConnect</span> · Karachi · Lahore · Islamabad · Global
          </p>
        </div>
      </section>
    </div>
  );
}

AboutPage.propTypes = {
  onNavigate: PropTypes.func.isRequired
};