import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bot, Send, User, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';

export default function Curax() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      
      const { data } = await supabase
        .from('chat_messages' as never)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (data) {
        setMessages(data as unknown as ChatMessage[]);
      }
      setHistoryLoading(false);
    }
    
    if (user) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // Save user message to database
      await supabase
        .from('chat_messages' as never)
        .insert({
          user_id: user.id,
          role: 'user',
          content: userMessage,
        } as never);

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('curax-chat', {
        body: { 
          message: userMessage,
          userId: user.id,
        },
      });

      if (error) throw error;

      const assistantMessage = data.response;

      // Save assistant message to database
      await supabase
        .from('chat_messages' as never)
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: assistantMessage,
        } as never);

      // Add assistant message to UI
      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Curax AI</h1>
              <p className="text-muted-foreground">Your personal medical AI assistant</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Medical Disclaimer</p>
              <p className="text-muted-foreground">
                Curax provides general health information only. It does not replace professional medical advice, 
                diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Container */}
        <Card className="h-[60vh] flex flex-col">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Chat with Curax
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {historyLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Hi! I'm Curax, your health assistant
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask me about general health topics, lifestyle recommendations, 
                    understanding symptoms, or dietary advice. How can I help you today?
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-8 w-8 bg-primary/10 flex-shrink-0 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="h-8 w-8 bg-secondary flex-shrink-0 flex items-center justify-center">
                          <User className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 bg-primary/10 flex-shrink-0 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted p-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your health question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
