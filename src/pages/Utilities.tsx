import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Utility {
  id: string;
  name: string;
  type: 'water' | 'electricity' | 'flight' | 'internet' | 'cable' | 'gas';
  icon: string;
  description: string;
  status: 'available' | 'unavailable';
  processingTime: string;
  fee: string;
  popular?: boolean;
}

interface UtilityCardProps {
  utility: Utility;
  onOpen: (utility: Utility) => void;
}

const UtilityCard: React.FC<UtilityCardProps> = ({ utility, onOpen }) => {
  return (
    <div className={`bg-secondary rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors duration-200 ${
      utility.status === 'unavailable' ? 'opacity-50' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-left">
          <div className="text-primary font-semibold">{utility.name}</div>
          <div className="text-sm text-secondary">{utility.description}</div>
        </div>
        {utility.popular && (
          <div className="px-2 py-1 bg-accent-green text-white text-xs rounded-full">
            Popular
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-secondary">Processing Time</div>
          <div className="text-primary font-medium">{utility.processingTime}</div>
        </div>
        <div>
          <div className="text-sm text-secondary">Service Fee</div>
          <div className="text-accent-green font-medium">{utility.fee}</div>
        </div>
      </div>

      <button
        onClick={() => onOpen(utility)}
        disabled={utility.status === 'unavailable'}
        className={`w-auto self-start inline-flex px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors border ${
          utility.status === 'available'
            ? 'border-accent-green text-accent-green hover:border-accent-green/80 bg-transparent'
            : 'border-white/10 text-secondary cursor-not-allowed bg-transparent'
        }`}
      >
        {utility.status === 'available' ? 'Open' : 'Coming Soon'}
      </button>
    </div>
  );
};

const UtilitiesPage: React.FC = () => {
  const navigate = useNavigate();

  const utilities: Utility[] = [
    {
      id: '1',
      name: 'Water Bill Payment',
      type: 'water',
      icon: '💧',
      description: 'Pay your water utility bills instantly',
      status: 'available',
      processingTime: 'Instant',
      fee: 'Free',
      popular: true
    },
    {
      id: '2',
      name: 'Electricity Bill Payment',
      type: 'electricity',
      icon: '⚡',
      description: 'Settle your electricity bills online',
      status: 'available',
      processingTime: 'Instant',
      fee: 'Free',
      popular: true
    },
    {
      id: '3',
      name: 'Flight Booking',
      type: 'flight',
      icon: '✈️',
      description: 'Book domestic and international flights',
      status: 'available',
      processingTime: '2-5 minutes',
      fee: '1% of ticket price'
    },
    {
      id: '4',
      name: 'Internet Bill',
      type: 'internet',
      icon: '',
      description: 'Pay internet service provider bills',
      status: 'available',
      processingTime: 'Instant',
      fee: 'Free'
    },
    {
      id: '5',
      name: 'Cable TV',
      type: 'cable',
      icon: '',
      description: 'Pay cable and satellite TV bills',
      status: 'available',
      processingTime: 'Instant',
      fee: 'Free'
    },
    {
      id: '6',
      name: 'Gas Bill',
      type: 'gas',
      icon: '',
      description: 'Pay natural gas utility bills',
      status: 'available',
      processingTime: 'Instant',
      fee: 'Free'
    }
  ];

  const handleOpen = (utility: Utility) => {
    if (utility.status === 'unavailable') return;
    switch (utility.type) {
      case 'water':
        navigate('/utilities/water');
        break;
      case 'electricity':
        navigate('/utilities/electricity');
        break;
      case 'flight':
        navigate('/utilities/flight');
        break;
      case 'internet':
        navigate('/utilities/internet');
        break;
      case 'cable':
        navigate('/utilities/cable');
        break;
      case 'gas':
        navigate('/utilities/gas');
        break;
      default:
        navigate('/utilities');
    }
  };

  

  const groupedUtilities = {
    available: utilities.filter(u => u.status === 'available'),
    comingSoon: [] as Utility[]
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-2">Utilities</h1>
          <p className="text-secondary">Pay your bills and book services instantly with crypto</p>
        </div>

        {/* Available Utilities */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">Available Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedUtilities.available.map((utility) => (
              <UtilityCard
                key={utility.id}
                utility={utility}
                onOpen={handleOpen}
              />
            ))}
          </div>
        </div>

        {/* No coming soon items */}
      </div>
    </div>
  );
};

export default UtilitiesPage;
