'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageViewer({ images, initialIndex = 0, isOpen, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  };

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.5, 3))}
              className="p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
              className="p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-white/80 text-sm px-2">{Math.round(zoom * 100)}%</span>
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 max-w-[90vw] max-h-[90vh] flex items-center justify-center"
          >
            <img
              src={currentImage.url}
              alt={currentImage.alt || ''}
              className="max-w-full max-h-[90vh] object-contain rounded-lg transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </motion.div>

          {images.length > 1 && (
            <div className="absolute bottom-4 z-10 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setZoom(1); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? 'bg-white w-4' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
