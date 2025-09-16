import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface HelpFeedbackProps {
  sectionId: string;
}

export function HelpFeedback({ sectionId }: HelpFeedbackProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleRating = (type: 'positive' | 'negative') => {
    setRating(type);
    if (type === 'positive') {
      // For positive feedback, just thank the user
      toast({
        title: 'Obrigado pelo feedback!',
        description: 'Ficamos felizes que o conteúdo foi útil.',
      });
      setSubmitted(true);
    } else {
      // For negative feedback, show the feedback form
      setShowFeedback(true);
    }
  };

  const handleSubmitFeedback = () => {
    // Here you would typically send the feedback to your backend
    console.log('Feedback submitted:', {
      sectionId,
      rating,
      feedback
    });
    
    toast({
      title: 'Feedback enviado!',
      description: 'Obrigado por nos ajudar a melhorar o conteúdo.',
    });
    
    setSubmitted(true);
    setShowFeedback(false);
  };

  if (submitted) {
    return (
      <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-medium">
            Obrigado pelo seu feedback! Isso nos ajuda a melhorar.
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Esta página foi útil?</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={rating === 'positive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRating('positive')}
              className="gap-1"
            >
              <ThumbsUp className="h-3 w-3" />
              Sim
            </Button>
            <Button
              variant={rating === 'negative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRating('negative')}
              className="gap-1"
            >
              <ThumbsDown className="h-3 w-3" />
              Não
            </Button>
          </div>
        </div>

        {showFeedback && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Como podemos melhorar este conteúdo?
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Compartilhe suas sugestões..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedback(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim()}
                className="gap-1"
              >
                <Send className="h-3 w-3" />
                Enviar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}