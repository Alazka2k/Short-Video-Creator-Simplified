'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Select from '@/components/ui/select';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Subscription } from '@/lib/hooks/useSubscription';
import cancellationReasonsData from '@/data/subscription/reasons_for_cancellation.json';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback?: { reason?: string; comments?: string }) => Promise<void>;
  subscription: Subscription | null;
  isLoading?: boolean;
}

// Load cancellation reasons from configurable JSON
const CANCELLATION_REASONS = cancellationReasonsData;

export function CancellationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  subscription, 
  isLoading = false 
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedbackComments, setFeedbackComments] = useState<string>('');
  const [step, setStep] = useState<'confirm' | 'feedback'>('confirm');

  const handleClose = () => {
    if (!isLoading) {
      setStep('confirm');
      setSelectedReason('');
      setFeedbackComments('');
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (step === 'confirm') {
      setStep('feedback');
      return;
    }

    // Step is 'feedback' - proceed with cancellation
    try {
      const feedback = {
        reason: selectedReason || undefined,
        comments: feedbackComments.trim() || undefined
      };
      await onConfirm(feedback);
      handleClose();
    } catch (error) {
      // Error handling will be managed by the parent component
      console.error('Cancellation failed:', error);
    }
  };

  const handleBack = () => {
    if (step === 'feedback') {
      setStep('confirm');
    }
  };

  const planName = subscription?.plan_name || 'Current Plan';
  const renewalDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            {step === 'confirm' ? (
              <>
                You're about to cancel your <strong>{planName}</strong> subscription.
                {renewalDate && (
                  <span className="block mt-2 text-sm">
                    You'll keep access to all features until <strong>{renewalDate}</strong>, 
                    then your account will be downgraded to the Free tier.
                  </span>
                )}
              </>
            ) : (
              "Help us improve by sharing why you're cancelling. Your feedback is valuable and completely optional."
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">What happens when you cancel:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Your subscription will be cancelled immediately</li>
                <li>• Until the paid period ends, you'll keep all premium features</li>
                <li>• Monthly token renewals will continue</li>
                <li>• After cancellation, you'll be moved to the Free tier</li>
                <li>• You can resubscribe at any time</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'feedback' && (
          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="cancellation-reason" className="block text-sm font-medium mb-3">
                What's the main reason for cancelling? (Optional)
              </label>
              <Select 
                data={CANCELLATION_REASONS}
                onChange={(value: string | null) => setSelectedReason(value || '')}
                value={selectedReason || undefined}
                title="Select a reason..."
                allowDeselect={true}
              />
            </div>
            
            <div>
              <label htmlFor="feedback-comments" className="block text-sm font-medium mb-3">
                Any additional feedback to help us improve? (Optional)
              </label>
              <Textarea
                id="feedback-comments"
                placeholder="Tell us more about your experience or what could make you stay..."
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {feedbackComments.length}/500 characters
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'feedback' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Keep Subscription
          </Button>
          
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {step === 'confirm' ? 'Processing...' : 'Cancelling...'}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {step === 'confirm' ? 'Continue' : 'Cancel Subscription'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}