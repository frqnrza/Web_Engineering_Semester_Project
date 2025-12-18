import { useState } from 'react';
import { FileUpload } from './FileUpload';

export function TestUpload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleUploadComplete = (files) => {
    console.log('Upload complete:', files);
    setUploadedFiles(files);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#0A2540] mb-8">
          File Upload Test Page
        </h1>

        <div className="grid gap-8">
          {/* Single Document Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Single Document Upload</h2>
            <FileUpload
              type="document"
              label="Upload a document (PDF, DOC, DOCX)"
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* Multiple Documents Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Multiple Documents Upload</h2>
            <FileUpload
              type="document"
              multiple
              maxFiles={5}
              label="Upload up to 5 documents"
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* Single Image Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Single Image Upload</h2>
            <FileUpload
              type="image"
              label="Upload profile image"
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* Portfolio Images Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Portfolio Images Upload</h2>
            <FileUpload
              type="portfolio"
              multiple
              maxFiles={5}
              label="Upload portfolio images"
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="bg-green-50 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-green-800">
                ✅ Upload Successful!
              </h2>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <p className="text-sm font-medium">File {index + 1}</p>
                    <p className="text-xs text-gray-600 break-all">
                      URL: {file.url}
                    </p>
                    <p className="text-xs text-gray-600">
                      Size: {(file.size / 1024).toFixed(2)} KB
                    </p>
                    {file.url && file.url.includes('image') && (
                      <img
                        src={file.url}
                        alt="Uploaded"
                        className="mt-2 max-w-xs rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}