import React, { useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown, 
  ChevronUp,
  FileText,
  Users,
  Award,
  Star,
  Shield,
  Eye,
  MessageSquare,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { useToast } from 'C:\\Users\\user\\Desktop\\Web_Engineering_Semester_Project\\client\\src\\contexts\\ToastContext.jsx';
import { bidAPI } from '../services/api';

const BidCard = ({ 
  bid, 
  project, 
  company,
  isClientView = false,
  isCompanyView = false,
  onStatusChange,
  onViewDetails,
  onSendMessage,
  onCompare,
  className = ''
}) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return 'just now';
  };

  // Get status badge color
  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Pending Review'
      },
      submitted: { 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: <Clock className="h-4 w-4" />,
        text: 'Submitted'
      },
      under_review: { 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        icon: <Eye className="h-4 w-4" />,
        text: 'Under Review'
      },
      accepted: { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Accepted'
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: <XCircle className="h-4 w-4" />,
        text: 'Rejected'
      },
      withdrawn: { 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        icon: <XCircle className="h-4 w-4" />,
        text: 'Withdrawn'
      },
      expired: { 
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        icon: <Clock className="h-4 w-4" />,
        text: 'Expired'
      }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(bid.status);

  // Handle bid acceptance
  const handleAcceptBid = async () => {
    if (!confirm('Are you sure you want to accept this bid?')) return;
    
    setIsAccepting(true);
    try {
      await bidAPI.accept(project._id, bid._id);
      toast({
        title: 'Bid Accepted',
        description: 'The bid has been accepted successfully',
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Failed to Accept Bid',
        description: error.response?.data?.error || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle bid rejection
  const handleRejectBid = async () => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    setIsRejecting(true);
    try {
      await bidAPI.reject(project._id, bid._id, { reason });
      toast({
        title: 'Bid Rejected',
        description: 'The bid has been rejected',
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Failed to Reject Bid',
        description: error.response?.data?.error || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle bid withdrawal
  const handleWithdrawBid = async () => {
    if (!confirm('Are you sure you want to withdraw this bid?')) return;
    
    setIsWithdrawing(true);
    try {
      await bidAPI.withdrawBid(project._id, bid._id);
      toast({
        title: 'Bid Withdrawn',
        description: 'Your bid has been withdrawn successfully',
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Failed to Withdraw Bid',
        description: error.response?.data?.error || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Calculate bid score (for comparison)
  const calculateBidScore = () => {
    let score = 100;
    
    // Price competitiveness (lower is better, but not too low)
    const avgBudget = (project.budget?.min + project.budget?.max) / 2;
    const priceRatio = bid.amount / avgBudget;
    
    if (priceRatio < 0.7) score -= 20; // Too low - suspicious
    else if (priceRatio < 0.9) score += 30; // Good discount
    else if (priceRatio <= 1.1) score += 10; // Average
    else if (priceRatio > 1.3) score -= 30; // Too high
    
    // Company rating
    if (company?.ratings?.average) {
      score += company.ratings.average * 15;
    }
    
    // Proposal length
    const proposalLength = bid.proposal?.length || 0;
    if (proposalLength > 500) score += 20;
    else if (proposalLength > 200) score += 10;
    
    // Experience (years in business)
    if (company?.yearsInBusiness > 5) score += 25;
    else if (company?.yearsInBusiness > 2) score += 10;
    
    // Team size
    if (company?.teamSize === '10+') score += 15;
    else if (company?.teamSize === '5-10') score += 10;
    
    return Math.max(0, Math.min(200, score));
  };

  const bidScore = calculateBidScore();

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={company?.logo} />
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {company?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {company?.name || 'Company'}
                {company?.verified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {company?.ratings?.average?.toFixed(1) || 'N/A'}
                  <span className="text-gray-500">({company?.ratings?.count || 0})</span>
                </span>
                •
                <span>{company?.location || 'Location not specified'}</span>
                •
                <span>{company?.yearsInBusiness || 0}+ years</span>
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={`${statusConfig.color} gap-1`}>
              {statusConfig.icon}
              {statusConfig.text}
            </Badge>
            
            {bid.isInvited && (
              <Badge variant="outline" className="text-xs">
                Invited
              </Badge>
            )}
            
            {bid.shortlisted && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                <Star className="h-3 w-3 mr-1" />
                Shortlisted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {/* Bid Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Amount
            </p>
            <p className="text-xl font-bold">{formatCurrency(bid.amount)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Timeline
            </p>
            <p className="font-medium">
              {bid.proposedTimeline?.value || bid.timelineValue || 'N/A'} {bid.proposedTimeline?.unit || bid.timelineUnit || 'weeks'}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Milestones
            </p>
            <p className="font-medium">{bid.milestones?.length || 0} phases</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Submitted
            </p>
            <p className="font-medium">{timeAgo(bid.createdAt)}</p>
          </div>
        </div>
        
        {/* Bid Score & Comparison */}
        {isClientView && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Bid Score</span>
              <span className="text-lg font-bold">
                {bidScore}/200
              </span>
            </div>
            <Progress value={(bidScore / 200) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>Average</span>
              <span>Excellent</span>
            </div>
          </div>
        )}
        
        {/* Executive Summary Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Proposal Summary</p>
          <p className="text-sm line-clamp-2">
            {bid.executiveSummary || bid.proposal?.substring(0, 200) || 'No summary provided...'}
          </p>
        </div>
        
        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 space-y-4">
            <Separator />
            
            {/* Detailed Proposal */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Detailed Proposal
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {bid.proposal || 'No detailed proposal provided.'}
              </p>
            </div>
            
            {/* Technology Stack */}
            {bid.techStack && bid.techStack.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Technology Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {bid.techStack.map((tech, index) => (
                    <Badge key={index} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Milestones Preview */}
            {bid.milestones && bid.milestones.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Payment Milestones</h4>
                <div className="space-y-2">
                  {bid.milestones.slice(0, 3).map((milestone, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="font-medium text-sm">{milestone.title}</p>
                        {milestone.description && (
                          <p className="text-xs text-gray-500">{milestone.description}</p>
                        )}
                      </div>
                      <span className="font-bold">
                        {milestone.amount}%
                      </span>
                    </div>
                  ))}
                  {bid.milestones.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{bid.milestones.length - 3} more milestones
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Team Structure Preview */}
            {bid.teamStructure && bid.teamStructure.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Structure
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {bid.teamStructure.map((member, index) => (
                    <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="font-medium text-sm">{member.role}</p>
                      <p className="text-xs text-gray-500">{member.experience} • {member.hoursAllocated} hours</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              View Details
            </>
          )}
        </Button>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex flex-wrap gap-2 w-full">
          {/* Client Actions */}
          {isClientView && ['pending', 'submitted', 'under_review'].includes(bid.status) && (
            <>
              <Button 
                onClick={handleAcceptBid}
                disabled={isAccepting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isAccepting ? 'Accepting...' : 'Accept Bid'}
              </Button>
              
              <Button 
                onClick={handleRejectBid}
                variant="outline"
                disabled={isRejecting}
                className="flex-1"
              >
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </Button>
              
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => onSendMessage?.(bid.company._id)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              {onCompare && (
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => onCompare(bid)}
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          
          {/* Company Actions */}
          {isCompanyView && ['pending', 'submitted', 'under_review'].includes(bid.status) && (
            <>
              <Button 
                onClick={() => onViewDetails?.(bid)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              
              <Button 
                onClick={handleWithdrawBid}
                variant="outline"
                disabled={isWithdrawing}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Bid'}
              </Button>
              
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => onSendMessage?.(project.clientId)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* View Only Actions */}
          {!isClientView && !isCompanyView && (
            <Button 
              onClick={() => onViewDetails?.(bid)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Bid Details
            </Button>
          )}
          
          {/* Accepted/Rejected States */}
          {bid.status === 'accepted' && (
            <Badge className="w-full justify-center bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepted {timeAgo(bid.updatedAt)}
            </Badge>
          )}
          
          {bid.status === 'rejected' && (
            <Badge className="w-full justify-center bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              <XCircle className="h-4 w-4 mr-2" />
              Rejected {timeAgo(bid.updatedAt)}
            </Badge>
          )}
          
          {bid.status === 'withdrawn' && (
            <Badge className="w-full justify-center bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
              <TrendingDown className="h-4 w-4 mr-2" />
              Withdrawn {timeAgo(bid.updatedAt)}
            </Badge>
          )}
          
          {bid.status === 'expired' && (
            <Badge className="w-full justify-center bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              <Clock className="h-4 w-4 mr-2" />
              Expired {timeAgo(bid.expiresAt)}
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BidCard;