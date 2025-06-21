
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload = ({ onFileSelect, isLoading }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        {isLoading ? (
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
        ) : (
          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
        )}
        
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop the file here' : 'Upload Document'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'Processing...' : 'Drag & drop or click to select (PNG, JPG, JPEG)'}
          </p>
        </div>
        
        {!isLoading && (
          <Button variant="outline" size="sm" className="mx-auto">
            <File className="w-4 h-4 mr-2" />
            Choose File
          </Button>
        )}
      </div>
    </div>
  );
};
