import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OperationConfirmationModal from '../../components/common/OperationConfirmationModal';
import { useContractInstances, CONTRACT_ADDRESSES } from '../../provider/ContractInstanceProvider';
import tokens from '../../lib/Tokens/tokens';
import { toast } from 'react-toastify';
import { roundToTwoDecimalPlaces } from '../../lib/utils';

interface CheckoutState {
  utilityType: 'water' | 'electricity' | 'gas' | 'cable' | 'internet' | 'flight';
  summaryTitle: string;
  summaryDetails: Record<string, string | number>;
  amount: number; // fiat or quote amount to be paid in stablecoin equivalent
  currency?: string; // optional currency label
}

const UtilityCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as Partial<CheckoutState>;

  const { 
    TEST_TOKEN_CONTRACT_INSTANCE, 
    isConnected,
    fetchBalance
  } = useContractInstances();

  // Filter tokens excluding the first one (APE - native token)
  const availableTokens = tokens.filter(t => t.id > 1 && t.address);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string>(availableTokens[0]?.symbol || 'USDT');
  const selectedToken = availableTokens.find(t => t.symbol === selectedTokenSymbol);

  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [hasApproved, setHasApproved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch balance for selected token
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!isConnected || !selectedToken?.address) return;
      
      try {
        const balance = await fetchBalance(selectedToken.address);
        if (balance !== undefined) {
          const balanceValue = parseFloat(balance);
          setTokenBalance(roundToTwoDecimalPlaces(balanceValue));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchTokenBalance();
    setHasApproved(false); // Reset approval when token changes
  }, [isConnected, selectedToken, fetchBalance]);

  const canConfirm = useMemo(() => {
    return !!state.utilityType && 
           (state.amount ?? 0) > 0 && 
           isConnected && 
           selectedToken && 
           tokenBalance >= (state.amount ?? 0);
  }, [state.utilityType, state.amount, isConnected, selectedToken, tokenBalance]);

  // Mock recipient address for utility payment (in real app, this would be a contract address)
  const utilityRecipientAddress = CONTRACT_ADDRESSES.swapAddress || '0x0000000000000000000000000000000000000000';

  // Approve token spending
  const handleApprove = async () => {
    if (!selectedToken?.address || state.amount == null) return;

    try {
      setIsApproving(true);
      const TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(selectedToken.address);
      if (!TOKEN_CONTRACT) {
        toast.error('Failed to get token contract');
        return;
      }

      const amountInWei = (state.amount * Math.pow(10, 18)).toString();
      const APPROVE_TX = await TOKEN_CONTRACT.approve(utilityRecipientAddress, amountInWei);
      console.log(`Approval Loading - ${APPROVE_TX.hash}`);
      await APPROVE_TX.wait();
      console.log(`Approval Success - ${APPROVE_TX.hash}`);
      
      setHasApproved(true);
      toast.success(`${selectedToken.symbol} approved`);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  // Transfer tokens (withdraw)
  const handleConfirm = async () => {
    if (!canConfirm || !selectedToken?.address || state.amount == null) return;
    
    if (!hasApproved) {
      toast.error('Please approve token spending first');
      return;
    }

    try {
      setIsProcessing(true);
      const TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(selectedToken.address);
      if (!TOKEN_CONTRACT) {
        toast.error('Failed to get token contract');
        return;
      }

      const amountInWei = (state.amount * Math.pow(10, 18)).toString();
      const TRANSFER = await TOKEN_CONTRACT.transfer(utilityRecipientAddress, amountInWei);
      console.log(`Transfer Loading - ${TRANSFER.hash}`);
      await TRANSFER.wait();
      console.log(`Transfer Success - ${TRANSFER.hash}`);
      
      toast.success('Payment successful!');
    setShowSuccess(true);
      
      // Refresh balance
      const balance = await fetchBalance(selectedToken.address);
      if (balance !== undefined) {
        setTokenBalance(roundToTwoDecimalPlaces(balance));
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto bg-secondary rounded-2xl p-6 md:p-8 border border-white/10">
        <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-1">Checkout</h1>
        <p className="text-secondary mb-6">Review details and pay with your stablecoin.</p>

        {/* Summary */}
        <div className="bg-tertiary rounded-xl p-4 md:p-5 border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-primary font-medium capitalize">{state.summaryTitle || state.utilityType || 'Utility'}</div>
            {state.amount != null && (
              <div className="text-primary font-semibold">{state.currency ? `${state.currency} ` : ''}{state.amount}</div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(state.summaryDetails || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-secondary capitalize">{k.replace(/([A-Z])/g,' $1').trim()}</span>
                <span className="text-primary font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment options */}
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm text-secondary mb-2">Select Token</label>
            <select 
              value={selectedTokenSymbol} 
              onChange={(e) => setSelectedTokenSymbol(e.target.value)} 
              className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              disabled={!isConnected}
            >
              {availableTokens.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            {isConnected && selectedToken && (
              <div className="mt-2 text-sm text-secondary">
                Balance: {tokenBalance.toFixed(2)} {selectedToken.symbol}
          </div>
            )}
          </div>
        </div>

        {/* Approval button */}
        {!hasApproved && selectedToken && state.amount && state.amount > 0 && (
          <button
            onClick={handleApprove}
            disabled={!isConnected || isApproving || !selectedToken}
            className={`w-full mb-4 px-6 py-3 rounded-xl font-semibold transition-colors ${
              isConnected && !isApproving && selectedToken
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-tertiary text-secondary cursor-not-allowed'
            }`}
          >
            {isApproving ? 'Approving...' : `Approve ${selectedToken.symbol}`}
          </button>
        )}

        {hasApproved && (
          <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            ✓ {selectedToken?.symbol} approved
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isProcessing || !hasApproved}
          className={`w-full px-6 py-3 rounded-xl font-semibold transition-colors ${
            canConfirm && !isProcessing && hasApproved
              ? 'bg-accent-green text-white hover:bg-accent-green-hover'
              : 'bg-tertiary text-secondary cursor-not-allowed'
          }`}
        >
          {isProcessing ? 'Processing...' : !isConnected ? 'Connect Wallet' : !hasApproved ? 'Approve Token First' : 'Confirm and Pay'}
        </button>
      </div>
    </div>
    <OperationConfirmationModal
      isOpen={showSuccess}
      onClose={() => navigate('/dashboard')}
      title="Transaction confirmed"
      message={
        <>
          You've successfully paid <span className="text-accent-green font-semibold">{state.amount} {state.currency || ''}</span> for <span className="text-accent-green font-semibold">{state.summaryTitle || state.utilityType}</span> using <span className="text-accent-green font-semibold">{selectedToken?.symbol}</span>. Your request has been received and will be processed shortly.
        </>
      }
      ctaLabel="Go to Dashboard"
    />
    </>
  );
};

export default UtilityCheckoutPage;


