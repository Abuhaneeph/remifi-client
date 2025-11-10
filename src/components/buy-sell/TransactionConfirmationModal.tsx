import React from 'react';

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType: 'buy' | 'sell';
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  toAmount: number;
}

const TransactionConfirmationModal: React.FC<TransactionConfirmationModalProps> = ({
  isOpen,
  onClose,
  transactionType,
  amount,
  fromCurrency,
  toCurrency,
  toAmount
}) => {
  // Helper function to format numbers without trailing zeros
  const formatAmount = (value: number): string => {
    if (value === 0) return '0';
    // Remove trailing zeros
    return parseFloat(value.toFixed(6)).toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-secondary rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-white/10">
        <div>
          {/* Transaction SVG */}
          <div className="mb-6">
            <img src="/assets/transaction.svg" alt="Transaction confirmed" className="w-full h-auto" />
          </div>
          
          <h3 className="text-xl font-semibold text-primary mb-4 text-left">We received your transfer.</h3>
          
          <p className="text-sm text-secondary mb-6 text-left">
            {transactionType === 'buy' ? (
              <>
                You've successfully bought <span className="text-accent-green font-semibold">{formatAmount(toAmount)} {toCurrency}</span> for <span className="text-accent-green font-semibold">{formatAmount(amount)} {fromCurrency}</span>. Your wallet has been updated. You can now use your {toCurrency} for transactions or withdraw it anytime.
              </>
            ) : (
              <>
                You've successfully sold <span className="text-accent-green font-semibold">{formatAmount(amount)} {fromCurrency}</span> for <span className="text-accent-green font-semibold">{formatAmount(toAmount)} {toCurrency}</span>. Your wallet has been updated. You can now use your {toCurrency} for transactions or withdraw it anytime.
              </>
            )}
          </p>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmationModal;
