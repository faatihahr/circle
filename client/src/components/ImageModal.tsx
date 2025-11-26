import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, isOpen, onClose }) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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

      {/* Image container with scroll if needed */}
      <div className="relative flex items-center justify-center p-4 overflow-auto">
        <img
          src={imageUrl}
          alt="Full size post image"
          className="max-w-[95vw] max-h-[90vh] object-scale-down cursor-default rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
        />
      </div>
    </div>
  );
};

export default ImageModal;
