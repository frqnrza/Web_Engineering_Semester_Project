import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { authAPI } from "../services/api";
import PropTypes from 'prop-types';
import { GoogleLogin } from '@react-oauth/google';

export function SignInModal({ open, onClose, onSignIn, onSwitchToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("client");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError("");
    setForgotEmail("");
    setForgotSuccess(false);
    setShowForgotPassword(false);
    onClose();
  };

  // ✅ FIXED: Use email and password state variables, not formData
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Attempting sign in:', email);
    
      // ✅ FIXED: Pass email and password directly
      const result = await authAPI.login(email, password);
    
      console.log('✅ Login successful:', result);
    
      if (result.success) {
        // ✅ CRITICAL: Ensure token and user are saved
        if (result.token) {
          console.log('💾 Saving token:', result.token.substring(0, 20) + '...');
          localStorage.setItem('authToken', result.token);
        } else {
          console.error('❌ No token in login response!');
          throw new Error('No authentication token received');
        }
      
        if (result.user) {
          console.log('💾 Saving user:', result.user.email);
          localStorage.setItem('currentUser', JSON.stringify(result.user));
        } else {
          console.error('❌ No user in login response!');
          throw new Error('No user data received');
        }
      
        // ✅ FIXED: Call onSignIn callback to update App.jsx state
        onSignIn(result.user.type, result.user, false);
        
        // Close modal
        handleClose();
        
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('❌ Sign in error:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await authAPI.googleLogin(credentialResponse.credential, activeTab);
      
      if (result.success && result.user) {
        // Save token and user
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        
        // Call parent callback
        onSignIn(result.user.type, result.user, false);
        handleClose();
      } else {
        throw new Error('Google sign-in failed');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in failed. Please try again.");
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    setError("");

    try {
      await authAPI.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      setError("");
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err.message || 'Failed to send reset email';
      
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        setError("No account found with this email address.");
      } else {
        // ✅ Always show success message for security (don't reveal if email exists)
        setForgotSuccess(true);
        setError("");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotSuccess(false);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" aria-describedby="signin-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-[#0A2540] text-center">
            {showForgotPassword ? 'Reset Password' : 'Welcome to TechConnect'}
          </DialogTitle>
          <DialogDescription id="signin-dialog-description" className="text-center">
            {showForgotPassword 
              ? 'Enter your email to receive a password reset link' 
              : 'Sign in to access your account'
            }
          </DialogDescription>
        </DialogHeader>

        {!showForgotPassword ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger 
                value="client"
                className={`transition-all ${activeTab === 'client' ? 'bg-[#008C7E] text-white shadow-sm' : 'bg-transparent text-gray-700'}`}
              >
                Client
              </TabsTrigger>
              <TabsTrigger 
                value="company"
                className={`transition-all ${activeTab === 'company' ? 'bg-[#0A2540] text-white shadow-sm' : 'bg-transparent text-gray-700'}`}
              >
                Company
              </TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="space-y-4 mt-6">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  size="large"
                  width="400"
                  text="continue_with"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                  <AlertCircle className="inline w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="client-email" className="mb-2 block text-[#0A2540]">
                    Email
                  </Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client-password" className="mb-2 block text-[#0A2540]">
                    Password
                  </Label>
                  <Input
                    id="client-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[#008C7E] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#008C7E] hover:bg-[#007066] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button 
                  onClick={() => {
                    handleClose();
                    onSwitchToSignUp('client');
                  }}
                  className="text-[#008C7E] hover:underline"
                >
                  Sign up
                </button>
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4 mt-6">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  size="large"
                  width="400"
                  text="continue_with"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                  <AlertCircle className="inline w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="company-email" className="mb-2 block text-[#0A2540]">
                    Email
                  </Label>
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="company@example.com"
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company-password" className="mb-2 block text-[#0A2540]">
                    Password
                  </Label>
                  <Input
                    id="company-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[#008C7E] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0A2540] hover:bg-[#0a2540]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button 
                  onClick={onSwitchToSignUp}
                  className="text-[#008C7E] hover:underline"
                >
                  Apply for verification
                </button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 mt-6">
            {!forgotSuccess ? (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                    <AlertCircle className="inline w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}
                <div>
                  <Label htmlFor="forgot-email" className="mb-2 block text-[#0A2540]">
                    Email Address
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    required
                  />
                </div>
                <Button
                  onClick={handleForgotPassword}
                  className="w-full bg-[#008C7E] hover:bg-[#007066] text-white"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <Button
                  onClick={resetForgotPassword}
                  variant="outline"
                  className="w-full"
                  disabled={forgotLoading}
                >
                  Back to Sign In
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <p className="font-medium">Reset link sent!</p>
                  <p className="text-sm mt-1">
                    Check your email for instructions to reset your password.
                  </p>
                </div>
                <Button
                  onClick={resetForgotPassword}
                  variant="outline"
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

SignInModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSignIn: PropTypes.func.isRequired,
  onSwitchToSignUp: PropTypes.func.isRequired
};
