import React, { useState, useRef, useEffect } from 'react';
import { useVirtualShowings } from '../hooks/useVirtualShowings';
import { useAuth } from '../hooks/useAuth';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, 
  Calendar, Clock, Share, Settings, MessageCircle, Hand,
  Camera, Monitor, Maximize, Volume2, VolumeX, Loader, Plus,
  X, Send, AlertCircle
} from 'lucide-react';

interface LiveVirtualShowingsProps {
  propertyId?: string;
  isHost?: boolean;
}

const LiveVirtualShowings: React.FC<LiveVirtualShowingsProps> = ({ 
  propertyId, 
  isHost = false 
}) => {
  const { user, profile } = useAuth();
  const { 
    showings, 
    activeShowing, 
    participants,
    loading, 
    error,
    isHost: confirmedHost,
    fetchShowings,
    createShowing,
    startShowing,
    endShowing,
    joinShowing,
    leaveShowing,
    updateParticipantStatus
  } = useVirtualShowings(propertyId);
  
  // Local state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [showingError, setShowingError] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Clean up media streams when component unmounts
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const initializeMediaDevices = async () => {
    try {
      // Stop any existing streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Request new media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Update state based on initial track state
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      setIsVideoOn(videoTrack.enabled);
      setIsAudioOn(audioTrack.enabled);
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setShowingError('Could not access camera or microphone. Please check your device permissions.');
      return null;
    }
  };

  const joinVirtualShowing = async (showingId: string) => {
    try {
      setShowingError(null);
      
      // Join the showing in the database
      const result = await joinShowing(showingId);
      
      if (!result.success) {
        setShowingError(result.error);
        return;
      }
      
      // Initialize media devices
      const stream = await initializeMediaDevices();
      if (!stream) return;
      
      // If this is a real showing, we would connect to the WebRTC session here
      // For demo purposes, we'll just display the local video
      
      // Update participant status
      await updateParticipantStatus({
        is_video_on: true,
        is_muted: false
      });
      
      // Add some mock chat messages
      setChatMessages([
        {
          id: '1',
          sender: 'System',
          content: 'Welcome to the virtual showing!',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          sender: result.showing.host?.full_name || 'Host',
          content: 'Hi everyone! I\'ll be showing you around this property today.',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error joining showing:', error);
      setShowingError('Failed to join the virtual showing. Please try again.');
    }
  };

  const leaveVirtualShowing = async () => {
    try {
      // Leave the showing in the database
      await leaveShowing();
      
      // Stop media streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Reset state
      setIsVideoOn(true);
      setIsAudioOn(true);
      setIsScreenSharing(false);
      setIsHandRaised(false);
      setChatMessages([]);
      setNewMessage('');
    } catch (error) {
      console.error('Error leaving showing:', error);
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        
        // Update participant status in database
        await updateParticipantStatus({
          is_video_on: videoTrack.enabled
        });
      }
    }
  };

  const toggleAudio = async () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
        
        // Update participant status in database
        await updateParticipantStatus({
          is_muted: !audioTrack.enabled
        });
      }
    }
  };

  const startScreenShare = async () => {
    try {
      // Get screen sharing stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Replace video track in local stream
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.removeTrack(videoTrack);
          videoTrack.stop();
        }
        
        const screenTrack = screenStream.getVideoTracks()[0];
        localStream.addTrack(screenTrack);
        
        // Update video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }
      
      setIsScreenSharing(true);
      
      // Handle when user stops screen sharing
      screenStream.getVideoTracks()[0].onended = async () => {
        await stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      setShowingError('Failed to start screen sharing. Please try again.');
    }
  };

  const stopScreenShare = async () => {
    try {
      // Stop screen sharing and revert to camera
      if (localStream) {
        // Remove screen share track
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.removeTrack(videoTrack);
          videoTrack.stop();
        }
        
        // Get new camera track
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        // Add camera track to local stream
        localStream.addTrack(newVideoTrack);
        
        // Update video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }
      
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    
    // Add system message to chat
    if (!isHandRaised) {
      addChatMessage('System', `${user?.email} raised their hand`);
    } else {
      addChatMessage('System', `${user?.email} lowered their hand`);
    }
  };

  const addChatMessage = (sender: string, content: string) => {
    const message = {
      id: Date.now().toString(),
      sender,
      content,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, message]);
  };

  const sendChatMessage = () => {
    if (newMessage.trim()) {
      addChatMessage(profile?.full_name || user?.email || 'You', newMessage.trim());
      setNewMessage('');
    }
  };

  const handleScheduleShowing = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !propertyId) {
      setShowingError('Missing required information');
      return;
    }
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const durationStr = formData.get('duration') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    if (!dateStr || !timeStr || !durationStr || !title) {
      setShowingError('Please fill in all required fields');
      return;
    }
    
    // Combine date and time
    const scheduledTime = new Date(`${dateStr}T${timeStr}`);
    
    // Create showing
    const result = await createShowing({
      property_id: propertyId,
      title,
      description,
      scheduled_time: scheduledTime.toISOString(),
      duration: parseInt(durationStr),
      status: 'scheduled'
    });
    
    if (result.success) {
      setShowScheduleModal(false);
      await fetchShowings();
    } else {
      setShowingError(result.error);
    }
  };

  const handleStartShowing = async (showingId: string) => {
    try {
      // In a real app, this would generate a WebRTC session URL
      // For demo purposes, we'll use a mock URL
      const mockMeetingUrl = `https://meet.example.com/${showingId}`;
      
      const result = await startShowing(showingId, mockMeetingUrl);
      
      if (result.success) {
        // Join the showing
        await joinVirtualShowing(showingId);
      } else {
        setShowingError(result.error);
      }
    } catch (error) {
      console.error('Error starting showing:', error);
      setShowingError('Failed to start the showing. Please try again.');
    }
  };

  const handleEndShowing = async () => {
    if (!activeShowing) return;
    
    try {
      // In a real app, this might include a recording URL
      const result = await endShowing(activeShowing.id);
      
      if (result.success) {
        await leaveVirtualShowing();
      } else {
        setShowingError(result.error);
      }
    } catch (error) {
      console.error('Error ending showing:', error);
      setShowingError('Failed to end the showing. Please try again.');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Render active showing view
  if (activeShowing) {
    return (
      <div className="flex-1 bg-gray-900 relative">
        {/* Video Grid */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
          {/* Host Video (or remote video in a real implementation) */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            {confirmedHost ? (
              // If user is host, show local video here
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              // Otherwise show remote video (host)
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {confirmedHost ? 'You (Host)' : 'Host'}
            </div>
            
            {/* Show placeholder if video is off */}
            {(!isVideoOn && confirmedHost) && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Local Video (or empty grid space for additional participants) */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            {!confirmedHost ? (
              // If user is not host, show local video here
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              // Otherwise show a placeholder for participants
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-400" />
                <p className="text-gray-400 ml-2">Waiting for participants...</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {!confirmedHost ? 'You' : 'Participants'}
            </div>
            
            {/* Show placeholder if video is off */}
            {(!isVideoOn && !confirmedHost) && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Property Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg max-w-sm">
          <h3 className="font-semibold mb-1">{activeShowing.title}</h3>
          <p className="text-sm text-gray-300">{activeShowing.properties?.address}</p>
          <div className="flex items-center mt-2 text-sm">
            <Users className="w-4 h-4 mr-1" />
            <span>{participants.length} participants</span>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isAudioOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isVideoOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {confirmedHost && (
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              <Monitor className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={toggleHandRaise}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isHandRaised ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-white'
            }`}
          >
            <Hand className="w-6 h-6" />
          </button>

          <button
            onClick={confirmedHost ? handleEndShowing : leaveVirtualShowing}
            className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Panel */}
        <div className="absolute right-4 top-4 bottom-20 w-80 bg-white rounded-lg shadow-lg flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Chat</h3>
          </div>
          
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((message) => (
              <div key={message.id} className="text-sm">
                <div className="font-medium text-gray-900">{message.sender}</div>
                <div className="text-gray-700">{message.content}</div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={sendChatMessage}
                className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {showingError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
            {showingError}
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading virtual showings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Showings</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchShowings()}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main showings list view
  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Virtual Showings</h1>
          {isHost && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Showing
            </button>
          )}
        </div>

        {/* Live Showings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showings.filter(s => s.status === 'live').map((showing) => {
              const { date, time } = formatDateTime(showing.scheduled_time);
              const primaryImage = showing.properties?.property_images?.find(img => img.is_primary)?.image_url ||
                                 showing.properties?.property_images?.[0]?.image_url ||
                                 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400';
              
              return (
                <div key={showing.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-red-200">
                  <div className="relative">
                    <img
                      src={primaryImage}
                      alt={showing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                      🔴 LIVE
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                      {showing.showing_participants?.length || 0} viewers
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{showing.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{showing.properties?.address}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{showing.duration} min</span>
                      </div>
                      <button
                        onClick={() => joinVirtualShowing(showing.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        Join Live
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {showings.filter(s => s.status === 'live').length === 0 && (
              <div className="col-span-full text-center py-8">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No live showings at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Showings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Showings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showings.filter(s => s.status === 'scheduled').map((showing) => {
              const { date, time } = formatDateTime(showing.scheduled_time);
              const primaryImage = showing.properties?.property_images?.find(img => img.is_primary)?.image_url ||
                                 showing.properties?.property_images?.[0]?.image_url ||
                                 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400';
              const isShowingHost = showing.host_id === user?.id;
              
              return (
                <div key={showing.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="relative">
                    <img
                      src={primaryImage}
                      alt={showing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                      {showing.duration} min
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{showing.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{showing.properties?.address}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{time}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {isShowingHost ? (
                        <button
                          onClick={() => handleStartShowing(showing.id)}
                          className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                        >
                          Start Showing
                        </button>
                      ) : (
                        <button
                          onClick={() => joinVirtualShowing(showing.id)}
                          className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                        >
                          Join
                        </button>
                      )}
                      <button className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {showings.filter(s => s.status === 'scheduled').length === 0 && (
              <div className="col-span-full text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No upcoming showings scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Past Showings */}
        {showings.filter(s => s.status === 'completed').length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Showings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showings.filter(s => s.status === 'completed').map((showing) => {
                const { date, time } = formatDateTime(showing.scheduled_time);
                const primaryImage = showing.properties?.property_images?.find(img => img.is_primary)?.image_url ||
                                   showing.properties?.property_images?.[0]?.image_url ||
                                   'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400';
                
                return (
                  <div key={showing.id} className="bg-white rounded-2xl shadow-sm overflow-hidden opacity-75">
                    <div className="relative">
                      <img
                        src={primaryImage}
                        alt={showing.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-gray-800 text-white px-2 py-1 rounded-full text-xs">
                        Completed
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{showing.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{showing.properties?.address}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{showing.showing_participants?.length || 0} attended</span>
                        </div>
                      </div>
                      
                      {showing.recording_url && (
                        <a
                          href={showing.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-gray-100 text-gray-700 py-2 text-center rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                          Watch Recording
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {showings.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Virtual Showings</h3>
            <p className="text-gray-600 mb-6">Schedule or join virtual property tours</p>
            {isHost && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                Schedule Your First Showing
              </button>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Schedule Virtual Showing</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {showingError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {showingError}
              </div>
            )}
            
            <form onSubmit={handleScheduleShowing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Virtual Tour of Downtown Loft"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe what viewers will see in this virtual showing..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  name="time"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <select
                  name="duration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="15">15 minutes</option>
                  <option value="30" selected>30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVirtualShowings;