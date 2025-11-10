import React from "react";
const GlassShield = "/assets/Frosted Glass Shield Icon 1.svg";

const SecuritySection: React.FC = () => {
  return (
    <section className="px-6 py-16 bg-primary">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-6">
          <h2 className="text-4xl lg:text-5xl font-medium text-primary leading-tight">
            Security You Can Trust
          </h2>
          <p className="text-xl text-secondary leading-relaxed">
            We know security isn’t just about tech — it’s about trust. That’s
            why we protect your funds with advanced encryption, regulated
            safeguards, and real-time monitoring. You focus on moving money, we
            handle the safety.
          </p>
        
        </div>

        {/* Right Content - 3D Shiny Blue Shield Image */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            {/* Main image container with metallic effect */}
            <img
              src={GlassShield}
              alt="Frosted Glass Shield"
              className="w-full -full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
