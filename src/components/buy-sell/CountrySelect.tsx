import React, { useState } from 'react';

export type CountryCode = 'NG' | 'GH' | 'KE' | 'ZA';

export interface Country {
  code: CountryCode;
  name: string;
  currency: string;
  icon: string;
}

export const COUNTRIES: Record<CountryCode, Country> = {
  NG: { code: 'NG', name: 'Nigeria', currency: 'NGN', icon: '/assets/ngn.svg' },
  GH: { code: 'GH', name: 'Ghana', currency: 'GHS', icon: '/assets/ghs.svg' },
  KE: { code: 'KE', name: 'Kenya', currency: 'KES', icon: '/assets/kes.svg' },
  ZA: { code: 'ZA', name: 'South Africa', currency: 'ZAR', icon: '/assets/zar.svg' },
};

interface CountrySelectProps {
  country: CountryCode;
  onChange: (country: CountryCode) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ country, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedCountry = COUNTRIES[country];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-tertiary rounded-full px-3 py-2 hover:bg-quaternary"
      >
        <img src={selectedCountry.icon} alt={selectedCountry.name} className="w-6 h-6" />
        <span className="text-primary font-medium">{selectedCountry.name}</span>
        <svg className="w-3.5 h-3.5 text-secondary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5H7z"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-secondary border border-white/10 rounded-2xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-primary">Select country</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-secondary hover:text-primary">✕</button>
            </div>

            <div className="space-y-2">
              {Object.values(COUNTRIES).map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onChange(country.code);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-tertiary transition-colors"
                >
                  <img src={country.icon} alt={country.name} className="w-6 h-6" />
                  <div className="flex-1 text-left">
                    <div className="text-primary font-medium">{country.name}</div>
                    <div className="text-secondary text-sm">{country.currency}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CountrySelect;
