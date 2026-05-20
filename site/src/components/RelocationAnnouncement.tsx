import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/TranslationContext';

const RelocationAnnouncement = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const newTime = clickRatio * duration;
    
    audio.currentTime = newTime;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Announcement Text */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {t('announcement.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('announcement.subtitle')}
            </p>
          </div>

          {/* Audio Player */}
          <div className="flex items-center gap-4 bg-background/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-primary/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center gap-2 min-w-[200px]">
              <div 
                className="flex-1 h-1 bg-muted rounded-full cursor-pointer relative"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground min-w-[35px]">
                {formatTime(duration)}
              </span>
            </div>

            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Call to Action */}
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">
            {t('announcement.cta')}
          </p>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src="/relocation-announcement.mp3"
        preload="metadata"
      />
    </div>
  );
};

export default RelocationAnnouncement;