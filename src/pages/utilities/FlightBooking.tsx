import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type TripType = 'one-way' | 'round-trip' | 'multi-city';
type CabinClass = 'economy' | 'premium-economy' | 'business' | 'first';

const partnerAirlines = [
  'Air Peace',
  'Ibom Air',
  'Arik Air',
  'Ethiopian Airlines',
  'Qatar Airways',
  'Emirates',
  'British Airways',
];

const FlightBookingPage: React.FC = () => {
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [airline, setAirline] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const passengersSummary = useMemo(() => {
    return `${adults} Adult${adults>1?'s':''}${children?`, ${children} Child${children>1?'ren':''}`:''}${infants?`, ${infants} Infant${infants>1?'s':''}`:''}`;
  }, [adults, children, infants]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/utilities/checkout', {
      state: {
        utilityType: 'flight',
        summaryTitle: 'Flight Booking',
        summaryDetails: {
          tripType,
          origin,
          destination,
          departDate,
          ...(tripType==='round-trip' ? { returnDate } : {}),
          passengers: passengersSummary,
          cabinClass,
          airline: airline || 'Any',
          contactEmail,
          contactPhone,
          promoCode: promoCode || '—',
        },
        amount: Number(amount || '0'),
        currency: undefined,
      }
    });
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto bg-secondary rounded-2xl p-6 md:p-8 border border-white/10">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-primary">Airflight Booking</h1>
          <p className="text-secondary">Partner airline booking — complete request form.</p>
        </div>

        {/* Trip type selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['one-way','round-trip','multi-city'] as TripType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTripType(t)}
              className={`px-4 py-2 rounded-lg capitalize ${tripType===t ? 'bg-accent-green text-white' : 'bg-tertiary text-primary'}`}
            >
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Route */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">From</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="City or airport"
                className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">To</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City or airport"
                className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Departure Date</label>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
                required
              />
            </div>
            {tripType === 'round-trip' && (
              <div>
                <label className="block text-sm text-secondary mb-2">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
                  required
                />
              </div>
            )}
          </div>

          {/* Passengers and cabin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Adults</label>
              <input type="number" min={1} value={adults} onChange={(e)=>setAdults(parseInt(e.target.value||'1',10))} className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green" />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">Children</label>
              <input type="number" min={0} value={children} onChange={(e)=>setChildren(parseInt(e.target.value||'0',10))} className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green" />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">Infants</label>
              <input type="number" min={0} value={infants} onChange={(e)=>setInfants(parseInt(e.target.value||'0',10))} className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Cabin Class</label>
              <select value={cabinClass} onChange={(e)=>setCabinClass(e.target.value as CabinClass)} className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green">
                <option value="economy">Economy</option>
                <option value="premium-economy">Premium economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">Partner Airline</label>
              <select value={airline} onChange={(e)=>setAirline(e.target.value)} className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-green">
                <option value="">Any</option>
                {partnerAirlines.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Contact Email</label>
              <input type="email" value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green" required />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">Contact Phone</label>
              <input type="tel" value={contactPhone} onChange={(e)=>setContactPhone(e.target.value)} placeholder="+234 800 000 0000" className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green" required />
            </div>
          </div>

          {/* Promo */}
          <div>
            <label className="block text-sm text-secondary mb-2">Promo Code (optional)</label>
            <input type="text" value={promoCode} onChange={(e)=>setPromoCode(e.target.value)} placeholder="Enter code" className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green" />
          </div>

          {/* Estimated Fare */}
          <div>
            <label className="block text-sm text-secondary mb-2">Estimated Fare Amount</label>
            <input type="number" min={0} step={0.01} value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 bg-tertiary rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-green" required />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-secondary">Passengers: <span className="text-primary">{passengersSummary}</span></div>
            <button type="submit" className="px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors">Proceed to Checkout</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlightBookingPage;


