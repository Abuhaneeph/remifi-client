import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { formatEther } from 'ethers';
import { useContractInstances } from '../../provider/ContractInstanceProvider';
import tokensList from '../../lib/Tokens/tokens';
import { roundToTwoDecimalPlaces } from '../../lib/utils';

ChartJS.register(ArcElement, Tooltip, Legend);

const TokenDistributionChart: React.FC = () => {
  const { PRICEAPI_CONTRACT_INSTANCE, fetchBalance, isConnected, address } = useContractInstances();
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [{
      data: [] as number[],
      backgroundColor: [] as string[],
      borderWidth: 0,
      hoverOffset: 4
    }]
  });

  const colors = [
    'rgb(16, 185, 129)',
    'rgb(59, 130, 246)',
    'rgb(168, 85, 247)',
    'rgb(236, 72, 153)',
    'rgb(251, 146, 60)',
    'rgb(239, 68, 68)',
    'rgb(34, 197, 94)',
    'rgb(249, 115, 22)',
  ];

  useEffect(() => {
    const calculateDistribution = async () => {
      if (!isConnected || !address) {
        setChartData({
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [],
            borderWidth: 0,
            hoverOffset: 4
          }]
        });
        return;
      }

      try {
        const priceContract = await PRICEAPI_CONTRACT_INSTANCE();
        if (!priceContract) return;

        const tokenValues: { symbol: string; usdValue: number }[] = [];

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
            if (usdValue > 0) {
              tokenValues.push({
                symbol: token.symbol,
                usdValue: roundToTwoDecimalPlaces(usdValue)
              });
            }
          } catch (error) {
            console.error(`Error fetching data for ${token.symbol}:`, error);
          }
        }

        // Sort by value descending
        tokenValues.sort((a, b) => b.usdValue - a.usdValue);

        // Calculate total value
        const totalValue = tokenValues.reduce((sum, token) => sum + token.usdValue, 0);

        // Calculate percentages
        const labels = tokenValues.map(t => t.symbol);
        const percentages = tokenValues.map(t => totalValue > 0 ? (t.usdValue / totalValue) * 100 : 0);
        const backgroundColor = percentages.map((_, i) => colors[i % colors.length]);

        setChartData({
          labels,
          datasets: [{
            data: percentages,
            backgroundColor,
            borderWidth: 0,
            hoverOffset: 4
          }]
        });
      } catch (error) {
        console.error('Error calculating distribution:', error);
      }
    };

    calculateDistribution();
    
    // Update every 2 seconds
    const interval = setInterval(calculateDistribution, 2000);
    return () => clearInterval(interval);
  }, [isConnected, address, PRICEAPI_CONTRACT_INSTANCE, fetchBalance]);

  const data = chartData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          padding: 12,
          font: {
            size: 11
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-secondary rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-primary mb-4">Token Distribution</h3>
      <div style={{ height: '250px' }}>
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
};

export default TokenDistributionChart;

