'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Zap } from 'lucide-react';

interface LowTokenWarningProps {
  tokenBalance: number;
  threshold?: number;
  isVisible: boolean;
  onUpgrade?: () => void;
  onPurchaseTokens?: () => void;
}

export function LowTokenWarning({ 
  tokenBalance, 
  threshold = 200, 
  isVisible,
  onUpgrade,
  onPurchaseTokens
}: LowTokenWarningProps) {
  if (!isVisible || tokenBalance >= threshold) {
    return null;
  }

  const isVeryLow = tokenBalance < threshold / 2; // Show more urgent warning below 100 tokens

  return (
    <Card className={`${isVeryLow ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
      <CardContent className="pt-6">
        <div className={`flex items-start gap-4 ${isVeryLow ? 'text-red-600' : 'text-amber-600'}`}>
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">
              {isVeryLow ? 'Critical: Very Low Token Balance' : 'Approaching Token Limit'}
            </p>
            <p className={`text-sm mt-1 ${isVeryLow ? 'text-red-600/80' : 'text-amber-600/80'}`}>
              You have {tokenBalance.toLocaleString()} tokens remaining. 
              {isVeryLow 
                ? ' Consider upgrading your plan or purchasing additional tokens immediately to continue creating content.'
                : ' Consider upgrading your plan or purchasing additional tokens.'
              }
            </p>
            <div className="flex gap-3 mt-4">
              {onUpgrade && (
                <Button 
                  onClick={onUpgrade}
                  size="sm"
                  className="bg-primary/80 hover:bg-primary shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
              {onPurchaseTokens && (
                <Button 
                  onClick={onPurchaseTokens}
                  size="sm" 
                  variant="outline"
                  className={`${isVeryLow ? 'border-red-500/20 hover:bg-red-500/5' : 'border-amber-500/20 hover:bg-amber-500/5'}`}
                >
                  Purchase Tokens
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}