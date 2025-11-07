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
        sound.unloadAsync();
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
      await sound.stopAsync();
      await sound.setPositionAsync(0);
    }
  };

  const seek = async (positionSeconds: number) => {
    if (sound) {
      await sound.setPositionAsync(positionSeconds * 1000);
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

