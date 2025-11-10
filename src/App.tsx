
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import HeroSection from './components/home/HeroSection';
import RatesSection from './components/home/RatesSection';
import FeaturesSection from './components/home/FeaturesSection';
import SecuritySection from './components/home/SecuritySection';
import FAQSection from './components/home/FAQSection';
import DashboardPage from './pages/Dashboard';
import SwapPage from './pages/Swap';
import BuySellPage from './pages/BuySell';
import ActivityPage from './pages/Activity';
import UtilitiesPage from './pages/Utilities';
import WaterBillPage from './pages/utilities/Water';
import ElectricityBillPage from './pages/utilities/Electricity';
import FlightBookingPage from './pages/utilities/FlightBooking.tsx';
import InternetBillPage from './pages/utilities/Internet';
import CableTVPage from './pages/utilities/CableTV';
import GasBillPage from './pages/utilities/Gas';
import UtilityCheckoutPage from './pages/utilities/Checkout';
import CreatePoolPage from './pages/CreatePool';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const Home = () => (
    <main>
      <HeroSection />
      <RatesSection />
      <FeaturesSection />
      <SecuritySection />
      <FAQSection />
    </main>
  );

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-primary text-primary transition-colors duration-300">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/buy-sell" element={<BuySellPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/utilities" element={<UtilitiesPage />} />
          <Route path="/utilities/water" element={<WaterBillPage />} />
          <Route path="/utilities/electricity" element={<ElectricityBillPage />} />
          <Route path="/utilities/flight" element={<FlightBookingPage />} />
          <Route path="/utilities/internet" element={<InternetBillPage />} />
          <Route path="/utilities/cable" element={<CableTVPage />} />
          <Route path="/utilities/gas" element={<GasBillPage />} />
          <Route path="/utilities/checkout" element={<UtilityCheckoutPage />} />
          <Route path="/create-pool" element={<CreatePoolPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar newestOnTop closeOnClick />
        {isHomePage && <Footer />}
      </div>
    </ThemeProvider>
  );
}

export default App;
