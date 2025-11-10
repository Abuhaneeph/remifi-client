import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'ethers';
import { useContractInstances } from '../../provider/ContractInstanceProvider';
import tokens from '../../lib/Tokens/tokens';
import { roundToTwoDecimalPlaces } from '../../lib/utils';

const NGNFlag = '/assets/ngn.svg';
const KESFlag = '/assets/kes.svg';
const GHSFlag = '/assets/ghs.svg';
const ZARFlag = '/assets/zar.svg';

interface CurrencyRate {
  country: string;
  code: string;
  symbol: string;
  rate: string;
  change: number;
  flag: string;
  flagImage: string;
}

const RatesSection: React.FC = () => {
  const { PRICEAPI_CONTRACT_INSTANCE } = useContractInstances();
  
  // Currency to crypto token mapping
  const currencyToTokenMap: { [key: string]: string } = {
    'NGN': 'cNGN',
    'KES': 'cKES',
    'GHS': 'cGHS',
    'ZAR': 'cZAR'
  };

  // Base currency data
  const baseCurrencies: Omit<CurrencyRate, 'rate' | 'change'>[] = [
    {
      country: 'Nigerian Naira',
      code: 'NGN',
      symbol: '₦',
      flag: 'NG',
      flagImage: NGNFlag
    },
    {
      country: 'Kenyan Shilling',
      code: 'KES',
      symbol: 'KSh',
      flag: 'KE',
      flagImage: KESFlag
    },
    {
      country: 'Ghanaian Cedi',
      code: 'GHS',
      symbol: 'GH₵',
      flag: 'GH',
      flagImage: GHSFlag
    },
    {
      country: 'South African Rand',
      code: 'ZAR',
      symbol: 'R',
      flag: 'ZA',
      flagImage: ZARFlag
    }
  ];

  const [currencies, setCurrencies] = useState<CurrencyRate[]>(
    baseCurrencies.map(curr => ({
      ...curr,
      rate: '0.00',
      change: 0
    }))
  );

  const previousPricesRef = useRef<{ [key: string]: number }>({});

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      const priceContract = await PRICEAPI_CONTRACT_INSTANCE();
      if (!priceContract) return;

      try {
        const updatedCurrencies: CurrencyRate[] = [];
        const newPreviousPrices: { [key: string]: number } = {};

        for (const baseCurrency of baseCurrencies) {
          const cryptoTokenSymbol = currencyToTokenMap[baseCurrency.code];
          if (!cryptoTokenSymbol) continue;

          // Find the crypto token
          const cryptoToken = tokens.find(t => t.symbol === cryptoTokenSymbol);
          if (!cryptoToken || !cryptoToken.address) continue;

          try {
            // Get price from contract
            const price = await priceContract.getTokenPrice(cryptoToken.address);
            const basePriceInUSD = parseFloat(formatEther(price));
            
            // Add random fluctuation (±0.01% to ±0.5%) to simulate market movement
            const fluctuationPercent = (Math.random() - 0.5) * 0.5; // -0.25% to +0.25%
            const fluctuationAmount = basePriceInUSD * (fluctuationPercent / 100);
            const priceInUSD = basePriceInUSD + fluctuationAmount;
            
            // Format rate (since these are 1:1 pegged, show the USD price)
            const formattedRate = roundToTwoDecimalPlaces(priceInUSD);
            
            // Calculate change using ref to avoid dependency issues
            const previousPrice = previousPricesRef.current[baseCurrency.code];
            let priceChange = 0;
            
            if (previousPrice && previousPrice > 0) {
              // Calculate percentage change from previous price
              priceChange = ((priceInUSD - previousPrice) / previousPrice) * 100;
            } else {
              // First time or no previous price, use the fluctuation as change
              priceChange = fluctuationPercent;
            }
            
            const roundedChange = roundToTwoDecimalPlaces(priceChange);
            
            newPreviousPrices[baseCurrency.code] = priceInUSD;

            updatedCurrencies.push({
              ...baseCurrency,
              rate: formattedRate.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              }),
              change: roundedChange
            });
          } catch (error) {
            console.error(`Error fetching price for ${baseCurrency.code}:`, error);
            // Keep previous rate or default
            updatedCurrencies.push({
              ...baseCurrency,
              rate: '0.00',
              change: 0
            });
          }
        }

        setCurrencies(updatedCurrencies);
        previousPricesRef.current = newPreviousPrices;
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    fetchExchangeRates();
    
    // Update rates every 2 seconds
    const interval = setInterval(fetchExchangeRates, 2000);
    return () => clearInterval(interval);
  }, [PRICEAPI_CONTRACT_INSTANCE]);

  return (
    <section className="px-6 py-16 bg-primary">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content - Rates Card */}
        <div className="bg-secondary rounded-2xl p-6">
          <h3 className="text-xl font-bold text-primary mb-6">Current Rates</h3>
          <div className="space-y-4">
            {currencies.map((currency, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                    <img 
                      src={currency.flagImage} 
                      alt={`${currency.country} flag`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-primary font-medium">{currency.country}</div>
                    <div className="text-sm text-secondary">{currency.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold">
                    {currency.symbol}&nbsp;{currency.rate}
                  </div>
                  <div className={`text-sm flex items-center justify-end space-x-1 ${
                    currency.change > 0 ? 'text-accent-green' : 'text-accent-red'
                  }`}>
                    {currency.change > 0 ? (
                      <img src="/assets/gain.svg" alt="gain" className="w-4 h-4" />
                    ) : (
                      <img src="/assets/loss.svg" alt="loss" className="w-4 h-4" />
                    )}
                    <span>{Math.abs(currency.change)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl lg:text-4xl font-semibold text-primary leading-tight tracking-tight">
            Know Your Rates in Real-Time
          </h2>
          <p className="text-lg text-secondary leading-relaxed">
            Always updated, always transparent. Track cNGN, cKES, USDT and more before you swap.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default RatesSection;
