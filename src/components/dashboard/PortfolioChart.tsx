import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimeRange = '1D' | '7D' | '30D' | '1Y' | 'ALL';

const PortfolioChart: React.FC = () => {
  const { PRICEAPI_CONTRACT_INSTANCE, fetchBalance, isConnected, address } = useContractInstances();
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  
  const [portfolioData, setPortfolioData] = useState({
    current: 0,
    change24h: 0,
    change7d: 0,
    change30d: 0,
    change30dPercent: 0,
    totalAssets: 0
  });

  const portfolioHistoryRef = useRef<{ timestamp: number; value: number }[]>([]);
  const previousValuesRef = useRef<{
    current: number;
    last24h: number;
    last7d: number;
    last30d: number;
  }>({
    current: 0,
    last24h: 0,
    last7d: 0,
    last30d: 0
  });

  const timeRanges: TimeRange[] = ['1D', '7D', '30D', '1Y', 'ALL'];

  // Calculate portfolio value
  useEffect(() => {
    const calculatePortfolioValue = async () => {
      if (!isConnected || !address) {
        setPortfolioData({
          current: 0,
          change24h: 0,
          change7d: 0,
          change30d: 0,
          change30dPercent: 0,
          totalAssets: 0
        });
        return;
      }

      try {
        const priceContract = await PRICEAPI_CONTRACT_INSTANCE();
        if (!priceContract) return;

        let totalValue = 0;
        let assetCount = 0;

        // Fetch balances and prices for all tokens
        for (const token of tokensList) {
          if (!token.address) continue;

          try {
            const balance = await fetchBalance(token.address);
            const balanceValue = balance !== undefined ? parseFloat(balance) : NaN;
            if (!Number.isFinite(balanceValue) || balanceValue <= 0) continue;

            const price = await priceContract.getTokenPrice(token.address);
            const priceInUSD = parseFloat(formatEther(price));
            
            const usdValue = balanceValue * priceInUSD;
            totalValue += usdValue;
            assetCount++;
          } catch (error) {
            console.error(`Error fetching data for ${token.symbol}:`, error);
          }
        }

        const roundedTotal = roundToTwoDecimalPlaces(totalValue);
        const now = Date.now();

        // Add to history
        portfolioHistoryRef.current.push({ timestamp: now, value: roundedTotal });
        // Keep only last 30 days of data
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        portfolioHistoryRef.current = portfolioHistoryRef.current.filter(
          entry => entry.timestamp >= thirtyDaysAgo
        );

        // Calculate changes
        const last24h = portfolioHistoryRef.current.find(
          entry => entry.timestamp <= now - (24 * 60 * 60 * 1000)
        )?.value || previousValuesRef.current.last24h || roundedTotal;
        
        const last7d = portfolioHistoryRef.current.find(
          entry => entry.timestamp <= now - (7 * 24 * 60 * 60 * 1000)
        )?.value || previousValuesRef.current.last7d || roundedTotal;
        
        const last30d = portfolioHistoryRef.current.find(
          entry => entry.timestamp <= now - (30 * 24 * 60 * 60 * 1000)
        )?.value || previousValuesRef.current.last30d || roundedTotal;

        const change24h = last24h > 0 ? roundedTotal - last24h : 0;
        const change7d = last7d > 0 ? roundedTotal - last7d : 0;
        const change30d = last30d > 0 ? roundedTotal - last30d : 0;
        const change30dPercent = last30d > 0 ? ((roundedTotal - last30d) / last30d) * 100 : 0;

        setPortfolioData({
          current: roundedTotal,
          change24h: roundToTwoDecimalPlaces(change24h),
          change7d: roundToTwoDecimalPlaces(change7d),
          change30d: roundToTwoDecimalPlaces(change30d),
          change30dPercent: roundToTwoDecimalPlaces(change30dPercent),
          totalAssets: assetCount
        });

        previousValuesRef.current = {
          current: roundedTotal,
          last24h: last24h,
          last7d: last7d,
          last30d: last30d
        };
      } catch (error) {
        console.error('Error calculating portfolio value:', error);
      }
    };

    calculatePortfolioValue();
    
    // Update every 2 seconds
    const interval = setInterval(calculatePortfolioValue, 2000);
    return () => clearInterval(interval);
  }, [isConnected, address, PRICEAPI_CONTRACT_INSTANCE, fetchBalance]);

  const getDataForRange = (range: TimeRange) => {
    const history = portfolioHistoryRef.current;
    if (history.length === 0) {
      return {
        labels: ['Now'],
        data: [portfolioData.current]
      };
    }

    const now = Date.now();
    let filteredHistory: { timestamp: number; value: number }[] = [];

    switch (range) {
      case '1D':
        filteredHistory = history.filter(entry => entry.timestamp >= now - (24 * 60 * 60 * 1000));
        if (filteredHistory.length === 0) {
          return {
            labels: ['Now'],
            data: [portfolioData.current]
          };
        }
        return {
          labels: filteredHistory.map((_, i) => {
            const hours = ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM'];
            return hours[i % hours.length];
          }),
          data: filteredHistory.map(entry => entry.value)
        };
      case '7D':
        filteredHistory = history.filter(entry => entry.timestamp >= now - (7 * 24 * 60 * 60 * 1000));
        if (filteredHistory.length === 0) {
          return {
            labels: ['Now'],
            data: [portfolioData.current]
          };
        }
        return {
          labels: filteredHistory.map((_, i) => {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return days[i % days.length];
          }),
          data: filteredHistory.map(entry => entry.value)
        };
      case '30D':
        filteredHistory = history.filter(entry => entry.timestamp >= now - (30 * 24 * 60 * 60 * 1000));
        if (filteredHistory.length === 0) {
          return {
            labels: ['Now'],
            data: [portfolioData.current]
          };
        }
        return {
          labels: filteredHistory.map((_, i) => {
            const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            return weeks[i % weeks.length];
          }),
          data: filteredHistory.map(entry => entry.value)
        };
      case '1Y':
        filteredHistory = history.filter(entry => entry.timestamp >= now - (365 * 24 * 60 * 60 * 1000));
        if (filteredHistory.length === 0) {
          return {
            labels: ['Now'],
            data: [portfolioData.current]
          };
        }
        return {
          labels: filteredHistory.map((_, i) => {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            return quarters[i % quarters.length];
          }),
          data: filteredHistory.map(entry => entry.value)
        };
      default:
        filteredHistory = history;
        if (filteredHistory.length === 0) {
          return {
            labels: ['Now'],
            data: [portfolioData.current]
          };
        }
        return {
          labels: filteredHistory.map((_, i) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
            return months[i % months.length];
          }),
          data: filteredHistory.map(entry => entry.value)
        };
    }
  };

  const chartData = getDataForRange(timeRange);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: chartData.data,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <motion.div 
      className="bg-secondary rounded-xl p-4 md:p-6 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div>
          <h3 className="text-sm md:text-lg font-semibold text-primary mb-1.5 md:mb-2">Portfolio Value</h3>
          <p className="text-xl md:text-3xl font-bold text-primary">${portfolioData.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1.5 md:gap-2 mt-1 flex-wrap">
            <p className={`text-xs md:text-sm font-medium ${portfolioData.change30d >= 0 ? 'text-accent-green' : 'text-red-500'}`}>
              {portfolioData.change30d >= 0 ? '+' : ''}${portfolioData.change30d.toFixed(2)}
            </p>
            <p className={`text-xs md:text-sm font-medium ${portfolioData.change30dPercent >= 0 ? 'text-accent-green' : 'text-red-500'}`}>
              ({portfolioData.change30dPercent >= 0 ? '+' : ''}{portfolioData.change30dPercent.toFixed(2)}%)
            </p>
            <span className="text-xs text-secondary">30d</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        <div className="bg-tertiary/50 rounded-lg p-2 md:p-3 border border-white/5">
          <p className="text-[10px] md:text-xs text-secondary mb-0.5 md:mb-1">24h Change</p>
          <p className={`text-xs md:text-lg font-semibold ${portfolioData.change24h >= 0 ? 'text-accent-green' : 'text-red-500'}`}>
            {portfolioData.change24h >= 0 ? '+' : ''}${portfolioData.change24h.toFixed(2)}
          </p>
        </div>
        <div className="bg-tertiary/50 rounded-lg p-2 md:p-3 border border-white/5">
          <p className="text-[10px] md:text-xs text-secondary mb-0.5 md:mb-1">7d Change</p>
          <p className={`text-xs md:text-lg font-semibold ${portfolioData.change7d >= 0 ? 'text-accent-green' : 'text-red-500'}`}>
            {portfolioData.change7d >= 0 ? '+' : ''}${portfolioData.change7d.toFixed(2)}
          </p>
        </div>
        <div className="bg-tertiary/50 rounded-lg p-2 md:p-3 border border-white/5">
          <p className="text-[10px] md:text-xs text-secondary mb-0.5 md:mb-1">Assets</p>
          <p className="text-xs md:text-lg font-semibold text-primary">
            {portfolioData.totalAssets}
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-1.5 md:gap-2 mb-4 overflow-x-auto">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              timeRange === range
                ? 'bg-accent-green text-white'
                : 'bg-tertiary text-secondary hover:bg-quaternary hover:text-primary'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: '150px' }} className="md:min-h-[200px]">
        <Line data={data} options={options} />
      </div>
    </motion.div>
  );
};

export default PortfolioChart;
