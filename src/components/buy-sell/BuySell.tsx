import React, { useState } from 'react';
import Buy from './Buy';
import Sell from './Sell';

const BuySell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  return (
    <section className="px-6 py-8">
      <div className="max-w-2xl mx-auto rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-primary">Buy/Sell</h2>
        </div>

        {/* Tabs */}
        <div className="flex mb-6">
          <button 
            onClick={() => setActiveTab('buy')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'buy' 
                ? 'text-primary border-accent-green' 
                : 'text-secondary border-transparent hover:text-primary'
            }`}
          >
            Buy
          </button>
          <button 
            onClick={() => setActiveTab('sell')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'sell' 
                ? 'text-primary border-accent-green' 
                : 'text-secondary border-transparent hover:text-primary'
            }`}
          >
            Sell
          </button>
        </div>

        {activeTab === 'buy' ? (
          <Buy />
        ) : (
          <Sell />
        )}
      </div>
    </section>
  );
};

export default BuySell;
