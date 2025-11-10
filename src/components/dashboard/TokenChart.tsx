import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useContractInstances } from '../../provider/ContractInstanceProvider';
import tokensList from '../../lib/Tokens/tokens';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TokenChart: React.FC = () => {
  const { fetchBalance, isConnected, address } = useContractInstances();
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [{
      label: 'Balance',
      data: [] as number[],
      backgroundColor: 'rgb(16, 185, 129)',
      borderRadius: 8,
      maxBarThickness: 60,
    }]
  });

  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (!isConnected || !address) {
        setChartData({
          labels: [],
          datasets: [{
            label: 'Balance',
            data: [],
            backgroundColor: 'rgb(16, 185, 129)',
            borderRadius: 8,
            maxBarThickness: 60,
          }]
        });
        return;
      }

      try {
        const labels: string[] = [];
        const balances: number[] = [];

        // Fetch balances for all tokens
        for (const token of tokensList) {
          if (!token.address) continue;

          try {
            const balance = await fetchBalance(token.address);
            const balanceValue = balance !== undefined ? parseFloat(balance) : NaN;
            if (Number.isFinite(balanceValue) && balanceValue > 0) {
              labels.push(token.symbol);
              balances.push(Number(balanceValue.toFixed(2)));
            }
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error);
          }
        }

        setChartData({
          labels,
          datasets: [{
            label: 'Balance',
            data: balances,
            backgroundColor: 'rgb(16, 185, 129)',
            borderRadius: 8,
            maxBarThickness: 60,
          }]
        });
      } catch (error) {
        console.error('Error fetching token balances:', error);
      }
    };

    fetchTokenBalances();
    
    // Update every 2 seconds
    const interval = setInterval(fetchTokenBalances, 2000);
    return () => clearInterval(interval);
  }, [isConnected, address, fetchBalance]);

  const data = chartData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toLocaleString()} ${context.label}`;
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
            return value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="bg-secondary rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-primary mb-4">Token Balances</h3>
      <div style={{ height: '200px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default TokenChart;

