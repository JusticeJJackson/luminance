import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
    onFileSelect: (file: File) => void;
}

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.pdf,.tif,.tiff';

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);``
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-white shadow">
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleFileChange}
                aria-label="Upload image or PDF"
            />
            <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                onClick={() => fileInputRef.current?.click()}
            >
                Select Image or PDF
            </button>
            {previewUrl && (
                <img src={previewUrl} alt="Preview" className="max-w-xs max-h-48 rounded border" />
            )}
        </div>
    );
};

export default ImageUploader; 