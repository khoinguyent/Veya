import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

interface UseAudioOptions {
  onPlaybackStatusUpdate?: (status: any) => void;
}

export const useAudio = (audioUri: string, options?: UseAudioOptions) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        // Cleanup sound on unmount
        const cleanup = async () => {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              // Stop if playing
              if (status.isPlaying) {
                await sound.stopAsync().catch(() => {
                  // Ignore errors during cleanup
                });
              }
              // Wait a bit before unloading
              await new Promise(resolve => setTimeout(resolve, 50));
              // Unload the sound
              await sound.unloadAsync().catch(() => {
                // Ignore errors if already unloaded
              });
            }
          } catch (error: any) {
            // Ignore cleanup errors - sound might already be unloaded
            if (error.code !== 'E_AUDIO_NOPLAYER') {
              console.warn('Error cleaning up audio:', error);
            }
          }
        };
        cleanup();
      }
    };
  }, [sound]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        setIsPlaying(status.isLoaded && status.isPlaying);
        if (status.isLoaded) {
          if (status.durationMillis !== undefined) {
          setDuration(status.durationMillis / 1000);
          }
          if (status.positionMillis !== undefined) {
          setPosition(status.positionMillis / 1000);
          }
          if (options?.onPlaybackStatusUpdate) {
            options.onPlaybackStatusUpdate(status);
          }
        }
      });

      setSound(newSound);
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  useEffect(() => {
    loadSound();
  }, [audioUri]);

  const play = async () => {
    if (sound) {
      await sound.playAsync();
    }
  };

  const pause = async () => {
    if (sound) {
      await sound.pauseAsync();
    }
  };

  const stop = async () => {
    if (sound) {
      try {
        // Check status before stopping
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          // Stop the sound if it's playing
          if (status.isPlaying) {
            await sound.stopAsync();
          }
          // Only reset position if sound is still loaded
          // Avoid setting position if we're about to unload
          try {
            await sound.setPositionAsync(0);
          } catch (error: any) {
            // Ignore "Seeking interrupted" errors - this is normal during cleanup
            if (!error.message?.includes('Seeking interrupted')) {
              console.warn('Error resetting audio position:', error);
            }
          }
        }
      } catch (error: any) {
        // Handle errors gracefully
        if (error.code !== 'E_AUDIO_NOPLAYER') {
          console.error('Error stopping audio:', error);
        }
      }
    }
  };

  const seek = async (positionSeconds: number) => {
    if (sound) {
      try {
        // Check status before seeking
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setPositionAsync(positionSeconds * 1000);
        }
      } catch (error: any) {
        // Handle "Seeking interrupted" errors gracefully
        if (error.message?.includes('Seeking interrupted')) {
          // This is expected when the sound is being stopped/unloaded
          console.log('Seek operation interrupted (normal during cleanup)');
        } else if (error.code !== 'E_AUDIO_NOPLAYER') {
          console.error('Error seeking audio:', error);
        }
      }
    }
  };

  return {
    isPlaying,
    duration,
    position,
    play,
    pause,
    stop,
    seek,
  };
};

