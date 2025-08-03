'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFileSelect: (file: File, dataUrl: string) => void;
  file?: File;
}

export function FileUploader({ onFileSelect, file: initialFile }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialFile ? URL.createObjectURL(initialFile) : null);
  const { toast } = useToast();

  const processFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileSelect(file, reader.result as string);
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload an image file.',
      });
    }
  }, [onFileSelect, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="dropzone-file"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 transition-colors ${dragActive ? 'border-primary' : 'border-border'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, or other image formats</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleChange} />
      </label>
      {preview && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-center mb-2">Timesheet Preview</h3>
          <div className="relative w-full max-w-md mx-auto aspect-[4/3] rounded-lg overflow-hidden border shadow-sm">
            <Image src={preview} alt="Timesheet preview" layout="fill" objectFit="contain" data-ai-hint="handwritten document" />
          </div>
        </div>
      )}
    </div>
  );
}
