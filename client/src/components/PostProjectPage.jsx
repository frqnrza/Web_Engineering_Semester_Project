import { useState, useEffect } from "react";
import { HelpCircle, FileText, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { FileUpload } from "./FileUpload";
import PropTypes from 'prop-types';
import { projectAPI } from "../services/api";

export function PostProjectPage({ onNavigate }) {
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [wordCount, setWordCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedTechStack, setSelectedTechStack] = useState([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedTimeline, setSelectedTimeline] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isInviteOnly, setIsInviteOnly] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("jazzcash");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const templates = [
    { id: "blank", label: "Start from Scratch" },
    { id: "website", label: "Website" },
    { id: "app", label: "Mobile App" },
    { id: "marketing", label: "Marketing" }
  ];

  const techStackOptions = [
    "React", "Node.js", "Python", "PHP", "Laravel",
    "React Native", "Flutter", "Swift", "Kotlin",
    "WordPress", "Shopify", "Django"
  ];

  const templateData = {
    website: {
      title: "E-commerce Website Development",
      description: "I need a fully functional e-commerce website with the following features:\n\n• Product catalog with search and filtering\n• User registration and login system\n• Shopping cart and checkout process\n• Payment gateway integration (JazzCash/EasyPaisa)\n• Admin dashboard for product management\n• Order tracking system\n• Mobile responsive design\n\nExpected traffic: 1000+ daily visitors\nTarget audience: Pakistani consumers aged 18-45\n\nPlease include hosting recommendations and maintenance plans in your proposal.",
      category: "web",
      budget: "250-500",
      timeline: "1-3",
      techStack: ["React", "Node.js", "WordPress"]
    },
    app: {
      title: "Food Delivery Mobile App",
      description: "I need a cross-platform mobile app (iOS & Android) with these features:\n\n• User app for browsing restaurants and ordering food\n• Restaurant partner app for managing orders\n• Delivery rider app for order fulfillment\n• Real-time order tracking with GPS\n• In-app payment integration (JazzCash/EasyPaisa/Cards)\n• Push notifications for order updates\n• Rating and review system\n• Promo code and discount management\n\nTarget cities: Lahore, Karachi, Islamabad\nExpected users: 10,000+ in first 6 months\n\nPlease provide examples of similar apps you've built.",
      category: "mobile",
      budget: "500+",
      timeline: "3-6",
      techStack: ["React Native", "Flutter", "Node.js"]
    },
    marketing: {
      title: "3-Month Digital Marketing Campaign",
      description: "I need a comprehensive digital marketing strategy for my business:\n\n• SEO optimization for website (on-page and off-page)\n• Social media marketing (Facebook, Instagram, LinkedIn)\n• Google Ads campaign management\n• Content creation (blog posts, social media posts)\n• Email marketing campaigns\n• Monthly performance reports and analytics\n• Competitor analysis\n\nIndustry: E-commerce/Retail\nTarget audience: Pakistani consumers aged 25-40\nCurrent monthly marketing budget: PKR 100,000\n\nPlease include case studies from similar industries in your proposal.",
      category: "marketing",
      budget: "100-250",
      timeline: "1-3",
      techStack: []
    }
  };

  useEffect(() => {
    if (selectedTemplate !== "blank" && templateData[selectedTemplate]) {
      const template = templateData[selectedTemplate];
      setProjectTitle(template.title);
      setProjectDescription(template.description);
      setSelectedCategory(template.category);
      setSelectedBudget(template.budget);
      setSelectedTimeline(template.timeline);
      setSelectedTechStack(template.techStack);
      
      const words = template.description.trim().split(/\s+/).length;
      setWordCount(words);
    } else if (selectedTemplate === "blank") {
      setProjectTitle("");
      setProjectDescription("");
      setSelectedCategory("");
      setSelectedBudget("");
      setSelectedTimeline("");
      setSelectedTechStack([]);
      setWordCount(0);
    }
  }, [selectedTemplate]);

  const getTemplateHelperText = () => {
    switch (selectedTemplate) {
      case "website":
        return "💡 Tip: Include details about user accounts, payment integration, expected traffic, and any specific design preferences.";
      case "app":
        return "💡 Tip: Specify platforms (iOS/Android/both), must-have features, target user base, and any API integrations needed.";
      case "marketing":
        return "💡 Tip: Define your target audience, current online presence, budget allocation, and success metrics (KPIs).";
      default:
        return "💡 Tip: Describe your project goals, features, timeline, and any specific requirements in detail.";
    }
  };

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    setProjectDescription(text);
    const words = text.trim().split(/\s+/).length;
    setWordCount(text.trim() === "" ? 0 : words);
  };

  const toggleTechStack = (tech) => {
    if (selectedTechStack.includes(tech)) {
      setSelectedTechStack(selectedTechStack.filter(t => t !== tech));
    } else {
      setSelectedTechStack([...selectedTechStack, tech]);
    }
  };

  const handleFileUpload = (files) => {
    setUploadedFiles(files);
  };

  const handlePublish = async () => {
    setSubmitError("");
    
    // Validation
    if (!projectTitle || !projectDescription || !selectedCategory || !selectedBudget || !selectedTimeline) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    if (!clientName || !clientEmail || !clientPhone) {
      setSubmitError("Please fill in your contact information");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Parse Budget
      let minBudget, maxBudget;
      
      if (selectedBudget.includes('+')) {
        // "500+" -> min 500,000
        const baseValue = parseInt(selectedBudget.replace('+', ''));
        minBudget = baseValue * 1000;
        maxBudget = null; // Open-ended
      } else if (selectedBudget.includes('-')) {
        // "100-250" -> min 100,000, max 250,000
        const [min, max] = selectedBudget.split('-').map(v => parseInt(v.trim()));
        minBudget = min * 1000;
        maxBudget = max * 1000;
      } else {
        // Fallback
        const value = parseInt(selectedBudget);
        minBudget = value * 1000;
        maxBudget = value * 2000;
      }

      // 2. Parse Timeline - ✅ FIXED LOGIC
      let timelineValue = selectedTimeline;
      let timelineUnit = 'months'; // Default

      // Check specifically for week-based values defined in Select options
      const weekOptions = ['1-2', '2-4'];
      if (weekOptions.includes(selectedTimeline)) {
        timelineUnit = 'weeks';
      }

      const projectData = {
        title: projectTitle,
        description: projectDescription,
        category: selectedCategory,
        budget: {
          range: selectedBudget,
          min: minBudget,
          max: maxBudget
        },
        timeline: {
          value: timelineValue,
          unit: timelineUnit
        },
        clientInfo: {
          name: clientName,
          email: clientEmail,
          phone: clientPhone
        },
        techStack: selectedTechStack,
        paymentMethod,
        isInviteOnly,
        attachments: uploadedFiles.map(file => ({
          url: file.url,
          publicId: file.publicId,
          originalName: file.originalName,
          fileType: 'document',
          size: file.size
        })),
        status: 'posted'
      };

      console.log('📋 Submitting project data:', projectData);
      
      const result = await projectAPI.create(projectData);
      
      console.log('✅ API Response:', result);
      
      if (result && (result.success || result.project)) {
        setShowConfirmation(true);
      } else {
        throw new Error(result.error || result.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('❌ Submit project error:', error);
      
      let errorMessage = 'Failed to publish project. ';
      
      if (error.message.includes('not authenticated') || error.message.includes('sign in')) {
        errorMessage += 'Please sign in to post a project.';
      } else if (error.message.includes('Unable to connect')) {
        errorMessage += 'Unable to connect to server. Using demo mode.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    alert('Draft saved locally. Note: This is a demo feature.');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A2540] mb-2">Post Your Project</h1>
          <p className="text-gray-600">Get verified companies to bid on your project</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {/* Error Display */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Form (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              {/* Template Selector */}
              <div className="mb-6">
                <Label className="mb-3 block text-base font-semibold text-[#0A2540]">
                  Start with a Template (Optional)
                </Label>
                <div className="flex flex-wrap gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                        selectedTemplate === template.id
                          ? "bg-[#0A2540] text-white border-[#0A2540]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
                {selectedTemplate !== "blank" && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    ✨ Template applied! You can edit any field below to customize your project.
                  </div>
                )}
              </div>

              {/* Project Title */}
              <div className="mb-6">
                <Label htmlFor="title" className="mb-2 block font-semibold text-[#0A2540]">
                  Project Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., E-commerce Website Development"
                  className="h-11"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              {/* Company / Contact Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="name" className="mb-2 block font-semibold text-[#0A2540]">
                    Your Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="name" 
                    placeholder="Full name" 
                    className="h-11"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="mb-2 block font-semibold text-[#0A2540]">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@company.com" 
                    className="h-11"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label htmlFor="phone" className="mb-2 block font-semibold text-[#0A2540]">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="phone" 
                  placeholder="+92 300 1234567" 
                  className="h-11"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

              {/* Project Category */}
              <div className="mb-6">
                <Label htmlFor="category" className="mb-2 block font-semibold text-[#0A2540]">
                  Project Category <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web Development</SelectItem>
                    <SelectItem value="mobile">Mobile Apps</SelectItem>
                    <SelectItem value="marketing">Digital Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="budget" className="mb-2 block font-semibold text-[#0A2540]">
                    Budget Range <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                    <SelectTrigger id="budget" className="h-11">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50-100">PKR 50k - 100k</SelectItem>
                      <SelectItem value="100-250">PKR 100k - 250k</SelectItem>
                      <SelectItem value="250-500">PKR 250k - 500k</SelectItem>
                      <SelectItem value="500+">PKR 500k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeline" className="mb-2 block font-semibold text-[#0A2540]">
                    Timeline <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedTimeline} onValueChange={setSelectedTimeline}>
                    <SelectTrigger id="timeline" className="h-11">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 weeks</SelectItem>
                      <SelectItem value="2-4">2-4 weeks</SelectItem>
                      <SelectItem value="1-3">1-3 months</SelectItem>
                      <SelectItem value="3-6">3-6 months</SelectItem>
                      <SelectItem value="6+">6+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project Description */}
              <div className="mb-6">
                <Label htmlFor="description" className="mb-2 block font-semibold text-[#0A2540]">
                  Project Description <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-gray-500 mb-2">{getTemplateHelperText()}</p>
                <Textarea
                  id="description"
                  placeholder="Describe your project requirements, goals, features, and any specific needs..."
                  className="min-h-64 resize-none"
                  maxLength={3000}
                  value={projectDescription}
                  onChange={handleDescriptionChange}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {wordCount} / 500 words
                  </span>
                  <span className="text-xs text-gray-400">
                    {3000 - projectDescription.length} characters remaining
                  </span>
                </div>
              </div>

              {/* Preferred Tech Stack */}
              <div className="mb-6">
                <Label className="mb-2 block font-semibold text-[#0A2540]">
                  Preferred Tech Stack (Optional)
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {techStackOptions.map((tech) => (
                    <Badge
                      key={tech}
                      variant={selectedTechStack.includes(tech) ? "default" : "outline"}
                      className={`cursor-pointer ${
                        selectedTechStack.includes(tech)
                          ? "bg-[#008C7E] hover:bg-[#007066]"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleTechStack(tech)}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Confidentiality */}
              <div className="mb-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="confidential" className="font-semibold text-[#0A2540]">
                      Make this project invite-only
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Only companies you invite can see and bid on this project
                    </p>
                  </div>
                  <Switch 
                    id="confidential"
                    checked={isInviteOnly}
                    onCheckedChange={setIsInviteOnly}
                  />
                </div>
              </div>

              {/* Attachments with FileUpload Component */}
              <div className="mb-6">
                <Label className="mb-2 block font-semibold text-[#0A2540]">
                  Attachments (Optional)
                </Label>
                <FileUpload
                  type="document"
                  multiple
                  maxFiles={5}
                  label="Upload project documents, requirements, wireframes"
                  onUploadComplete={handleFileUpload}
                />
              </div>

              {/* Preferred Payment */}
              <div className="mb-8">
                <Label className="mb-3 block font-semibold text-[#0A2540]">
                  Preferred Payment Method
                </Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative">
                      <RadioGroupItem value="jazzcash" id="jazzcash" className="peer sr-only" />
                      <Label
                        htmlFor="jazzcash"
                        className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-data-[state=checked]:border-[#008C7E] peer-data-[state=checked]:bg-[#008C7E] peer-data-[state=checked]:bg-opacity-5 hover:border-gray-300 transition-colors"
                      >
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-xs text-red-600 font-semibold">JazzCash</span>
                        </div>
                        <span className="text-sm text-[#0A2540]">JazzCash</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="easypaisa" id="easypaisa" className="peer sr-only" />
                      <Label
                        htmlFor="easypaisa"
                        className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-data-[state=checked]:border-[#008C7E] peer-data-[state=checked]:bg-[#008C7E] peer-data-[state=checked]:bg-opacity-5 hover:border-gray-300 transition-colors"
                      >
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-xs text-green-600 font-semibold">EasyPaisa</span>
                        </div>
                        <span className="text-sm text-[#0A2540]">EasyPaisa</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                      <Label
                        htmlFor="bank"
                        className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-data-[state=checked]:border-[#008C7E] peer-data-[state=checked]:bg-[#008C7E] peer-data-[state=checked]:bg-opacity-5 hover:border-gray-300 transition-colors"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-xs text-blue-600 font-semibold">Bank</span>
                        </div>
                        <span className="text-sm text-[#0A2540]">Bank Transfer</span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  className="bg-[#FF8A2B] hover:bg-[#ff7a1b] text-white px-8"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Project'}
                </Button>
                <Button
                  variant="outline"
                  className="border-[#008C7E] text-[#008C7E] hover:bg-[#008C7E] hover:text-white"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Save Draft
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Help & Tips (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              {/* Tips Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="text-[#008C7E]" size={20} />
                  <div className="font-semibold text-[#0A2540]">Tips for a Great Brief</div>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <Check className="text-[#008C7E] flex-shrink-0 mt-0.5" size={16} />
                    <span>Be specific about your requirements and goals</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="text-[#008C7E] flex-shrink-0 mt-0.5" size={16} />
                    <span>Include your budget range and timeline expectations</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="text-[#008C7E] flex-shrink-0 mt-0.5" size={16} />
                    <span>Mention any technical preferences or constraints</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="text-[#008C7E] flex-shrink-0 mt-0.5" size={16} />
                    <span>Attach relevant documents, wireframes, or examples</span>
                  </li>
                </ul>
              </div>

              {/* Template Examples */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-[#0A2540]" size={20} />
                  <div className="font-semibold text-[#0A2540]">Use a Template</div>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedTemplate('website')}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTemplate === 'website' 
                        ? 'bg-[#008C7E] bg-opacity-10 border-2 border-[#008C7E]' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium text-[#0A2540] mb-1">🌐 Website Development</div>
                    <p className="text-xs text-gray-600">
                      E-commerce, corporate sites, web apps
                    </p>
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate('app')}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTemplate === 'app' 
                        ? 'bg-[#008C7E] bg-opacity-10 border-2 border-[#008C7E]' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium text-[#0A2540] mb-1">📱 Mobile App</div>
                    <p className="text-xs text-gray-600">
                      iOS, Android, cross-platform apps
                    </p>
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate('marketing')}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTemplate === 'marketing' 
                        ? 'bg-[#008C7E] bg-opacity-10 border-2 border-[#008C7E]' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium text-[#0A2540] mb-1">📈 Digital Marketing</div>
                    <p className="text-xs text-gray-600">
                      SEO, social media, advertising campaigns
                    </p>
                  </button>
                </div>
              </div>

              {/* Support */}
              <div className="bg-[#008C7E] bg-opacity-5 rounded-lg border border-[#008C7E] border-opacity-20 p-6">
                <div className="font-semibold text-[#0A2540] mb-2">Need Help?</div>
                <p className="text-sm text-gray-700 mb-4">
                  Our team is here to help you write the perfect project brief
                </p>
                <Button
                  variant="outline"
                  className="w-full border-[#008C7E] text-[#008C7E] hover:bg-[#008C7E] hover:text-white"
                >
                  Chat with Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md" aria-describedby="dialog-description">
          <DialogHeader>
            <div className="w-12 h-12 bg-[#008C7E] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-[#008C7E]" size={24} />
            </div>
            <DialogTitle className="text-center text-[#0A2540]">
              Project Posted Successfully
            </DialogTitle>
            <DialogDescription id="dialog-description" className="text-center">
              Your project is now live. Verified companies will start sending bids within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Button
              className="w-full bg-[#008C7E] hover:bg-[#007066] text-white"
              onClick={() => {
                setShowConfirmation(false);
                onNavigate('browse');
              }}
            >
              Invite Companies to Bid
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowConfirmation(false);
                onNavigate('dashboard');
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

PostProjectPage.propTypes = {
  onNavigate: PropTypes.func.isRequired
};