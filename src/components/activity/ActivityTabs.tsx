import React from 'react';

export type ActivityTab = 'all' | 'swaps' | 'transfers' | 'liquidity' | 'staking';

interface ActivityTabsProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
}

const ActivityTabs: React.FC<ActivityTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'all' as ActivityTab, label: 'All' },
    { key: 'swaps' as ActivityTab, label: 'Swaps' },
    { key: 'transfers' as ActivityTab, label: 'Transfers' },
    { key: 'liquidity' as ActivityTab, label: 'Liquidity' },
  //  { key: 'staking' as ActivityTab, label: 'Staking' }
  ];

  return (
    <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-1 px-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
            activeTab === tab.key
              ? 'bg-accent-green text-white'
              : 'bg-tertiary text-secondary hover:bg-quaternary hover:text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ActivityTabs;
