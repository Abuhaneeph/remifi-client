import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { formatEther } from 'ethers';
import { useContractInstances } from '../../provider/ContractInstanceProvider';
import tokensList from '../../lib/Tokens/tokens';
import { roundToTwoDecimalPlaces } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

interface Token {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  balance: number;
  icon: string;
  sparklineData: number[];
}

const TokensActivity: React.FC = () => {
  const { PRICEAPI_CONTRACT_INSTANCE, fetchBalance, isConnected, address } = useContractInstances();
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const [activitiesToShow, setActivitiesToShow] = useState(3);

  // Currency to crypto token mapping
  const currencyToTokenMap: { [key: string]: string } = {
    'NGN': 'cNGN',
    'KES': 'cKES',
    'GHS': 'cGHS',
    'ZAR': 'cZAR'
  };

  // Base token data
  const baseTokens: Omit<Token, 'price' | 'change24h' | 'volume24h' | 'balance' | 'sparklineData'>[] = [
    { 
      symbol: 'NGN', 
      name: 'Nigerian Naira', 
      icon: '/assets/ngn.svg'
    },
    { 
      symbol: 'GHS', 
      name: 'Ghanaian Cedi', 
      icon: '/assets/ghs.svg'
    },
    { 
      symbol: 'KES', 
      name: 'Kenyan Shilling', 
      icon: '/assets/kes.svg'
    },
  ];

  const [tokensData, setTokensData] = useState<Token[]>(
    baseTokens.map(token => ({
      ...token,
      price: 0,
      change24h: 0,
      volume24h: 0,
      balance: 0,
      sparklineData: []
    }))
  );

  const previousPricesRef = useRef<{ [key: string]: number }>({});
  const sparklineDataRef = useRef<{ [key: string]: number[] }>({});

  // Fetch exchange rates and balances
  useEffect(() => {
    const fetchTokenData = async () => {
      const priceContract = await PRICEAPI_CONTRACT_INSTANCE();
      if (!priceContract) return;

      try {
        const updatedTokens: Token[] = [];
        const newPreviousPrices: { [key: string]: number } = {};

        for (const baseToken of baseTokens) {
          const cryptoTokenSymbol = currencyToTokenMap[baseToken.symbol];
          if (!cryptoTokenSymbol) continue;

          // Find the crypto token
          const cryptoToken = tokensList.find(t => t.symbol === cryptoTokenSymbol);
          if (!cryptoToken || !cryptoToken.address) continue;

          try {
            // Get price from contract
            const price = await priceContract.getTokenPrice(cryptoToken.address);
            const basePriceInUSD = parseFloat(formatEther(price));
            
            // Add random fluctuation (±0.25%) to simulate market movement
            const fluctuationPercent = (Math.random() - 0.5) * 0.5; // -0.25% to +0.25%
            const fluctuationAmount = basePriceInUSD * (fluctuationPercent / 100);
            const priceInUSD = basePriceInUSD + fluctuationAmount;
            
            // Calculate change
            const previousPrice = previousPricesRef.current[baseToken.symbol];
            let priceChange = 0;
            
            if (previousPrice && previousPrice > 0) {
              priceChange = ((priceInUSD - previousPrice) / previousPrice) * 100;
            } else {
              priceChange = fluctuationPercent;
            }
            
            const roundedChange = roundToTwoDecimalPlaces(priceChange);
            newPreviousPrices[baseToken.symbol] = priceInUSD;

            // Update sparkline data
            if (!sparklineDataRef.current[baseToken.symbol]) {
              sparklineDataRef.current[baseToken.symbol] = [];
            }
            const currentSparkline = sparklineDataRef.current[baseToken.symbol];
            currentSparkline.push(priceInUSD);
            // Keep only last 15 data points
            if (currentSparkline.length > 15) {
              currentSparkline.shift();
            }
            // If we have less than 15 points, fill with current price for smooth chart
            while (currentSparkline.length < 15 && currentSparkline.length > 0) {
              currentSparkline.unshift(currentSparkline[0]);
            }

            // Fetch balance if wallet is connected
            let balance = 0;
            if (isConnected && address) {
              try {
                const tokenBalance = await fetchBalance(cryptoToken.address);
                if (tokenBalance !== undefined) {
                  balance = roundToTwoDecimalPlaces(tokenBalance);
                }
              } catch (error) {
                console.error(`Error fetching balance for ${baseToken.symbol}:`, error);
              }
            }

            updatedTokens.push({
              ...baseToken,
              price: priceInUSD,
              change24h: roundedChange,
              volume24h: 0, // Volume can be fetched separately if needed
              balance: balance,
              sparklineData: [...currentSparkline]
            });
          } catch (error) {
            console.error(`Error fetching price for ${baseToken.symbol}:`, error);
            // Keep previous data or default
            const existingToken = tokensData.find(t => t.symbol === baseToken.symbol);
            updatedTokens.push({
              ...baseToken,
              price: existingToken?.price || 0,
              change24h: existingToken?.change24h || 0,
              volume24h: existingToken?.volume24h || 0,
              balance: existingToken?.balance || 0,
              sparklineData: existingToken?.sparklineData || []
            });
          }
        }

        setTokensData(updatedTokens);
        previousPricesRef.current = newPreviousPrices;
      } catch (error) {
        console.error('Error fetching token data:', error);
      }
    };

    fetchTokenData();
    
    // Update rates every 2 seconds
    const interval = setInterval(fetchTokenData, 2000);
    return () => clearInterval(interval);
  }, [PRICEAPI_CONTRACT_INSTANCE, isConnected, address, fetchBalance]);

  // Use tokensData for rendering
  const tokens = tokensData;

  const getSparklineChart = (data: number[], isPositive: boolean) => {
    // If no data, create a flat line with the current price or 0
    const chartData = data.length > 0 ? data : [0];
    return {
      labels: chartData.map(() => ''),
      datasets: [
        {
          label: 'Price',
          data: chartData,
        borderColor: isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 50);
          if (isPositive) {
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          } else {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          }
          return gradient;
        },
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        borderWidth: 2,
        borderJoinStyle: 'round' as const,
        borderCapStyle: 'round' as const,
      }
    ]
  };
  };

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    scales: {
      x: { display: false, grid: { display: false } },
      y: { display: false, grid: { display: false } }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      point: {
        radius: 0
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none hover:bg-tertiary ${
            activeTab === 'tokens' ? 'bg-tertiary text-primary' : 'text-secondary'
          }`}
        >
          Tokens
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none hover:bg-tertiary ${
            activeTab === 'activity' ? 'bg-tertiary text-primary' : 'text-secondary'
          }`}
        >
          Activity
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'tokens' ? (
          <motion.div
            key="tokens"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-secondary rounded-xl border border-white/10 overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-medium text-secondary">
                <div className="col-span-3">Asset</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">24h Change</div>
                <div className="col-span-2 text-right">Balance</div>
                <div className="col-span-3 text-right">24h Price Chart</div>
              </div>

              {/* Token List */}
              <div className="divide-y divide-white/10">
                {tokens.map((token, index) => {
                  const isPositive = token.change24h >= 0;
                  return (
                    <motion.div
                      key={token.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-tertiary/50 transition-colors duration-200 cursor-pointer group"
                    >
                      {/* Mobile Card Layout */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" />
                            <div>
                              <div className="font-medium text-primary">{token.symbol}</div>
                              <div className="text-xs text-secondary">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-base font-semibold ${isPositive ? 'text-accent-green' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-secondary mb-1">Price</div>
                            <div className="font-medium text-primary">${token.price.toFixed(4)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-secondary mb-1">Balance</div>
                            <div className="font-medium text-primary">{token.balance.toLocaleString()}</div>
                            <div className="text-xs text-secondary mt-0.5">${(token.balance * token.price).toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="text-xs text-secondary mb-2">24h Price Chart</div>
                          <div style={{ width: '100%', height: '60px' }}>
                            <Line data={getSparklineChart(token.sparklineData, isPositive)} options={sparklineOptions} />
                          </div>
                        </div>
                      </div>

                      {/* Desktop Table Layout */}
                      <div className="hidden md:grid grid-cols-12 gap-4">
                      <div className="col-span-3 flex items-center space-x-3">
                        <img src={token.icon} alt={token.symbol} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-medium text-primary">{token.symbol}</div>
                          <div className="text-xs text-secondary">{token.name}</div>
                        </div>
                      </div>

                      <div className="col-span-2 text-right flex flex-col justify-center">
                        <div className="font-medium text-primary">${token.price.toFixed(4)}</div>
                      </div>

                      <div className="col-span-2 text-right flex flex-col justify-center">
                        <div className={`font-medium ${isPositive ? 'text-accent-green' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                        </div>
                      </div>

                      <div className="col-span-2 text-right flex flex-col justify-center">
                        <div className="font-medium text-primary">
                          {token.balance.toLocaleString()}
                        </div>
                        <div className="text-xs text-secondary">
                          ${(token.balance * token.price).toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center justify-end px-2">
                        <div style={{ width: '100%', height: '50px', maxWidth: '200px' }}>
                          <Line data={getSparklineChart(token.sparklineData, isPositive)} options={sparklineOptions} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-secondary rounded-xl border border-white/10 overflow-hidden">
              <div className="p-3 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-primary mb-1">Activity</h3>
                <p className="text-xs md:text-sm text-secondary mb-4 md:mb-6">Track your transaction history and status</p>
                
                <div className="flex items-center gap-1.5 md:gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
                  {['All', 'Swaps', 'Transfers', 'Liquidity', 'Staking'].map((filter) => (
                    <button
                      key={filter}
                      className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-tertiary text-secondary hover:bg-quaternary hover:text-primary transition-colors duration-200 whitespace-nowrap"
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {[
                    { network: 'Ethereum', action: 'Swap', fromAmount: '0.24', fromToken: 'ETH', toAmount: '79.91', toToken: 'USDT', usdValue: '$0.239', time: '30s', hash: '0x2A01...9EA9', statusColor: 'text-accent-green' },
                    { network: 'Base', action: 'Swap', fromAmount: '109.41', fromToken: 'DIA', toAmount: '79.91', toToken: 'USDC', usdValue: '$79.91', time: '30s', hash: '0xDc04...d3a1', statusColor: 'text-accent-green' },
                    { network: 'Arbitrum', action: 'Swap', fromAmount: '0.04', fromToken: 'rETH', toAmount: '0.04', toToken: 'ETH', usdValue: '$174.31', time: '30s', hash: '0xae2F...aE13', statusColor: 'text-accent-green' },
                    { network: 'Polygon', action: 'Swap', fromAmount: '505.0K', fromToken: 'TRX', toAmount: '36.29', toToken: 'ETH', usdValue: '$152,686.89', time: '30s', hash: '0x5B43...EFd1', statusColor: 'text-accent-green' },
                    { network: 'OP Mainnet', action: 'Swap', fromAmount: '11.85', fromToken: 'USDC', toAmount: '<0.01', toToken: 'ETH', usdValue: '$11.86', time: '30s', hash: '0xA83E...b111', statusColor: 'text-accent-green' }
                  ].slice(0, activitiesToShow).map((activity, index) => (
                    <div key={index} className="bg-tertiary/50 rounded-lg p-3 md:p-4 border border-white/5 hover:bg-tertiary/70 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        {/* Left side - Icon and Transaction info */}
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-quaternary rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm md:text-base">🔄</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs md:text-sm font-medium text-primary">{activity.action}</span>
                              <span className={`text-xs ${activity.statusColor} font-medium`}>✓</span>
                            </div>
                            <div className="text-xs text-secondary truncate">
                              {activity.fromAmount} {activity.fromToken} → {activity.toAmount} {activity.toToken}
                            </div>
                          </div>
                        </div>
                        {/* Right side - Value and time */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-medium text-primary">{activity.usdValue}</div>
                          <div className="text-xs text-secondary">{activity.time}</div>
                        </div>
                      </div>
                      {/* Transaction hash */}
                      <div className="text-xs text-secondary font-mono mt-2 pl-10 md:pl-12 break-all">
                        {activity.hash}
                      </div>
                    </div>
                  ))}
                </div>

                {activitiesToShow < 6 && (
                  <button 
                    onClick={() => setActivitiesToShow(activitiesToShow + 3)}
                    className="w-full mt-6 py-3 text-sm font-medium text-primary bg-tertiary hover:bg-quaternary rounded-lg transition-colors duration-200"
                  >
                    Load More
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokensActivity;
