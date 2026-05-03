import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FeedbackButtonsProps {
  id: string;
  context: string;
}

export function FeedbackButtons({ id, context }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    toast.success(`Feedback recorded! Thank you for helping us improve ${context}.`);
    // In a real app, this would send a request to a backend/analytics
    console.log(`AI Feedback [${context}]: ${type} for ID: ${id}`);
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Was this helpful?</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-full transition-all ${
            feedback === 'up' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
          }`}
          onClick={() => handleFeedback('up')}
        >
          {feedback === 'up' ? <Check size={14} /> : <ThumbsUp size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-full transition-all ${
            feedback === 'down' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
          }`}
          onClick={() => handleFeedback('down')}
        >
          <ThumbsDown size={14} />
        </Button>
      </div>
    </div>
  );
}
