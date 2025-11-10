import React, { useState, useEffect } from 'react';
import type { TokenSymbol } from '../components/swap/tokens';
import TransactionCard from '../components/activity/TransactionCard';
import LiquidityPoolCard from '../components/activity/LiquidityPoolCard';
import StakingCard from '../components/activity/StakingCard';
import OperationConfirmationModal from '../components/common/OperationConfirmationModal';
import { useContractInstances, CONTRACT_ADDRESSES } from '../provider/ContractInstanceProvider';
import tokens from '../lib/Tokens/tokens.ts';
import { ethers } from 'ethers';
import { roundToSevenDecimalPlaces, roundToTwoDecimalPlaces } from '../lib/utils';
import { toast } from 'react-toastify';
type LocalTab = 'transactions' | 'liquidity' | 'staking';

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

interface LiquidityPool {
  id: string;
  tokenA: TokenSymbol;
  tokenB: TokenSymbol;
  liquidity: number;
  apy: number;
  volume24h: number;
  fees24h: number;
  yourShare: number;
  yourFees: number;
}

const ActivityPage: React.FC = () => {
  const { 
    SWAP_CONTRACT_INSTANCE, 
    PRICEAPI_CONTRACT_INSTANCE, 
    TEST_TOKEN_CONTRACT_INSTANCE,
    fetchBalance,
    address, 
    isConnected 
  } = useContractInstances();
  const [activeTab, setActiveTab] = useState<LocalTab>('liquidity');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showClaimConfirm, setShowClaimConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Add liquidity states
  const [token1, setToken1] = useState<string>('');
  const [token2, setToken2] = useState<string>('');
  const [isApprove1, setApprove1] = useState(false);
  const [isApprove2, setApprove2] = useState(false);
  const [hasApproveOne, setHasApprovedOne] = useState(false);
  const [hasApproveTwo, setHasApprovedTwo] = useState(false);
  const [Bal1, setBal1] = useState<string | null>(null);
  const [isAddLiquid, setIsAddLiquid] = useState(false);
  const [isEstimate, setEstimate] = useState(false);
  const [amount2Rate, setAmount2Rate] = useState<string>('');
  const [amount1inWei, setToWei] = useState<bigint | null>(null);
  const [poolExists, setPoolExists] = useState(true);
  const [liquidID, setLiquidID] = useState<string>('');
  const [isRemoveLiquid, setIsRemoveLiquid] = useState(false);
  
  const token1Address = token1 ? tokens.find(t => t.symbol === token1)?.address : null;
  const token2Address = token2 ? tokens.find(t => t.symbol === token2)?.address : null;

  // Transactions data for the Transactions tab
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'swap',
      fromToken: 'USDT',
      toToken: 'NGN',
      fromAmount: 100,
      toAmount: 130607,
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      hash: '0x1234...5678'
    },
    {
      id: '2',
      type: 'add-liquidity',
      fromToken: 'USDT',
      toToken: 'NGN',
      fromAmount: 500,
      toAmount: 653035,
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      hash: '0x2345...6789',
      apy: 12.5
    },
    {
      id: '3',
      type: 'stake',
      fromToken: 'USDT',
      toToken: 'NGN',
      fromAmount: 1000,
      toAmount: 0,
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      hash: '0x3456...7890',
      apy: 8.2
    }
  ];

  // Helper function to get USD value for a token amount
  const getTokenUSDValue = async (tokenAddress: string, amount: number, PRICE_FEED_CONTRACT: any) => {
    try {
      const priceInWei = await PRICE_FEED_CONTRACT.getLatestPrice(tokenAddress);
      const price = parseFloat(ethers.formatEther(priceInWei));
      const usdValue = amount * price;
      return usdValue;
    } catch (error) {
      console.error(`Error getting price for token ${tokenAddress}:`, error);
      return 0;
    }
  };

  // Helper function to get total pool liquidity in USD
  const getTotalPoolLiquidity = async (tokenA: any, tokenB: any, PRICE_FEED_CONTRACT: any, SWAP_CONTRACT: any) => {
    try {
      const [poolBalance1, poolBalance2] = await SWAP_CONTRACT.getPoolSize(tokenA.address, tokenB.address);
      const totalAmount0Formatted = parseFloat(ethers.formatEther(poolBalance1));
      const totalAmount1Formatted = parseFloat(ethers.formatEther(poolBalance2));
      
      const [usdValue0, usdValue1] = await Promise.all([
        getTokenUSDValue(tokenA.address, totalAmount0Formatted, PRICE_FEED_CONTRACT),
        getTokenUSDValue(tokenB.address, totalAmount1Formatted, PRICE_FEED_CONTRACT)
      ]);
      
      return usdValue0 + usdValue1;
    } catch (error) {
      console.error(`Error getting total pool liquidity:`, error);
      return 0;
    }
  };

  const getAllLiquidityPoolsWithAddresses = () => {
    const pools: any[] = [];
    tokens.forEach(token => {
      if (Array.isArray(token.pool)) {
        token.pool.forEach(poolTokenSymbol => {
          const partnerToken = tokens.find(t => t.symbol === poolTokenSymbol);
          if (partnerToken) {
            const pair = `${token.symbol}/${poolTokenSymbol}`;
            const reversePair = `${poolTokenSymbol}/${token.symbol}`;
            const existingPool = pools.find(p => p.pair === pair || p.pair === reversePair);
            if (!existingPool) {
              pools.push({
                pair: pair,
                tokenA: { symbol: token.symbol, address: token.address },
                tokenB: { symbol: poolTokenSymbol, address: partnerToken.address }
              });
            }
          }
        });
      }
    });
    return pools;
  };

  // Fetch all pools data function
  const fetchAllPoolsData = async () => {
    if (!SWAP_CONTRACT_INSTANCE || !PRICEAPI_CONTRACT_INSTANCE || !isConnected || !tokens?.length) {
      return;
    }

    try {
      setLoadingPools(true);
      const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
      const PRICE_FEED_CONTRACT = await PRICEAPI_CONTRACT_INSTANCE();

      if (!SWAP_CONTRACT || !PRICE_FEED_CONTRACT) {
        return;
      }

      const availablePools = getAllLiquidityPoolsWithAddresses();
      const structuredPools: LiquidityPool[] = [];

      for (const pool of availablePools) {
        try {
          const { tokenA, tokenB } = pool;

          // Resolve pool ID
          let poolId = `${tokenA.symbol}-${tokenB.symbol}`;
          try {
            const onChainPoolId = await SWAP_CONTRACT.findPool(tokenA.address, tokenB.address);
            if (onChainPoolId.toString() !== '0') {
              poolId = onChainPoolId.toString();
            }
          } catch (e) {
            console.warn('Failed to resolve pool id:', e);
          }

          // Get total pool liquidity
          const totalPoolLiquidity = await getTotalPoolLiquidity(
            tokenA,
            tokenB,
            PRICE_FEED_CONTRACT,
            SWAP_CONTRACT
          );

          // User liquidity data
          let userLiquidity = 0;
          let userShare = 0;
          let userFees = 0;

          if (address) {
            try {
              const [pools, amounts0, amounts1] = await SWAP_CONTRACT.myLiquidities(address);
              const poolIndex = pools.findIndex((p: bigint) => p.toString() === poolId);
              if (poolIndex !== -1) {
                const userAmount0 = parseFloat(ethers.formatEther(amounts0[poolIndex]));
                const userAmount1 = parseFloat(ethers.formatEther(amounts1[poolIndex]));

                const [userUsdValue0, userUsdValue1] = await Promise.all([
                  getTokenUSDValue(tokenA.address, userAmount0, PRICE_FEED_CONTRACT),
                  getTokenUSDValue(tokenB.address, userAmount1, PRICE_FEED_CONTRACT)
                ]);

                userLiquidity = userUsdValue0 + userUsdValue1;
                userShare = totalPoolLiquidity > 0 ? (userLiquidity / totalPoolLiquidity) : 0;
                userFees = 0; // Placeholder
              }
            } catch (error) {
              console.warn('Could not fetch user liquidity:', error);
            }
          }

          structuredPools.push({
            id: poolId,
            tokenA: tokenA.symbol as TokenSymbol,
            tokenB: tokenB.symbol as TokenSymbol,
            liquidity: roundToSevenDecimalPlaces(totalPoolLiquidity),
            apy: 12.5, // Placeholder - calculate if needed
            volume24h: 0, // Placeholder
            fees24h: userFees,
            yourShare: userShare,
            yourFees: userFees
          });
        } catch (error) {
          console.error(`Error processing pool ${pool.pair}:`, error);
        }
      }

      setLiquidityPools(structuredPools);
    } catch (error) {
      console.error('Error fetching liquidity pools data:', error);
    } finally {
      setLoadingPools(false);
    }
  };

  // Fetch all pools data
  useEffect(() => {
    fetchAllPoolsData();
  }, [SWAP_CONTRACT_INSTANCE, PRICEAPI_CONTRACT_INSTANCE, isConnected, address, tokens, refreshTrigger]);

  // Helper functions for liquidity operations
  const isNativeToken = (tokenAddress: string | undefined) => {
    if (!tokenAddress) return false;
    const nativeToken = tokens.find(token => token.address === tokenAddress);
    return nativeToken && nativeToken.symbol === 'APE';
  };

  const checkPoolExists = (token1Symbol: string, token2Symbol: string): boolean => {
    const token1Data = tokens.find(t => t.symbol === token1Symbol);
    const token2Data = tokens.find(t => t.symbol === token2Symbol);
    if (!token1Data || !token2Data) return false;
    const pool1 = Array.isArray(token1Data.pool) ? token1Data.pool : [];
    const pool2 = Array.isArray(token2Data.pool) ? token2Data.pool : [];
    return pool1.includes(token2Symbol) || pool2.includes(token1Symbol);
  };

  // Calculate amount2 based on amount1
  const calculateAmount2Async = async () => {
    if (!amountA || !isConnected || !token1Address || !token2Address) {
      setAmountB('');
      return;
    }

    setEstimate(true);
    try {
      const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
      if (!SWAP_CONTRACT) return;

      const trimmedAmount = amountA.toString().trim();
      if (!trimmedAmount || isNaN(Number(trimmedAmount))) {
        setAmountB('0');
        return;
      }

      const TokenAmountInWei = ethers.parseEther(trimmedAmount);
      setToWei(TokenAmountInWei);

      const rate = await SWAP_CONTRACT.estimate(token1Address, token2Address, TokenAmountInWei);
      setAmount2Rate(rate.toString());
      const formattedRate = ethers.formatEther(rate);
      setAmountB(formattedRate.toString());
    } catch (error) {
      console.error('Error calculating amount2:', error);
      setAmountB('0');
    } finally {
      setEstimate(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateAmount2Async();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [amountA, token1, token2, isConnected, token1Address, token2Address]);

  // Fetch balances and pool data when modal opens
  useEffect(() => {
    if (!showAddModal || !selectedPool || !isConnected) return;

    const fetchModalData = async () => {
      try {
        const token1Symbol = selectedPool.tokenA as string;
        const token2Symbol = selectedPool.tokenB as string;
        
        setToken1(token1Symbol);
        setToken2(token2Symbol);
        
        const poolExists = checkPoolExists(token1Symbol, token2Symbol);
        setPoolExists(poolExists);

        const t1Address = tokens.find(t => t.symbol === token1Symbol)?.address;

        if (t1Address) {
          const bal1 = await fetchBalance(t1Address);
          setBal1(bal1 ? roundToTwoDecimalPlaces(bal1).toString() : '0');
        }
      } catch (error) {
        console.error('Error fetching modal data:', error);
      }
    };

    fetchModalData();
  }, [showAddModal, selectedPool, isConnected, fetchBalance]);

  // Approve functions
  const ApproveToken1 = async () => {
    if (!token1Address || !amount1inWei) return;
    try {
      const TEST_TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(token1Address);
      if (!TEST_TOKEN_CONTRACT) {
        toast.error('Failed to get token contract');
        return;
      }
      const approveSpending = await TEST_TOKEN_CONTRACT.approve(CONTRACT_ADDRESSES.swapAddress, amount1inWei);
      setApprove1(true);
      await approveSpending.wait();
      setApprove1(false);
      setHasApprovedOne(true);
      toast.success(`Token ${token1} approved`);
    } catch (error) {
      setApprove1(false);
      console.error(error);
      toast.error('Approval failed');
    }
  };

  const ApproveToken2 = async () => {
    if (!token2Address || !amount2Rate) return;
    try {
      const TEST_TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(token2Address);
      if (!TEST_TOKEN_CONTRACT) {
        toast.error('Failed to get token contract');
        return;
      }
      const approveSpending = await TEST_TOKEN_CONTRACT.approve(CONTRACT_ADDRESSES.swapAddress, amount2Rate);
      setApprove2(true);
      await approveSpending.wait();
      setApprove2(false);
      setHasApprovedTwo(true);
      toast.success(`Token ${token2} approved`);
    } catch (error) {
      setApprove2(false);
      console.error(error);
      toast.error('Approval failed');
    }
  };

  const getLiquidID = async (poolid: bigint, token1Symbol: string, token2Symbol: string) => {
    try {
      const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
      if (!SWAP_CONTRACT) {
        console.error('Failed to get swap contract');
        return;
      }
      const LIQUID_ID = await SWAP_CONTRACT.liquidIndex(poolid);
      const xLIQUID_ID = Number(LIQUID_ID);
      const id = `Your Liquid ID for ${token1Symbol}/${token2Symbol} is ${xLIQUID_ID}`;
      toast.success(id);
    } catch (error) {
      console.error('Error getting liquid ID:', error);
    }
  };

  const AddLiquidity = async () => {
    if (!token1Address || !token2Address || !amount1inWei) return;
    
    try {
      const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
      if (!SWAP_CONTRACT) {
        toast.error('Failed to get swap contract');
        return;
      }
      
      const POOL_ID = await SWAP_CONTRACT.findPool(token1Address, token2Address);
      
      if (Number(POOL_ID) === 0) {
        toast.error('Pool not found');
        return;
      }

      setIsAddLiquid(true);

      if (isNativeToken(token1Address)) {
        const ADD_LIQUID = await SWAP_CONTRACT.provideLiquidity(POOL_ID, amount1inWei, { value: amount1inWei });
        await ADD_LIQUID.wait();
        await getLiquidID(POOL_ID, token1, token2);
      } else {
        const ADD_LIQUID = await SWAP_CONTRACT.provideLiquidity(POOL_ID, amount1inWei);
        await ADD_LIQUID.wait();
        await getLiquidID(POOL_ID, token1, token2);
      }

      setIsAddLiquid(false);
      setHasApprovedOne(false);
      setHasApprovedTwo(false);
      setApprove1(false);
      setApprove2(false);
      setShowAddModal(false);
      setSuccessMessage(`You added ${amountA} ${token1} and ${amountB} ${token2} to Pool #${POOL_ID}.`);
      setAmountA('');
      setAmountB('');
      
      // Refresh pool data to update total liquidity
      setRefreshTrigger(prev => prev + 1);
      toast.success('Liquidity added successfully! Pool data refreshed.');
    } catch (error) {
      setIsAddLiquid(false);
      console.error(error);
      toast.error('Adding liquidity failed');
    }
  };

  const REMOVE_LIQUID = async () => {
    if (!liquidID) return;
    try {
      const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
      if (!SWAP_CONTRACT) {
        toast.error('Failed to get swap contract');
        return;
      }
      const REMOVE_LIQUID = await SWAP_CONTRACT.removeLiquidity(liquidID);
      setIsRemoveLiquid(true);
      await REMOVE_LIQUID.wait();
      setIsRemoveLiquid(false);
      setShowRemoveModal(false);
      setSuccessMessage(`You removed liquidity with ID ${liquidID}.`);
      setLiquidID('');
      
      // Refresh pool data to update total liquidity
      setRefreshTrigger(prev => prev + 1);
      toast.success('Liquidity removed successfully! Pool data refreshed.');
    } catch (error) {
      setIsRemoveLiquid(false);
      console.error(error);
      toast.error('Remove liquidity failed');
    }
  };

  const setMaxAmount1 = () => {
    if (Bal1) setAmountA(Bal1.toString());
  };

  // Handler functions for component callbacks
  const handleAddLiquidity = (poolId: string) => {
    const pool = liquidityPools.find(p => p.id === poolId) || null;
    setSelectedPool(pool);
    setAmountA('');
    setAmountB('');
    setHasApprovedOne(false);
    setHasApprovedTwo(false);
    setApprove1(false);
    setApprove2(false);
    setAmount2Rate('');
    setToWei(null);
    setShowAddModal(true);
  };

  const handleRemoveLiquidity = (poolId: string) => {
    const pool = liquidityPools.find(p => p.id === poolId) || null;
    setSelectedPool(pool);
    setLiquidID('');
    setShowRemoveModal(true);
  };

  const handleClaimFees = (poolId: string) => {
    const pool = liquidityPools.find(p => p.id === poolId) || null;
    setSelectedPool(pool);
    setShowClaimConfirm(true);
  };

  const handleClaimRewards = (positionId: string) => {
    console.log('Claim rewards for position:', positionId);
    // Implement claim rewards logic
  };

  const handleStake = (pool: any) => {
    console.log('Stake in pool:', pool);
    // Implement stake logic
  };

  // Transactions list hidden for now

  return (
    <>
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-2">Activity</h1>
          <p className="text-secondary">Track your transaction history and status</p>
        </div>

        {/* Tabs: Transactions, Liquidity, Staking */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {[
            //{ id: 'transactions', label: 'Transactions' },
            { id: 'liquidity', label: 'Liquidity' },
            //{ id: 'staking', label: 'Staking' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LocalTab)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === (tab.id as LocalTab)
                  ? 'bg-accent-green text-white'
                  : 'bg-tertiary text-primary hover:bg-quaternary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions section */}
        {activeTab === 'transactions' && (
          <div className="mt-6 space-y-3">
            {transactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))}
          </div>
        )}

        {/* Liquidity Pools Section */}
        {activeTab === 'liquidity' && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-primary mb-2">Your Liquidity Pools</h2>
              <p className="text-secondary">Manage your liquidity positions and earn fees</p>
            </div>

            {/* Create New Pool - First */}
            <div className="mb-6">
              <button 
                onClick={() => window.location.href = '/create-pool'}
                className="w-full px-6 py-4 bg-tertiary text-primary rounded-xl border-2 border-dashed border-white/20 hover:border-accent-green hover:text-accent-green transition-colors duration-200"
              >
                <img src="/assets/createicon.svg" alt="Create" className="w-10 h-10 mb-2 inline-block dark:invert" />
                <div className="font-semibold">Create New Pool</div>
                <div className="text-sm text-secondary">Start earning fees with a new liquidity pool</div>
              </button>
            </div>

            <div className="space-y-4">
              {loadingPools ? (
                <div className="text-center py-8 text-secondary">
                  <p>Loading liquidity pools...</p>
                </div>
              ) : liquidityPools.length === 0 ? (
                <div className="text-center py-8 text-secondary">
                  <p>No liquidity pools available</p>
                </div>
              ) : (
                liquidityPools.map((pool) => (
                <LiquidityPoolCard
                  key={pool.id}
                  pool={pool}
                  onAddLiquidity={handleAddLiquidity}
                  onRemoveLiquidity={handleRemoveLiquidity}
                  onClaimFees={handleClaimFees}
                />
                ))
              )}
            </div>
          </div>
        )}

        {/* Staking Section */}
        {activeTab === 'staking' && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-primary mb-2">Staking Rewards</h2>
              <p className="text-secondary">Stake your tokens and earn passive rewards</p>
            </div>

            <StakingCard
              activePositions={[
                {
                  id: '1',
                  token: 'USDT',
                  stakedAmount: 1000,
                  apy: 8.2,
                  earnedRewards: 25.5,
                  stakingPeriod: 0
                }
              ]}
              availablePools={[
                { token: 'USDT', apy: 8.2, minStake: 100 },
                { token: 'NGN', apy: 12.5, minStake: 50000 },
                { token: 'GHS', apy: 6.8, minStake: 200 }
              ]}
              onClaimRewards={handleClaimRewards}
              onStake={handleStake}
            />
          </div>
        )}
      </div>
    </div>

    {/* Add Liquidity Modal */}
    {showAddModal && selectedPool && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setShowAddModal(false)}>
        <div className="bg-secondary rounded-2xl p-4 md:p-6 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-primary">Add Liquidity</h3>
            <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-tertiary hover:bg-quaternary flex items-center justify-center">✕</button>
          </div>
          <div className="text-xs md:text-sm text-secondary mb-4">{selectedPool.tokenA}/{selectedPool.tokenB} • Pool #{selectedPool.id}</div>
          <div className="space-y-3 md:space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs md:text-sm text-secondary">Amount {selectedPool.tokenA}</label>
                {Bal1 && (
                  <span className="text-xs text-secondary">Balance: {Bal1}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input 
                  value={amountA} 
                  onChange={(e)=>setAmountA(e.target.value)} 
                  inputMode="decimal" 
                  disabled={!isConnected}
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-tertiary rounded-lg text-primary outline-none focus:ring-2 focus:ring-accent-green disabled:opacity-50" 
                  placeholder={isConnected ? "0.00" : "Connect wallet"} 
                />
                <button 
                  onClick={setMaxAmount1}
                  className="px-2 py-1 text-xs text-accent-green hover:underline"
                  disabled={!isConnected || !Bal1}
                >
                  Max
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs md:text-sm text-secondary mb-2">Amount {selectedPool.tokenB}</label>
              <input 
                value={amountB} 
                readOnly
                className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-tertiary rounded-lg text-primary outline-none opacity-75" 
                placeholder={isEstimate ? "Calculating..." : "0.00"} 
              />
            </div>
            {!poolExists && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                No liquidity pool exists for this pair. Please select tokens with available pools.
              </div>
            )}
            {isEstimate && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-200">
                Calculating optimal amount...
            </div>
            )}
            {/* Approval buttons */}
            {token1Address && !isNativeToken(token1Address) && (
              <button
                onClick={ApproveToken1}
                disabled={Boolean(isApprove1 || hasApproveOne || !amountA || !amount1inWei)}
                className={`w-full px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold transition-colors ${
                  hasApproveOne 
                    ? 'bg-green-600 text-white' 
                    : isApprove1 
                    ? 'bg-tertiary text-secondary cursor-not-allowed' 
                    : 'bg-tertiary text-primary hover:bg-quaternary'
                }`}
              >
                {isApprove1 ? 'Approving...' : hasApproveOne ? `✓ Approved ${token1}` : `Approve ${token1}`}
              </button>
            )}
            {token2Address && !isNativeToken(token2Address) && (
              <button
                onClick={ApproveToken2}
                disabled={Boolean(isApprove2 || hasApproveTwo || !amount2Rate)}
                className={`w-full px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold transition-colors ${
                  hasApproveTwo 
                    ? 'bg-green-600 text-white' 
                    : isApprove2 
                    ? 'bg-tertiary text-secondary cursor-not-allowed' 
                    : 'bg-tertiary text-primary hover:bg-quaternary'
                }`}
              >
                {isApprove2 ? 'Approving...' : hasApproveTwo ? `✓ Approved ${token2}` : `Approve ${token2}`}
              </button>
            )}
            <button
              disabled={Boolean(
                isAddLiquid ||
                !isConnected || 
                !poolExists || 
                !amountA || 
                isEstimate ||
                (token1Address && !isNativeToken(token1Address) && !hasApproveOne) ||
                (token2Address && !isNativeToken(token2Address) && !hasApproveTwo)
              )}
              onClick={AddLiquidity}
              className={`w-full px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold transition-colors ${
                isAddLiquid ||
                !isConnected || 
                !poolExists || 
                !amountA || 
                isEstimate ||
                (token1Address && !isNativeToken(token1Address) && !hasApproveOne) ||
                (token2Address && !isNativeToken(token2Address) && !hasApproveTwo)
                  ? 'bg-tertiary text-secondary cursor-not-allowed' 
                  : 'bg-accent-green text-white hover:bg-accent-green-hover'
              }`}
            >
              {isAddLiquid ? 'Adding Liquidity...' : 
               !isConnected ? 'Connect Wallet' :
               !poolExists ? 'Pool not available' :
               !amountA ? 'Enter amount' :
               isEstimate ? 'Calculating...' :
               (token1Address && !isNativeToken(token1Address) && !hasApproveOne) ? `Approve ${token1} First` :
               (token2Address && !isNativeToken(token2Address) && !hasApproveTwo) ? `Approve ${token2} First` :
               'Confirm Add Liquidity'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Liquidity Modal */}
    {showRemoveModal && selectedPool && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setShowRemoveModal(false)}>
        <div className="bg-secondary rounded-2xl p-4 md:p-6 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-primary">Remove Liquidity</h3>
            <button onClick={() => setShowRemoveModal(false)} className="w-8 h-8 rounded-full bg-tertiary hover:bg-quaternary flex items-center justify-center">✕</button>
          </div>
          <div className="text-xs md:text-sm text-secondary mb-4">{selectedPool.tokenA}/{selectedPool.tokenB} • Pool #{selectedPool.id}</div>
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm text-secondary mb-2">Liquidity ID</label>
              <input
                type="number"
                value={liquidID}
                onChange={(e) => setLiquidID(e.target.value)}
                disabled={!isConnected}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-tertiary rounded-lg text-primary outline-none focus:ring-2 focus:ring-accent-green disabled:opacity-50"
                placeholder={isConnected ? "0" : "Connect wallet to enter liquidity ID"}
              />
            </div>
            <button
              disabled={isRemoveLiquid || !isConnected || !liquidID}
              onClick={REMOVE_LIQUID}
              className={`w-full px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold transition-colors ${
                isRemoveLiquid || !isConnected || !liquidID
                  ? 'bg-tertiary text-secondary cursor-not-allowed'
                  : 'bg-accent-green text-white hover:bg-accent-green-hover'
              }`}
            >
              {isRemoveLiquid ? 'Removing Liquidity...' : 'Confirm Remove'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Success Confirmation */}
    <OperationConfirmationModal
      isOpen={!!successMessage}
      onClose={() => setSuccessMessage(null)}
      title="Transaction confirmed"
      message={successMessage || ''}
      ctaLabel="Close"
    />

    {/* Claim Fees Confirmation */}
    {showClaimConfirm && selectedPool && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setShowClaimConfirm(false)}>
        <div className="bg-secondary rounded-2xl p-4 md:p-6 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-primary">Claim Fees?</h3>
            <button onClick={() => setShowClaimConfirm(false)} className="w-8 h-8 rounded-full bg-tertiary hover:bg-quaternary flex items-center justify-center">✕</button>
          </div>
          <p className="text-xs md:text-sm text-secondary mb-4 md:mb-6">You are about to claim your accrued fees from Pool #{selectedPool.id} ({selectedPool.tokenA}/{selectedPool.tokenB}). Continue?</p>
          <div className="flex items-center justify-end gap-2 md:gap-3">
            <button onClick={() => setShowClaimConfirm(false)} className="px-3 md:px-4 py-2 bg-tertiary text-primary rounded-lg hover:bg-quaternary text-sm md:text-base">Cancel</button>
            <button onClick={() => { setShowClaimConfirm(false); setSuccessMessage(`You have successfully claimed fees from Pool #${selectedPool.id}. Your wallet has been updated.`); }} className="px-3 md:px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green-hover text-sm md:text-base">Confirm</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ActivityPage;


