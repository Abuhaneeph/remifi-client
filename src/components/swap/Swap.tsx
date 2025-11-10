import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TokenSelect from './TokenSelect';
import type { TokenSymbol } from './tokens';
import OperationConfirmationModal from '../common/OperationConfirmationModal';
import { useContractInstances, CONTRACT_ADDRESSES } from '../../provider/ContractInstanceProvider';
import tokens from '../../lib/Tokens/tokens';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { roundToTwoDecimalPlaces } from '../../lib/utils';

// Legacy Coin type kept for reference; token selection now uses TokenSymbol

const Swap: React.FC = () => {
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
  const [showSettings, setShowSettings] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState('0.5');
  const [deadline, setDeadline] = useState('20');

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
  const [successSwapAmount, setSuccessSwapAmount] = useState<number>(0);
  const [successReceiveAmount, setSuccessReceiveAmount] = useState<number>(0);
  const [successSendCoin, setSuccessSendCoin] = useState<TokenSymbol>('APE');
  const [successReceiveCoin, setSuccessReceiveCoin] = useState<TokenSymbol>('USDT');
  
  const token1Address = tokens.find(t => t.symbol === sendCoin)?.address;
  const token2Address = tokens.find(t => t.symbol === receiveCoin)?.address;

  // Helper function to format balance without trailing zeros
  const formatBalance = (balance: number): string => {
    if (balance === 0) return '0';
    // For large numbers (>= 1000), show up to 2 decimals
    if (balance >= 1000) {
      return parseFloat(balance.toFixed(2)).toString();
    }
    // For smaller numbers, show up to 4 decimals but remove trailing zeros
    return parseFloat(balance.toFixed(4)).toString();
  };

  // Helper function to format receive amount without trailing zeros
  const formatReceiveAmount = (amount: number): string => {
    if (amount === 0) return '0';
    // For large numbers (>= 1000), show up to 2 decimals
    if (amount >= 1000) {
      return parseFloat(amount.toFixed(2)).toString();
    }
    // For smaller numbers, show up to 6 decimals but remove trailing zeros
    return parseFloat(amount.toFixed(6)).toString();
  };

  // Helper functions
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

  const isNativeToken = (tokenAddress: string | undefined) => {
    if (!tokenAddress) return false;
    const nativeToken = tokens.find(token => token.address === tokenAddress);
    return nativeToken && nativeToken.symbol === 'APE';
  };

  // Fetch balances and prices
  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !token1Address || !token2Address) return;
      
      try {
        const bal1 = await fetchBalance(token1Address);
        const bal1Value = bal1 !== undefined ? parseFloat(bal1) : 0;
        setBal1(roundToTwoDecimalPlaces(bal1Value));
        
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
  const calculateAmount2 = async () => {
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
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateAmount2();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [token1Amount, sendCoin, receiveCoin, isConnected, token1Address, token2Address]);

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
    
    // Update receive coin if needed
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

      // Store swap amounts before clearing state
      const swapAmount = parsedSend;
      const receiveAmount = token2Amount ? parseFloat(token2Amount) : 0;
      
      setSwapping(false);
      setHasApprovedOne(false);
      setApproveOne(false);
      setSendAmount('0');
      setToken1Amount(null);
      setToken2Amount(null);
      
      // Store values for success message
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
  
  const [showSuccess, setShowSuccess] = useState(false);
  const handleSwap = () => {
    if (!canSwap) return;
    SwapToken();
  };

  return (
    <section className="px-6 py-8">
      <motion.div 
        className="max-w-2xl mx-auto rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-primary">Swap</h2>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-full bg-tertiary hover:bg-quaternary flex items-center justify-center transition-colors duration-200"
            aria-label="Settings"
          >
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.14,12.94a7.43,7.43,0,0,0,.05-.94,7.43,7.43,0,0,0-.05-.94l2.11-1.65a.5.5,0,0,0,.12-.64L19.9,5.27a.5.5,0,0,0-.6-.22l-2.49,1a7.36,7.36,0,0,0-1.63-.94l-.38-2.65A.5.5,0,0,0,14.32,2H9.68a.5.5,0,0,0-.49.42L8.81,5.07a7.36,7.36,0,0,0-1.63.94l-2.49-1a.5.5,0,0,0-.6.22L2.63,8.77ǎa.5.5,0,0,0,.12.64L4.86,11.06a7.43,7.43,0,0,0-.05.94,7.43,7.43,0,0,0,.05.94L2.75,14.59a.5.5,0,0,0-.12.64l1.46,2.5a.5.5,0,0,0,.6.22l2.49-1a7.36,7.36,0,0,0,1.63.94l.38,2.65a.5.5,0,0,0,.49.42h4.64a.5.5,0,0,0,.49-.42l.38-2.65a7.36,7.36,0,0,0,1.63-.94l2.49,1a.5.5,0,0,0,.6-.22l1.46-2.5a.5.5,0,0,0-.12-.64承担责任M12,15.5 nuances.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
            </svg>
          </button>
        </div>

        {/* Send card - mirror HeroSection styles */}
        <div className="bg-secondary rounded-xl p-5 space-y-3 -mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-secondary">You send</span>
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
            <div>
              <input
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                inputMode="decimal"
                className="bg-transparent outline-none focus:outline-none text-4xl font-semibold text-primary w-32"
              />
              <div className="text-sm text-secondary">${sendUsd.toFixed(2)}</div>
            </div>

            <TokenSelect symbol={sendCoin} onChange={handleSendCoinChange} />
          </div>

          <div className="text-right text-sm text-secondary mt-3">
            {isConnected && Bal1 > 0 ? `Balance: ${formatBalance(Bal1)} ${sendCoin}` : `Balance: 0 ${sendCoin}`}
          </div>
        </div>

        {/* switch icon - centered and floating */}
        <div className="flex justify-center">
          <motion.button
            type="button"
            onClick={toggleTokens}
            aria-label="Switch tokens"
            className="w-10 h-10 bg-tertiary rounded-full flex items-center justify-center hover:bg-quaternary transition-colors duration-200 cursor-pointer"
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img
              src="/assets/swap-icon.svg"
              alt="swap toggle"
              className="w-5 h-5 filter brightness-0 dark:invert"
            />
          </motion.button>
        </div>

        {/* Receive card - mirror HeroSection styles */}
        <div className="bg-secondary rounded-xl p-5 space-y-3 -mt-3 border border-white/10">
          <span className="text-sm text-secondary">You receive</span>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-semibold text-primary">
                {isEstimateAmount2 ? '...' : (receiveQuote ? formatReceiveAmount(receiveQuote) : '0')}
              </div>
              <div className="text-sm text-secondary">${receiveUsd.toFixed(2)}</div>
            </div>
            <TokenSelect symbol={receiveCoin} onChange={handleReceiveCoinChange} />
          </div>
        </div>

        {/* Approval button */}
        {!isNativeToken(token1Address) && sendAmount !== '0' && parsedSend > 0 && (
          <div className="mt-6">
            <motion.button
              type="button"
              onClick={ApproveTokenOne}
              disabled={isApproveOne || hasApprovedOne || !AmountOneInWei}
              className={`w-full px-6 py-4 rounded-2xl text-lg font-semibold shadow-lg transition-colors duration-200 ${
                hasApprovedOne
                  ? 'bg-green-600 text-white'
                  : isApproveOne
                    ? 'bg-tertiary text-secondary cursor-not-allowed'
                    : canSwap
                      ? 'bg-accent-green text-white hover:bg-accent-green-hover'
                      : 'bg-tertiary text-secondary cursor-not-allowed'
              }`}
              whileHover={!isApproveOne && !hasApprovedOne && canSwap ? { scale: 1.02 } : {}}
              whileTap={!isApproveOne && !hasApprovedOne && canSwap ? { scale: 0.98 } : {}}
            >
              {isApproveOne ? 'Approving...' : hasApprovedOne ? `✓ Approved ${sendCoin}` : `Approve ${sendCoin}`}
            </motion.button>
          </div>
        )}

        {/* Swap button */}
        <div className="mt-6">
          <motion.button
            type="button"
            onClick={handleSwap}
            disabled={!canSwap}
            className={`w-full px-6 py-4 rounded-2xl text-lg font-semibold shadow-lg transition-colors duration-200 ${
              canSwap
                ? 'bg-accent-green text-white hover:bg-accent-green-hover'
                : 'bg-tertiary text-secondary cursor-not-allowed'
            }`}
            title={canSwap ? 'Swap' : disabledReason}
            aria-disabled={!canSwap}
            whileHover={canSwap ? { scale: 1.02 } : {}}
            whileTap={canSwap ? { scale: 0.98 } : {}}
          >
            {isSwapping ? 'Swapping...' : (canSwap ? 'Swap' : disabledReason)}
          </motion.button>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-secondary rounded-2xl p-6 max-w-md w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-primary">Transaction Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-8 h-8 rounded-full bg-tertiary hover:bg-quaternary flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Slippage Tolerance */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">Slippage tolerance</span>
                    <span className="text-sm text-secondary">{slippageTolerance}%</span>
                  </div>
                  <div className="flex gap-2">
                    {['0.1', '0.5', '1.0', '3.0'].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSlippageTolerance(value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          slippageTolerance === value
                            ? 'bg-accent-green text-white'
                            : 'bg-tertiary text-primary hover:bg-quaternary'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={slippageTolerance}
                    onChange={(e) => setSlippageTolerance(e.target.value)}
                    className="w-full px-3 py-2 bg-tertiary border border-white/10 rounded-lg text-primary text-sm outline-none focus:border-accent-green"
                    placeholder="Custom"
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                  <p className="text-xs text-secondary">
                    {Number.parseFloat(slippageTolerance) < 0.5 && "⚠️ Your transaction may fail"}
                    {Number.parseFloat(slippageTolerance) >= 5 && "⚠️ Your transaction may be frontrun"}
                  </p>
                </div>

                {/* Transaction Deadline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">Transaction deadline</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-16 px-2 py-1 bg-tertiary border border-white/10 rounded text-primary text-sm outline-none focus:border-accent-green"
                        min="1"
                        max="4320"
                      />
                      <span className="text-sm text-secondary">minutes</span>
                    </div>
                  </div>
                  <p className="text-xs text-secondary">Your transaction will revert if it is pending for more than this period of time.</p>
                </div>

                {/* Save Button */}
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6 py-3 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green-hover transition-colors"
                >
                  Save Settings
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <OperationConfirmationModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Transaction confirmed"
        message={
          <>
            You've successfully swapped <span className="text-accent-green font-semibold">{formatReceiveAmount(successSwapAmount)} {successSendCoin}</span> for approximately <span className="text-accent-green font-semibold">{formatReceiveAmount(successReceiveAmount)} {successReceiveCoin}</span>. Your wallet has been updated.
          </>
        }
        ctaLabel="Close"
      />
    </section>
  );
};

export default Swap;


