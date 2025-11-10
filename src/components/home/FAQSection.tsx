import React, { useState } from 'react';
const ShinyBlue = '/assets/3D  of a Shiny Blue Question Mark 1.svg';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'What are stablecoins?',
      answer: 'Stablecoins are digital currencies pegged to stable assets like the US dollar, designed to maintain a stable value and reduce volatility in cryptocurrency markets.'
    },
    {
      question: 'Do I need crypto experience to use this Platform?',
      answer: 'No! Our platform is designed for everyone. We provide simple, intuitive interfaces that make stablecoin swapping as easy as using any mobile banking app.'
    },
    {
      question: 'How fast are transactions?',
      answer: 'Most transactions are completed within minutes. Our platform uses advanced blockchain technology to ensure fast, secure, and reliable transfers.'
    },
    {
      question: 'Is my money really safe?',
      answer: 'Yes! We use enterprise-grade security, multi-signature wallets, and are fully audited by leading security firms. Your funds are protected with the highest industry standards.'
    },
    {
      question: 'What countries can I use this in?',
      answer: 'Currently available in Nigeria, Ghana, Kenya, and South Africa. We are expanding to more African countries soon.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="px-6 py-16 bg-primary">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Content - FAQ List */}
        <div className="bg-secondary rounded-2xl p-6">
          <h3 className="text-xl font-bold text-primary mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between py-4 text-left hover:text-accent-green transition-colors duration-200"
                >
                  <span className="text-primary font-medium">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-secondary transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="pb-4">
                    <p className="text-secondary leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-medium text-primary leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-secondary leading-relaxed">
              Got questions? We have answers. Find everything you need to know about 
              using Remifi for your stablecoin transactions.
            </p>
          </div>
          
          {/* 3D Shiny Blue Image */}
          <div className="flex justify-center lg:justify-start mt-12">
            <img 
              src={ShinyBlue} 
              alt="3D Shiny Blue" 
              className="w-full h-full object-cover max-w-400 max-h-700 sm:max-w-500 sm:max-h-1200"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
