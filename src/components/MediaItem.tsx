import React from 'react';
import { useResolvedUrl } from '../lib/useResolvedUrl';
import { Play } from 'lucide-react';

interface ResolvedImgProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const ResolvedImg: React.FC<ResolvedImgProps> = ({ src, alt, className, onClick, onError }) => {
  const resolved = useResolvedUrl(src);
  return (
    <img
      src={resolved || src}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={onError}
    />
  );
};

interface ResolvedVideoProps {
  src: string;
  className?: string;
  isThumbnail?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const ResolvedVideo: React.FC<ResolvedVideoProps> = ({
  src,
  className,
  isThumbnail,
  autoPlay,
  muted = true,
  controls = true,
  videoRef,
  onMouseEnter,
  onMouseLeave
}) => {
  const resolved = useResolvedUrl(src);
  const finalSrc = resolved || src;
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const setVideoRef = (node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (videoRef) {
      if (typeof videoRef === 'function') {
        (videoRef as any)(node);
      } else {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
      }
    }
  };

  const handleMouseEnterInternal = () => {
    if (localVideoRef.current) {
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
    if (onMouseEnter) onMouseEnter();
  };

  const handleMouseLeaveInternal = () => {
    if (localVideoRef.current) {
      localVideoRef.current.pause();
    }
    if (onMouseLeave) onMouseLeave();
  };

  // Extract Drive ID if Google Drive link
  const driveMatch = finalSrc ? (finalSrc.match(/\/d\/([a-zA-Z0-9_-]+)/) || finalSrc.match(/id=([a-zA-Z0-9_-]+)/)) : null;
  const driveId = driveMatch ? driveMatch[1] : null;

  if (isThumbnail) {
    if (driveId) {
      const driveImgUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
      return (
        <div className="w-full h-full relative group/drive flex items-center justify-center bg-slate-950 overflow-hidden">
          <img
            src={driveImgUrl}
            alt="Video preview"
            className="w-full h-full object-cover transition-transform duration-300 group-hover/drive:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
            }}
          />
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white backdrop-blur-xs shadow-lg">
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            </div>
          </div>
        </div>
      );
    }

    const videoThumbnailSrc = (finalSrc.startsWith('http://') || finalSrc.startsWith('https://')) && !finalSrc.includes('drive.google.com') && !finalSrc.includes('#t=')
      ? `${finalSrc}#t=0.001`
      : finalSrc;

    return (
      <div className="w-full h-full relative group/vid flex items-center justify-center bg-slate-950 overflow-hidden">
        <video
          key={finalSrc}
          ref={setVideoRef}
          src={videoThumbnailSrc}
          muted={true}
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          className={className || "w-full h-full object-cover transition-transform duration-300 ease-out group-hover/vid:scale-105"}
          onMouseEnter={handleMouseEnterInternal}
          onMouseLeave={handleMouseLeaveInternal}
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white backdrop-blur-xs shadow-lg">
            <Play className="w-4 h-4 fill-white translate-x-0.5" />
          </div>
        </div>
      </div>
    );
  }

  if (finalSrc.includes('drive.google.com') || driveId) {
    const embedUrl = driveId
      ? `https://drive.google.com/file/d/${driveId}/preview`
      : finalSrc.includes('/preview') ? finalSrc : `${finalSrc}/preview`;

    return (
      <iframe
        key={embedUrl}
        src={embedUrl}
        className={className || "w-full aspect-video min-h-[200px] sm:min-h-[420px] border-0 bg-black rounded-xl shadow-inner"}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Google Drive Video Clip"
      />
    );
  }

  return (
    <video
      key={finalSrc}
      ref={setVideoRef}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
      src={finalSrc}
      className={className || "w-full aspect-video min-h-[200px] sm:min-h-[420px] object-contain bg-black rounded-xl shadow-inner"}
      onMouseEnter={handleMouseEnterInternal}
      onMouseLeave={handleMouseLeaveInternal}
    >
      Your browser does not support HTML5 video.
    </video>
  );
};

interface ResolvedAudioProps {
  src: string;
  className?: string;
}

export const ResolvedAudio: React.FC<ResolvedAudioProps> = ({ src, className }) => {
  const resolved = useResolvedUrl(src);
  return (
    <audio controls src={resolved || src} className={className || "w-full h-8"}>
      Your browser does not support audio.
    </audio>
  );
};
