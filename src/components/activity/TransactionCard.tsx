import React from 'react';
import type { TokenSymbol } from '../swap/tokens';

interface Transaction {
  id: string;
  type: 'swap' | 'buy' | 'sell' | 'deposit' | 'withdraw' | 'add-liquidity' | 'remove-liquidity' | 'stake' | 'unstake' | 'claim-rewards';
  fromToken: TokenSymbol;
  toToken: TokenSymbol;
  fromAmount: number;
  toAmount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  hash?: string;
  fee?: number;
  poolId?: string;
  apy?: number;
}

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-accent-green';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
      default:
        return '?';
    }
  };


  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="bg-tertiary/50 rounded-lg p-3 md:p-4 border border-white/5 hover:bg-tertiary/70 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left side - Transaction info */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-medium capitalize">{transaction.type}</span>
              <span className={`text-xs ${getStatusColor(transaction.status)}`}>
                {getStatusIcon(transaction.status)}
              </span>
            </div>
            <div className="text-sm text-secondary">
              {transaction.fromAmount.toLocaleString()} {transaction.fromToken} → {transaction.toAmount.toLocaleString()} {transaction.toToken}
            </div>
          </div>
        </div>

        {/* Right side - Time and hash */}
        <div className="text-right">
          <div className="text-xs text-secondary">
            {formatTimeAgo(transaction.timestamp)}
          </div>
          {transaction.hash && (
            <div className="text-xs text-accent-green font-mono mt-2 break-all">
              {transaction.hash}
            </div>
          )}
        </div>
      </div>

      {/* APY info if available */}
      {transaction.apy && (
        <div className="border-t border-white/10 pt-3 mt-3">
          <div className="text-xs">
            <span className="text-secondary">APY:</span>
            <div className="text-accent-green font-medium mt-0.5 inline-block ml-2">{transaction.apy}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
