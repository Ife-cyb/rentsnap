import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Send, Trash2, Volume2 } from 'lucide-react';

interface VoiceMessage {
  id: string;
  sender_id: string;
  duration: number;
  audio_url: string;
  waveform: number[];
  created_at: string;
  is_playing?: boolean;
}

interface VoiceMessagingProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void;
  voiceMessages: VoiceMessage[];
  currentUserId: string;
}

const VoiceMessaging: React.FC<VoiceMessagingProps> = ({
  onSendVoiceMessage,
  voiceMessages,
  currentUserId
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [recordingPermission, setRecordingPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setRecordingPermission(false);
    }
  };

  const startRecording = async () => {
    if (!recordingPermission) {
      await checkMicrophonePermission();
      if (!recordingPermission) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  const sendVoiceMessage = () => {
    if (audioBlob && recordingDuration > 0) {
      onSendVoiceMessage(audioBlob, recordingDuration);
      setAudioBlob(null);
      setRecordingDuration(0);
    }
  };

  const playVoiceMessage = (messageId: string, audioUrl: string) => {
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    if (playingMessageId === messageId) {
      setPlayingMessageId(null);
      return;
    }

    if (!audioRefs.current[messageId]) {
      audioRefs.current[messageId] = new Audio(audioUrl);
      audioRefs.current[messageId].onended = () => {
        setPlayingMessageId(null);
      };
    }

    audioRefs.current[messageId].play();
    setPlayingMessageId(messageId);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateWaveform = (duration: number) => {
    // Generate a simple waveform visualization
    const points = Math.min(duration * 2, 40);
    return Array.from({ length: points }, () => Math.random() * 100);
  };

  if (recordingPermission === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <MicOff className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-medium">Microphone Access Required</p>
        <p className="text-red-600 text-sm">Please allow microphone access to send voice messages</p>
        <button
          onClick={checkMicrophonePermission}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
        >
          Grant Permission
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Messages List */}
      <div className="space-y-3">
        {voiceMessages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          const isPlaying = playingMessageId === message.id;
          const waveform = message.waveform || generateWaveform(message.duration);

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  isOwnMessage
                    ? 'bg-purple-500 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => playVoiceMessage(message.id, message.audio_url)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isOwnMessage ? 'bg-white/20' : 'bg-purple-100'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className={`w-4 h-4 ${isOwnMessage ? 'text-white' : 'text-purple-600'}`} />
                    ) : (
                      <Play className={`w-4 h-4 ${isOwnMessage ? 'text-white' : 'text-purple-600'}`} />
                    )}
                  </button>

                  {/* Waveform Visualization */}
                  <div className="flex items-center space-x-1 flex-1">
                    {waveform.slice(0, 20).map((height, index) => (
                      <div
                        key={index}
                        className={`w-1 rounded-full ${
                          isOwnMessage ? 'bg-white/60' : 'bg-gray-400'
                        }`}
                        style={{ height: `${Math.max(height / 4, 8)}px` }}
                      />
                    ))}
                  </div>

                  <span
                    className={`text-xs ${
                      isOwnMessage ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    {formatDuration(message.duration)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recording Interface */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {audioBlob ? (
          /* Preview Recorded Message */
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const audio = new Audio(URL.createObjectURL(audioBlob));
                audio.play();
              }}
              className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
            >
              <Play className="w-5 h-5 text-purple-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                {generateWaveform(recordingDuration).slice(0, 25).map((height, index) => (
                  <div
                    key={index}
                    className="w-1 bg-purple-400 rounded-full"
                    style={{ height: `${Math.max(height / 4, 8)}px` }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatDuration(recordingDuration)}
              </p>
            </div>
            <button
              onClick={cancelRecording}
              className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
            <button
              onClick={sendVoiceMessage}
              className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
            >
              <Send className="w-5 h-5 text-green-600" />
            </button>
          </div>
        ) : isRecording ? (
          /* Recording in Progress */
          <div className="flex items-center space-x-3">
            <button
              onClick={stopRecording}
              className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse"
            >
              <MicOff className="w-6 h-6 text-white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-full animate-pulse"
                    style={{ 
                      height: `${Math.random() * 20 + 8}px`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-red-600 mt-1 font-medium">
                Recording... {formatDuration(recordingDuration)}
              </p>
            </div>
            <button
              onClick={cancelRecording}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        ) : (
          /* Start Recording */
          <div className="flex items-center justify-center">
            <button
              onClick={startRecording}
              className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
            >
              <Mic className="w-6 h-6 text-white" />
            </button>
            <p className="ml-3 text-gray-600">Hold to record voice message</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMessaging;