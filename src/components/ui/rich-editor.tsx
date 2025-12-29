
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Bold, Italic, Underline, Strikethrough, Pilcrow, List, ListOrdered, Undo, Redo, Image as ImageIcon, Code, Table } from 'lucide-react';
import { Textarea } from './textarea';
import Image from 'next/image';

interface RichEditorProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

const RichEditorToolbar = ({ onImageUpload }: { onImageUpload: (file: File) => void }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };
  
  const Superscript = () => <span>x²</span>
  const SquareRoot = () => <span>√</span>
  const Hexagon = () => <div className="w-4 h-4 flex items-center justify-center">C</div>


  return (
    <div className="flex items-center gap-1 border-b p-2 bg-slate-50 rounded-t-md flex-wrap">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Pilcrow /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Bold /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Italic /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">16</Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Undo /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Redo /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Superscript /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">¶*</Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Table /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">-</Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><SquareRoot /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Hexagon /></Button>
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
      />
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleImageClick}>
        <ImageIcon />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Code /></Button>
    </div>
  );
};


const RichEditor = React.forwardRef<HTMLTextAreaElement, RichEditorProps>(
  ({ value: controlledValue, onChange, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    useEffect(() => {
        const urlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp))/g;
        const urls = value?.match(urlRegex) || [];
        const uniqueUrls = Array.from(new Set(urls));
        setImagePreviews(uniqueUrls);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
          setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleImageUpload = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreview = reader.result as string;
        const updatedValue = `${value}\n${newPreview}`;
         if (controlledValue === undefined) {
          setInternalValue(updatedValue);
        }
        onChange?.(updatedValue);
      };
      reader.readAsDataURL(file);
    }, [value, onChange, controlledValue]);


    return (
      <div className={cn("rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring", className)}>
        <RichEditorToolbar onImageUpload={handleImageUpload} />
        <div className='p-2'>
            <Textarea
                ref={ref}
                value={value}
                onChange={handleChange}
                className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                {...props}
            />
            <div className="mt-2 flex flex-wrap gap-2">
                {imagePreviews.map((src, index) => (
                    <div key={index} className="relative w-24 h-24">
                        <Image src={src} alt={`preview ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }
);
RichEditor.displayName = 'RichEditor';

export { RichEditor };
