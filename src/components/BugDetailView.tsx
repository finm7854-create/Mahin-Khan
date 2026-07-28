import React, { useState, useEffect, useRef } from 'react';
import { Bug, BugComment, UserProfile } from '../types';
import { addCommentToBug, subscribeToComments, addMediaToBugInDb, removeMediaFromBugInDb, uploadMediaToStorage } from '../lib/firebase';
import { useNotifications } from '../context/NotificationContext';
import { ResolvedImg, ResolvedVideo, ResolvedAudio } from './MediaItem';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Calendar, 
  User, 
  AlertTriangle, 
  ImageIcon,
  Video as VideoIcon,
  MessageSquare,
  Send,
  Mic,
  Square,
  Trash2,
  Smile,
  Volume2,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Play,
  Eye,
  Plus,
  Upload,
  Camera,
  Loader2,
  Music
} from 'lucide-react';

interface BugDetailViewProps {
  bug: Bug;
  currentUser: UserProfile | null;
  onBack: () => void;
  onMarkSolvedClick: () => void;
  onReopenBug?: (bugId: string) => void;
  onDeleteBug?: (bugId: string) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🐛', '💡', '🎉', '😊', '👏', '🙌', '🚀'];

interface PendingMediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  isRecorded?: boolean;
}

// Helper component for Video Card
interface VideoCardProps {
  vUrl: string;
  idx: number;
  totalVideos: number;
  onOpenModal: () => void;
  onDelete?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  vUrl,
  idx,
  totalVideos,
  onOpenModal,
  onDelete
}) => {
  const heightClass = 
    totalVideos === 1 ? 'h-64 sm:h-80 md:h-[400px]' :
    totalVideos === 2 ? 'h-52 sm:h-64 md:h-72' :
    'h-48 sm:h-56';

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md flex flex-col transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,220,230,0.2)] hover:border-[#00dce6] hover:z-30 cursor-pointer ${heightClass}`}
    >
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-white/90 text-xs shrink-0 z-10">
        <div className="flex items-center gap-1.5 font-semibold">
          <VideoIcon className="w-3.5 h-3.5 text-[#00dce6]" />
          <span>Video Clip #{idx + 1}</span>
          {isHovered && (
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/50 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Auto Playing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs bg-red-900/60 hover:bg-red-600 text-red-200 hover:text-white px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Remove video from entry"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onOpenModal}
            className="text-xs bg-slate-800 hover:bg-[#00dce6] text-slate-200 hover:text-slate-950 px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" /> Fullscreen
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full overflow-hidden bg-black relative flex items-center justify-center">
        <ResolvedVideo
          src={vUrl}
          controls
          className="w-full h-full object-contain bg-black"
        />
      </div>
    </div>
  );
};

// Helper component for Image Card
interface ImageCardProps {
  imgUrl: string;
  idx: number;
  totalImages: number;
  onOpenModal: () => void;
  onDelete?: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  imgUrl,
  idx,
  totalImages,
  onOpenModal,
  onDelete
}) => {
  const heightClass = 
    totalImages === 1 ? 'h-64 sm:h-80 md:h-[380px]' :
    totalImages === 2 ? 'h-52 sm:h-64 md:h-72' :
    totalImages === 3 ? 'h-44 sm:h-52' :
    'h-36 sm:h-44';

  return (
    <div
      onClick={onOpenModal}
      className={`group relative w-full rounded-2xl border border-slate-200/80 bg-slate-900/5 backdrop-blur-md overflow-hidden cursor-pointer shadow-xs hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 hover:border-[#005bc1] transition-all duration-300 ease-out hover:z-20 flex flex-col ${heightClass}`}
    >
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-white/90 text-xs shrink-0 z-10">
        <div className="flex items-center gap-1.5 font-semibold">
          <ImageIcon className="w-3.5 h-3.5 text-[#005bc1]" />
          <span>Screenshot #{idx + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs bg-red-900/60 hover:bg-red-600 text-red-200 hover:text-white px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Remove image from entry"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <div className="text-[11px] font-medium text-slate-300 group-hover:text-[#00dce6] flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> Fullscreen
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full overflow-hidden bg-slate-950 relative flex items-center justify-center p-1">
        <ResolvedImg
          src={imgUrl}
          alt={`Bug Screenshot ${idx + 1}`}
          className="w-full h-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';
          }}
        />
      </div>
    </div>
  );
};

export const BugDetailView: React.FC<BugDetailViewProps> = ({
  bug,
  currentUser,
  onBack,
  onMarkSolvedClick,
}) => {
  const { addNotification } = useNotifications();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);

  const imagesList = bug.imageUrls && bug.imageUrls.length > 0 
    ? bug.imageUrls 
    : (bug.photoUrl ? [bug.photoUrl] : []);

  const videosList = bug.videoUrls && bug.videoUrls.length > 0 
    ? bug.videoUrls 
    : (bug.videoUrl ? [bug.videoUrl] : []);

  // Keyboard navigation for Full Webpage Image Modal
  useEffect(() => {
    if (!showImageModal || imagesList.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || (e.ctrlKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedImageIndex((prev) => (prev + 1) % imagesList.length);
      } else if (e.key === 'ArrowLeft' || (e.ctrlKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
      } else if (e.key === 'Escape') {
        setShowImageModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showImageModal, imagesList.length]);

  // Keyboard navigation for Full Webpage Video Modal
  useEffect(() => {
    if (!showVideoModal || videosList.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || (e.ctrlKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedVideoIndex((prev) => (prev + 1) % videosList.length);
      } else if (e.key === 'ArrowLeft' || (e.ctrlKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedVideoIndex((prev) => (prev - 1 + videosList.length) % videosList.length);
      } else if (e.key === 'Escape') {
        setShowVideoModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showVideoModal, videosList.length]);
  
  // Pending attachments state for adding media to existing entry
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const detailImageInputRef = useRef<HTMLInputElement>(null);
  const detailVideoInputRef = useRef<HTMLInputElement>(null);
  const detailAudioInputRef = useRef<HTMLInputElement>(null);

  // Audio voice recording state for adding audio notes directly to existing entry
  const [isRecordingDetailAudio, setIsRecordingDetailAudio] = useState(false);
  const [detailAudioSeconds, setDetailAudioSeconds] = useState(0);
  const detailMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const detailAudioChunksRef = useRef<Blob[]>([]);
  const detailAudioTimerRef = useRef<any>(null);

  const startDetailAudioRecording = async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      detailAudioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) detailAudioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(detailAudioChunksRef.current, { type: 'audio/webm' });
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const fileName = `voice_note_${Date.now()}.webm`;
        const file = new File([audioBlob], fileName, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(audioBlob);

        setPendingMedia((prev) => [
          ...prev,
          {
            id: `p_aud_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            file,
            previewUrl,
            type: 'audio',
            name: `Voice Note (${timeStr})`,
            isRecorded: true
          }
        ]);

        stream.getTracks().forEach((track) => track.stop());
      };

      detailMediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingDetailAudio(true);
      setDetailAudioSeconds(0);

      detailAudioTimerRef.current = setInterval(() => {
        setDetailAudioSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMediaError('Microphone access failed: ' + (err.message || 'Permission denied'));
    }
  };

  const stopDetailAudioRecording = () => {
    if (detailAudioTimerRef.current) {
      clearInterval(detailAudioTimerRef.current);
      detailAudioTimerRef.current = null;
    }
    if (detailMediaRecorderRef.current && detailMediaRecorderRef.current.state !== 'inactive') {
      detailMediaRecorderRef.current.stop();
    }
    setIsRecordingDetailAudio(false);
  };

  // Global paste handler for attaching images/videos directly in BugDetailView
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const files: File[] = [];
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        files.push(...Array.from(e.clipboardData.files));
      } else if (e.clipboardData.items) {
        Array.from(e.clipboardData.items).forEach((item) => {
          if (item.kind === 'file') {
            const f = item.getAsFile();
            if (f) files.push(f);
          }
        });
      }

      if (files.length > 0) {
        let addedAny = false;
        files.forEach((file) => {
          if (file.type.startsWith('image/')) {
            const newItem: PendingMediaItem = {
              id: `p_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              previewUrl: URL.createObjectURL(file),
              type: 'image',
              name: file.name || 'Pasted Image'
            };
            setPendingMedia((prev) => [...prev, newItem]);
            addedAny = true;
          } else if (file.type.startsWith('video/')) {
            const newItem: PendingMediaItem = {
              id: `p_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              previewUrl: URL.createObjectURL(file),
              type: 'video',
              name: file.name || 'Pasted Video'
            };
            setPendingMedia((prev) => [...prev, newItem]);
            addedAny = true;
          } else if (file.type.startsWith('audio/')) {
            const newItem: PendingMediaItem = {
              id: `p_aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              previewUrl: URL.createObjectURL(file),
              type: 'audio',
              name: file.name || 'Pasted Audio'
            };
            setPendingMedia((prev) => [...prev, newItem]);
            addedAny = true;
          }
        });
        if (addedAny) e.preventDefault();
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSelectMediaFiles = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newItems: PendingMediaItem[] = files.map((file: File) => ({
        id: `p_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        name: file.name
      }));
      setPendingMedia((prev) => [...prev, ...newItems]);
    }
    e.target.value = '';
  };

  const handleRemovePendingMedia = (id: string) => {
    setPendingMedia((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleUploadPendingMedia = async () => {
    if (pendingMedia.length === 0) return;
    setIsUploadingMedia(true);
    setUploadProgress('Preparing upload...');
    setMediaError(null);

    try {
      const bugFolder = `bugs/${bug.id}`;
      const newImageUrls: string[] = [];
      const newVideoUrls: string[] = [];
      const newAudioUrls: string[] = [];

      for (let i = 0; i < pendingMedia.length; i++) {
        const item = pendingMedia[i];
        setUploadProgress(`Uploading ${i + 1} of ${pendingMedia.length} (${item.type})...`);
        const url = await uploadMediaToStorage(item.file, `${bugFolder}/${item.type}s`, `${item.type}_${Date.now()}_${i}`);
        if (item.type === 'image') {
          newImageUrls.push(url);
        } else if (item.type === 'video') {
          newVideoUrls.push(url);
        } else {
          newAudioUrls.push(url);
        }
      }

      setUploadProgress('Saving attachments to entry...');
      await addMediaToBugInDb(bug.id, newImageUrls, newVideoUrls, newAudioUrls);

      // Clean up preview URLs
      pendingMedia.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingMedia([]);

      addNotification({
        type: 'new_bug',
        title: 'Attachments Saved',
        message: `Successfully added ${newImageUrls.length + newVideoUrls.length + newAudioUrls.length} file(s) to "${bug.title}"`,
        bugId: bug.id,
        bugTitle: bug.title
      });
    } catch (err: any) {
      console.error('Failed to upload attachments to entry:', err);
      setMediaError(err.message || 'Error uploading attachments. Please try again.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress('');
    }
  };

  const handleDeleteExistingMedia = async (mediaUrl: string, type: 'image' | 'video' | 'audio') => {
    if (!window.confirm(`Are you sure you want to remove this ${type} from the entry?`)) return;
    try {
      await removeMediaFromBugInDb(bug.id, mediaUrl, type);
    } catch (err) {
      console.error('Failed to remove media:', err);
    }
  };

  // Comments state
  const [comments, setComments] = useState<BugComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commentsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottomComments = () => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottomComments();
    const t = setTimeout(scrollToBottomComments, 100);
    return () => clearTimeout(t);
  }, [comments]);

  // Voice recording state for comments
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isOpen = bug.status === 'open';

  // Realtime subscription to comments
  const initialCommentsLoadedRef = useRef(false);
  const prevCommentsCountRef = useRef(0);

  useEffect(() => {
    initialCommentsLoadedRef.current = false;
    prevCommentsCountRef.current = 0;

    const unsub = subscribeToComments(bug.id, (loadedComments) => {
      setComments(loadedComments);

      if (initialCommentsLoadedRef.current) {
        if (loadedComments.length > prevCommentsCountRef.current) {
          const newest = loadedComments[loadedComments.length - 1];
          if (newest) {
            addNotification({
              type: 'comment',
              title: 'New Comment',
              message: `${newest.authorName} commented on "${bug.title}"`,
              bugId: bug.id,
              bugTitle: bug.title,
              authorName: newest.authorName
            });
          }
        }
      } else {
        initialCommentsLoadedRef.current = true;
      }

      prevCommentsCountRef.current = loadedComments.length;
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [bug.id]);

  // Clean up recording timers on unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Keyboard Arrow navigation for image and video modals
  useEffect(() => {
    if (!showVideoModal && !showImageModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVideoModal(false);
        setShowImageModal(false);
      } else if (e.key === 'ArrowRight') {
        if (showVideoModal && videosList.length > 1) {
          setSelectedVideoIndex((prev) => (prev + 1) % videosList.length);
        } else if (showImageModal && imagesList.length > 1) {
          setSelectedImageIndex((prev) => (prev + 1) % imagesList.length);
        }
      } else if (e.key === 'ArrowLeft') {
        if (showVideoModal && videosList.length > 1) {
          setSelectedVideoIndex((prev) => (prev - 1 + videosList.length) % videosList.length);
        } else if (showImageModal && imagesList.length > 1) {
          setSelectedImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideoModal, showImageModal, videosList.length, imagesList.length]);

  // Voice Recording Handlers
  const handleStartVoiceRecord = async () => {
    setVoiceError(null);
    audioChunksRef.current = [];
    setVoiceRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecordingVoice(true);

      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start microphone recording:', err);
      setVoiceError('Microphone permission denied or not available.');
    }
  };

  const handleStopVoiceRecord = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
  };

  const handleDiscardRecordedVoice = () => {
    setRecordedAudioUrl(null);
    setVoiceRecordingSeconds(0);
  };

  // Add emoji to comment text
  const handleAddEmoji = (emoji: string) => {
    setNewCommentText((prev) => prev + emoji);
  };

  // Handle Post Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() && !recordedAudioUrl) return;

    setIsPostingComment(true);
    const author = commenterName.trim() || currentUser?.displayName || currentUser?.email || 'Community Member';
    
    try {
      await addCommentToBug(
        bug.id,
        newCommentText,
        author,
        currentUser?.email || undefined,
        currentUser?.photoURL || undefined,
        recordedAudioUrl || undefined
      );
      addNotification({
        type: 'comment',
        title: 'New Comment',
        message: `${author} commented on "${bug.title}"`,
        bugId: bug.id,
        bugTitle: bug.title,
        authorName: author
      });
      setNewCommentText('');
      setRecordedAudioUrl(null);
      setVoiceRecordingSeconds(0);
      setShowEmojiPicker(false);
      setTimeout(scrollToBottomComments, 50);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Format timestamp
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      className="min-h-screen min-h-[100dvh] text-slate-900 pb-28 sm:pb-12 flex flex-col"
      style={{
        backgroundColor: '#f9f9fe',
        backgroundImage: `
          radial-gradient(at 0% 0%, hsla(253,16%,12%,0.08) 0, transparent 50%), 
          radial-gradient(at 50% 0%, hsla(225,39%,30%,0.08) 0, transparent 50%), 
          radial-gradient(at 100% 0%, hsla(339,49%,30%,0.08) 0, transparent 50%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top Glass Header */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-8 bg-white/70 backdrop-blur-xl border-b border-white/60 h-[64px] flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-[#005bc1] transition-colors cursor-pointer"
            aria-label="Back to Issues"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-semibold">Back to Issues</span>
          </button>
          <span className="text-slate-400">/</span>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
            {bug.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isOpen ? (
            <button
              onClick={onMarkSolvedClick}
              className="bg-gradient-to-r from-[#005bc1] to-[#008188] hover:from-[#0070eb] hover:to-[#00dce6] text-white text-xs sm:text-sm font-bold py-2 px-4 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Solved</span>
            </button>
          ) : (
            <div className="bg-emerald-500/10 text-emerald-800 border border-emerald-300 py-1.5 px-3 rounded-full text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Solved</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-3">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="User Profile"
                className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005bc1] to-[#008188] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Left Column: Main Content (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3.5">
            
            {/* Bug Description Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/60 shadow-sm">
              <div className="mb-2">
                <span className="text-[11px] font-bold bg-gradient-to-r from-[#005bc1] to-[#008188] bg-clip-text text-transparent uppercase tracking-wider block mb-0.5">
                  BUG TITLE
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {bug.title}
                </h2>
              </div>

              <div className="border-t border-white/50 pt-3 mt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  WHAT BROKE THIS TIME?
                </span>
                <div className="bg-white/40 p-3 rounded-lg border border-white/60 min-h-[60px]">
                  <p className="text-sm font-normal text-slate-900 leading-relaxed whitespace-pre-line">
                    {bug.description || bug.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Media Attachments & Evidence Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/60 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-white/50 pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#005bc1]" />
                  <h3 className="text-base font-bold bg-gradient-to-r from-[#005bc1] to-[#008188] bg-clip-text text-transparent">
                    Media Attachments & Evidence
                  </h3>
                </div>
              </div>

              {/* Audio Attachments */}
              {bug.audioUrls && bug.audioUrls.length > 0 && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
                    Audio Recording(s):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {bug.audioUrls.map((audioUrl, idx) => (
                      <div key={idx} className="bg-white/40 border border-white/60 p-2 rounded-lg flex items-center gap-2">
                        <ResolvedAudio src={audioUrl} className="w-full h-8 flex-1" />
                        <button
                          onClick={() => handleDeleteExistingMedia(audioUrl, 'audio')}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove audio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screenshots / Images */}
              {imagesList.length > 0 && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                    Screenshots / Images ({imagesList.length}):
                  </span>
                  <div className={`grid gap-3.5 w-full ${
                    imagesList.length === 1 ? 'grid-cols-1' :
                    imagesList.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                    imagesList.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                  }`}>
                    {imagesList.map((imgUrl, idx) => (
                      <ImageCard
                        key={idx}
                        imgUrl={imgUrl}
                        idx={idx}
                        totalImages={imagesList.length}
                        onOpenModal={() => {
                          setSelectedImageIndex(idx);
                          setShowImageModal(true);
                        }}
                        onDelete={() => handleDeleteExistingMedia(imgUrl, 'image')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reproduction Videos */}
              {videosList.length > 0 && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                    Reproduction Video(s) ({videosList.length}):
                  </span>
                  <div className={`grid gap-3.5 w-full ${
                    videosList.length === 1 ? 'grid-cols-1' :
                    videosList.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  }`}>
                    {videosList.map((vUrl, idx) => (
                      <VideoCard
                        key={idx}
                        vUrl={vUrl}
                        idx={idx}
                        totalVideos={videosList.length}
                        onOpenModal={() => {
                          setSelectedVideoIndex(idx);
                          setShowVideoModal(true);
                        }}
                        onDelete={() => handleDeleteExistingMedia(vUrl, 'video')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ADD NEW MEDIA TO THIS ENTRY SECTION */}
              <div className="mt-4 pt-3 border-t border-white/60 bg-white/30 rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#005bc1]" /> Add Image, Video, or Audio Note to this Entry
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Click below or press <kbd className="px-1 py-0.5 rounded bg-white text-slate-800 font-mono text-[10px] border border-slate-300 font-bold">Ctrl + V</kbd> to paste
                  </span>
                </div>

                <input
                  ref={detailImageInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                  multiple
                  onChange={(e) => handleSelectMediaFiles(e, 'image')}
                  className="hidden"
                />

                <input
                  ref={detailVideoInputRef}
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.m4v,.3gp,.mkv"
                  multiple
                  onChange={(e) => handleSelectMediaFiles(e, 'video')}
                  className="hidden"
                />

                <input
                  ref={detailAudioInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac"
                  multiple
                  onChange={(e) => handleSelectMediaFiles(e, 'audio')}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2.5 mb-2">
                  <button
                    type="button"
                    onClick={() => detailImageInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-[#005bc1]" />
                    <span>Select Images</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => detailVideoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <VideoIcon className="w-4 h-4 text-[#008188]" />
                    <span>Select Videos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => detailAudioInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Music className="w-4 h-4 text-purple-600" />
                    <span>Select Audio</span>
                  </button>

                  {isRecordingDetailAudio ? (
                    <button
                      type="button"
                      onClick={stopDetailAudioRecording}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Voice Recording ({Math.floor(detailAudioSeconds / 60)}:{String(detailAudioSeconds % 60).padStart(2, '0')})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startDetailAudioRecording}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <Mic className="w-4 h-4 text-emerald-600" />
                      <span>Record Voice Note</span>
                    </button>
                  )}
                </div>

                {/* Pending files list preview */}
                {pendingMedia.length > 0 && (
                  <div className="mt-3 space-y-2 bg-white/60 p-3 rounded-xl border border-white/80">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Pending Attachments ({pendingMedia.length}):
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {pendingMedia.map((item) => (
                        <div key={item.id} className="relative rounded-lg border border-slate-300 bg-slate-900 overflow-hidden h-24 group flex flex-col justify-between p-1 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:z-20 hover:border-[#005bc1]">
                          {item.type === 'image' ? (
                            <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover rounded" />
                          ) : item.type === 'video' ? (
                            <video 
                              src={item.previewUrl} 
                              className="w-full h-full object-cover rounded"
                              playsInline
                              preload="metadata"
                              onMouseEnter={(e) => {
                                e.currentTarget.muted = true;
                                e.currentTarget.play().catch(() => {});
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-2 text-center rounded">
                              <Music className="w-6 h-6 text-purple-400 mb-1" />
                              <audio src={item.previewUrl} controls className="w-full h-6 scale-90" />
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-slate-900/40 opacity-100 flex items-center justify-between p-1.5 align-top pointer-events-none">
                            <span className="text-[10px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded truncate max-w-[80%]">
                              {item.type === 'image' ? 'Photo' : item.type === 'video' ? 'Video' : 'Audio'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePendingMedia(item.id);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full cursor-pointer shadow-xs pointer-events-auto"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {mediaError && (
                      <p className="text-xs font-bold text-red-600 mt-2">{mediaError}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                      {isUploadingMedia ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-[#005bc1]">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{uploadProgress || 'Uploading media attachments...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => {
                              pendingMedia.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                              setPendingMedia([]);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleUploadPendingMedia}
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload to Entry ({pendingMedia.length})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Meta & Actions (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3.5">
            
            {/* Status Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-5 border border-white/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ISSUE STATUS</span>
                <span className="bg-[#6ff6ff] text-[#002022] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                  {isOpen ? 'OPEN / UNRESOLVED' : 'SOLVED'}
                </span>
              </div>

              {isOpen ? (
                <button
                  onClick={onMarkSolvedClick}
                  className="w-full bg-gradient-to-r from-[#005bc1] to-[#008188] hover:from-[#0070eb] hover:to-[#00dce6] text-white font-bold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Mark as Solved</span>
                </button>
              ) : (
                <div className="w-full bg-emerald-500/10 text-emerald-900 border border-emerald-300 py-2.5 px-4 rounded-full text-xs font-bold text-center">
                  Solved by {bug.solvedBy || 'Friend'} on {formatDate(bug.solvedAt)}
                </div>
              )}
            </div>

            {/* Details & Attributes Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-5 border border-white/60 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/50 pb-2">
                DETAILS & ATTRIBUTES
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/40 p-3 rounded-lg border border-white/60 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">PRIORITY</span>
                  <div className="flex items-center gap-1.5 text-[#e51245]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-sm text-slate-900">{bug.priority || 'Medium'}</span>
                  </div>
                </div>

                <div className="bg-white/40 p-3 rounded-lg border border-white/60 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">DATE CREATED</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="text-xs font-bold text-slate-900 truncate">{formatDate(bug.createdAt)}</span>
                  </div>
                </div>

                <div className="bg-white/40 p-3 rounded-lg border border-white/60 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">REPORTED BY</span>
                  <div className="flex items-center gap-1.5 text-[#005bc1]">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-xs truncate">{bug.createdBy || 'Anonymous'}</span>
                  </div>
                </div>

                <div className="bg-white/40 p-3 rounded-lg border border-white/60 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">SOLVER</span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-xs truncate">{isOpen ? 'Unassigned' : (bug.solvedBy || 'Solved')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Comments Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-5 border border-white/60 shadow-sm flex flex-col h-[420px]">
              <div className="flex justify-between items-center mb-3 border-b border-white/50 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#005bc1]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Public Comments ({comments.length})
                  </h3>
                </div>
                <span className="text-[11px] text-[#005bc1] border border-[#005bc1]/30 px-2.5 py-0.5 rounded-full bg-white/50 font-medium">
                  Anyone can comment
                </span>
              </div>

              {/* Comment stream */}
              <div ref={commentsContainerRef} className="flex-1 overflow-y-auto mb-3 pr-1 space-y-2 scroll-smooth">
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs bg-white/30 rounded-lg border border-dashed border-white/60">
                    <p className="font-semibold text-slate-700">No comments on this issue yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Leave a comment or voice response below!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-white/40 rounded-lg border border-white/60 p-3 shadow-xs space-y-1"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          {comment.authorPhoto ? (
                            <img src={comment.authorPhoto} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#008188] to-[#005bc1] text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                              {(comment.authorName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-900">{comment.authorName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>

                      {comment.text && (
                        <p className="text-xs font-medium text-slate-800 leading-relaxed pl-8">
                          {comment.text}
                        </p>
                      )}

                      {comment.audioUrl && (
                        <div className="pl-8 pt-1">
                          <audio controls src={comment.audioUrl} className="w-full h-7">
                            Your browser does not support audio.
                          </audio>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handlePostComment} className="mt-auto shrink-0 space-y-2">
                {!currentUser && (
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name (e.g. Alex)"
                      value={commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                      className="w-full bg-white/60 border border-white/80 focus:border-[#005bc1] text-slate-900 text-xs rounded-full px-3 py-1.5 outline-none font-medium mb-1"
                    />
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="p-2 bg-white/80 backdrop-blur-md rounded-xl border border-white flex flex-wrap gap-1 animate-fade-in">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAddEmoji(emoji)}
                        className="p-1 rounded-lg hover:bg-[#005bc1]/10 text-base transition-all cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Voice active recording indicator */}
                {isRecordingVoice && (
                  <div className="p-2 bg-rose-500/10 border border-rose-300 rounded-xl flex items-center justify-between text-xs animate-pulse">
                    <span className="text-rose-700 font-bold">Recording ({formatSeconds(voiceRecordingSeconds)})</span>
                    <button
                      type="button"
                      onClick={handleStopVoiceRecord}
                      className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Stop
                    </button>
                  </div>
                )}

                {/* Voice preview banner */}
                {recordedAudioUrl && !isRecordingVoice && (
                  <div className="p-2 bg-purple-500/10 border border-purple-300 rounded-xl flex items-center justify-between gap-2">
                    <audio controls src={recordedAudioUrl} className="h-6 w-full max-w-[180px]" />
                    <button
                      type="button"
                      onClick={handleDiscardRecordedVoice}
                      className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {voiceError && (
                  <p className="text-[10px] text-rose-600 font-medium">{voiceError}</p>
                )}

                <div className="flex items-center gap-1.5 bg-white/60 p-1.5 rounded-full border border-white/80 focus-within:border-[#005bc1]/50 focus-within:ring-2 focus-within:ring-[#005bc1]/20 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-slate-500 hover:text-[#005bc1] rounded-full transition-colors cursor-pointer"
                    title="Add Emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={isRecordingVoice ? handleStopVoiceRecord : handleStartVoiceRecord}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isRecordingVoice ? 'text-rose-600' : 'text-slate-500 hover:text-[#005bc1]'
                    }`}
                    title="Voice Comment"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder={recordedAudioUrl ? "Add voice comment..." : "Write a comment..."}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs p-1 outline-none placeholder:text-slate-500 font-medium"
                  />

                  <button
                    type="submit"
                    disabled={isPostingComment || (!newCommentText.trim() && !recordedAudioUrl)}
                    className="bg-gradient-to-r from-[#005bc1] to-[#008188] hover:from-[#0070eb] hover:to-[#00dce6] disabled:opacity-50 text-white py-1.5 px-3.5 rounded-full flex items-center gap-1 transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Full Webpage Image Modal with Keyboard Arrow Navigation */}
      {showImageModal && imagesList.length > 0 && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowImageModal(false);
          }}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none animate-fade-in"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto py-2 z-10 shrink-0">
            <div className="flex items-center gap-3 text-white text-xs sm:text-sm font-semibold bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-md">
              <ImageIcon className="w-4 h-4 text-[#00dce6]" />
              <span>Image {selectedImageIndex + 1} of {imagesList.length}</span>
            </div>

            <div className="flex items-center gap-3">
              {imagesList.length > 1 && (
                <span className="hidden sm:inline text-white/60 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  ← → Arrow keys to switch
                </span>
              )}
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/20 shadow-lg active:scale-95"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewport with Image & Nav Arrows */}
          <div className="relative flex-1 flex items-center justify-center w-full max-w-7xl mx-auto my-2 overflow-hidden">
            {imagesList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
                }}
                className="absolute left-2 sm:left-6 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Previous Image (←)"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            <ResolvedImg
              src={imagesList[selectedImageIndex]}
              alt={`Full Screen Image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/10 transition-all duration-300"
            />

            {imagesList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % imagesList.length);
                }}
                className="absolute right-2 sm:right-6 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Next Image (→)"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Pagination dots */}
          {imagesList.length > 1 && (
            <div className="flex items-center justify-center gap-2 py-2 shrink-0">
              {imagesList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === selectedImageIndex
                      ? 'w-8 bg-[#00dce6] shadow-sm'
                      : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Webpage Video Player Modal with Keyboard Arrow Navigation */}
      {showVideoModal && videosList.length > 0 && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVideoModal(false);
          }}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none animate-fade-in"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto py-2 z-10 shrink-0">
            <div className="flex items-center gap-3 text-white text-xs sm:text-sm font-semibold bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-md">
              <VideoIcon className="w-4 h-4 text-[#00dce6]" />
              <span>Video Clip {selectedVideoIndex + 1} of {videosList.length}</span>
            </div>

            <div className="flex items-center gap-3">
              {videosList.length > 1 && (
                <span className="hidden sm:inline text-white/60 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  ← / → or Ctrl + Arrow to switch
                </span>
              )}
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/20 shadow-lg active:scale-95"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewport with Video Player & Nav Arrows */}
          <div className="relative flex-1 flex items-center justify-center w-full max-w-5xl mx-auto my-2 overflow-hidden">
            {videosList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVideoIndex((prev) => (prev - 1 + videosList.length) % videosList.length);
                }}
                className="absolute left-2 sm:left-4 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Previous Video (←)"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            <div className="w-full max-h-[80vh] aspect-video rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/20 bg-slate-950 flex items-center justify-center">
              <ResolvedVideo
                key={selectedVideoIndex}
                src={videosList[selectedVideoIndex]}
                autoPlay
                controls
                className="w-full h-full object-contain bg-black"
              />
            </div>

            {videosList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVideoIndex((prev) => (prev + 1) % videosList.length);
                }}
                className="absolute right-2 sm:right-4 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Next Video (→)"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Pagination dots */}
          {videosList.length > 1 && (
            <div className="flex items-center justify-center gap-2 py-2 shrink-0">
              {videosList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVideoIndex(idx);
                  }}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === selectedVideoIndex
                      ? 'w-8 bg-[#00dce6] shadow-sm'
                      : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

