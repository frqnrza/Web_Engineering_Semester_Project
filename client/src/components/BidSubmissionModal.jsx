import { useState, useEffect } from 'react';
import { X, Paperclip, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import PropTypes from 'prop-types';

export function BidSubmissionModal({ open, onClose, project, onBidSubmitted }) {
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryUnit, setDeliveryUnit] = useState('weeks');
  const [proposal, setProposal] = useState('');
  const [milestones, setMilestones] = useState([
    { title: '', amount: '', description: '' }
  ]);
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Get current user on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
  }, [open]);

  const validateForm = () => {
    const newErrors = {};
    setSubmitError('');

    // Check if user is a company
    if (!currentUser || currentUser.type !== 'company') {
      newErrors.general = 'Only company accounts can submit bids';
    }

    // Check if user has a company profile
    if (!currentUser?.companyId) {
      newErrors.general = 'Please complete your company profile before submitting bids';
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      newErrors.bidAmount = 'Please enter a valid bid amount';
    }

    const projectMin = project.budget?.min || 0;
    const projectMax = project.budget?.max || Infinity;
    if (projectMin && parseFloat(bidAmount) < projectMin) {
      newErrors.bidAmount = `Bid amount should be at least PKR ${projectMin.toLocaleString()}`;
    }
    if (projectMax && parseFloat(bidAmount) > projectMax) {
      newErrors.bidAmount = `Bid amount should not exceed PKR ${projectMax.toLocaleString()}`;
    }

    if (!deliveryTime || parseInt(deliveryTime) <= 0) {
      newErrors.deliveryTime = 'Please enter a valid delivery time';
    }

    if (!proposal || proposal.trim().length < 100) {
      newErrors.proposal = 'Proposal must be at least 100 characters';
    }

    const milestonesTotal = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    if (milestones.length > 0 && milestonesTotal !== parseFloat(bidAmount)) {
      newErrors.milestones = `Milestones total (PKR ${milestonesTotal.toLocaleString()}) must equal bid amount (PKR ${bidAmount})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('authToken');
      
      // Prepare bid data according to backend expectations
      const bidData = {
        amount: parseFloat(bidAmount),
        timeline: `${deliveryTime} ${deliveryUnit}`,
        proposal: proposal.trim(),
        milestones: milestones
          .filter(m => m.title && m.amount)
          .map(m => ({
            title: m.title,
            amount: parseFloat(m.amount),
            description: m.description || ''
          })),
        attachments: attachments.map(file => ({
          url: file.url,
          publicId: file.publicId,
          originalName: file.name,
          size: file.size
        })),
        status: 'pending'
      };

      console.log('Submitting bid:', { projectId: project._id, bidData });

      const response = await fetch(`http://localhost:5000/api/projects/${project._id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bidData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit bid');
      }

      alert('✅ Bid submitted successfully!');
      
      // Call the callback with the submitted bid data
      if (onBidSubmitted) {
        onBidSubmitted(responseData);
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Submit bid error:', error);
      setSubmitError(error.message || 'Failed to submit bid. Please try again.');
      alert(`❌ ${error.message || 'Failed to submit bid. Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', amount: '', description: '' }]);
  };

  const removeMilestone = (index) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      files.forEach(file => {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 10MB limit`);
        }
        formData.append('files', file);
      });

      // Upload files to backend
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      const uploadedFiles = await response.json();
      
      // Add uploaded files to attachments
      const newAttachments = uploadedFiles.map(file => ({
        name: file.originalName,
        size: file.size,
        url: file.url,
        publicId: file.publicId
      }));

      setAttachments([...attachments, ...newAttachments]);
      
    } catch (error) {
      console.error('File upload error:', error);
      alert(`File upload failed: ${error.message}`);
      
      // Fallback to mock files for development
      const mockFiles = files.map(file => ({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        publicId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      setAttachments([...attachments, ...mockFiles]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setBidAmount('');
    setDeliveryTime('');
    setDeliveryUnit('weeks');
    setProposal('');
    setMilestones([{ title: '', amount: '', description: '' }]);
    setAttachments([]);
    setErrors({});
    setSubmitError('');
  };

  // Calculate milestones total
  const milestonesTotal = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  // Check if user can bid
  const canBid = currentUser?.type === 'company' && currentUser?.companyId;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
      }
      onClose();
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="bid-submission-description">
        <DialogHeader>
          <DialogTitle>Submit Your Bid</DialogTitle>
          <DialogDescription id="bid-submission-description">
            Submit a competitive bid for "{project.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Alert */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* General Errors */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* User Info Banner */}
          {currentUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Submitting bid as: <span className="font-semibold">{currentUser.name}</span>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {currentUser.type === 'company' ? 'Company Account' : 'Client Account'}
                    {!canBid && ' - Cannot submit bids'}
                  </p>
                </div>
                {!canBid && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-blue-700 border-blue-300"
                  >
                    Switch Account
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Project Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-[#0A2540] mb-2">Project Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Budget Range:</span>
                <p className="font-medium">PKR {project.budget?.range || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <p className="font-medium capitalize">{project.category || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Bid Amount & Delivery Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bidAmount">
                Bid Amount (PKR) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bidAmount"
                type="number"
                min="0"
                step="1000"
                placeholder="Enter your bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className={errors.bidAmount ? 'border-red-500' : ''}
                disabled={!canBid}
              />
              {errors.bidAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.bidAmount}</p>
              )}
              {project.budget && (
                <p className="text-sm text-gray-500 mt-1">
                  Project budget: PKR {project.budget.range}
                  {project.budget.min && project.budget.max && (
                    <span> (Min: PKR {project.budget.min.toLocaleString()}, Max: PKR {project.budget.max.toLocaleString()})</span>
                  )}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deliveryTime">
                Delivery Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="deliveryTime"
                  type="number"
                  min="1"
                  placeholder="Duration"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className={`flex-1 ${errors.deliveryTime ? 'border-red-500' : ''}`}
                  disabled={!canBid}
                />
                <Select value={deliveryUnit} onValueChange={setDeliveryUnit} disabled={!canBid}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.deliveryTime && (
                <p className="text-red-500 text-sm mt-1">{errors.deliveryTime}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Estimated completion time
              </p>
            </div>
          </div>

          {/* Proposal */}
          <div>
            <Label htmlFor="proposal">
              Your Proposal <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="proposal"
              placeholder="Explain your approach, relevant experience, and why you're the best fit for this project..."
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className={`min-h-40 ${errors.proposal ? 'border-red-500' : ''}`}
              maxLength={2000}
              disabled={!canBid}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.proposal ? (
                <p className="text-red-500 text-sm">{errors.proposal}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    {proposal.length}/2000 characters
                  </p>
                  <p className={`text-xs ${proposal.length < 100 ? 'text-red-500' : 'text-green-600'}`}>
                    Min 100 characters {proposal.length >= 100 ? '✓' : ''}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label>Milestones (Optional)</Label>
                <p className="text-xs text-gray-500">Break down your project into milestones with payments</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestone}
                disabled={!canBid}
              >
                <Plus size={16} className="mr-2" />
                Add Milestone
              </Button>
            </div>

            {errors.milestones && (
              <p className="text-red-500 text-sm mb-3">{errors.milestones}</p>
            )}

            {/* Milestones Total */}
            {milestones.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Milestones Total:</span>
                  <span className={`font-semibold ${Math.abs(milestonesTotal - parseFloat(bidAmount || 0)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    PKR {milestonesTotal.toLocaleString()}
                    {Math.abs(milestonesTotal - parseFloat(bidAmount || 0)) < 0.01 ? ' ✓' : ' (Does not match bid amount)'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 grid md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Title *</Label>
                        <Input
                          placeholder="e.g., Design Phase"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          disabled={!canBid}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Amount (PKR) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Amount"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                          disabled={!canBid}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Due (Days)</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Days"
                          disabled={!canBid}
                        />
                      </div>
                    </div>
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                        className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={!canBid}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Description (Optional)</Label>
                    <Input
                      placeholder="Describe what will be delivered in this milestone..."
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      disabled={!canBid}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <Label>Attachments (Optional)</Label>
            <p className="text-sm text-gray-500 mb-2">
              Upload relevant documents, portfolio samples, or references (Max 10MB each)
            </p>
            
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              canBid ? 'border-gray-300 hover:border-gray-400' : 'border-gray-200 bg-gray-50'
            }`}>
              <input
                type="file"
                id="bid-attachments"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                disabled={!canBid}
              />
              <label
                htmlFor="bid-attachments"
                className={`cursor-pointer flex flex-col items-center ${!canBid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Paperclip size={32} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {canBid ? 'Click to upload or drag and drop' : 'Bid submission disabled'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPG, PNG
                </span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} className="text-gray-400" />
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!canBid}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canBid}
              className="bg-[#008C7E] hover:bg-[#007a6d] flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : !canBid ? (
                'Cannot Submit Bid'
              ) : (
                'Submit Bid'
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 text-center">
            <p>Once submitted, your bid will be visible to the client and cannot be edited.</p>
            <p>You can withdraw your bid before the client accepts it.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

BidSubmissionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
  onBidSubmitted: PropTypes.func.isRequired
  // companyId is removed as we get it from currentUser
};