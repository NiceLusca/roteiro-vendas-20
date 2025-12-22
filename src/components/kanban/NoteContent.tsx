import React from 'react';
import { linkifyText } from '@/utils/linkify';
import { CommentImageRenderer } from './CommentImageRenderer';

interface NoteContentProps {
  text: string;
}

export function NoteContent({ text }: NoteContentProps) {
  // Parse the text to find image markers [[IMG:path]]
  const imageRegex = /\[\[IMG:([^\]]+)\]\]/g;
  const parts: { type: 'text' | 'image'; content: string }[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = imageRegex.exec(text)) !== null) {
    // Add text before the image
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    // Add the image
    parts.push({ type: 'image', content: match[1] });
    lastIndex = imageRegex.lastIndex;
  }
  
  // Add remaining text after last image
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }
  
  // If no parts found, just render as text
  if (parts.length === 0) {
    return <p className="text-sm whitespace-pre-wrap">{linkifyText(text)}</p>;
  }
  
  return (
    <div className="space-y-2">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part.type === 'text' ? (
            <p className="text-sm whitespace-pre-wrap">{linkifyText(part.content)}</p>
          ) : (
            <CommentImageRenderer filePath={part.content} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
