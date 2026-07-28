import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Bug } from '../types';
import { uploadMediaToStorage } from '../lib/firebase';
import { 
  X, 
  Send, 
  AlertCircle,
  Camera,
  Video,
  Mic,
  Music,
  Square,
  Plus,
  Trash2,
  Volume2
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface VideoItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
}

interface AudioItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  isRecorded?: boolean;
}

interface AddBugModalProps {
  user: UserProfile;
  onClose: () => void;
  onSubmit: (newBug: Bug) => Promise<void>;
  onUpdateBug?: (updatedBug: Bug) => Promise<void>;
}

export const AddBugModal: React.FC<AddBugModalProps> = ({ user, onClose, onSubmit, onUpdateBug }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');

  // Media state lists
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);

  // Category tags state
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // File Input Refs for direct click triggering on mobile and desktop
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Uploading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Clean up recording timer and object URLs on unmount, and setup clipboard paste listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const files: File[] = [];

      if (clipboardData.files && clipboardData.files.length > 0) {
        files.push(...Array.from(clipboardData.files));
      } else if (clipboardData.items && clipboardData.items.length > 0) {
        Array.from(clipboardData.items).forEach((item) => {
          if (item.kind === 'file') {
            const f = item.getAsFile();
            if (f) files.push(f);
          }
        });
      }

      if (files.length > 0) {
        let pastedAny = false;

        files.forEach((file) => {
          if (file.type.startsWith('image/')) {
            const newImg: ImageItem = {
              id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              previewUrl: URL.createObjectURL(file)
            };
            setImageItems((prev) => [...prev, newImg]);
            pastedAny = true;
          } else if (file.type.startsWith('video/')) {
            const newVid: VideoItem = {
              id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              previewUrl: URL.createObjectURL(file),
              name: file.name || 'Pasted Video'
            };
            setVideoItems((prev) => [...prev, newVid]);
            pastedAny = true;
          }
        });

        if (pastedAny) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);

    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Handle Photo selection (Multiple)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files) as File[];
      const newItems: ImageItem[] = files.map((file) => ({
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setImageItems((prev) => [...prev, ...newItems]);
    }
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImageItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  // Handle Video selection (Multiple)
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files) as File[];
      const newItems: VideoItem[] = files.map((file) => ({
        id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name
      }));
      setVideoItems((prev) => [...prev, ...newItems]);
    }
    e.target.value = '';
  };

  const handleRemoveVideo = (id: string) => {
    setVideoItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  // Handle Audio File Selection (Multiple)
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files) as File[];
      const newItems: AudioItem[] = files.map((file) => ({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name
      }));
      setAudioItems((prev) => [...prev, ...newItems]);
    }
    e.target.value = '';
  };

  const handleRemoveAudio = (id: string) => {
    setAudioItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  // Start Live Audio Voice Note Recording
  const startRecording = async () => {
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const fileName = `voice_note_${Date.now()}.webm`;
        const file = new File([audioBlob], fileName, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(audioBlob);

        setAudioItems((prev) => [
          ...prev,
          {
            id: `aud_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            file,
            previewUrl,
            name: `Voice Note (${timeStr})`,
            isRecorded: true
          }
        ]);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage('Microphone access failed: ' + (err.message || 'Permission denied or microphone unavailable.'));
    }
  };

  // Stop Audio Recording
  const stopRecording = (): Promise<void> => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        const recorder = mediaRecorderRef.current;
        const prevOnStop = recorder.onstop;
        recorder.onstop = (e) => {
          if (prevOnStop) prevOnStop.call(recorder, e);
          resolve();
        };
        recorder.stop();
      } else {
        resolve();
      }
      setIsRecording(false);
    });
  };

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isRecording) {
      await stopRecording();
    }

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    if (!cleanTitle && !cleanDesc) {
      setErrorMessage('Please provide a title or describe what broke.');
      return;
    }

    const finalTitle = cleanTitle || cleanDesc;
    const finalDescription = cleanDesc || cleanTitle;

    setIsSubmitting(true);
    setUploadProgress('Preparing upload...');

    const authorName = user.displayName || user.email || 'Anonymous';
    const category = tags.length > 0 ? tags.join(', ') : 'General';
    const bugId = `bug_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bugFolder = `bugs/${bugId}`;

    try {
      setUploadProgress('Uploading files to cloud...');
      const [uploadedImageUrls, uploadedVideoUrls, uploadedAudioUrls] = await Promise.all([
        Promise.all(imageItems.map((item, i) => uploadMediaToStorage(item.file, `${bugFolder}/images`, `img_${i + 1}`))),
        Promise.all(videoItems.map((item, j) => uploadMediaToStorage(item.file, `${bugFolder}/videos`, `vid_${j + 1}`))),
        Promise.all(audioItems.map((item, k) => uploadMediaToStorage(item.file, `${bugFolder}/audios`, `aud_${k + 1}`)))
      ]);

      const validImageUrls = uploadedImageUrls.filter(Boolean);
      const validVideoUrls = uploadedVideoUrls.filter(Boolean);
      const validAudioUrls = uploadedAudioUrls.filter(Boolean);

      const finalPhoto = validImageUrls.length > 0 ? validImageUrls[0] : '';
      const finalVideo = validVideoUrls.length > 0 ? validVideoUrls[0] : '';

      const finalBug: Bug = {
        id: bugId,
        title: finalTitle,
        description: finalDescription,
        status: 'open',
        priorityLevel: priority,
        priority: priority,
        category,
        authorName,
        createdBy: authorName,
        createdByEmail: user.email || '',
        createdAt: new Date().toISOString(),
        photoUrl: finalPhoto,
        videoUrl: finalVideo,
        imageUrls: validImageUrls,
        videoUrls: validVideoUrls,
        audioUrls: validAudioUrls,
        tags,
        isUploading: false
      };

      setUploadProgress('Saving entry to Google Drive...');
      await onSubmit(finalBug);
    } catch (err: any) {
      console.error('Submit bug error:', err);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 min-h-screen text-slate-900">
      {/* Animated background layers */}
      <div className="mesh-bg" />
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm -z-10" onClick={onClose} />

      {/* Main Form Container */}
      <div className="glass-panel rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden relative shadow-2xl my-auto border border-white/60">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/30 bg-white/20">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">New Bug</h1>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-600 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-white/40 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bug Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-0.5">
                BUG TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Navigation menu non-responsive on mobile"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder:text-slate-400/80 outline-none"
                autoFocus
              />
            </div>

            {/* What Broke This Time? */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between ml-0.5">
                WHAT BROKE THIS TIME?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what broke, steps to reproduce, or details..."
                className="glass-input w-full rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder:text-slate-400/80 resize-none outline-none"
              />
            </div>

            {/* Evidence Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Evidence */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between ml-0.5">
                  <span>IMAGE EVIDENCE {imageItems.length > 0 && `(${imageItems.length})`}</span>
                </label>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                {imageItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {imageItems.map((item) => (
                        <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-video border border-white/60 shadow-xs bg-slate-900">
                          <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(item.id)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-white hover:bg-red-600 transition-colors shadow-md cursor-pointer z-10"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg glass-button text-xs font-bold text-slate-800 cursor-pointer hover:bg-white active:scale-95 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0070eb]" />
                      <span>Add More Images</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="dotted-zone rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center h-32 cursor-pointer group hover:border-[#0070eb] transition-all select-none"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const files: File[] = Array.from(e.dataTransfer.files);
                        const imgFiles = files.filter(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|bmp)$/i.test(f.name));
                        if (imgFiles.length > 0) {
                          const newItems: ImageItem[] = imgFiles.map((file) => ({
                            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                            file,
                            previewUrl: URL.createObjectURL(file)
                          }));
                          setImageItems((prev) => [...prev, ...newItems]);
                        }
                      }
                    }}
                  >
                    <span className="glass-button font-medium text-xs px-4 py-2 rounded-lg text-slate-800 flex items-center gap-2 group-hover:bg-white/80 transition-colors pointer-events-none">
                      <Camera className="w-4 h-4 text-[#0070eb]" /> Add Images / Screenshots
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight max-w-[200px] pointer-events-none">
                      Click or tap to choose files, drag & drop, or press <kbd className="px-1 py-0.5 rounded bg-white/60 text-slate-800 text-[10px] font-mono font-bold border border-white/80">Ctrl + V</kbd>
                    </p>
                  </div>
                )}
              </div>

              {/* Video Recordings */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between ml-0.5">
                  <span>VIDEO RECORDINGS {videoItems.length > 0 && `(${videoItems.length})`}</span>
                </label>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.m4v,.3gp,.mkv"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                />

                {videoItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {videoItems.map((item) => (
                        <div key={item.id} className="relative rounded-xl overflow-hidden border border-white/60 bg-black group p-1.5 flex flex-col gap-1">
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                            <video src={item.previewUrl} controls playsInline preload="metadata" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(item.id)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors shadow-md z-10 cursor-pointer"
                              title="Remove video"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] font-medium text-slate-300 truncate px-1">{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg glass-button text-xs font-bold text-slate-800 cursor-pointer hover:bg-white active:scale-95 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0070eb]" />
                      <span>Add More Videos</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => videoInputRef.current?.click()}
                    className="dotted-zone rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center h-32 cursor-pointer group hover:border-[#008188] transition-all select-none"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const files: File[] = Array.from(e.dataTransfer.files);
                        const vidFiles = files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(f.name));
                        if (vidFiles.length > 0) {
                          const newItems: VideoItem[] = vidFiles.map((file) => ({
                            id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                            file,
                            previewUrl: URL.createObjectURL(file),
                            name: file.name
                          }));
                          setVideoItems((prev) => [...prev, ...newItems]);
                        }
                      }
                    }}
                  >
                    <span className="glass-button font-medium text-xs px-4 py-2 rounded-lg text-slate-800 flex items-center gap-2 group-hover:bg-white/80 transition-colors pointer-events-none">
                      <Video className="w-4 h-4 text-[#008188]" /> Add Reproduction Videos
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight max-w-[200px] pointer-events-none">
                      Click or tap to choose files, drag & drop, or press <kbd className="px-1 py-0.5 rounded bg-white/60 text-slate-800 text-[10px] font-mono font-bold border border-white/80">Ctrl + V</kbd>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-0.5">
                AUDIO NOTES {audioItems.length > 0 && `(${audioItems.length})`}
              </label>

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac"
                multiple
                onChange={handleAudioChange}
                className="hidden"
              />

              <div className="bg-white/30 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3 border border-white/40">
                <div className="flex gap-2 w-full sm:w-auto">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="glass-button text-xs font-semibold px-3.5 py-2 rounded-lg text-[#0070eb] flex items-center gap-1.5 flex-1 sm:flex-none justify-center cursor-pointer hover:bg-white active:scale-95 transition-all shadow-xs"
                    >
                      <Mic className="w-4 h-4 text-rose-600" />
                      <span>Record Voice Note</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 flex-1 sm:flex-none justify-center animate-pulse cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop ({formatRecordingTime(recordingSeconds)})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="glass-button text-xs font-semibold px-3.5 py-2 rounded-lg text-slate-800 flex items-center gap-1.5 flex-1 sm:flex-none justify-center cursor-pointer hover:bg-white active:scale-95 transition-all shadow-xs"
                  >
                    <Music className="w-4 h-4 text-[#0070eb]" />
                    <span>Upload Audio</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 flex-1 leading-tight text-center sm:text-left">
                  {audioItems.length === 0 && !isRecording && 'No audio clips attached yet. Click "Record Voice Note" to speak or "Upload Audio" to select audio files.'}
                  {isRecording && <span className="text-rose-700 font-semibold animate-pulse">Recording voice note... {formatRecordingTime(recordingSeconds)}</span>}
                </p>
              </div>

              {audioItems.length > 0 && (
                <div className="space-y-2 mt-2">
                  {audioItems.map((item) => (
                    <div key={item.id} className="p-2 bg-white/50 border border-white/70 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 truncate font-semibold text-slate-800 min-w-0">
                        <Volume2 className="w-4 h-4 text-[#0070eb] shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <audio controls src={item.previewUrl} className="h-8 max-w-[220px]" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAudio(item.id)}
                          className="p-1 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove audio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Priority Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-0.5">
                  PRIORITY LEVEL
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((p) => {
                    const isSelected = priority === p;
                    let btnClass = "glass-button px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-800 cursor-pointer";
                    if (isSelected) {
                      if (p === 'Critical' || p === 'High') {
                        btnClass = "px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-red-600 shadow-sm shadow-red-500/30 ring-2 ring-red-500/20 cursor-pointer";
                      } else {
                        btnClass = "px-3.5 py-1.5 rounded-full text-xs font-semibold text-white electric-flow cursor-pointer";
                      }
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={btnClass}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-0.5">
                  CATEGORY
                </label>
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type category title & press Enter..."
                    className="glass-input w-full rounded-xl pl-3 pr-20 py-2 text-slate-900 text-xs placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="absolute right-1 top-1 bottom-1 glass-button px-3 rounded-lg text-xs font-semibold text-[#0070eb] cursor-pointer hover:bg-white"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0070eb]/15 text-[#005bc1] border border-[#0070eb]/30"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-[11px] text-slate-500 italic ml-1 self-center">
                      Type above to create custom category tags
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 border-t border-white/30">
              <button
                type="submit"
                disabled={isSubmitting}
                className="electric-flow w-full py-3 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{uploadProgress || 'Uploading files...'}</span>
                  </div>
                ) : (
                  <>
                    <span>Post bug</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
