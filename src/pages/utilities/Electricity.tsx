import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ElectricityBillPage: React.FC = () => {
  const [disco, setDisco] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid' | ''>('');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/utilities/checkout', {
      state: {
        utilityType: 'electricity',
        summaryTitle: 'Electricity Bill Payment',
        summaryDetails: {
          disco,
          meterType,
          meterNumber,
        },
        amount: Number(amount || '0'),
        currency: undefined,
      }
    });
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto bg-secondary rounded-2xl p-6 border border-white/10">
        <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-1">Electricity Bill</h1>
        <p className="text-secondary mb-6">Top up prepaid or settle postpaid electricity bills.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">DisCo</label>
            <select
              value={disco}
              onChange={(e) => setDisco(e.target.value)}
              className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              required
            >
              <option value="" disabled>Select DisCo</option>
              <option value="Ikeja Electric">Ikeja Electric</option>
              <option value="Eko Electric">Eko Electric</option>
              <option value="Abuja Electric">Abuja Electric</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Meter Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMeterType('prepaid')} className={`px-4 py-2 rounded-lg ${meterType==='prepaid' ? 'bg-accent-green text-white' : 'bg-tertiary text-primary'}`}>Prepaid</button>
                <button type="button" onClick={() => setMeterType('postpaid')} className={`px-4 py-2 rounded-lg ${meterType==='postpaid' ? 'bg-accent-green text-white' : 'bg-tertiary text-primary'}`}>Postpaid</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">Meter Number</label>
              <input
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="Enter meter number"
                className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green"
                required
              />
            </div>
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

export default ElectricityBillPage;


