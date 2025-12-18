import { useState } from "react";
import { Search, Bell, ChevronDown, Menu, X, LogOut, Settings, Shield, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "./ui/dropdown-menu";
import PropTypes from 'prop-types';

export function Header({ 
  isLoggedIn = false,
  isAdminLoggedIn = false,
  onNavigate, 
  onSignInClick,
  onAdminLoginClick,
  onSignOut,
  onAdminSignOut,
  language, 
  onLanguageChange, 
  userType,
  currentUser,
  adminUser
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAdminSignOut = () => {
    console.log('Admin sign out clicked');
    if (onAdminSignOut) {
      onAdminSignOut();
    }
    // Redirect to home page after admin sign out
    setTimeout(() => {
      if (onNavigate) {
        console.log('Navigating to home after admin sign out');
        onNavigate('home');
      }
    }, 100);
    setMobileMenuOpen(false);
  };

  const handleUserSignOut = () => {
    console.log('User sign out clicked');
    if (onSignOut) {
      onSignOut();
    }
    // Redirect to home after regular sign out
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('home');
      }
    }, 100);
    setMobileMenuOpen(false);
  };

  // Bell icon click handler - navigate to notifications
  const handleBellClick = () => {
    console.log('Bell icon clicked');
    if (isAdminLoggedIn) {
      // For admin, navigate to admin dashboard
      onNavigate('admin');
    } else if (isLoggedIn) {
      // For regular users, navigate to dashboard notifications tab
      onNavigate('dashboard');
      // You can add a way to pass which tab to open
      setTimeout(() => {
        // Trigger notification tab open
        const event = new CustomEvent('openNotificationsTab');
        window.dispatchEvent(event);
      }, 100);
    } else {
      // For non-logged users, prompt sign in
      onSignInClick();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E6E9EE] h-[72px]">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-full flex items-center justify-between gap-6">
        {/* Left - Logo */}
        <div 
          className="cursor-pointer flex-shrink-0" 
          onClick={() => {
            // Admin cannot navigate to home from logo (stays in admin panel)
            if (!isAdminLoggedIn) {
              onNavigate('home');
            }
          }}
        >
          <div className="bg-[#0A2540] rounded px-3 md:px-4 py-2">
            <span className="text-white text-sm md:text-base font-semibold">TechConnect</span>
          </div>
        </div>

        {/* Center - Search (Hidden for Admin) */}
        {!isAdminLoggedIn && (
          <div className="hidden lg:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder={language === 'en' ? "Search services, companies, skills" : "خدمات، کمپنیاں، مہارتیں تلاش کریں"}
                className="pl-10 pr-12 h-11 rounded-lg"
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        )}

        {/* Admin Mode Indicator (Replaces Search) */}
        {isAdminLoggedIn && (
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
              <Shield className="text-red-600" size={20} />
              <span className="font-semibold text-red-700">
                {language === 'en' ? 'Admin Panel Mode' : 'ایڈمن پینل موڈ'}
              </span>
            </div>
          </div>
        )}

        {/* Right - User Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 md:px-3 py-1.5">
            <button 
              onClick={() => onLanguageChange('en')}
              className={`text-xs md:text-sm px-1 ${language === 'en' ? 'text-[#0A2540] font-medium' : 'text-gray-400'}`}
            >
              EN
            </button>
            <span className="text-gray-400">|</span>
            <button 
              onClick={() => onLanguageChange('ur')}
              className={`text-xs md:text-sm px-1 ${language === 'ur' ? 'text-[#0A2540] font-medium' : 'text-gray-400'}`}
            >
              اردو
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* Show navigation links only if NOT admin */}
            {!isAdminLoggedIn && (
              <>
                {/* Browse Projects link for company users */}
                {isLoggedIn && userType === 'company' && (
                  <a 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      onNavigate('browse-projects'); 
                    }}
                    className="text-sm text-[#0A2540] hover:text-[#008C7E] transition-colors font-medium"
                  >
                    {language === 'en' ? 'Browse Projects' : 'پروجیکٹس براؤز کریں'}
                  </a>
                )}
                
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate('about'); }}
                  className="text-sm text-[#0A2540] hover:text-[#008C7E] transition-colors"
                >
                  {language === 'en' ? 'About' : 'کے بارے میں'}
                </a>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
                  className="text-sm text-[#0A2540] hover:text-[#008C7E] transition-colors"
                >
                  {language === 'en' ? 'Contact' : 'رابطہ کریں'}
                </a>
              </>
            )}

            {/* Admin Panel Access */}
            {isAdminLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-red-700 hover:bg-red-50">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Shield className="text-red-600" size={16} />
                    </div>
                    <span className="hidden lg:block font-medium text-sm">
                      {adminUser?.name?.split(' ')[0] || 'Admin'}
                    </span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-red-700">
                    {language === 'en' ? 'Admin Panel' : 'ایڈمن پینل'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('admin')}>
                    <Shield className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Verification Dashboard' : 'تصدیق ڈیش بورڈ'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleAdminSignOut} className="text-red-600 focus:text-red-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Admin Sign Out' : 'ایڈمن سائن آؤٹ'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isLoggedIn && (
              <Button
                onClick={onAdminLoginClick}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Shield size={16} className="mr-2" />
                {language === 'en' ? 'Admin Panel' : 'ایڈمن پینل'}
              </Button>
            )}

            {/* Regular User Actions (Hidden for Admin) */}
            {!isAdminLoggedIn && isLoggedIn ? (
              <>
                {/* Bell icon - now clickable */}
                <button 
                  onClick={handleBellClick}
                  className="relative cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Bell className="text-gray-600 hover:text-[#008C7E] transition-colors" size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-50">
                      <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarFallback className="bg-gradient-to-br from-[#FF8A2B] to-[#ff7a1b] text-white text-sm font-semibold">
                          {currentUser?.name?.charAt(0)?.toUpperCase() || (userType === 'client' ? 'C' : 'P')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:block text-sm font-medium text-[#0A2540]">
                        {currentUser?.name?.split(' ')[0] || 'User'}
                      </span>
                      <ChevronDown size={16} className="text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {currentUser?.email || 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onNavigate('dashboard')}>
                      <Settings className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Dashboard' : 'ڈیش بورڈ'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      onNavigate('dashboard');
                      setTimeout(() => {
                        const event = new CustomEvent('openProfileTab');
                        window.dispatchEvent(event);
                      }, 100);
                    }}>
                      <User className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'My Profile' : 'میرا پروفائل'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleUserSignOut} className="text-red-600 focus:text-red-700">
                      <LogOut className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Sign Out' : 'سائن آؤٹ'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : !isAdminLoggedIn && !isLoggedIn && (
              <>
                <button 
                  className="text-sm text-[#0A2540] hover:text-[#008C7E] transition-colors font-medium"
                  onClick={onSignInClick}
                >
                  {language === 'en' ? 'Sign In' : 'سائن ان کریں'}
                </button>
                <Button 
                  className="bg-[#FF8A2B] hover:bg-[#ff7a1b] text-white"
                  onClick={() => onNavigate('post-project')}
                >
                  {language === 'en' ? 'Post Project' : 'پروجیکٹ پوسٹ کریں'}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="p-2">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]" aria-describedby="mobile-menu-description">
              <SheetHeader className="sr-only">
                <SheetTitle>
                  {language === 'en' ? 'Navigation Menu' : 'نیویگیشن مینو'}
                </SheetTitle>
                <SheetDescription id="mobile-menu-description">
                  {language === 'en' ? 'Access main navigation options and account settings' : 'مرکزی نیویگیشن اختیارات اور اکاؤنٹ کی ترتیبات تک رسائی'}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 mt-8">
                {/* Mobile Search (Hidden for Admin) */}
                {!isAdminLoggedIn && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      placeholder={language === 'en' ? "Search..." : "تلاش کریں..."}
                      className="pl-10 h-10 text-sm"
                    />
                  </div>
                )}

                {/* Admin Badge in Mobile */}
                {isAdminLoggedIn && adminUser && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <Shield className="text-red-600" size={16} />
                    <div>
                      <div className="text-sm font-medium text-red-700">
                        {adminUser.name}
                      </div>
                      <div className="text-xs text-red-600">
                        {language === 'en' ? 'Admin Mode Active' : 'ایڈمن موڈ فعال'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation Links (Hidden for Admin) */}
                {!isAdminLoggedIn && (
                  <nav className="flex flex-col gap-4">
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); onNavigate('home'); setMobileMenuOpen(false); }}
                      className="text-[#0A2540] hover:text-[#008C7E] transition-colors"
                    >
                      {language === 'en' ? 'Home' : 'ہوم'}
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); onNavigate('browse'); setMobileMenuOpen(false); }}
                      className="text-[#0A2540] hover:text-[#008C7E] transition-colors"
                    >
                      {language === 'en' ? 'Browse Companies' : 'کمپنیاں براؤز کریں'}
                    </a>
                    
                    {/* Browse Projects link for company users in mobile menu */}
                    {isLoggedIn && userType === 'company' && (
                      <a 
                        href="#" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          onNavigate('browse-projects'); 
                          setMobileMenuOpen(false); 
                        }}
                        className="text-[#0A2540] hover:text-[#008C7E] transition-colors font-medium"
                      >
                        {language === 'en' ? 'Browse Projects' : 'پروجیکٹس براؤز کریں'}
                      </a>
                    )}
                    
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); onNavigate('about'); setMobileMenuOpen(false); }}
                      className="text-[#0A2540] hover:text-[#008C7E] transition-colors"
                    >
                      {language === 'en' ? 'About' : 'کے بارے میں'}
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); onNavigate('contact'); setMobileMenuOpen(false); }}
                      className="text-[#0A2540] hover:text-[#008C7E] transition-colors"
                    >
                      {language === 'en' ? 'Contact' : 'رابطہ کریں'}
                    </a>
                  </nav>
                )}

                {/* Admin Panel Link in Mobile */}
                {isAdminLoggedIn && (
                  <nav className="flex flex-col gap-4">
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); onNavigate('admin'); setMobileMenuOpen(false); }}
                      className="text-red-700 hover:text-red-800 transition-colors flex items-center gap-2 font-medium"
                    >
                      <Shield className="w-4 h-4" />
                      {language === 'en' ? 'Verification Dashboard' : 'تصدیق ڈیش بورڈ'}
                    </a>
                  </nav>
                )}

                <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
                  {/* Admin Actions */}
                  {isAdminLoggedIn ? (
                    <Button 
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleAdminSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Admin Sign Out' : 'ایڈمن سائن آؤٹ'}
                    </Button>
                  ) : (
                    <>
                      {/* Admin Login Button (for non-logged users) */}
                      {!isLoggedIn && (
                        <Button 
                          variant="outline"
                          className="w-full border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => { onAdminLoginClick(); setMobileMenuOpen(false); }}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Admin Login' : 'ایڈمن لاگ ان'}
                        </Button>
                      )}

                      {/* Regular User Actions */}
                      {isLoggedIn ? (
                        <>
                          <Button 
                            className="w-full bg-[#008C7E] hover:bg-[#007066] text-white"
                            onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                          >
                            {language === 'en' ? 'Dashboard' : 'ڈیش بورڈ'}
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full border-[#0A2540] text-[#0A2540]"
                            onClick={() => { 
                              onNavigate('dashboard'); 
                              setMobileMenuOpen(false);
                              setTimeout(() => {
                                const event = new CustomEvent('openProfileTab');
                                window.dispatchEvent(event);
                              }, 100);
                            }}
                          >
                            <User className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'My Profile' : 'میرا پروفائل'}
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50"
                            onClick={handleUserSignOut}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'Sign Out' : 'سائن آؤٹ'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline"
                            className="w-full mb-3 border-[#0A2540] text-[#0A2540]"
                            onClick={() => { onSignInClick(); setMobileMenuOpen(false); }}
                          >
                            {language === 'en' ? 'Sign In' : 'سائن ان کریں'}
                          </Button>
                          <Button 
                            className="w-full bg-[#FF8A2B] hover:bg-[#ff7a1b] text-white"
                            onClick={() => { onNavigate('post-project'); setMobileMenuOpen(false); }}
                          >
                            {language === 'en' ? 'Post Project' : 'پروجیکٹ پوسٹ کریں'}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  isLoggedIn: PropTypes.bool,
  isAdminLoggedIn: PropTypes.bool,
  onNavigate: PropTypes.func.isRequired,
  onSignInClick: PropTypes.func.isRequired,
  onAdminLoginClick: PropTypes.func,
  onSignOut: PropTypes.func,
  onAdminSignOut: PropTypes.func,
  language: PropTypes.oneOf(['en', 'ur']).isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  userType: PropTypes.oneOf(['client', 'company', 'admin']),
  currentUser: PropTypes.object,
  adminUser: PropTypes.object
};