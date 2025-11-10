import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BuyReceiveCards: React.FC = () => {
  const navigate = useNavigate();
  
  const cards = [
    {
      title: 'Buy Coins',
      description: 'Purchase with a debit card or bank account.',
      icon: (
        <img src="/assets/Vector.svg" alt="Buy" className="w-8 h-8" />
      )
    },
    {
      title: 'Receive Coins',
      description: 'Transfer from another wallet or account.',
      icon: (
        <img src="/assets/Icons (1).svg" alt="Receive" className="w-8 h-8" />
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {cards.map((card, index) => (
        <motion.button
          key={index}
          onClick={() => navigate('/buy-sell')}
          className="bg-secondary rounded-xl p-8 text-center hover:bg-tertiary transition-colors duration-200 group border border-white/10 hover:border-accent-green/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-200"
            whileHover={{ scale: 1.1 }}
          >
            {card.icon}
          </motion.div>
          <h3 className="text-xl font-semibold text-primary mb-2">{card.title}</h3>
          <p className="text-secondary text-base max-w-xl mx-auto">{card.description}</p>
        </motion.button>
      ))}
    </div>
  );
};

export default BuyReceiveCards;
