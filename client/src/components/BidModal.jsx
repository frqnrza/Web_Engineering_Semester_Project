import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, Briefcase, Users, Award, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { useToast } from 'C:\\Users\\user\\Desktop\\Web_Engineering_Semester_Project\\client\\src\\contexts\\ToastContext.jsx';
import { bidAPI } from '../services/api';

const BidModal = ({ 
  project, 
  company, 
  isOpen, 
  onClose, 
  onBidSubmit,
  isEdit = false,
  existingBid = null 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Bid Form State
  const [bidData, setBidData] = useState({
    amount: existingBid?.amount || project?.budget?.min || 0,
    proposal: existingBid?.proposal || '',
    timelineValue: existingBid?.proposedTimeline?.value || project?.timeline?.value?.split('-')[0] || 1,
    timelineUnit: existingBid?.proposedTimeline?.unit || project?.timeline?.unit || 'weeks',
    milestones: existingBid?.milestones || [
      { title: 'Discovery & Planning', amount: 20, dueDate: null, description: '' },
      { title: 'Development Phase', amount: 50, dueDate: null, description: '' },
      { title: 'Testing & Deployment', amount: 30, dueDate: null, description: '' }
    ],
    techStack: existingBid?.techStack || project?.techStack || [],
    teamStructure: existingBid?.teamStructure || [
      { role: 'Project Manager', name: '', experience: 'Senior', hoursAllocated: 40 },
      { role: 'Lead Developer', name: '', experience: 'Senior', hoursAllocated: 120 },
      { role: 'UI/UX Designer', name: '', experience: 'Mid-level', hoursAllocated: 60 }
    ],
    assumptions: existingBid?.assumptions || [],
    paymentSchedule: existingBid?.paymentSchedule?.type || 'milestone',
    escrowRequired: existingBid?.escrowRequired ?? true,
    executiveSummary: existingBid?.executiveSummary || '',
    methodology: existingBid?.methodology || ''
  });

  const [customAssumption, setCustomAssumption] = useState('');
  const [customTech, setCustomTech] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      if (!isEdit) {
        resetForm();
      }
      setCurrentStep(1);
    }
  }, [isOpen, isEdit, existingBid]);

  const resetForm = () => {
    setBidData({
      amount: project?.budget?.min || 0,
      proposal: '',
      timelineValue: project?.timeline?.value?.split('-')[0] || 1,
      timelineUnit: project?.timeline?.unit || 'weeks',
      milestones: [
        { title: 'Discovery & Planning', amount: 20, dueDate: null, description: '' },
        { title: 'Development Phase', amount: 50, dueDate: null, description: '' },
        { title: 'Testing & Deployment', amount: 30, dueDate: null, description: '' }
      ],
      techStack: project?.techStack || [],
      teamStructure: [
        { role: 'Project Manager', name: '', experience: 'Senior', hoursAllocated: 40 },
        { role: 'Lead Developer', name: '', experience: 'Senior', hoursAllocated: 120 },
        { role: 'UI/UX Designer', name: '', experience: 'Mid-level', hoursAllocated: 60 }
      ],
      assumptions: [],
      paymentSchedule: 'milestone',
      escrowRequired: true,
      executiveSummary: '',
      methodology: ''
    });
    setAttachments([]);
    setErrors({});
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!bidData.amount || bidData.amount <= 0) {
          newErrors.amount = 'Please enter a valid bid amount';
        }
        if (project?.budget?.max && bidData.amount > project.budget.max) {
          newErrors.amount = `Bid amount exceeds maximum budget of PKR ${project.budget.max.toLocaleString()}`;
        }
        if (project?.budget?.min && bidData.amount < project.budget.min) {
          newErrors.amount = `Bid amount is below minimum budget of PKR ${project.budget.min.toLocaleString()}`;
        }
        if (!bidData.timelineValue || bidData.timelineValue <= 0) {
          newErrors.timeline = 'Please enter a valid timeline';
        }
        break;
        
      case 2:
        if (!bidData.proposal || bidData.proposal.length < 100) {
          newErrors.proposal = 'Proposal must be at least 100 characters';
        }
        if (!bidData.executiveSummary || bidData.executiveSummary.length < 50) {
          newErrors.executiveSummary = 'Please provide a brief executive summary';
        }
        break;
        
      case 3:
        const totalMilestonePercentage = bidData.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
        if (totalMilestonePercentage !== 100) {
          newErrors.milestones = `Milestone amounts must total 100% (Current: ${totalMilestonePercentage}%)`;
        }
        
        const emptyMilestoneTitles = bidData.milestones.filter(m => !m.title.trim());
        if (emptyMilestoneTitles.length > 0) {
          newErrors.milestoneTitles = 'All milestones must have titles';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (field, value) => {
    setBidData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = [...bidData.milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value
    };
    
    // Auto-calculate due dates based on timeline
    if (field === 'amount' || (field === 'dueDate' && index > 0)) {
      // This is a simplified calculation - in production you'd have more complex logic
    }
    
    setBidData(prev => ({ ...prev, milestones: updatedMilestones }));
  };

  const handleAddMilestone = () => {
    setBidData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: '', amount: 0, dueDate: null, description: '' }
      ]
    }));
  };

  const handleRemoveMilestone = (index) => {
    if (bidData.milestones.length > 1) {
      const updatedMilestones = bidData.milestones.filter((_, i) => i !== index);
      setBidData(prev => ({ ...prev, milestones: updatedMilestones }));
    }
  };

  const handleAddAssumption = () => {
    if (customAssumption.trim()) {
      setBidData(prev => ({
        ...prev,
        assumptions: [...prev.assumptions, customAssumption.trim()]
      }));
      setCustomAssumption('');
    }
  };

  const handleRemoveAssumption = (index) => {
    const updatedAssumptions = bidData.assumptions.filter((_, i) => i !== index);
    setBidData(prev => ({ ...prev, assumptions: updatedAssumptions }));
  };

  const handleAddTech = () => {
    if (customTech.trim()) {
      setBidData(prev => ({
        ...prev,
        techStack: [...prev.techStack, customTech.trim()]
      }));
      setCustomTech('');
    }
  };

  const handleRemoveTech = (index) => {
    const updatedTechStack = bidData.techStack.filter((_, i) => i !== index);
    setBidData(prev => ({ ...prev, techStack: updatedTechStack }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type`,
          variant: 'destructive'
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive'
        });
        return false;
      }
      
      return true;
    });
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    
    try {
      // In production, upload to server
      // const uploadPromises = validFiles.map(file => api.uploadFile(file));
      // const uploadedFiles = await Promise.all(uploadPromises);
      
      // For demo, simulate uploaded files
      setTimeout(() => {
        const simulatedUploads = validFiles.map(file => ({
          url: URL.createObjectURL(file),
          originalName: file.name,
          fileType: file.type,
          size: file.size
        }));
        
        setAttachments(prev => [...prev, ...simulatedUploads]);
        setUploadProgress(100);
        clearInterval(interval);
        
        toast({
          title: 'Files uploaded',
          description: `${validFiles.length} file(s) uploaded successfully`,
        });
      }, 1000);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload files',
        variant: 'destructive'
      });
      clearInterval(interval);
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalAmount = () => {
    return bidData.amount;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      const bidPayload = {
        amount: parseFloat(bidData.amount),
        proposal: bidData.proposal,
        timeline: { // Changed from proposedTimeline to timeline
          value: bidData.timelineValue,
          unit: bidData.timelineUnit
        },
        milestones: bidData.milestones.map(milestone => ({
          ...milestone,
          amount: parseFloat(milestone.amount)
        })),
        techStack: bidData.techStack,
        teamStructure: bidData.teamStructure,
        assumptions: bidData.assumptions,
        paymentSchedule: bidData.paymentSchedule,
        escrowRequired: bidData.escrowRequired,
        executiveSummary: bidData.executiveSummary,
        methodology: bidData.methodology,
        attachments: attachments
      };
      
      console.log('📤 Submitting to real backend...');
      
      let response;
      if (isEdit && existingBid) {
        response = await bidAPI.update(project._id, existingBid._id, bidPayload);
      } else {
        response = await bidAPI.submit(project._id, bidPayload);
      }
      
      console.log('📦 Backend response:', response);
      
      if (response && response.success) {
        toast({
          title: isEdit ? 'Bid Updated' : 'Bid Submitted',
          description: response.message || 'Your bid has been processed successfully',
        });
        
        // Call the callback to refresh data
        if (onBidSubmit) {
          onBidSubmit(response);
        }
        
        onClose();
      } else {
        throw new Error(response?.message || 'Failed to submit bid');
      }
      
    } catch (error) {
      console.error('Bid submission error:', error);
      
      // Check for specific error messages
      let errorMessage = error.message;
      
      if (errorMessage.includes('Project not found')) {
        errorMessage = 'The project was not found. It may have been removed.';
      } else if (errorMessage.includes('Not authenticated')) {
        errorMessage = 'Please sign in to submit a bid.';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">
              {isEdit ? 'Edit Bid' : 'Submit Bid'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {project?.title} • {company?.name}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                  ${currentStep === step ? 'ring-4 ring-blue-200 dark:ring-blue-900' : ''}
                `}>
                  {step}
                </div>
                <span className="mt-2 text-sm font-medium">
                  {step === 1 && 'Price & Timeline'}
                  {step === 2 && 'Proposal'}
                  {step === 3 && 'Milestones'}
                </span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="mt-4" />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Price & Timeline */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Bid Amount
                  </CardTitle>
                  <CardDescription>
                    Enter your proposed price for this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (PKR)</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">PKR</span>
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        value={bidData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="pl-16"
                        min={project?.budget?.min || 0}
                        max={project?.budget?.max || 10000000}
                        step="1000"
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.amount}
                      </p>
                    )}
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Project Budget Range: {formatCurrency(project?.budget?.min || 0)} - {formatCurrency(project?.budget?.max || 0)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timelineValue">Timeline</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="timelineValue"
                          type="number"
                          value={bidData.timelineValue}
                          onChange={(e) => handleInputChange('timelineValue', e.target.value)}
                          min="1"
                          max="365"
                        />
                        <Select
                          value={bidData.timelineUnit}
                          onValueChange={(value) => handleInputChange('timelineUnit', value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.timeline && (
                        <p className="text-sm text-red-600 mt-1">{errors.timeline}</p>
                      )}
                    </div>

                    <div>
                      <Label>Project Timeline</Label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <p className="text-sm">
                          Client requested: {project?.timeline?.value || 'N/A'} {project?.timeline?.unit || 'weeks'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Payment & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Use Escrow Service</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Secure payment through TechConnect escrow
                      </p>
                    </div>
                    <Switch
                      checked={bidData.escrowRequired}
                      onCheckedChange={(checked) => handleInputChange('escrowRequired', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentSchedule">Payment Schedule</Label>
                    <Select
                      value={bidData.paymentSchedule}
                      onValueChange={(value) => handleInputChange('paymentSchedule', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milestone">Milestone-based</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="lump_sum">Lump Sum</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Proposal */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Proposal
                  </CardTitle>
                  <CardDescription>
                    Describe your approach and methodology
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="executiveSummary">Executive Summary</Label>
                    <Textarea
                      id="executiveSummary"
                      value={bidData.executiveSummary}
                      onChange={(e) => handleInputChange('executiveSummary', e.target.value)}
                      placeholder="Brief overview of your approach..."
                      className="mt-1 min-h-[100px]"
                    />
                    {errors.executiveSummary && (
                      <p className="text-sm text-red-600 mt-1">{errors.executiveSummary}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {bidData.executiveSummary.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="methodology">Methodology</Label>
                    <Textarea
                      id="methodology"
                      value={bidData.methodology}
                      onChange={(e) => handleInputChange('methodology', e.target.value)}
                      placeholder="Describe your development process and methodology..."
                      className="mt-1 min-h-[120px]"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {bidData.methodology.length}/1000 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="proposal">Detailed Proposal</Label>
                    <Textarea
                      id="proposal"
                      value={bidData.proposal}
                      onChange={(e) => handleInputChange('proposal', e.target.value)}
                      placeholder="Provide detailed proposal including scope, deliverables, and approach..."
                      className="mt-1 min-h-[200px]"
                    />
                    {errors.proposal && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.proposal}
                      </p>
                    )}
                    <div className="flex justify-between mt-1">
                      <p className="text-sm text-gray-500">
                        {bidData.proposal.length}/5000 characters
                      </p>
                      <p className="text-sm text-gray-500">
                        Minimum 100 characters required
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Team & Technology
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Technology Stack</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add technology (e.g., React, Node.js)"
                          value={customTech}
                          onChange={(e) => setCustomTech(e.target.value)}
                          className="w-48"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTech()}
                        />
                        <Button onClick={handleAddTech} size="sm">
                          Add
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bidData.techStack.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tech}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-transparent"
                            onClick={() => handleRemoveTech(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      {bidData.techStack.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No technologies added yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Assumptions & Dependencies</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add assumption (e.g., Client provides content)"
                          value={customAssumption}
                          onChange={(e) => setCustomAssumption(e.target.value)}
                          className="w-48"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddAssumption()}
                        />
                        <Button onClick={handleAddAssumption} size="sm">
                          Add
                        </Button>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {bidData.assumptions.map((assumption, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm">{assumption}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveAssumption(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                      {bidData.assumptions.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No assumptions added yet</p>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Supporting Documents
                  </CardTitle>
                  <CardDescription>
                    Upload portfolio, case studies, or additional documents (PDF, DOC, JPG, PNG)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                    <Input
                      type="file"
                      id="file-upload"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Max 10MB per file • PDF, DOC, JPG, PNG
                      </p>
                    </Label>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-4">
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
                      </div>
                    )}
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Uploaded Files ({attachments.length})</h4>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-sm">{file.originalName}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAttachment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Milestones */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Project Milestones
                  </CardTitle>
                  <CardDescription>
                    Define project milestones with deliverables and payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {errors.milestones && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.milestones}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {bidData.milestones.map((milestone, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Milestone {index + 1}
                            </CardTitle>
                            {bidData.milestones.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMilestone(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={milestone.title}
                              onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                              placeholder="e.g., Design Approval, MVP Development"
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Payment Percentage</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Slider
                                  value={[milestone.amount || 0]}
                                  onValueChange={([value]) => handleMilestoneChange(index, 'amount', value)}
                                  max={100}
                                  step={5}
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  value={milestone.amount || 0}
                                  onChange={(e) => handleMilestoneChange(index, 'amount', parseInt(e.target.value) || 0)}
                                  className="w-20"
                                  min="0"
                                  max="100"
                                />
                                <span className="text-gray-500">%</span>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Amount</Label>
                              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <p className="font-medium">
                                  {formatCurrency((bidData.amount * (milestone.amount || 0)) / 100)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={milestone.description || ''}
                              onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                              placeholder="Describe deliverables and acceptance criteria..."
                              className="mt-1 min-h-[80px]"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleAddMilestone}
                    className="w-full"
                  >
                    + Add Another Milestone
                  </Button>

                  <Separator className="my-4" />

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Milestone Summary
                    </h4>
                    <div className="space-y-2">
                      {bidData.milestones.map((milestone, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>Milestone {index + 1}: {milestone.title || 'Untitled'}</span>
                          <span className="font-medium">
                            {milestone.amount || 0}% ({formatCurrency((bidData.amount * (milestone.amount || 0)) / 100)})
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t border-blue-200 dark:border-blue-800">
                        <span>Total</span>
                        <span>
                          {bidData.milestones.reduce((sum, m) => sum + (m.amount || 0), 0)}%
                          {' '}({formatCurrency(calculateTotalAmount())})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bid Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Bid Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-2xl font-bold">{formatCurrency(calculateTotalAmount())}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Timeline</p>
                        <p className="font-medium">{bidData.timelineValue} {bidData.timelineUnit}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Milestones</p>
                        <p className="font-medium">{bidData.milestones.length} phases</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Payment</p>
                        <p className="font-medium capitalize">{bidData.paymentSchedule.replace('_', ' ')} basis</p>
                      </div>
                    </div>
                  </div>
                  
                  {bidData.escrowRequired && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Payments secured through TechConnect Escrow
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t dark:border-gray-700">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  Next Step
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {isEdit ? 'Update Bid' : 'Submit Bid'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidModal;