import { motion } from 'framer-motion';
import BalanceCard from './BalanceCard';
import QuickActions from './QuickActions';
import TokensActivity from './TokensActivity';
import BuyReceiveCards from './BuyReceiveCards';
import PortfolioChart from './PortfolioChart';

const Dashboard: React.FC = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 md:pt-20">
        <motion.div 
          className=""
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Main content */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Balance Section */}
            <motion.div variants={item}>
              <BalanceCard />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item}>
              <QuickActions />
            </motion.div>

            {/* Charts Section */}
            <motion.div variants={item}>
              <PortfolioChart />
            </motion.div>

            {/* Tokens/Activity Section */}
            <motion.div variants={item}>
              <TokensActivity />
            </motion.div>

            {/* Buy/Receive Cards */}
            <motion.div variants={item}>
              <BuyReceiveCards />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
