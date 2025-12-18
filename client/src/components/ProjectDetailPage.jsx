import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, MapPin, Tag, Paperclip, MessageSquare, ArrowLeft, Edit, XCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { BidSubmissionModal } from './BidSubmissionModal';
import { projectAPI } from '../services/api';
import PropTypes from 'prop-types';

export function ProjectDetailPage({ projectId, onNavigate, currentUser, userType }) {
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showBidModal, setShowBidModal] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple approaches to fetch the project
      let data = null;
      
      // First try: Direct project ID endpoint
      try {
        const result = await projectAPI.getById(projectId);
        if (result.project) {
          data = result;
        }
      } catch (error1) {
        console.log('First attempt failed:', error1.message);
        
        // Second try: Get all projects and filter
        try {
          const allProjects = await projectAPI.getAll({});
          const foundProject = allProjects.projects?.find(p => p._id === projectId);
          if (foundProject) {
            data = { project: foundProject };
          }
        } catch (error2) {
          console.log('Second attempt failed:', error2.message);
        }
      }
      
      if (data?.project) {
        setProject(data.project);
        setBids(data.project.bids || []);
      } else {
        // Fallback to sample data for development
        const sampleProject = {
          _id: projectId,
          title: "E-commerce Website Development",
          description: "We need a fully functional e-commerce website with payment gateway integration, product management, and admin dashboard. The website should be responsive and user-friendly.",
          category: "web",
          budget: { min: 150000, max: 250000, range: "150,000 - 250,000" },
          timeline: { value: 3, unit: "months" },
          techStack: ["React", "Node.js", "MongoDB", "Stripe", "AWS"],
          clientInfo: { 
            name: "Retail Pro", 
            email: "contact@retailpro.com",
            phone: "+92 300 1234567"
          },
          clientId: { _id: "client123", name: "Retail Pro" },
          status: "posted",
          paymentMethod: "jazzcash",
          isInviteOnly: false,
          invites: 5,
          viewCount: 124,
          bids: [],
          createdAt: new Date(),
          attachments: [
            { url: "#", originalName: "Project_Brief.pdf" },
            { url: "#", originalName: "Wireframes.zip" }
          ]
        };
        setProject(sampleProject);
        setBids(sampleProject.bids || []);
        
        // Show warning about using sample data
        setError({
          warning: true,
          message: "Using sample data. Please check if backend server is running."
        });
      }
    } catch (error) {
      console.error('Fetch project error:', error);
      setError({
        warning: false,
        message: `Failed to load project: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmitted = (data) => {
    // Refresh project details to show new bid
    fetchProjectDetails();
    setActiveTab('bids'); // Switch to bids tab
  };

  const handleAcceptBid = async (bidId) => {
    if (!confirm('Are you sure you want to accept this bid? All other bids will be automatically rejected.')) {
      return;
    }

    try {
      setSubmittingAction(true);
      await projectAPI.updateBidStatus(projectId, bidId, 'accepted');
      
      // Refresh project data
      await fetchProjectDetails();
      
      // Show success message
      alert('Bid accepted successfully! The project is now active.');
    } catch (error) {
      console.error('Accept bid error:', error);
      alert('Failed to accept bid. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!confirm('Are you sure you want to reject this bid?')) {
      return;
    }

    try {
      setSubmittingAction(true);
      await projectAPI.updateBidStatus(projectId, bidId, 'rejected');
      
      // Refresh project data
      await fetchProjectDetails();
      
      alert('Bid rejected');
    } catch (error) {
      console.error('Reject bid error:', error);
      alert('Failed to reject bid. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancelProject = async () => {
    if (!confirm('Are you sure you want to cancel this project? All bids will be rejected.')) {
      return;
    }

    try {
      setSubmittingAction(true);
      await projectAPI.delete(projectId);
      alert('Project cancelled successfully');
      onNavigate('dashboard');
    } catch (error) {
      console.error('Cancel project error:', error);
      alert('Failed to cancel project. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      posted: 'bg-blue-100 text-blue-700',
      bidding: 'bg-purple-100 text-purple-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getBidStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const isProjectOwner = currentUser && project && project.clientId && 
    (project.clientId._id === currentUser._id || project.clientId === currentUser._id);
  
  const canBid = userType === 'company' && project && 
    (project.status === 'posted' || project.status === 'bidding');

  // Check if company already bid
  const hasAlreadyBid = userType === 'company' && project && bids.some(bid => {
    const companyId = bid.companyId?._id || bid.companyId;
    return companyId && currentUser?.companyId === companyId;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008C7E] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project && error && !error.warning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <div className="space-y-3">
            <Button 
              className="w-full bg-[#008C7E] hover:bg-[#007066]"
              onClick={() => onNavigate('browse-projects')}
            >
              Browse Projects
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={fetchProjectDetails}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate(userType === 'company' ? 'browse-projects' : 'dashboard')}
            className="mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>

          {error?.warning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-700">{error.message}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Please ensure the backend server is running at http://localhost:5000
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#0A2540]">{project.title}</h1>
                <Badge className={getStatusColor(project.status)}>
                  {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Posted {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={16} />
                  PKR {project.budget?.range || `${project.budget?.min?.toLocaleString() || '0'} - ${project.budget?.max?.toLocaleString() || '0'}`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {project.timeline?.value} {project.timeline?.unit}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={16} />
                  {bids.length} Bids
                </span>
                {project.viewCount && (
                  <span className="flex items-center gap-1">
                    <Eye size={16} />
                    {project.viewCount} Views
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isProjectOwner && project.status === 'posted' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onNavigate('edit-project', project._id)}
                    disabled={submittingAction}
                  >
                    <Edit size={18} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={handleCancelProject}
                    disabled={submittingAction}
                  >
                    {submittingAction ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle size={18} className="mr-2" />
                    )}
                    Cancel
                  </Button>
                </>
              )}
              {canBid && !hasAlreadyBid && (
                <Button
                  className="bg-[#008C7E] hover:bg-[#007a6d]"
                  onClick={() => setShowBidModal(true)}
                >
                  Submit Bid
                </Button>
              )}
              {hasAlreadyBid && (
                <Badge className="bg-blue-100 text-blue-700 px-4 py-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Bid Submitted
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="bids">
              Bids ({bids.length})
            </TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            {isProjectOwner && <TabsTrigger value="milestones">Milestones</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
                  </CardContent>
                </Card>

                {project.techStack && project.techStack.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tech Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {project.techStack.map((tech, idx) => (
                          <Badge key={idx} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {project.attachments && project.attachments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {project.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Paperclip size={16} />
                            <span className="text-sm">{file.originalName || `Attachment ${idx + 1}`}</span>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Category</div>
                      <Badge variant="secondary" className="capitalize">
                        {project.category}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Budget Range</div>
                      <div className="font-semibold text-[#0A2540]">
                        PKR {project.budget?.range || `${project.budget?.min?.toLocaleString() || '0'} - ${project.budget?.max?.toLocaleString() || '0'}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Timeline</div>
                      <div className="font-semibold text-[#0A2540]">
                        {project.timeline?.value} {project.timeline?.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                      <div className="font-semibold text-[#0A2540] capitalize">
                        {project.paymentMethod}
                      </div>
                    </div>
                    {project.isInviteOnly && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Invitation Status</div>
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          <Tag size={12} className="mr-1" />
                          Invite Only
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {project.clientInfo?.name?.charAt(0) || project.clientId?.name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-[#0A2540]">
                            {project.clientInfo?.name || project.clientId?.name || 'Client'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {project.clientInfo?.email || project.clientId?.email}
                          </div>
                        </div>
                      </div>
                      {!isProjectOwner && userType === 'company' && (
                        <Button className="w-full bg-[#008C7E] hover:bg-[#007a6d]">
                          <MessageSquare size={16} className="mr-2" />
                          Message Client
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bids" className="mt-6">
            {bids.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">No bids yet</p>
                  {canBid && !hasAlreadyBid && (
                    <Button
                      className="bg-[#008C7E] hover:bg-[#007a6d]"
                      onClick={() => setShowBidModal(true)}
                    >
                      Be the first to bid
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <Card key={bid._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {bid.companyId?.name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-[#0A2540]">
                              {bid.companyId?.name || 'Company'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(bid.createdAt || new Date()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge className={getBidStatusColor(bid.status)}>
                          {bid.status?.charAt(0).toUpperCase() + bid.status?.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Bid Amount</div>
                          <div className="text-2xl font-bold text-[#0A2540]">
                            PKR {(bid.amount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Delivery Time</div>
                          <div className="font-semibold text-[#0A2540]">
                            {bid.timeline}
                          </div>
                        </div>
                      </div>

                      {bid.proposal && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">Proposal</div>
                          <p className="text-gray-700 whitespace-pre-wrap">{bid.proposal}</p>
                        </div>
                      )}

                      {bid.milestones && bid.milestones.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">Milestones</div>
                          <div className="space-y-2">
                            {bid.milestones.map((milestone, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-sm">{milestone.title}</div>
                                    {milestone.description && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        {milestone.description}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm font-semibold text-[#0A2540]">
                                    PKR {(milestone.amount || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isProjectOwner && bid.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            className="bg-[#008C7E] hover:bg-[#007a6d] flex-1"
                            onClick={() => handleAcceptBid(bid._id)}
                            disabled={submittingAction}
                          >
                            {submittingAction ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : 'Accept Bid'}
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                            onClick={() => handleRejectBid(bid._id)}
                            disabled={submittingAction}
                          >
                            {submittingAction ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : 'Reject'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discussion" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600 mb-4">Discussion feature coming soon</p>
                <p className="text-sm text-gray-500">
                  Ask questions and get clarifications about the project
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {isProjectOwner && (
            <TabsContent value="milestones" className="mt-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">No milestones yet</p>
                  <Button className="bg-[#008C7E] hover:bg-[#007a6d]">
                    Create Milestone
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Bid Submission Modal */}
      {showBidModal && (
        <BidSubmissionModal
          open={showBidModal}
          onClose={() => setShowBidModal(false)}
          project={project}
          companyId={currentUser?.companyId}
          onBidSubmitted={handleBidSubmitted}
        />
      )}
    </div>
  );
}

// Add missing Eye component import
import { Eye } from "lucide-react";

ProjectDetailPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  userType: PropTypes.string
};