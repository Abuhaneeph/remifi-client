import React, { useMemo, useState } from 'react';
import CountrySelect, { type CountryCode, COUNTRIES } from './CountrySelect';
import TransactionConfirmationModal from './TransactionConfirmationModal';
import type { TokenSymbol } from '../swap/tokens';
import { useContractInstances } from '../../provider/ContractInstanceProvider';
import tokens from '../../lib/Tokens/tokens';
import { toast } from 'react-toastify';

interface SellProps {}

const Sell: React.FC<SellProps> = () => {
  const { 
    TEST_TOKEN_CONTRACT_INSTANCE, 
    AFRISTABLE_CONTRACT_INSTANCE, 
    isConnected,
    address 
  } = useContractInstances();
  
  const [amount, setAmount] = useState<string>('0');
  const [country, setCountry] = useState<CountryCode>('NG');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successSellAmount, setSuccessSellAmount] = useState<number>(0);
  const [successReceiveAmount, setSuccessReceiveAmount] = useState<number>(0);
  const [successSellCrypto, setSuccessSellCrypto] = useState<TokenSymbol>('cNGN');
  const [successReceiveCurrency, setSuccessReceiveCurrency] = useState<string>('NGN');

  // Get currency from country
  const currency = COUNTRIES[country].currency as TokenSymbol;
  
  // Map country currency to crypto token
  const getCryptoToken = (fiatCurrency: string): TokenSymbol => {
    const mapping: Record<string, TokenSymbol> = {
      'NGN': 'cNGN',
      'ZAR': 'cZAR',
      'KES': 'cKES',
      'GHS': 'cGHS'
    };
    return mapping[fiatCurrency] || 'cNGN';
  };
  
  const selectedCrypto = getCryptoToken(currency);
  const filteredTokens = tokens.filter(t => t.id >= 5);
  const selectedToken = filteredTokens.find(t => t.symbol === selectedCrypto);

  // Sell functions
  const transferTokens = async (tokenAddress: string, amount: string, recipientAddress: string) => {
    try {
      setIsProcessing(true);
      const TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(tokenAddress);
      if (!TOKEN_CONTRACT) {
        toast.error('Failed to get token contract');
        return false;
      }
      const tokenAmount = (parseFloat(amount) * Math.pow(10, 18)).toString();
      const TRANSFER = await TOKEN_CONTRACT.transfer(recipientAddress, tokenAmount);
      console.log(`Transfer Loading - ${TRANSFER.hash}`);
      await TRANSFER.wait();
      console.log(`Transfer Success - ${TRANSFER.hash}`);
      setIsProcessing(false);
      return true;
    } catch (error) {
      setIsProcessing(false);
      console.log(error);
      toast.error('Transfer failed');
      return false;
    }
  };

  const approveAndSellAFX = async (amount: string, selectedAfirAddress: string) => {
    try {
      setIsProcessing(true);
      const AFRISTABLE_CONTRACT = await AFRISTABLE_CONTRACT_INSTANCE();
      if (!AFRISTABLE_CONTRACT) {
        toast.error('Failed to get AFX contract');
        return false;
      }
      const amountInWei = (parseFloat(amount) * Math.pow(10, 18)).toString();
      const APPROVE_TX = await AFRISTABLE_CONTRACT.transfer(selectedAfirAddress, amountInWei);
      console.log(`AFX Approval Loading - ${APPROVE_TX.hash}`);
      await APPROVE_TX.wait();
      console.log(`AFX Approval Success - ${APPROVE_TX.hash}`);
      setIsProcessing(false);
      return true;
    } catch (error) {
      setIsProcessing(false);
      console.log('AFX Approve Error:', error);
      toast.error('AFX sell failed');
      return false;
    }
  };

  const handleSellCrypto = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedToken) {
      toast.error('Invalid token selection');
      return;
    }

    let success = false;

    const tokenAddress = selectedToken.address;
    if (!tokenAddress) {
      toast.error('Token address not found');
      return;
    }

    if (selectedCrypto === 'AFX') {
      success = await approveAndSellAFX(parsedAmount.toString(), tokenAddress);
    } else {
      success = await transferTokens(tokenAddress, parsedAmount.toString(), tokenAddress);
    }

    if (success) {
      // Store sell amounts before clearing state
      const sellAmount = parsedAmount;
      const receiveAmount = receiveQuote;
      
      // Store values for success message
      setSuccessSellAmount(sellAmount);
      setSuccessReceiveAmount(receiveAmount);
      setSuccessSellCrypto(selectedCrypto);
      setSuccessReceiveCurrency(currency);
      
      toast.success(`Sale successful! Your ${currency} ${formatAmount(receiveAmount)} will be sent to your bank account within 1-3 business days.`);
      setAmount('0');
      setShowConfirmationModal(true);
    }
  };

  const setPercent = (p: number) => {
    const base = 1000; // Mock stablecoin balance
    setAmount(String(Math.floor((base * p) / 100)));
  };

  // Helper function to format numbers without trailing zeros
  const formatAmount = (value: number): string => {
    if (value === 0) return '0';
    // Remove trailing zeros
    return parseFloat(value.toFixed(6)).toString();
  };

  const parsedAmount = useMemo(() => Number.parseFloat(amount || '0') || 0, [amount]);
  // 1:1 peg conversion
  const receiveQuote = useMemo(() => {
    if (parsedAmount <= 0) return 0;
    return parsedAmount; // 1:1 peg
  }, [parsedAmount]);
  
  const canProceed = parsedAmount > 0 && isConnected;

  const handleProceed = () => {
    if (!canProceed) return;
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setShowPaymentModal(false);
    if (method === 'bank-transfer') {
      setShowBankTransferModal(true);
    } else if (method === 'momo-agent') {
      // Handle momo agent payment - trigger sell directly
      handleSellCrypto();
    }
  };

  const handleBankTransferConfirm = async () => {
    setShowBankTransferModal(false);
    await handleSellCrypto();
  };

  const handleGoToDashboard = () => {
    setShowConfirmationModal(false);
    // Navigate to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div>
      {/* Main card */}
      <div className="bg-secondary rounded-xl p-6 space-y-6 border border-white/10">
          <p className="text-sm text-secondary text-left">
            Real-time rates powered by AfricaDex Oracle Feed.
          </p>

          {/* Country selection - must be first to determine currency and crypto */}
          <div className="space-y-2">
            <span className="text-sm text-secondary">Select your country</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={COUNTRIES[country].icon} alt={COUNTRIES[country].name} className="w-6 h-6" />
                <span className="text-primary font-medium">{COUNTRIES[country].name}</span>
              </div>
              <CountrySelect country={country} onChange={setCountry} />
            </div>
          </div>

          {/* You are selling section (crypto) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">You are selling</span>
              <div className="flex items-center gap-2">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPercent(p)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                      p === 100
                        ? 'bg-accent-green text-white'
                        : 'bg-tertiary hover:bg-quaternary text-primary'
                    }`}
                  >
                    {p === 100 ? 'Max' : `${p}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="bg-transparent outline-none focus:outline-none text-4xl font-semibold text-primary w-full"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 ml-4">
                {selectedToken && (
                  <img 
                    src={selectedToken.img || '/assets/Icons.svg'} 
                    alt={selectedCrypto} 
                    className="w-8 h-8 rounded-full" 
                  />
                )}
                <span className="text-primary font-semibold text-lg">{selectedCrypto}</span>
              </div>
            </div>

            <div className="text-sm text-secondary">
              1 {selectedCrypto} = 1 {currency} (1:1 Peg)
            </div>
          </div>

          {/* You will receive (fiat) */}
          <div className="bg-tertiary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">You will receive</span>
              <div className="text-right flex items-center gap-2">
                <div>
                  <div className="text-2xl font-semibold text-primary">
                    {receiveQuote ? formatAmount(receiveQuote) : '0'} {currency}
                  </div>
                  <div className="text-sm text-secondary">
                    ≈ {selectedCrypto}{receiveQuote ? formatAmount(receiveQuote) : '0'} (1:1 Peg)
                  </div>
                </div>
                <img src={COUNTRIES[country].icon} alt={currency} className="w-8 h-8 rounded-full" />
              </div>
            </div>
          </div>

          {/* Proceed button */}
          <button
            type="button"
            onClick={handleProceed}
            disabled={!canProceed || isProcessing || !isConnected}
            className={`w-full px-6 py-4 rounded-2xl text-lg font-semibold shadow-lg transition-colors duration-200 ${
              canProceed && !isProcessing && isConnected
                ? 'bg-accent-green text-white hover:bg-accent-green-hover'
                : 'bg-tertiary text-secondary cursor-not-allowed'
            }`}
          >
            {!isConnected ? 'Connect Wallet' : isProcessing ? 'Processing...' : 'Proceed'}
          </button>
        </div>

        {/* Payment Method Selection Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-secondary/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-primary">Select how you want to receive</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-secondary hover:text-primary"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-sm text-secondary mb-6">
                We'll process your transaction instantly and send the funds to your selected method.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handlePaymentMethodSelect('momo-agent')}
                  className="w-full flex items-center gap-3 p-4 bg-tertiary rounded-xl hover:bg-quaternary transition-colors"
                >
                  <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center">
                    📱
                  </div>
                  <span className="text-primary font-medium">Momo Agent</span>
                </button>

                <button
                  onClick={() => handlePaymentMethodSelect('bank-transfer')}
                  className="w-full flex items-center gap-3 p-4 bg-tertiary rounded-xl hover:bg-quaternary transition-colors"
                >
                  <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center">
                    🏦
                  </div>
                  <span className="text-primary font-medium">Bank Transfer</span>
                </button>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full mt-6 px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Bank Transfer Modal */}
        {showBankTransferModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-secondary/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-primary">Receive via Bank Transfer</h3>
                <button
                  onClick={() => setShowBankTransferModal(false)}
                  className="text-secondary hover:text-primary"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-sm text-secondary mb-6">
                We'll transfer <span className="text-accent-green font-semibold">{currency} {Number(receiveQuote || 0).toLocaleString()}</span> to your bank account. The transfer will be processed within 24 hours.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-secondary">Amount:</span>
                  <span className="text-accent-green font-medium">{currency} {Number(receiveQuote || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Processing Time:</span>
                  <span className="text-accent-green font-medium">24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Fee:</span>
                  <span className="text-accent-green font-medium">Free</span>
                </div>
              </div>

              <button
                onClick={handleBankTransferConfirm}
                className="w-full px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        )}

        {/* Transaction Confirmation Modal */}
        <TransactionConfirmationModal
          isOpen={showConfirmationModal}
          onClose={handleGoToDashboard}
          transactionType="sell"
          amount={successSellAmount}
          fromCurrency={successSellCrypto}
          toCurrency={successReceiveCurrency}
          toAmount={successReceiveAmount}
        />
    </div>
  );
};

export default Sell;
