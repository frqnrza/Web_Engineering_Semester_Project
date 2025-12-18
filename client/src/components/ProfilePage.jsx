import { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, MapPin, Building, Briefcase, Globe, Linkedin, MessageSquare, Award, Shield, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { authAPI, companyAPI } from '../services/api';
import PropTypes from 'prop-types';

export function ProfilePage({ userType, currentUser, onNavigate }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });
  
  // Professional Information (for both clients and companies)
  const [professionalInfo, setProfessionalInfo] = useState({
    title: '',
    experience: '',
    skills: '',
    education: '',
    certifications: ''
  });
  
  // Company Information
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    tagline: '',
    description: '',
    services: [],
    website: '',
    linkedin: '',
    teamSize: '',
    yearsInBusiness: '',
    startingPrice: '',
    category: 'web'
  });
  
  // Social Links
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    github: ''
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    projectAlerts: true,
    bidAlerts: true,
    marketingEmails: false
  });

  // Profile Picture
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  useEffect(() => {
    loadProfileData();
  }, [userType, currentUser]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage first
      const savedPersonal = JSON.parse(localStorage.getItem('personalProfile') || '{}');
      const savedProfessional = JSON.parse(localStorage.getItem('professionalProfile') || '{}');
      const savedSocial = JSON.parse(localStorage.getItem('socialProfile') || '{}');
      const savedNotifications = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
      
      // Load user data
      const userData = await authAPI.getCurrentUser();
      if (userData) {
        setPersonalInfo(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        }));
      }

      // Load saved profiles
      if (Object.keys(savedPersonal).length > 0) {
        setPersonalInfo(savedPersonal);
      }
      
      if (Object.keys(savedProfessional).length > 0) {
        setProfessionalInfo(savedProfessional);
      }
      
      if (Object.keys(savedSocial).length > 0) {
        setSocialLinks(savedSocial);
      }
      
      if (Object.keys(savedNotifications).length > 0) {
        setNotifications(savedNotifications);
      }

      // Load company profile if user is a company
      if (userType === 'company' && currentUser?.companyId) {
        try {
          const companyData = await companyAPI.getById(currentUser.companyId);
          if (companyData.company) {
            const company = companyData.company;
            setCompanyInfo({
              companyName: company.name || '',
              tagline: company.tagline || '',
              description: company.description || '',
              services: company.services || [],
              website: company.website || '',
              linkedin: company.linkedin || '',
              teamSize: company.teamSize || '',
              yearsInBusiness: company.yearsInBusiness || '',
              startingPrice: company.startingPrice || '',
              category: company.category || 'web'
            });
          }
        } catch (error) {
          console.error('Error loading company profile:', error);
        }
      }

      // Load profile picture
      const savedPicture = localStorage.getItem('profilePicture');
      if (savedPicture) {
        setProfilePictureUrl(savedPicture);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    try {
      setSaving(true);
      
      // Update in localStorage
      localStorage.setItem('personalProfile', JSON.stringify(personalInfo));
      
      // Update current user in localStorage
      const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...currentUserData,
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone
      }));
      
      setMessage({ type: 'success', text: 'Personal information saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to save personal information' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfessionalInfo = async () => {
    try {
      setSaving(true);
      localStorage.setItem('professionalProfile', JSON.stringify(professionalInfo));
      setMessage({ type: 'success', text: 'Professional information saved!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save professional information' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    try {
      setSaving(true);
      
      // Prepare company data
      const companyData = {
        name: companyInfo.companyName,
        tagline: companyInfo.tagline,
        description: companyInfo.description,
        services: Array.isArray(companyInfo.services) 
          ? companyInfo.services 
          : companyInfo.services.split(',').map(s => s.trim()).filter(s => s),
        website: companyInfo.website,
        linkedin: companyInfo.linkedin,
        teamSize: companyInfo.teamSize,
        yearsInBusiness: companyInfo.yearsInBusiness,
        startingPrice: companyInfo.startingPrice,
        category: companyInfo.category
      };
      
      // Save to backend if company exists
      if (currentUser?.companyId) {
        await companyAPI.update(currentUser.companyId, companyData);
      }
      
      // Update current user
      const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...currentUserData,
        companyName: companyInfo.companyName
      }));
      
      setMessage({ type: 'success', text: 'Company information saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Save company error:', error);
      setMessage({ type: 'error', text: 'Failed to save company information' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    try {
      setSaving(true);
      localStorage.setItem('socialProfile', JSON.stringify(socialLinks));
      setMessage({ type: 'success', text: 'Social links saved!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save social links' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      localStorage.setItem('notificationPreferences', JSON.stringify(notifications));
      setMessage({ type: 'success', text: 'Notification preferences saved!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save notification preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, upload to server and get URL
      // For now, create a local URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        setProfilePictureUrl(url);
        localStorage.setItem('profilePicture', url);
        setMessage({ type: 'success', text: 'Profile picture updated!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAvatarFallback = () => {
    if (personalInfo.name) {
      return personalInfo.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return userType === 'company' ? 'C' : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008C7E] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540] mb-2">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your {userType === 'company' ? 'company and personal' : 'personal and professional'} information
          </p>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profilePictureUrl} alt={personalInfo.name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-[#008C7E] to-[#0A2540] text-white">
                    {getAvatarFallback()}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="profile-picture-upload" className="absolute bottom-0 right-0">
                  <div className="bg-[#008C7E] hover:bg-[#007066] text-white p-2 rounded-full cursor-pointer shadow-md">
                    <Upload size={16} />
                  </div>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0A2540]">
                      {userType === 'company' ? companyInfo.companyName : personalInfo.name}
                    </h2>
                    {userType === 'company' && (
                      <p className="text-gray-600 text-lg">{companyInfo.tagline}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      {personalInfo.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={14} />
                          {personalInfo.email}
                        </span>
                      )}
                      {personalInfo.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {personalInfo.phone}
                        </span>
                      )}
                      {personalInfo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {personalInfo.location}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#008C7E] text-white">
                      {userType === 'company' ? 'Company' : 'Client'}
                    </Badge>
                    {currentUser?.verified && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                        <Shield size={12} />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                {personalInfo.bio && (
                  <p className="text-gray-700 mt-4 max-w-3xl">{personalInfo.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            <TabsTrigger value="personal" className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white">
              <User size={16} className="mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="professional" className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white">
              <Briefcase size={16} className="mr-2" />
              Professional
            </TabsTrigger>
            {userType === 'company' && (
              <TabsTrigger value="company" className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white">
                <Building size={16} className="mr-2" />
                Company
              </TabsTrigger>
            )}
            <TabsTrigger value="social" className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white">
              <Globe size={16} className="mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-[#008C7E] data-[state=active]:text-white">
              <MessageSquare size={16} className="mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your basic personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={personalInfo.location}
                      onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={personalInfo.bio}
                    onChange={(e) => setPersonalInfo({...personalInfo, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">A brief introduction about yourself</p>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSavePersonalInfo}
                    disabled={saving}
                    className="bg-[#008C7E] hover:bg-[#007066]"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Personal Information'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Information Tab */}
          <TabsContent value="professional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase size={20} />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  {userType === 'company' ? 'About your professional background' : 'Your professional details'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={professionalInfo.title}
                      onChange={(e) => setProfessionalInfo({...professionalInfo, title: e.target.value})}
                      placeholder={userType === 'company' ? 'CEO, Founder, etc.' : 'Job Title'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      value={professionalInfo.experience}
                      onChange={(e) => setProfessionalInfo({...professionalInfo, experience: e.target.value})}
                      placeholder="e.g., 5 years"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills & Expertise</Label>
                  <Textarea
                    id="skills"
                    value={professionalInfo.skills}
                    onChange={(e) => setProfessionalInfo({...professionalInfo, skills: e.target.value})}
                    placeholder={userType === 'company' ? 'List your company skills...' : 'List your skills separated by commas...'}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    value={professionalInfo.education}
                    onChange={(e) => setProfessionalInfo({...professionalInfo, education: e.target.value})}
                    placeholder="Your educational background..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Textarea
                    id="certifications"
                    value={professionalInfo.certifications}
                    onChange={(e) => setProfessionalInfo({...professionalInfo, certifications: e.target.value})}
                    placeholder="List any certifications..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfessionalInfo}
                    disabled={saving}
                    className="bg-[#008C7E] hover:bg-[#007066]"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Professional Information'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Information Tab (only for companies) */}
          {userType === 'company' && (
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building size={20} />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Update your company details for clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.companyName}
                      onChange={(e) => setCompanyInfo({...companyInfo, companyName: e.target.value})}
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={companyInfo.tagline}
                      onChange={(e) => setCompanyInfo({...companyInfo, tagline: e.target.value})}
                      placeholder="Brief company tagline"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyDescription">Company Description</Label>
                    <Textarea
                      id="companyDescription"
                      value={companyInfo.description}
                      onChange={(e) => setCompanyInfo({...companyInfo, description: e.target.value})}
                      placeholder="Describe your company, services, and expertise..."
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="services">Services Offered</Label>
                      <Input
                        id="services"
                        value={Array.isArray(companyInfo.services) ? companyInfo.services.join(', ') : companyInfo.services}
                        onChange={(e) => setCompanyInfo({...companyInfo, services: e.target.value})}
                        placeholder="Web Development, Mobile Apps, SEO, etc."
                      />
                      <p className="text-sm text-gray-500">Separate services with commas</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Primary Category</Label>
                      <select
                        id="category"
                        value={companyInfo.category}
                        onChange={(e) => setCompanyInfo({...companyInfo, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008C7E]"
                      >
                        <option value="web">Web Development</option>
                        <option value="mobile">Mobile Apps</option>
                        <option value="marketing">Digital Marketing</option>
                        <option value="design">UI/UX Design</option>
                        <option value="seo">SEO</option>
                        <option value="cloud">Cloud Services</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="teamSize">Team Size</Label>
                      <Input
                        id="teamSize"
                        value={companyInfo.teamSize}
                        onChange={(e) => setCompanyInfo({...companyInfo, teamSize: e.target.value})}
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsInBusiness">Years in Business</Label>
                      <Input
                        id="yearsInBusiness"
                        value={companyInfo.yearsInBusiness}
                        onChange={(e) => setCompanyInfo({...companyInfo, yearsInBusiness: e.target.value})}
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startingPrice">Starting Price (PKR)</Label>
                      <Input
                        id="startingPrice"
                        value={companyInfo.startingPrice}
                        onChange={(e) => setCompanyInfo({...companyInfo, startingPrice: e.target.value})}
                        placeholder="e.g., 100000"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveCompanyInfo}
                      disabled={saving}
                      className="bg-[#0A2540] hover:bg-[#0A2540]/90"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? 'Saving...' : 'Save Company Information'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Social Links Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe size={20} />
                  Social Links
                </CardTitle>
                <CardDescription>
                  Connect your social profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe size={16} />
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin size={16} />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      type="url"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      type="url"
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  {userType === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        type="url"
                        value={socialLinks.github}
                        onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                        placeholder="https://github.com/yourcompany"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSocialLinks}
                    disabled={saving}
                    className="bg-[#008C7E] hover:bg-[#007066]"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Social Links'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={20} />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-600">
                          {key.includes('email') && 'Receive email notifications'}
                          {key.includes('sms') && 'Get SMS alerts'}
                          {key.includes('project') && 'Updates about your projects'}
                          {key.includes('bid') && 'Notifications about bids'}
                          {key.includes('marketing') && 'Marketing and promotional emails'}
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({...notifications, [key]: !value})}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                          value ? 'bg-[#008C7E] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="bg-[#008C7E] hover:bg-[#007066]"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

ProfilePage.propTypes = {
  userType: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
  onNavigate: PropTypes.func.isRequired
};