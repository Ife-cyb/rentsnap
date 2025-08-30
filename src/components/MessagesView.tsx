import React, { useState, useEffect } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { Search, Send, ArrowLeft, Loader } from 'lucide-react';

const MessagesView: React.FC = () => {
  const { user } = useAuth();
  const { conversations, messages, loading, fetchMessages, sendMessage, subscribeToMessages } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      
      // Subscribe to real-time messages
      const subscription = subscribeToMessages(selectedConversation);
      return () => subscription?.unsubscribe();
    }
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    const result = await sendMessage(selectedConversation, newMessage.trim());
    
    if (result.success) {
      setNewMessage('');
    }
    setSendingMessage(false);
  };

  const getOtherParticipant = (conversation: any) => {
    if (!user) return null;
    return conversation.tenant_id === user.id ? conversation.landlord : conversation.tenant;
  };

  const getLastMessage = (conversation: any) => {
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
    return lastMessage?.content || 'No messages yet';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    const otherParticipant = getOtherParticipant(conversation);
    const conversationMessages = messages[selectedConversation] || [];

    if (!conversation || !otherParticipant) return null;

    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <button
            onClick={() => setSelectedConversation(null)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={otherParticipant.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
            alt={otherParticipant.full_name}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{otherParticipant.full_name}</h3>
            <p className="text-sm text-gray-500">{conversation.properties?.title}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversationMessages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            
            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwnMessage 
                    ? 'bg-purple-500 text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                }`}>
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          const lastMessage = getLastMessage(conversation);
          const propertyImage = conversation.properties?.property_images?.[0]?.image_url;
          
          if (!otherParticipant) return null;

          return (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <img
                  src={otherParticipant.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={otherParticipant.full_name}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">
                      {otherParticipant.full_name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatTime(conversation.updated_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.properties?.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {lastMessage}
                  </p>
                </div>
                {propertyImage && (
                  <img
                    src={propertyImage}
                    alt="Property"
                    className="w-10 h-10 rounded-lg ml-2"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {conversations.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-600">Start connecting with landlords and tenants!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesView;