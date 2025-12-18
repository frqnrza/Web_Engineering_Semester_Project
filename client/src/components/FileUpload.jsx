import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import PropTypes from 'prop-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function FileUpload({ 
  type = 'document', // 'document', 'image', 'portfolio'
  multiple = false,
  maxFiles = 10,
  onUploadComplete,
  accept,
  label = 'Upload File'
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const acceptTypes = {
    document: '.jpg,.jpeg,.png,.pdf,.doc,.docx',
    image: '.jpg,.jpeg,.png,.gif,.webp',
    portfolio: '.jpg,.jpeg,.png,.gif,.webp'
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (multiple && selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    setError('');
    setFiles(selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
      url: null
    })));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select file(s) to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();

      if (multiple) {
        files.forEach(({ file }) => {
          formData.append('files', file);
        });
      } else {
        formData.append('file', files[0].file);
      }

      const endpoint = multiple 
        ? `${API_URL}/upload/${type === 'portfolio' ? 'portfolio' : 'documents'}`
        : `${API_URL}/upload/${type}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update files with uploaded URLs
      const uploadedFiles = multiple ? data.files : [data.file];
      setFiles(prevFiles => prevFiles.map((f, i) => ({
        ...f,
        uploaded: true,
        url: uploadedFiles[i]?.url,
        publicId: uploadedFiles[i]?.publicId
      })));

      // Call callback with uploaded files
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleClear = () => {
    setFiles([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#008C7E] transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || acceptTypes[type]}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            {type === 'image' || type === 'portfolio' ? (
              <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
            )}
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-xs text-gray-500">
              {type === 'document' && 'PDF, DOC, DOCX, JPG, PNG (max 10MB)'}
              {type === 'image' && 'JPG, PNG, GIF, WEBP (max 5MB)'}
              {type === 'portfolio' && 'JPG, PNG, GIF, WEBP (max 5MB)'}
            </p>
            {multiple && (
              <p className="text-xs text-gray-500 mt-1">
                Select up to {maxFiles} files
              </p>
            )}
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-700">
              Selected Files ({files.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((fileData, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* Preview */}
                {(type === 'image' || type === 'portfolio') ? (
                  <img
                    src={fileData.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <File className="w-12 h-12 text-gray-400" />
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Status */}
                {fileData.uploaded ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <button
                    onClick={() => handleRemove(index)}
                    disabled={uploading}
                    className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {!files.every(f => f.uploaded) && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-[#008C7E] hover:bg-[#007066] text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length} File{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

FileUpload.propTypes = {
  type: PropTypes.oneOf(['document', 'image', 'portfolio']),
  multiple: PropTypes.bool,
  maxFiles: PropTypes.number,
  onUploadComplete: PropTypes.func,
  accept: PropTypes.string,
  label: PropTypes.string
};