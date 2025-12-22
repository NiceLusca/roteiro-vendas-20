import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface CommentImageRendererProps {
  filePath: string;
}

export function CommentImageRenderer({ filePath }: CommentImageRendererProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const { data, error: signError } = await supabase.storage
          .from('lead-attachments')
          .createSignedUrl(filePath, 60 * 60); // 1 hour validity
        
        if (signError || !data?.signedUrl) {
          console.error('Error getting signed URL:', signError);
          setError(true);
          return;
        }
        
        setImageUrl(data.signedUrl);
      } catch (err) {
        console.error('Error fetching image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [filePath]);

  if (loading) {
    return <Skeleton className="w-full max-w-[200px] h-[150px] rounded-lg" />;
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full max-w-[200px] h-[100px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
        Imagem não disponível
      </div>
    );
  }

  return (
    <a 
      href={imageUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block"
    >
      <img 
        src={imageUrl} 
        alt="Imagem do comentário"
        className="max-w-full max-h-[200px] rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
        onError={() => setError(true)}
      />
    </a>
  );
}
