import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import PropTypes from 'prop-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function CompanyVerificationForm({ companyId, onSuccess }) {
  const [documents, setDocuments] = useState({
    secp_certificate: null,
    ntn_certificate: null,
    incorporation_certificate: null,
    owner_cnic_front: null,
    owner_cnic_back: null,
    owner_photo: null,
    utility_bill: null,
    office_photos: []
  });
  
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requiredDocs = [
    { key: 'secp_certificate', label: 'SECP Certificate', required: true },
    { key: 'ntn_certificate', label: 'NTN Certificate', required: true },
    { key: 'incorporation_certificate', label: 'Incorporation Certificate', required: false },
    { key: 'owner_cnic_front', label: 'Owner CNIC (Front)', required: true },
    { key: 'owner_cnic_back', label: 'Owner CNIC (Back)', required: true },
    { key: 'owner_photo', label: 'Owner Photo', required: false },
    { key: 'utility_bill', label: 'Office Utility Bill', required: false },
    { key: 'office_photos', label: 'Office Photos', required: false, multiple: true }
  ];

  const handleDocumentUpload = (docKey, multiple = false) => (files) => {
    if (multiple) {
      setDocuments(prev => ({
        ...prev,
        [docKey]: files.map(file => ({
          url: file.url,
          publicId: file.publicId,
          uploadedAt: new Date()
        }))
      }));
    } else {
      setDocuments(prev => ({
        ...prev,
        [docKey]: {
          url: files[0].url,
          publicId: files[0].publicId,
          uploadedAt: new Date()
        }
      }));
    }
    setUploading(prev => ({ ...prev, [docKey]: false }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validate required documents
    const missingRequired = requiredDocs
      .filter(doc => doc.required && !documents[doc.key])
      .map(doc => doc.label);

    if (missingRequired.length > 0) {
      setError(`Missing required documents: ${missingRequired.join(', ')}`);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit verification');
      }

      const data = await response.json();
      setSuccess(data.message);
      
      if (onSuccess) {
        onSuccess(data.company);
      }
    } catch (err) {
      console.error('Submit verification error:', err);
      setError(err.message || 'Failed to submit verification request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Verification Requirements</h3>
        <p className="text-sm text-blue-800">
          Upload the following documents to get your company verified. All required documents must be clear, valid, and readable.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Document Upload Sections */}
      <div className="space-y-6">
        {/* Business Registration Section */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="text-[#008C7E]" size={20} />
            Business Registration Documents
          </h4>
          
          <div className="space-y-4">
            {requiredDocs.slice(0, 3).map(doc => (
              <div key={doc.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm">
                    {doc.label}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {documents[doc.key] && (
                    <CheckCircle className="text-green-600" size={16} />
                  )}
                </div>
                <FileUpload
                  type="document"
                  label={`Upload ${doc.label}`}
                  onUploadComplete={handleDocumentUpload(doc.key)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Identity Verification Section */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="text-[#008C7E]" size={20} />
            Identity Verification
          </h4>
          
          <div className="space-y-4">
            {requiredDocs.slice(3, 6).map(doc => (
              <div key={doc.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm">
                    {doc.label}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {documents[doc.key] && (
                    <CheckCircle className="text-green-600" size={16} />
                  )}
                </div>
                <FileUpload
                  type={doc.key === 'owner_photo' ? 'image' : 'document'}
                  label={`Upload ${doc.label}`}
                  onUploadComplete={handleDocumentUpload(doc.key)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Office Verification Section */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="text-[#008C7E]" size={20} />
            Office Verification (Optional)
          </h4>
          
          <div className="space-y-4">
            {requiredDocs.slice(6).map(doc => (
              <div key={doc.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm">
                    {doc.label}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {documents[doc.key] && (doc.multiple ? documents[doc.key].length > 0 : true) && (
                    <CheckCircle className="text-green-600" size={16} />
                  )}
                </div>
                <FileUpload
                  type={doc.multiple ? 'portfolio' : 'document'}
                  multiple={doc.multiple}
                  maxFiles={5}
                  label={`Upload ${doc.label}`}
                  onUploadComplete={handleDocumentUpload(doc.key, doc.multiple)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#008C7E] hover:bg-[#007066] text-white px-8"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit for Verification'
          )}
        </Button>
      </div>

      {/* Info Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Verification typically takes 3-5 business days. You'll receive an email once your documents have been reviewed.
        </p>
      </div>
    </div>
  );
}

CompanyVerificationForm.propTypes = {
  companyId: PropTypes.string,
  onSuccess: PropTypes.func
};