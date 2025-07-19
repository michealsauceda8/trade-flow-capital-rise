import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUploaded: (path: string, url: string) => void;
  accept?: string[];
  maxSize?: number;
  folder: string;
  label: string;
  description?: string;
  existingFile?: string;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  accept = ['image/*', '.pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
  folder,
  label,
  description,
  existingFile,
  required = false
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(existingFile || null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      setError('You must be logged in to upload files');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      setUploadedFile(file.name);
      onFileUploaded(fileName, urlData.publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [user, folder, onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    maxSize,
    multiple: false
  });

  const removeFile = () => {
    setUploadedFile(null);
    onFileUploaded('', '');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-primary/5",
            isDragActive && "border-primary bg-primary/10",
            error && "border-destructive",
            "border-border"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? 'Drop the file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                {accept.join(', ')} up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center space-x-2">
            <File className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{uploadedFile}</span>
            <Check className="w-4 h-4 text-success" />
          </div>
          <button
            onClick={removeFile}
            className="p-1 hover:bg-muted rounded"
            type="button"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Uploading...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};