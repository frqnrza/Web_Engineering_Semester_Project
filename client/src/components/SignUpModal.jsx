// ==========================================
// FIXED SignUpModal.jsx
// ==========================================
import { useState } from "react";
import { Loader2, Building2, User, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { authAPI, companyAPI } from "../services/api";
import PropTypes from 'prop-types';
import { GoogleLogin } from '@react-oauth/google';

export function SignUpModal({ open, onClose, onSignUp, onSwitchToSignIn, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [activeTab, setActiveTab] = useState("client");

  // Company-specific fields
  const [companyName, setCompanyName] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
    setAgreedToTerms(false);
    setError("");
    setSuccess("");
    setCompanyName("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // FIXED: Pass individual parameters to API
  const handleCompanySignUp = async (e) => {
    e.preventDefault();
    
    if (!companyName || !name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('👤 Attempting company registration...');
      
      // FIXED: Pass individual parameters
      const registrationData = await authAPI.register(
        email,
        password,
        name,
        'company',
        companyName,
        phone
      );

      console.log('✅ Registration successful:', registrationData);

      // Try to create company profile
      const companyData = {
        name: companyName,
        description: `Professional ${companyName} services`,
        services: ['Web Development', 'Consulting'],
        location: 'Pakistan',
        teamSize: "1-10",
        yearsInBusiness: 1,
        startingPrice: 100000,
        category: 'web',
        tagline: 'Professional tech services'
      };

      try {
        const companyResponse = await companyAPI.create(companyData);
        const updatedUser = {
          ...registrationData.user,
          companyId: companyResponse.company._id
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        setSuccess('Registration successful! Please check your email to verify your account.');
        
        setTimeout(() => {
          resetForm();
          onSignUp(registrationData.user.type, updatedUser, true);
        }, 1500);
      } catch (companyError) {
        console.log('Company creation failed, continuing anyway:', companyError);
        setSuccess('Account created! You can complete company setup later.');
        setTimeout(() => {
          resetForm();
          onSignUp(registrationData.user.type, registrationData.user, true);
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Company sign up error:', error);
      if (error.message.includes('already registered')) {
        setError("This email is already registered. Please use a different email or sign in.");
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Pass individual parameters to API
  const handleClientSignUp = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('👤 Attempting client registration...');
      
      // FIXED: Pass individual parameters
      const registrationData = await authAPI.register(
        email,
        password,
        name,
        'client',
        null,
        phone
      );

      console.log('✅ Registration successful:', registrationData);

      setSuccess('Registration successful! Welcome to TechConnect.');
      
      setTimeout(() => {
        resetForm();
        onSignUp(registrationData.user.type, registrationData.user, true);
      }, 1500);
    } catch (error) {
      console.error('❌ Client sign up error:', error);
      if (error.message.includes('already registered')) {
        setError("This email is already registered. Please use a different email or sign in.");
      } else {
        setError(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authAPI.googleLogin(credentialResponse.credential, activeTab);
      resetForm();
      onSignUp(result.user.type, result.user, true);
    } catch (err) {
      console.error('Google sign up error:', err);
      setError(err.message || "Google sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-up failed. Please try again.");
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    onClose();
    onNavigate('terms');
  };

  const handlePrivacyClick = (e) => {
    e.preventDefault();
    onClose();
    onNavigate('privacy');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby="signup-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-[#0A2540] text-center">Join TechConnect</DialogTitle>
          <DialogDescription id="signup-dialog-description" className="text-center">
            Create an account to get started
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger 
              value="client"
              className={`transition-all ${activeTab === 'client' ? 'bg-[#008C7E] text-white shadow-sm' : 'bg-transparent text-gray-700'}`}
            >
              <User className="w-4 h-4 mr-2" />
              Client
            </TabsTrigger>
            <TabsTrigger 
              value="company"
              className={`transition-all ${activeTab === 'company' ? 'bg-[#0A2540] text-white shadow-sm' : 'bg-transparent text-gray-700'}`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Company
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-4 mt-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                size="large"
                width="100%"
                text="signup_with"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                <AlertCircle className="inline w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleClientSignUp} className="space-y-3">
              <div>
                <Label htmlFor="client-name" className="mb-1 block text-[#0A2540] text-sm">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-name"
                  placeholder="John Doe"
                  className="h-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client-email-signup" className="mb-1 block text-[#0A2540] text-sm">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-email-signup"
                  type="email"
                  placeholder="you@example.com"
                  className="h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client-phone" className="mb-1 block text-[#0A2540] text-sm">
                  Phone Number
                </Label>
                <Input
                  id="client-phone"
                  type="tel"
                  placeholder="+92 300 1234567"
                  className="h-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="client-password-signup" className="mb-1 block text-[#0A2540] text-sm">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-password-signup"
                  type="password"
                  placeholder="••••••••"
                  className="h-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client-confirm-password" className="mb-1 block text-[#0A2540] text-sm">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="h-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms-client"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  disabled={isLoading}
                />
                <Label htmlFor="terms-client" className="text-sm font-normal leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <a 
                    href="#" 
                    onClick={handleTermsClick}
                    className="text-[#008C7E] hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a 
                    href="#" 
                    onClick={handlePrivacyClick}
                    className="text-[#008C7E] hover:underline"
                  >
                    Privacy Policy
                  </a>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#008C7E] hover:bg-[#007066] text-white h-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button 
                onClick={onSwitchToSignIn}
                className="text-[#008C7E] hover:underline"
              >
                Sign in
              </button>
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-3 mt-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                size="large"
                width="100%"
                text="signup_with"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                <AlertCircle className="inline w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleCompanySignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="company-name-signup" className="mb-1 block text-[#0A2540] text-sm">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-name-signup"
                    placeholder="Your Company"
                    className="h-10"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company-contact-name" className="mb-1 block text-[#0A2540] text-sm">
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-contact-name"
                    placeholder="John Doe"
                    className="h-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company-email-signup" className="mb-1 block text-[#0A2540] text-sm">
                  Business Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company-email-signup"
                  type="email"
                  placeholder="contact@company.com"
                  className="h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="company-phone-signup" className="mb-1 block text-[#0A2540] text-sm">
                  Phone Number
                </Label>
                <Input
                  id="company-phone-signup"
                  type="tel"
                  placeholder="+92 300 1234567"
                  className="h-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="company-password-signup" className="mb-1 block text-[#0A2540] text-sm">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-password-signup"
                    type="password"
                    placeholder="••••••••"
                    className="h-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company-confirm-password" className="mb-1 block text-[#0A2540] text-sm">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms-company"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  disabled={isLoading}
                />
                <Label htmlFor="terms-company" className="text-sm font-normal leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <a 
                    href="#" 
                    onClick={handleTermsClick}
                    className="text-[#008C7E] hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a 
                    href="#" 
                    onClick={handlePrivacyClick}
                    className="text-[#008C7E] hover:underline"
                  >
                    Privacy Policy
                  </a>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0A2540] hover:bg-[#0a2540]/90 text-white h-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Company Account'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button 
                onClick={onSwitchToSignIn}
                className="text-[#008C7E] hover:underline"
              >
                Sign in
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

SignUpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSignUp: PropTypes.func.isRequired,
  onSwitchToSignIn: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired
};