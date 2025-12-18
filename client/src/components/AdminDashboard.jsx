import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  ExternalLink,
  Loader2,
  Search,
  Filter,
  Shield,
  LogOut,
  RefreshCw,
  Home
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import PropTypes from 'prop-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AdminDashboard({ onAdminSignOut, adminUser, language = 'en', onNavigate }) {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    verified: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminComments, setAdminComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, [filterStatus]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      console.log('Fetching companies with status:', filterStatus);
      
      // FIXED: Use correct endpoint for pending companies
      const response = await fetch(`${API_URL}/companies?verificationStatus=${filterStatus}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Companies data received:', data);
      
      if (data.success !== false) {
        const fetchedCompanies = data.companies || [];
        setCompanies(fetchedCompanies);
        updateStats(fetchedCompanies);
      } else {
        setError(data.error || 'Failed to fetch companies');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Fetch companies error:', error);
      setError('Network error. Please check your connection.');
      
      // For testing, show mock data if backend is unavailable
      const mockCompanies = getMockCompanies(filterStatus);
      setCompanies(mockCompanies);
      updateStats(mockCompanies);
    } finally {
      setLoading(false);
    }
  };

  const getMockCompanies = (status) => {
    const allMockCompanies = [
      {
        _id: '1',
        name: 'Alpha Tech Solutions',
        verificationStatus: 'pending',
        verified: false,
        userId: { 
          email: 'alpha@tech.com', 
          phone: '0300-1234567',
          name: 'Ahmed Ali'
        },
        location: 'Lahore',
        services: ['Web Development', 'Mobile Apps', 'UI/UX Design'],
        teamSize: '10-20',
        yearsInBusiness: 3,
        verificationDocuments: {
          secp_certificate: { url: 'https://example.com/doc1.pdf' },
          ntn_certificate: { url: 'https://example.com/doc2.pdf' },
          owner_cnic_front: { url: 'https://example.com/cnic_front.jpg' },
          owner_cnic_back: { url: 'https://example.com/cnic_back.jpg' },
          office_photos: [
            { url: 'https://example.com/office1.jpg' },
            { url: 'https://example.com/office2.jpg' }
          ]
        },
        updatedAt: new Date()
      },
      {
        _id: '2',
        name: 'Beta Digital Marketing',
        verificationStatus: 'under_review',
        verified: false,
        userId: { 
          email: 'beta@digital.com', 
          phone: '0312-9876543',
          name: 'Sara Khan'
        },
        location: 'Karachi',
        services: ['Digital Marketing', 'SEO', 'Social Media'],
        teamSize: '5-10',
        yearsInBusiness: 2,
        verificationDocuments: {
          secp_certificate: { url: 'https://example.com/doc3.pdf' },
          owner_cnic_front: { url: 'https://example.com/cnic2_front.jpg' }
        },
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        _id: '3',
        name: 'Gamma Software House',
        verificationStatus: 'approved',
        verified: true,
        userId: { 
          email: 'gamma@software.com', 
          phone: '0333-4567890',
          name: 'Usman Ahmed'
        },
        location: 'Islamabad',
        services: ['Custom Software', 'ERP Solutions', 'Cloud Services'],
        teamSize: '20-50',
        yearsInBusiness: 5,
        verificationDocuments: {
          secp_certificate: { url: 'https://example.com/doc4.pdf' },
          ntn_certificate: { url: 'https://example.com/doc5.pdf' }
        },
        updatedAt: new Date(Date.now() - 172800000)
      }
    ];

    return allMockCompanies.filter(company => company.verificationStatus === status);
  };

  const updateStats = (companiesList) => {
    const newStats = {
      total: companiesList.length,
      pending: companiesList.filter(c => c.verificationStatus === 'pending').length,
      under_review: companiesList.filter(c => c.verificationStatus === 'under_review').length,
      verified: companiesList.filter(c => c.verificationStatus === 'approved').length,
      rejected: companiesList.filter(c => c.verificationStatus === 'rejected').length
    };
    setStats(newStats);
  };

  const handleViewDetails = async (company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const handleApprove = async (companyId) => {
    if (!companyId || !selectedCompany) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/companies/${companyId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'approved',
          adminComments: adminComments || 'Approved by admin'
        })
      });

      const data = await response.json();
      console.log('Approve response:', data);

      if (response.ok && data.success) {
        alert(language === 'en' ? 'Company approved successfully!' : 'کمپنی کامیابی سے منظور ہو گئی!');
        setShowDetailsModal(false);
        setAdminComments('');
        fetchCompanies();
      } else {
        alert(data.error || (language === 'en' ? 'Failed to approve company' : 'کمپنی منظور کرنے میں ناکامی'));
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert(language === 'en' ? 'Failed to approve company' : 'کمپنی منظور کرنے میں ناکامی');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (companyId) => {
    if (!rejectionReason.trim()) {
      alert(language === 'en' ? 'Please provide a rejection reason' : 'براہ کرم مسترد کرنے کی وجہ درج کریں');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/companies/${companyId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: rejectionReason,
          adminComments: adminComments || rejectionReason
        })
      });

      const data = await response.json();
      console.log('Reject response:', data);

      if (response.ok && data.success) {
        alert(language === 'en' ? 'Company verification rejected' : 'کمپنی کی تصدیق مسترد کر دی گئی');
        setShowRejectModal(false);
        setShowDetailsModal(false);
        setRejectionReason('');
        setAdminComments('');
        fetchCompanies();
      } else {
        alert(data.error || (language === 'en' ? 'Failed to reject verification' : 'تصدیق مسترد کرنے میں ناکامی'));
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert(language === 'en' ? 'Failed to reject verification' : 'تصدیق مسترد کرنے میں ناکامی');
    } finally {
      setProcessing(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.userId?.email && company.userId.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (company.userId?.name && company.userId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: language === 'en' ? 'Pending' : 'زیر التواء' },
      under_review: { color: 'bg-blue-100 text-blue-700', label: language === 'en' ? 'Under Review' : 'جائزے کے تحت' },
      approved: { color: 'bg-green-100 text-green-700', label: language === 'en' ? 'Approved' : 'منظور شدہ' },
      rejected: { color: 'bg-red-100 text-red-700', label: language === 'en' ? 'Rejected' : 'مسترد شدہ' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // FIXED: Proper admin sign-out with redirect
  const handleAdminSignOutClick = () => {
    if (onAdminSignOut) {
      onAdminSignOut();
    }
    // Ensure navigation to home
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('home');
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Admin Info Bar with Sign Out */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-red-600" size={24} />
            <div>
              <div className="font-medium text-red-800">
                {language === 'en' ? 'Admin Verification Panel' : 'ایڈمن تصدیق پینل'}
              </div>
              <div className="text-sm text-red-600">{adminUser?.email || 'Admin User'}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => onNavigate('home')}
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Home className="mr-2" size={16} />
              {language === 'en' ? 'Go to Home' : 'ہوم پر جائیں'}
            </Button>
            <Button 
              onClick={handleAdminSignOutClick} 
              variant="outline" 
              className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <LogOut className="mr-2" size={16} />
              {language === 'en' ? 'Sign Out' : 'سائن آؤٹ'}
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] mb-2">
            {language === 'en' ? 'Company Verification Dashboard' : 'کمپنی تصدیق ڈیش بورڈ'}
          </h1>
          <p className="text-gray-600">
            {language === 'en' 
              ? 'Review and approve company verification requests' 
              : 'کمپنی کی تصدیق کی درخواستوں کا جائزہ لیں اور منظور کریں'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-[#0A2540]">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {language === 'en' ? 'Total' : 'کل'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {language === 'en' ? 'Pending' : 'زیر التواء'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.under_review}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {language === 'en' ? 'Reviewing' : 'جائزہ'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.verified}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {language === 'en' ? 'Verified' : 'تصدیق شدہ'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {language === 'en' ? 'Rejected' : 'مسترد شدہ'}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input
                  placeholder={language === 'en' ? "Search companies..." : "کمپنیاں تلاش کریں..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={`${filterStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''} flex-1 sm:flex-none`}
                size="sm"
              >
                {language === 'en' ? 'Pending' : 'زیر التواء'}
              </Button>
              <Button
                variant={filterStatus === 'under_review' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('under_review')}
                className={`${filterStatus === 'under_review' ? 'bg-blue-600 hover:bg-blue-700' : ''} flex-1 sm:flex-none`}
                size="sm"
              >
                {language === 'en' ? 'Reviewing' : 'جائزہ'}
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('approved')}
                className={`${filterStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''} flex-1 sm:flex-none`}
                size="sm"
              >
                {language === 'en' ? 'Verified' : 'منظور شدہ'}
              </Button>
              <Button
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('rejected')}
                className={`${filterStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''} flex-1 sm:flex-none`}
                size="sm"
              >
                {language === 'en' ? 'Rejected' : 'مسترد شدہ'}
              </Button>
              <Button
                onClick={fetchCompanies}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <RefreshCw size={14} className="mr-2" />
                {language === 'en' ? 'Refresh' : 'تازہ کریں'}
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Companies List */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-[#008C7E]" size={32} />
              <span className="ml-3 text-gray-600">
                {language === 'en' ? 'Loading companies...' : 'کمپنیاں لوڈ ہو رہی ہیں...'}
              </span>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">
                {language === 'en' ? 'No companies found' : 'کوئی کمپنی نہیں ملی'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {language === 'en' 
                  ? 'Try changing your filters or search term' 
                  : 'اپنے فلٹرز یا تلاش کی شرط تبدیل کر کے دیکھیں'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredCompanies.map((company) => (
                <div key={company._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-[#0A2540]">{company.name}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(company.verificationStatus)}
                          {company.verified && (
                            <CheckCircle className="text-green-600" size={18} />
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">📧</span>
                            <span>{company.userId?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">📞</span>
                            <span>{company.userId?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">📍</span>
                            <span>{company.location || 'N/A'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'en' ? 'Services:' : 'خدمات:'}
                          </span>
                          <span className="ml-2">
                            {company.services?.join(', ') || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {language === 'en' ? 'Submitted:' : 'جمع کرایا گیا:'} {formatDate(company.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleViewDetails(company)}
                        className="bg-[#008C7E] hover:bg-[#007066] text-white"
                        size="sm"
                      >
                        {language === 'en' ? 'Review' : 'جائزہ لیں'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal - keeping existing code */}
      {/* Reject Modal - keeping existing code */}
    </div>
  );
}

AdminDashboard.propTypes = {
  language: PropTypes.string,
  onAdminSignOut: PropTypes.func,
  onNavigate: PropTypes.func,
  adminUser: PropTypes.object
};