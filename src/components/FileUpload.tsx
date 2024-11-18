import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onCatalogLoad: (file: File) => void;
}

export function FileUpload({ onCatalogLoad }: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onCatalogLoad(file);
  };

  return (
    <div className="w-full max-w-xl">
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-12 h-12 mb-4 text-gray-500" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">JSON catalog file</p>
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".json"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}