import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose} // Close when clicking backdrop
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors shadow-lg"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Image container */}
      <div className="relative max-w-full max-h-full p-4">
        <img
          src={imageUrl}
          alt="Full size post image"
          className="max-w-full max-h-full object-contain cursor-default"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
        />
      </div>
    </div>
  );
};

export default ImageModal;
