import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Phone, Video, Search, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { messagingAPI } from '../services/api';
import PropTypes from 'prop-types';

export function MessagingPanel({ language, userId }) {
  const [conversations] = useState([
    {
      id: '1',
      name: 'Digital Dynamics',
      lastMessage: 'We can help with your project requirements',
      timestamp: '2:30 PM',
      unread: 2,
      online: true
    },
    {
      id: '2',
      name: 'Mobile Masters',
      lastMessage: 'Thanks for reaching out!',
      timestamp: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: '3',
      name: 'Marketing Mavens',
      lastMessage: 'Let me share our portfolio',
      timestamp: 'Monday',
      unread: 1,
      online: true
    }
  ]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: '1',
      senderId: '2',
      content: 'Hello! Thank you for your interest in our services.',
      timestamp: '2:15 PM',
      sent: true
    },
    {
      id: '2',
      senderId: userId,
      content: 'Hi! I need a mobile app for my business.',
      timestamp: '2:18 PM',
      sent: true
    },
    {
      id: '3',
      senderId: '2',
      content: 'Great! Could you tell me more about your requirements?',
      timestamp: '2:20 PM',
      sent: true
    },
    {
      id: '4',
      senderId: userId,
      content: 'I need an e-commerce app with payment integration.',
      timestamp: '2:25 PM',
      sent: true
    },
    {
      id: '5',
      senderId: '2',
      content: 'We can definitely help with that. We have experience with JazzCash and EasyPaisa integration.',
      timestamp: '2:30 PM',
      sent: true
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    const tempMessage = {
      id: Date.now().toString(),
      senderId: userId,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sent: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      // PRODUCTION: Uncomment when API is ready
      await messagingAPI.sendMessage(selectedConversation, newMessage);
      
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? { ...msg, sent: true } : msg)
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error - could show a notification
    } finally {
      setIsSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {language === 'ur' ? 'پیغامات' : 'Messages'}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={language === 'ur' ? 'تلاش کریں...' : 'Search...'}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedConversation === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12 bg-gradient-to-br from-[#FF8A2B] to-[#ff7a1b] flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {conv.name[0]}
                  </span>
                </Avatar>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{conv.name}</h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{conv.timestamp}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 w-5 h-5 bg-[#FF8A2B] text-white text-xs rounded-full flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-10 h-10 bg-gradient-to-br from-[#FF8A2B] to-[#ff7a1b] flex items-center justify-center">
                <span className="text-white font-semibold">
                  {selectedConv?.name[0]}
                </span>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedConv?.name}</h3>
                <p className="text-sm text-green-600">
                  {selectedConv?.online 
                    ? (language === 'ur' ? 'آن لائن' : 'Online')
                    : (language === 'ur' ? 'آف لائن' : 'Offline')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.senderId === userId
                        ? 'bg-[#FF8A2B] text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1`}>
                      <p className={`text-xs ${
                        message.senderId === userId ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {message.timestamp}
                      </p>
                      {message.senderId === userId && (
                        <span className="text-xs text-white/70">
                          {message.sent ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder={language === 'ur' ? 'پیغام لکھیں...' : 'Type a message...'}
                className="flex-1"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="bg-[#FF8A2B] hover:bg-[#ff7a1b] text-white"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {language === 'ur' 
                ? 'DEMO: حقیقی پیغامات بھیجے نہیں جاتے'
                : 'DEMO: Messages are not actually sent'}
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg text-gray-600">
              {language === 'ur' 
                ? 'پیغام دیکھنے کے لیے بات چیت منتخب کریں'
                : 'Select a conversation to view messages'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

MessagingPanel.propTypes = {
  language: PropTypes.oneOf(['en', 'ur']).isRequired,
  userId: PropTypes.string.isRequired
};