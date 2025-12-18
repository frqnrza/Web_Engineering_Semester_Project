import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import PropTypes from 'prop-types';

export function ContactPage({ onNavigate, isLoggedIn, userType, onSignUpClick }) {
  // Handler for verification button click
  const handleVerificationClick = () => {
    // Scenario A: User NOT Logged In
    if (!isLoggedIn) {
      onSignUpClick('company'); // Opens SignUp modal with Company tab
      return;
    }
    
    // Scenario B: Logged In as CLIENT
    if (userType === 'client') {
      alert('You need to register as a Company to apply for verification...');
      return;
    }
    
    // Scenario C: Logged In as COMPANY
    if (userType === 'company') {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[#0A2540] mb-4">Get in Touch</h1>
            <p className="text-gray-600 text-lg">
              Have questions? We're here to help. Reach out to our team and we'll get back to you shortly.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="grid lg:grid-cols-[350px,1fr] gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-[#0A2540] mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#008C7E] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="text-[#008C7E]" size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <a href="mailto:techconnect.dev.official@gmail.com" className="text-[#0A2540] hover:text-[#008C7E]">
                      techconnect.dev.official@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#FF8A2B] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-[#FF8A2B]" size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Phone</div>
                    <a href="tel:+923001234567" className="text-[#0A2540] hover:text-[#008C7E]">
                      +92 300 123 4567
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#0A2540] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-[#0A2540]" size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Office</div>
                    <p className="text-[#0A2540]">
                      Islamabad, Pakistan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0A2540] to-[#008C7E] rounded-lg p-6 text-white">
              <h3 className="mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white text-opacity-80">Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white text-opacity-80">Saturday</span>
                  <span>Closed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white text-opacity-80">Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-[#0A2540] mb-4">For Companies</h3>
              <p className="text-sm text-gray-600 mb-4">
                Interested in getting your company verified and listed on TechConnect?
              </p>
              <Button 
                className="w-full bg-[#008C7E] hover:bg-[#007a6d] text-white"
                onClick={handleVerificationClick}  // ← ADDED THIS
              >
                Apply for Verification
              </Button>
              {!isLoggedIn && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Sign up as a company to get started
                </p>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
              <h3 className="text-[#0A2540] mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="mb-2 block text-[#0A2540]">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="firstName" placeholder="John" className="h-11" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="mb-2 block text-[#0A2540]">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="lastName" placeholder="Doe" className="h-11" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="mb-2 block text-[#0A2540]">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="email" type="email" placeholder="you@company.com" className="h-11" />
                </div>

                <div>
                  <Label htmlFor="phone" className="mb-2 block text-[#0A2540]">
                    Phone Number
                  </Label>
                  <Input id="phone" placeholder="+92 300 1234567" className="h-11" />
                </div>

                <div>
                  <Label htmlFor="subject" className="mb-2 block text-[#0A2540]">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger id="subject" className="h-11">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="verification">Company Verification</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message" className="mb-2 block text-[#0A2540]">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    className="min-h-32 resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-[#008C7E] hover:bg-[#007a6d] flex-1"
                  >
                    <Send size={18} className="mr-2" />
                    Send Message
                  </Button>
                </div>
              </form>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6 md:p-8">
              <h3 className="text-[#0A2540] mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[#0A2540] font-medium mb-2">How long does company verification take?</div>
                  <p className="text-sm text-gray-600">
                    Typically 3-5 business days. We conduct thorough checks to ensure quality standards.
                  </p>
                </div>
                <div>
                  <div className="text-[#0A2540] font-medium mb-2">What are the fees for posting projects?</div>
                  <p className="text-sm text-gray-600">
                    Posting projects is completely free. We only charge a small commission on successful matches.
                  </p>
                </div>
                <div>
                  <div className="text-[#0A2540] font-medium mb-2">Do you offer refunds?</div>
                  <p className="text-sm text-gray-600">
                    Yes, we have a dispute resolution process. Contact support if you're unsatisfied with a service.
                  </p>
                </div>
                <div>
                  <div className="text-[#0A2540] font-medium mb-2">Can I hire companies outside Pakistan?</div>
                  <p className="text-sm text-gray-600">
                    Currently, we focus on Pakistani companies to support the local tech ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prop Types
ContactPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  isLoggedIn: PropTypes.bool,
  userType: PropTypes.string,
  onSignUpClick: PropTypes.func
};