/**
 * Batch Upload Component
 * Upload multiple documents at once
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import { documentIntelligence } from '@/lib/ai';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

interface BatchUploaderProps {
  onComplete?: (results: Map<string, any>) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function BatchUploader({
  onComplete,
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
}: BatchUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [files]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles
      .filter((f) => acceptedTypes.includes(f.type))
      .slice(0, maxFiles - files.length);

    const uploadedFiles: UploadedFile[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadedFiles]);
    processFiles(uploadedFiles);
  };

  const processFiles = async (filesToProcess: UploadedFile[]) => {
    const results = new Map<string, any>();

    for (const uploadedFile of filesToProcess) {
      try {
        updateFileStatus(uploadedFile.id, 'processing', 0);

        const arrayBuffer = await uploadedFile.file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        updateFileStatus(uploadedFile.id, 'processing', 50);

        const result = await documentIntelligence.analyzeDocument(
          uint8Array,
          uploadedFile.file.type,
          uploadedFile.file.name
        );

        updateFileStatus(uploadedFile.id, 'complete', 100, result);
        results.set(uploadedFile.file.name, result);
      } catch (error) {
        updateFileStatus(uploadedFile.id, 'error', 0, undefined, String(error));
      }
    }

    onComplete?.(results);
  };

  const updateFileStatus = (
    id: string,
    status: UploadedFile['status'],
    progress: number,
    result?: any,
    error?: string
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status, progress, result, error }
          : f
      )
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }
        `}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Drop files here or click to upload
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Upload up to {maxFiles} documents at once
        </p>
        <label className="inline-block">
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <span className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors inline-block">
            Select Files
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Uploaded Files ({files.length})
            </h4>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Clear All
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <FileItem key={file.id} file={file} onRemove={removeFile} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FileItem({ file, onRemove }: { file: UploadedFile; onRemove: (id: string) => void }) {
  const statusIcons = {
    pending: FileImage,
    processing: FileImage,
    complete: CheckCircle,
    error: AlertCircle,
  };

  const Icon = statusIcons[file.status];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`w-5 h-5 ${
            file.status === 'complete'
              ? 'text-green-500'
              : file.status === 'error'
              ? 'text-red-500'
              : 'text-blue-500 animate-pulse'
          }`}
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {file.file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {(file.file.size / 1024).toFixed(1)} KB
          </p>

          {file.status === 'processing' && (
            <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                className="h-full bg-blue-500"
              />
            </div>
          )}

          {file.error && (
            <p className="text-xs text-red-500 mt-1">{file.error}</p>
          )}
        </div>

        <button
          onClick={() => onRemove(file.id)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}
