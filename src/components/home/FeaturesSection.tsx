import React from 'react';
const FrameIcon1 = '/assets/Frame 48100562 (1).svg';
const FrameIcon2 = '/assets/Frame 48100562 (2).svg';
const FrameIcon3 = '/assets/Frame 48100562.svg';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeaturesSection: React.FC = () => {
  const features: Feature[] = [
    {
      icon: (
        <img src={FrameIcon1} alt="Feature icon 1" className="w-12 h-12" />
      ),
      title: 'Audited Smart Contracts',
      description: 'Tamper-proof security with regular audits by leading blockchain security firms.'
    },
    {
      icon: (
        <img src={FrameIcon2} alt="Feature icon 2" className="w-12 h-12" />
      ),
      title: 'Compliant & Transparent',
      description: 'Full KYC/AML compliance and GDPR standards with complete transaction transparency.'
    },
    {
      icon: (
        <img src={FrameIcon3} alt="Feature icon 3" className="w-12 h-12" />
      ),
      title: 'Trusted Partnerships',
      description: 'Direct integration with mobile money operators and local banks across Africa.'
    }
  ];

  return (
    <section className="px-6 py-16 bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-medium text-primary mb-6">
            Stable, Secure, Africa-Ready.
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            Built for Africa's unique financial landscape with enterprise-grade security, 
            regulatory compliance, and seamless integration with local payment systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="border border-white/20 rounded-2xl p-8 hover:border-white/40 transition-colors duration-200">
              <div className="mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">
                {feature.title}
              </h3>
              <p className="text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
