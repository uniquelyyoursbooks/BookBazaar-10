import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, File, X } from "lucide-react";

type FileUploaderProps = {
  accept?: string;
  multiple?: boolean;
  onFileSelect: (file: File) => void;
  label?: string;
  maxFileSize?: number; // in MB
};

export default function FileUploader({
  accept = "*",
  multiple = false,
  onFileSelect,
  label = "Upload File",
  maxFileSize = 10 // 10MB default
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    validateAndSetFile(file);
  };
  
  const validateAndSetFile = (file: File) => {
    setError(null);
    
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }
    
    // Check file type if accept is specified
    if (accept !== "*") {
      const fileType = file.type;
      const acceptTypes = accept.split(",").map(type => type.trim());
      
      // Check if the file type is accepted
      const isAccepted = acceptTypes.some(type => {
        if (type.includes("*")) {
          // Handle wildcard types like "image/*"
          return fileType.startsWith(type.split("/")[0]);
        }
        return fileType === type;
      });
      
      if (!isAccepted) {
        setError(`Invalid file type. Accepted: ${accept}`);
        return;
      }
    }
    
    setSelectedFile(file);
    onFileSelect(file);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    validateAndSetFile(file);
  };
  
  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                    ${isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"}
                    ${error ? "border-red-500 bg-red-50" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center">
              <File className="h-6 w-6 text-primary mr-2" />
              <div className="text-sm truncate max-w-[200px]">{selectedFile.name}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <Upload className="h-8 w-8 mx-auto text-[#777777] mb-2" />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-[#777777] mt-1">
              Drag and drop or click to select
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
