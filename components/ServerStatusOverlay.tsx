import React from 'react';
import { X } from 'lucide-react';

interface ServerStatusOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ServerStatusOverlay: React.FC<ServerStatusOverlayProps> = ({
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking on the backdrop (not the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Server status"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 relative">
          <div className="relative inline-block">
            <span className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
            <div className="relative bg-blue-50 rounded-full p-4">
              <img
                src="/icons/medforcelogo.webp"
                alt="MedForce AI"
                className="h-8 w-8 object-contain"
              />
            </div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Server Starting</h3>
        <p className="text-gray-600 text-sm">Please wait while we connect to the server...</p>

        {/* Pulsing dots */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    </div>
  );
};
