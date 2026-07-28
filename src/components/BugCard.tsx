import React, { useState } from 'react';
import { Bug } from '../types';
import { Video, Image as ImageIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useResolvedUrl } from '../lib/useResolvedUrl';
import { ResolvedVideo } from './MediaItem';

interface BugCardProps {
  bug: Bug;
  onClick: () => void;
}

export const BugCard: React.FC<BugCardProps> = ({ bug, onClick }) => {
  const isOpen = bug.status === 'open';
  const rawImage = bug.photoUrl || (bug.imageUrls && bug.imageUrls.length > 0 ? bug.imageUrls[0] : null);
  const rawVideo = bug.videoUrl || (bug.videoUrls && bug.videoUrls.length > 0 ? bug.videoUrls[0] : null);
  const resolvedImage = useResolvedUrl(rawImage);
  const displayImage = resolvedImage || (rawImage && !rawImage.startsWith('idb_media_') ? rawImage : null);
  const hasPhoto = Boolean(displayImage);
  const hasVideo = Boolean(rawVideo);
  const hasMedia = hasPhoto || hasVideo;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden h-full active:scale-[0.99] relative hover:z-20 hover:border-[#0070eb]"
    >
      {/* Mini Circle Uploading Spinner Badge */}
      {bug.isUploading && (
        <div 
          className="absolute top-2.5 right-2.5 z-30 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5 shadow-md border border-blue-400/50 backdrop-blur-xs animate-pulse"
          title="Uploading media attachments..."
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          <span className="text-[10px] font-bold tracking-wide">Uploading...</span>
        </div>
      )}
      {/* Card Image / Video Preview Area (Only rendered if media exists) */}
      {hasMedia && (
        <div className="h-40 bg-slate-950 relative p-0 flex items-center justify-center overflow-hidden group/media">
          {hasVideo && rawVideo ? (
            <div className="w-full h-full relative">
              <ResolvedVideo
                src={rawVideo}
                isThumbnail
                controls={false}
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/media:scale-105"
              />
              {isHovered && (
                <div className="absolute top-2 right-2 bg-emerald-950/90 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/50 backdrop-blur-xs animate-pulse flex items-center gap-1 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Playing
                </div>
              )}
            </div>
          ) : displayImage ? (
            <img
              src={displayImage}
              alt={bug.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';
              }}
            />
          ) : null}

          {/* Status Badge over Media */}
          <span className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase shadow-xs z-10 ${
            isOpen ? 'bg-black/80' : 'bg-[#639F9E]'
          }`}>
            {isOpen ? 'OPEN' : 'SOLVED'}
          </span>

          {/* Media Indicators */}
          <div className="absolute bottom-3 right-3 flex gap-1 z-10">
            {displayImage && (
              <span className="w-6 h-6 rounded bg-black/60 flex items-center justify-center backdrop-blur-xs">
                <ImageIcon className="w-3 h-3 text-[#E8D5C8]" />
              </span>
            )}
            {hasVideo && (
              <span className="w-6 h-6 rounded bg-black/60 flex items-center justify-center backdrop-blur-xs">
                <Video className="w-3 h-3 text-emerald-400" />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Status Badge when no media exists */}
          {!hasMedia && (
            <div className="mb-2.5 flex items-center justify-between">
              <span className={`text-white text-[10px] font-black px-2 py-1 rounded tracking-wider uppercase shadow-xs ${
                isOpen ? 'bg-black/90' : 'bg-[#639F9E]'
              }`}>
                {isOpen ? 'OPEN' : 'SOLVED'}
              </span>
            </div>
          )}

          <h3 className="font-bold text-base sm:text-lg text-black line-clamp-2 group-hover:text-[#0070eb] transition-colors">
            {bug.title}
          </h3>
          {bug.description && (
            <p className="text-xs text-black/80 font-medium mt-1.5 line-clamp-3 leading-relaxed">
              {bug.description}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 border-t border-gray-200 pt-3">
          <div className="border border-gray-400 rounded-lg px-2.5 py-1 flex items-center text-xs font-bold text-black bg-gray-100">
            <span>By {bug.createdBy || 'Anonymous'}</span>
          </div>
          <button className="text-xs font-black text-black flex items-center gap-1 group-hover:text-[#0070eb] transition-colors">
            Details
            <ArrowRight className="w-3.5 h-3.5 text-black group-hover:text-[#0070eb]" />
          </button>
        </div>
      </div>
    </div>
  );
};
