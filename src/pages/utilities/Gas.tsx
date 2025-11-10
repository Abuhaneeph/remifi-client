import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GasBillPage: React.FC = () => {
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/utilities/checkout', {
      state: {
        utilityType: 'gas',
        summaryTitle: 'Gas Bill',
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
        <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-1">Gas Bill</h1>
        <p className="text-secondary mb-6">Pay your natural gas utility bill.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Provider</label>
            <input type="text" value={provider} onChange={(e)=>setProvider(e.target.value)} placeholder="Provider name" className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green" required />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-2">Account Number</label>
            <input type="text" value={accountNumber} onChange={(e)=>setAccountNumber(e.target.value)} placeholder="Account number" className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green" required />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-2">Amount</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green" required />
          </div>
          <button type="submit" className="w-full px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors">Proceed to Checkout</button>
        </form>
      </div>
    </div>
  );
};

export default GasBillPage;


