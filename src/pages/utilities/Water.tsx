import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WaterBillPage: React.FC = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/utilities/checkout', {
      state: {
        utilityType: 'water',
        summaryTitle: 'Water Bill Payment',
        summaryDetails: {
          provider,
          accountNumber,
        },
        amount: Number(amount || '0'),
        currency: undefined,
      }
    });
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto bg-secondary rounded-2xl p-6 border border-white/10">
        <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-1">Water Bill</h1>
        <p className="text-secondary mb-6">Pay your water utility bill using crypto.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              required
            >
              <option value="" disabled>Select provider</option>
              <option value="Lagos Water">Lagos Water</option>
              <option value="Abuja Water">Abuja Water</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-secondary mb-2">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-2">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors"
          >
            Pay Bill
          </button>
        </form>
      </div>
    </div>
  );
};

export default WaterBillPage;


