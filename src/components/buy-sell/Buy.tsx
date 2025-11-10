import React, { useMemo, useState } from 'react';
import CountrySelect, { type CountryCode, COUNTRIES } from './CountrySelect';
import TransactionConfirmationModal from './TransactionConfirmationModal';
import type { TokenSymbol } from '../swap/tokens';
import { useContractInstances } from '../../provider/ContractInstanceProvider';
import tokens from '../../lib/Tokens/tokens';
import { toast } from 'react-toastify';

interface BuyProps {}

const Buy: React.FC<BuyProps> = () => {
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
  const [faucet, setFaucet] = useState(false);
  const [successBuyAmount, setSuccessBuyAmount] = useState<number>(0);
  const [successReceiveAmount, setSuccessReceiveAmount] = useState<number>(0);
  const [successPayCurrency, setSuccessPayCurrency] = useState<string>('NGN');
  const [successReceiveCrypto, setSuccessReceiveCrypto] = useState<TokenSymbol>('cNGN');

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

  // Buy functions
  const getFaucet = async (tokenAddress: string, tokenAmount: string) => {
    try {
      setFaucet(true);
      const TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(tokenAddress);
      if (!TOKEN_CONTRACT) {
        toast.error('Failed to get token contract');
        return false;
      }
      const GET_FAUCET = await TOKEN_CONTRACT.buyToken(tokenAmount);
      console.log(`Loading - ${GET_FAUCET.hash}`);
      await GET_FAUCET.wait();
      console.log(`Success - ${GET_FAUCET.hash}`);
      setFaucet(false);
      return true;
    } catch (error) {
      setFaucet(false);
      console.log(error);
      toast.error('Purchase failed');
      return false;
    }
  };

  const depositFiatAndMintAFX = async (ngnAmount: string, userAddress: string) => {
    try {
      setFaucet(true);
      const AFRISTABLE_CONTRACT = await AFRISTABLE_CONTRACT_INSTANCE();
      if (!AFRISTABLE_CONTRACT) {
        toast.error('Failed to get AFX contract');
        return false;
      }
      const ngnAmountInWei = (parseFloat(ngnAmount) * Math.pow(10, 18)).toString();
      const DEPOSIT_MINT = await AFRISTABLE_CONTRACT.depositFiatAndMint(ngnAmountInWei, userAddress);
      console.log(`AFX Deposit Loading - ${DEPOSIT_MINT.hash}`);
      await DEPOSIT_MINT.wait();
      console.log(`AFX Deposit Success - ${DEPOSIT_MINT.hash}`);
      setFaucet(false);
      return true;
    } catch (error) {
      setFaucet(false);
      console.log('AFX Deposit Error:', error);
      toast.error('AFX purchase failed');
      return false;
    }
  };

  const handleBuyCrypto = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedToken) {
      toast.error('Invalid token selection');
      return;
    }

    let success = false;

    if (selectedCrypto === 'AFX') {
      success = await depositFiatAndMintAFX(receiveQuote.toString(), address);
    } else {
      if (!selectedToken?.address) {
        toast.error('Token address not found');
        return;
      }
      success = await getFaucet(selectedToken.address, receiveQuote.toString());
    }

    if (success) {
      // Store buy amounts before clearing state
      const payAmount = parsedAmount;
      const receiveAmount = receiveQuote;
      
      // Store values for success message
      setSuccessBuyAmount(payAmount);
      setSuccessReceiveAmount(receiveAmount);
      setSuccessPayCurrency(currency);
      setSuccessReceiveCrypto(selectedCrypto);
      
      toast.success(`Purchase successful! ${formatAmount(receiveAmount)} ${selectedCrypto} has been deposited to your wallet.`);
      setAmount('0');
      setShowConfirmationModal(true);
    }
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
      // Handle momo agent payment - trigger buy directly
      handleBuyCrypto();
    }
  };

  const handleBankTransferConfirm = async () => {
    setShowBankTransferModal(false);
    await handleBuyCrypto();
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

          {/* Country selection - must be first to determine currency */}
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

          {/* You are paying section (fiat) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">You are paying</span>
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
                <img src={COUNTRIES[country].icon} alt={currency} className="w-8 h-8 rounded-full" />
                <span className="text-primary font-semibold text-lg">{currency}</span>
              </div>
            </div>

            <div className="text-sm text-secondary">
              1 {currency} = 1 {selectedCrypto} (1:1 Peg)
            </div>
          </div>

          {/* You will receive (crypto) */}
          <div className="bg-tertiary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">You will receive</span>
              <div className="text-right flex items-center gap-2">
                <div>
                <div className="text-2xl font-semibold text-primary">
                    {receiveQuote ? formatAmount(receiveQuote) : '0'} {selectedCrypto}
                </div>
                <div className="text-sm text-secondary">
                    ≈ {currency}{receiveQuote ? formatAmount(receiveQuote) : '0'} (1:1 Peg)
                  </div>
                </div>
                {selectedToken && (
                  <img 
                    src={selectedToken.img || '/assets/Icons.svg'} 
                    alt={selectedCrypto} 
                    className="w-8 h-8 rounded-full" 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Proceed button */}
          <button
            type="button"
            onClick={handleProceed}
            disabled={!canProceed || faucet || !isConnected}
            className={`w-full px-6 py-4 rounded-2xl text-lg font-semibold shadow-lg transition-colors duration-200 ${
              canProceed && !faucet && isConnected
                ? 'bg-accent-green text-white hover:bg-accent-green-hover'
                : 'bg-tertiary text-secondary cursor-not-allowed'
            }`}
          >
            {!isConnected ? 'Connect Wallet' : faucet ? 'Processing...' : 'Proceed'}
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
          transactionType="buy"
          amount={successBuyAmount}
          fromCurrency={successPayCurrency}
          toCurrency={successReceiveCrypto}
          toAmount={successReceiveAmount}
        />
    </div>
  );
};

export default Buy;
