import React from 'react';

interface OperationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: React.ReactNode;
  ctaLabel?: string;
}

const OperationConfirmationModal: React.FC<OperationConfirmationModalProps> = ({
  isOpen,
  onClose,
  title = 'We received your transfer.',
  message,
  ctaLabel = 'Go to Dashboard',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-secondary rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-white/10">
        <div>
          <div className="mb-6">
            <img src="/assets/transaction.svg" alt="Transaction confirmed" className="w-full h-auto" />
          </div>

          <h3 className="text-xl font-semibold text-primary mb-4 text-left">{title}</h3>

          <div className="text-sm text-secondary mb-6 text-left">{message}</div>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationConfirmationModal;


