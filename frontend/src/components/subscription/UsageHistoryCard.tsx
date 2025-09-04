'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, History, Loader2, AlertTriangle } from 'lucide-react';
import { Transaction } from '@/lib/hooks/useTransactionHistory';
import { formatDistanceToNow } from 'date-fns';

interface UsageHistoryCardProps {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  onViewFullHistory: () => void;
}

export function UsageHistoryCard({ 
  transactions, 
  isLoading, 
  error, 
  onViewFullHistory 
}: UsageHistoryCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Usage History
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent token consumption
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse" />
                  <div>
                    <div className="h-4 w-32 bg-muted-foreground/20 rounded-md animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-muted-foreground/20 rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-muted-foreground/20 rounded-md animate-pulse" />
              </div>
            ))}
            <div className="h-10 w-full bg-muted-foreground/20 rounded-md animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-destructive" />
            Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-semibold">Could not load transaction history</p>
            <p className="text-sm">Please try refreshing the page. If the error persists, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTransactionColor = (type: Transaction['transactionType']) => {
    switch (type) {
      case 'allocation':
      case 'purchase':
        return 'text-green-600';
      case 'deduction':
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Usage History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Recent token consumption
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length > 0 ? (
            <>
              {transactions.slice(0, 5).map((transaction) => (
                <div 
                  key={transaction.transactionId} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.transactionDate), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${getTransactionColor(transaction.transactionType)}`}>
                    {transaction.transactionType === 'deduction' ? '' : '+'}
                    {transaction.tokenAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transaction history available</p>
            </div>
          )}
          <Button 
            onClick={onViewFullHistory}
            variant="outline" 
            className="w-full group hover:bg-primary/5"
          >
            View Full History
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}