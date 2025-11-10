import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import TokenSelect from '../swap/TokenSelect';
import type { TokenSymbol } from '../swap/tokens';
import { useContractInstances, CONTRACT_ADDRESSES } from '../../provider/ContractInstanceProvider';
import tokens from '../../lib/Tokens/tokens';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { roundToTwoDecimalPlaces } from '../../lib/utils';
import OperationConfirmationModal from '../common/OperationConfirmationModal';

const SwapIcon = '/assets/swap-icon.svg';
const NGNFlag = '/assets/ngn.svg';
const GHSFlag = '/assets/ghs.svg';
const KESFlag = '/assets/kes.svg';
const ZARFlag = '/assets/zar.svg';

const HeroSection: React.FC = () => {
  const { 
    isConnected, 
    SWAP_CONTRACT_INSTANCE, 
    PRICEAPI_CONTRACT_INSTANCE, 
    TEST_TOKEN_CONTRACT_INSTANCE,
    fetchBalance
  } = useContractInstances();

  const [sendAmount, setSendAmount] = useState<string>('0');
  const [sendCoin, setSendCoin] = useState<TokenSymbol>('APE');
  const [receiveCoin, setReceiveCoin] = useState<TokenSymbol>('USDT');
  
  // Swap logic states
  const [token1Amount, setToken1Amount] = useState<string | null>(null);
  const [token2Amount, setToken2Amount] = useState<string | null>(null);
  const [isApproveOne, setApproveOne] = useState(false);
  const [hasApprovedOne, setHasApprovedOne] = useState(false);
  const [isSwapping, setSwapping] = useState(false);
  const [AmountOneInWei, setAmountOneInWei] = useState<bigint | null>(null);
  const [Bal1, setBal1] = useState<number>(0);
  const [dollarRate, setDollarRate] = useState<string | null>(null);
  const [isEstimateAmount2, setEstimatedAmount2] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSwapAmount, setSuccessSwapAmount] = useState<number>(0);
  const [successReceiveAmount, setSuccessReceiveAmount] = useState<number>(0);
  const [successSendCoin, setSuccessSendCoin] = useState<TokenSymbol>('APE');
  const [successReceiveCoin, setSuccessReceiveCoin] = useState<TokenSymbol>('USDT');
  
  const token1Address = tokens.find(t => t.symbol === sendCoin)?.address;
  const token2Address = tokens.find(t => t.symbol === receiveCoin)?.address;

  // Helper functions
  const formatBalance = (balance: number): string => {
    if (balance === 0) return '0';
    if (balance >= 1000) {
      return parseFloat(balance.toFixed(2)).toString();
    }
    return parseFloat(balance.toFixed(4)).toString();
  };

  const formatReceiveAmount = (amount: number): string => {
    if (amount === 0) return '0';
    if (amount >= 1000) {
      return parseFloat(amount.toFixed(2)).toString();
    }
    return parseFloat(amount.toFixed(6)).toString();
  };

  const isNativeToken = (tokenAddress: string | undefined) => {
    if (!tokenAddress) return false;
    const nativeToken = tokens.find(token => token.address === tokenAddress);
    return nativeToken && nativeToken.symbol === 'APE';
  };

  const getAvailableTokens = (selectedToken: TokenSymbol, isFromToken = true) => {
    if (isFromToken) {
      return tokens.filter(token => token.symbol !== selectedToken);
    } else {
      const fromTokenData = tokens.find(token => token.symbol === selectedToken);
      if (!fromTokenData || !fromTokenData.pool || fromTokenData.pool.length === 0) {
        return [];
      }
      return tokens.filter(token => 
        fromTokenData.pool.includes(token.symbol)
      );
    }
  };

  // Fetch balances and prices
  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !token1Address || !token2Address) return;
      
      try {
        const bal1 = await fetchBalance(token1Address);
        const roundedBal1 = roundToTwoDecimalPlaces(bal1);
        
        setBal1(roundedBal1);
        
        const PRICE_CONTRACT = await PRICEAPI_CONTRACT_INSTANCE();
        if (PRICE_CONTRACT) {
          const dollarRate = await PRICE_CONTRACT.getLatestPrice(token1Address);
          const formattedDollarRate = ethers.formatEther(dollarRate);
          setDollarRate(formattedDollarRate);
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchData();
  }, [isConnected, sendCoin, receiveCoin, token1Address, token2Address, fetchBalance, PRICEAPI_CONTRACT_INSTANCE]);

  // Calculate amount2 based on amount1
  const calculateAmount2 = useCallback(async () => {
    if (!token1Amount || !isConnected || !token1Address || !token2Address) {
      setToken2Amount(null);
      return;
    }

    setEstimatedAmount2(true);
    try {
      const PRICE_CONTRACT = await PRICEAPI_CONTRACT_INSTANCE();
      if (!PRICE_CONTRACT) return;

      const TokenAmountInWei = ethers.parseEther(token1Amount);
      const rate = await PRICE_CONTRACT.estimate(token1Address, token2Address, TokenAmountInWei);
      const f_rate = ethers.formatEther(rate);
      const swapFee = (20 / 1000) * parseFloat(f_rate);
      const amountTwoToReceive = parseFloat(f_rate) - swapFee;
      const roundedAmount = parseFloat(amountTwoToReceive.toFixed(9));
      
      setToken2Amount(roundedAmount.toString());
      setAmountOneInWei(TokenAmountInWei);
    } catch (error) {
      console.error('Error calculating amount2:', error);
      setToken2Amount(null);
    } finally {
      setEstimatedAmount2(false);
    }
  }, [token1Amount, isConnected, token1Address, token2Address, PRICEAPI_CONTRACT_INSTANCE]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateAmount2();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [calculateAmount2]);

  // Sync sendAmount with token1Amount
  useEffect(() => {
    if (sendAmount !== token1Amount && sendAmount !== '0') {
      setToken1Amount(sendAmount);
    } else if (sendAmount === '0' && token1Amount !== null) {
      setToken1Amount(null);
    }
  }, [sendAmount]);

  const setPercent = (p: number) => {
    if (Bal1 > 0) {
      const amount = (Bal1 * p) / 100;
      setSendAmount(amount.toString());
      setToken1Amount(amount.toString());
    }
  };

  const parsedSend = useMemo(() => Number.parseFloat(sendAmount || '0') || 0, [sendAmount]);
  const receiveQuote = useMemo(() => {
    if (token2Amount) {
      return parseFloat(token2Amount);
    }
    return 0;
  }, [token2Amount]);
  
  const sendUsd = useMemo(() => {
    if (dollarRate && parsedSend > 0) {
      return parsedSend * parseFloat(dollarRate);
    }
    return 0;
  }, [parsedSend, dollarRate]);
  
  const receiveUsd = useMemo(() => {
    if (dollarRate && receiveQuote > 0) {
      return receiveQuote * parseFloat(dollarRate);
    }
    return 0;
  }, [receiveQuote, dollarRate]);

  const toggleTokens = () => {
    const prevSend = sendCoin;
    const prevReceive = receiveCoin;
    const nextSendAmount = token2Amount || '0';
    setSendCoin(prevReceive);
    setReceiveCoin(prevSend);
    setSendAmount(nextSendAmount);
    setToken1Amount(nextSendAmount);
  };

  // Handle token changes
  const handleSendCoinChange = (newCoin: TokenSymbol) => {
    setSendCoin(newCoin);
    setSendAmount('0');
    setToken1Amount(null);
    setToken2Amount(null);
    setHasApprovedOne(false);
    
    const availableTokens = getAvailableTokens(newCoin, false);
    if (availableTokens.length > 0 && !availableTokens.some(t => t.symbol === receiveCoin)) {
      setReceiveCoin(availableTokens[0].symbol);
    }
  };

  const handleReceiveCoinChange = (newCoin: TokenSymbol) => {
    setReceiveCoin(newCoin);
    setToken2Amount(null);
  };

  // Approval function
  const ApproveTokenOne = async () => {
    if (!token1Address || !AmountOneInWei) return;
    
    try {
      const TEST_TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(token1Address);
      if (!TEST_TOKEN_CONTRACT) {
        toast.error('Failed to get token contract');
        return;
      }
      
      const approveSpending = await TEST_TOKEN_CONTRACT.approve(CONTRACT_ADDRESSES.swapAddress, AmountOneInWei);
      setApproveOne(true);
      await approveSpending.wait();
      setApproveOne(false);
      setHasApprovedOne(true);
      toast.success(`Token ${sendCoin} approved`);
    } catch (error) {
      setApproveOne(false);
      console.error(error);
      toast.error('Approval failed');
    }
  };

  // Swap function
  const SwapToken = async () => {
    if (!token1Address || !token2Address || !AmountOneInWei) return;
    
    try {
      const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
      if (!SWAP_CONTRACT) {
        toast.error('Failed to get swap contract');
        return;
      }

      setSwapping(true);
      
      if (isNativeToken(token1Address)) {
        const SWAP = await SWAP_CONTRACT.swap(token1Address, token2Address, AmountOneInWei, {
          value: AmountOneInWei
        });
        await SWAP.wait();
        toast.success('Swap successful!');
      } else if (isNativeToken(token2Address)) {
        const SWAP = await SWAP_CONTRACT.swap(token1Address, token2Address, AmountOneInWei);
        await SWAP.wait();
        toast.success('Swap successful!');
      } else {
        const SWAP = await SWAP_CONTRACT.swap(token1Address, token2Address, AmountOneInWei);
        await SWAP.wait();
        toast.success('Swap successful!');
      }

      const swapAmount = parsedSend;
      const receiveAmount = token2Amount ? parseFloat(token2Amount) : 0;
      
      setSwapping(false);
      setHasApprovedOne(false);
      setApproveOne(false);
      setSendAmount('0');
      setToken1Amount(null);
      setToken2Amount(null);
      
      setSuccessSwapAmount(swapAmount);
      setSuccessReceiveAmount(receiveAmount);
      setSuccessSendCoin(sendCoin);
      setSuccessReceiveCoin(receiveCoin);
      
      setShowSuccess(true);
    } catch (error) {
      setSwapping(false);
      setHasApprovedOne(false);
      setApproveOne(false);
      setSendAmount('0');
      setToken1Amount(null);
      setToken2Amount(null);
      console.error(error);
      toast.error('Swap failed');
    }
  };

  const canSwap = parsedSend > 0 && 
    sendCoin !== receiveCoin && 
    token2Amount !== null && 
    parseFloat(token2Amount) > 0 &&
    !isSwapping &&
    (isNativeToken(token1Address) || hasApprovedOne);
  
  const disabledReason = !isConnected
    ? 'Connect Wallet'
    : parsedSend <= 0
    ? 'Enter amount'
    : sendCoin === receiveCoin
      ? 'Select different tokens'
        : token2Amount === null || parseFloat(token2Amount) <= 0
          ? 'No quote'
          : isSwapping
            ? 'Swapping...'
            : !isNativeToken(token1Address) && !hasApprovedOne
              ? `Approve ${sendCoin} First`
              : '';

  const handleSwap = () => {
    if (!canSwap) return;
    SwapToken();
  };

  return (
    <section className="relative px-6 py-16 bg-primary overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute top-80 right-0 md:top-0 w-48 h-48 md:w-96 md:h-96 bg-gradient-radial from-red-500/20 via-orange-500/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-96 right-20 md:top-20 w-32 h-32 md:w-64 md:h-64 bg-gradient-radial from-green-500/20 via-blue-500/20 to-transparent rounded-full blur-2xl"></div>
      

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        {/* Left Content */}
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-medium text-primary leading-tight">
              Swap stablecoins instantly
            </h1>
            <p className="text-xl text-secondary">
              Fast, low-fee swaps for every stablecoin
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg text-secondary">Trusted by communities in</p>
            <div className="flex items-center">
              {/* Horizontally stacked flags with hover expansion */}
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <motion.img 
                  src={NGNFlag} 
                  alt="Nigeria" 
                  className="w-12 h-12 rounded-full object-cover border border-white/40 shadow-lg cursor-pointer"
                  whileHover={{ scale: 1.2, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <motion.img 
                  src={GHSFlag} 
                  alt="Ghana" 
                  className="w-12 h-12 rounded-full object-cover border border-white/40 shadow-lg cursor-pointer"
                  whileHover={{ scale: 1.2, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <motion.img 
                  src={KESFlag} 
                  alt="Kenya" 
                  className="w-12 h-12 rounded-full object-cover border border-white/40 shadow-lg cursor-pointer"
                  whileHover={{ scale: 1.2, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <motion.img 
                  src={ZARFlag} 
                  alt="South Africa" 
                  className="w-12 h-12 rounded-full object-cover border border-white/40 shadow-lg cursor-pointer"
                  whileHover={{ scale: 1.2, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right Content - Swap Widget */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* You Send Section */}
          <div className="bg-secondary rounded-2xl p-6 space-y-3 -mb-7">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">You send</span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setPercent(25)}
                  className="px-3 py-1 bg-tertiary hover:bg-quaternary text-primary text-sm rounded-full transition-colors duration-200"
                >
                  25%
                </button>
                <button 
                  onClick={() => setPercent(50)}
                  className="px-3 py-1 bg-tertiary hover:bg-quaternary text-primary text-sm rounded-full transition-colors duration-200"
                >
                  50%
                </button>
                <button 
                  onClick={() => setPercent(75)}
                  className="px-3 py-1 bg-tertiary hover:bg-quaternary text-primary text-sm rounded-full transition-colors duration-200"
                >
                  75%
                </button>
                <button 
                  onClick={() => setPercent(100)}
                  className="px-3 py-1 bg-accent-green text-white text-sm rounded-full transition-colors duration-200"
                >
                  Max
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <input
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  inputMode="decimal"
                  className="bg-transparent outline-none focus:outline-none text-3xl font-bold text-primary w-32"
                />
                <div className="text-sm text-secondary">${sendUsd.toFixed(2)}</div>
              </div>
              <TokenSelect symbol={sendCoin} onChange={handleSendCoinChange} />
            </div>
            {isConnected && Bal1 > 0 && (
              <div className="text-right text-xs text-secondary mt-2">
                Balance: {formatBalance(Bal1)} {sendCoin}
            </div>
            )}
          </div>

          {/* Swap Toggle Icon - Floating between sections */}
          <div className="flex justify-center">
            <motion.button
              onClick={toggleTokens}
              className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center hover:bg-quaternary transition-colors duration-200 cursor-pointer"
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src={SwapIcon} 
                alt="Swap toggle" 
                className="w-6 h-6 filter brightness-0 dark:invert"
              />
            </motion.button>
          </div>

          {/* You Receive Section */}
          <div className="bg-secondary rounded-2xl p-6 space-y-3 -mt-4">
            <span className="text-sm text-secondary">You receive</span>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {isEstimateAmount2 ? '...' : (receiveQuote ? formatReceiveAmount(receiveQuote) : '0')}
                </div>
                <div className="text-sm text-secondary">${receiveUsd.toFixed(2)}</div>
              </div>
              <TokenSelect symbol={receiveCoin} onChange={handleReceiveCoinChange} />
            </div>
          </div>

          {/* Approval button */}
          {!isNativeToken(token1Address) && sendAmount !== '0' && parsedSend > 0 && (
            <motion.button
              type="button"
              onClick={ApproveTokenOne}
              disabled={isApproveOne || hasApprovedOne || !AmountOneInWei}
              className={`w-full mt-4 py-4 rounded-full font-medium transition-colors duration-200 ${
                hasApprovedOne
                  ? 'bg-green-600 text-white'
                  : isApproveOne
                    ? 'bg-tertiary text-secondary cursor-not-allowed'
                    : 'bg-accent-green text-white hover:bg-accent-green-hover'
              }`}
              whileHover={!isApproveOne && !hasApprovedOne ? { scale: 1.02 } : {}}
              whileTap={!isApproveOne && !hasApprovedOne ? { scale: 0.98 } : {}}
            >
              {isApproveOne ? 'Approving...' : hasApprovedOne ? `✓ Approved ${sendCoin}` : `Approve ${sendCoin}`}
            </motion.button>
          )}

          {/* Swap button */}
          <motion.button 
            type="button"
            onClick={handleSwap}
            disabled={!canSwap}
            className={`w-full mt-4 py-4 rounded-full font-medium transition-colors duration-200 ${
              canSwap
                ? 'bg-accent-green text-white hover:bg-accent-green-hover border-2 border-accent-green'
                : 'bg-tertiary text-secondary cursor-not-allowed'
            }`}
            title={canSwap ? 'Swap' : disabledReason}
            whileHover={canSwap ? { scale: 1.02 } : {}}
            whileTap={canSwap ? { scale: 0.98 } : {}}
          >
            {isSwapping ? 'Swapping...' : (canSwap ? 'Swap' : disabledReason)}
          </motion.button>
        </motion.div>
      </div>

      {/* Success Modal */}
      <OperationConfirmationModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          // Refresh balances
          if (isConnected && token1Address && token2Address) {
            fetchBalance(token1Address).then(bal => {
              const roundedBal = roundToTwoDecimalPlaces(bal);
              setBal1(roundedBal);
            });
          }
        }}
        title="Swap Successful!"
        message={`You successfully swapped ${successSwapAmount} ${successSendCoin} for approximately ${formatReceiveAmount(successReceiveAmount)} ${successReceiveCoin}. Your wallet has been updated.`}
        ctaLabel="Done"
      />
    </section>
  );
};

export default HeroSection;
