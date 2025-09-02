import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Send,
  Paperclip,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Clock,
  CheckCheck,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    leadId?: string;
    leadName?: string;
  };
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    online: boolean;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  type: 'direct' | 'group' | 'lead_discussion';
  title: string;
  archived: boolean;
  starred: boolean;
}

interface InAppMessagingProps {
  className?: string;
  leadId?: string;
}

export function InAppMessaging({ className, leadId }: InAppMessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Mock data for demonstration
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        participants: [
          { id: '1', name: 'João Silva', avatar: '', online: true },
          { id: user?.id || '2', name: user?.email?.split('@')[0] || 'Você', online: true }
        ],
        lastMessage: {
          id: '1',
          content: 'Preciso revisar o lead da Maria Santos',
          sender_id: '1',
          sender_name: 'João Silva',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          type: 'text'
        },
        unreadCount: 2,
        type: 'direct',
        title: 'João Silva',
        archived: false,
        starred: true
      },
      {
        id: '2',
        participants: [
          { id: '3', name: 'Ana Costa', avatar: '', online: false },
          { id: '4', name: 'Pedro Lima', avatar: '', online: true },
          { id: user?.id || '2', name: user?.email?.split('@')[0] || 'Você', online: true }
        ],
        lastMessage: {
          id: '2',
          content: 'Reunião de equipe às 15h',
          sender_id: '3',
          sender_name: 'Ana Costa',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true,
          type: 'text'
        },
        unreadCount: 0,
        type: 'group',
        title: 'Equipe de Vendas',
        archived: false,
        starred: false
      }
    ];

    if (leadId) {
      mockConversations.unshift({
        id: `lead-${leadId}`,
        participants: [
          { id: user?.id || '1', name: user?.email?.split('@')[0] || 'Você', online: true }
        ],
        lastMessage: {
          id: 'lead-msg-1',
          content: 'Discussão sobre este lead',
          sender_id: user?.id || '1',
          sender_name: user?.email?.split('@')[0] || 'Você',
          timestamp: new Date(),
          read: true,
          type: 'text',
          metadata: { leadId, leadName: 'Lead Específico' }
        },
        unreadCount: 0,
        type: 'lead_discussion',
        title: 'Discussão do Lead',
        archived: false,
        starred: false
      });
    }

    setConversations(mockConversations);
    if (!selectedConversation && mockConversations.length > 0) {
      setSelectedConversation(mockConversations[0].id);
    }
  }, [leadId, user, selectedConversation]);

  // Mock messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Oi! Como está o andamento do pipeline hoje?',
          sender_id: '1',
          sender_name: 'João Silva',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true,
          type: 'text'
        },
        {
          id: '2',
          content: 'Está indo bem! Temos 5 novos leads hoje.',
          sender_id: user?.id || '2',
          sender_name: user?.email?.split('@')[0] || 'Você',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          read: true,
          type: 'text'
        },
        {
          id: '3',
          content: 'Ótimo! Preciso revisar o lead da Maria Santos. Você pode me enviar os detalhes?',
          sender_id: '1',
          sender_name: 'João Silva',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          type: 'text'
        }
      ];

      setMessages(mockMessages);
    }
  }, [selectedConversation, user]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      sender_id: user?.id || 'current-user',
      sender_name: user?.email?.split('@')[0] || 'Você',
      timestamp: new Date(),
      read: true,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update conversation last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: message }
          : conv
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return timestamp.toLocaleDateString('pt-BR');
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_id === user?.id) {
      return message.read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />;
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Mensagens
          {conversations.reduce((acc, conv) => acc + conv.unreadCount, 0) > 0 && (
            <Badge variant="destructive">
              {conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex h-96">
          {/* Conversations List */}
          <div className="w-1/3 border-r">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="h-80">
              {filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={cn(
                    'flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b transition-colors',
                    selectedConversation === conversation.id && 'bg-muted'
                  )}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="relative">
                    {conversation.type === 'group' ? (
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {conversation.participants.length}
                        </span>
                      </div>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participants[0]?.avatar} />
                        <AvatarFallback>
                          {conversation.participants[0]?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {conversation.participants.some(p => p.online) && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate flex items-center gap-1">
                        {conversation.title}
                        {conversation.starred && <Star className="h-3 w-3 text-warning fill-current" />}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {conversation.lastMessage && formatMessageTime(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.lastMessage?.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentConversation.participants[0]?.avatar} />
                      <AvatarFallback>
                        {currentConversation.participants[0]?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-sm">{currentConversation.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {currentConversation.participants.length} participante(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          {currentConversation.starred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar conversa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.sender_id === user?.id && 'flex-row-reverse'
                        )}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.sender_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className={cn(
                          'max-w-[70%] space-y-1',
                          message.sender_id === user?.id && 'text-right'
                        )}>
                          <div className={cn(
                            'inline-block px-3 py-2 rounded-lg text-sm',
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          )}>
                            {message.type === 'text' && message.content}
                          </div>

                          <div className={cn(
                            'flex items-center gap-1 text-xs text-muted-foreground',
                            message.sender_id === user?.id && 'justify-end'
                          )}>
                            <Clock className="h-3 w-3" />
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {getMessageStatus(message)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {currentConversation.participants[0]?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted px-3 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t">
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[40px] max-h-32 resize-none"
                        rows={1}
                      />
                    </div>
                    
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecione uma conversa para começar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}