import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TokenSelect from '../components/swap/TokenSelect';
import type { TokenSymbol } from '../components/swap/tokens';
import { MOCK_PRICES_USDT } from '../components/swap/tokens';
import tokens from '../lib/Tokens/tokens.ts';
import { useContractInstances } from '../provider/ContractInstanceProvider';
import { toast } from 'react-toastify';

interface PoolCreationFormProps {
  onSubmit: (poolData: PoolData) => void;
  onCancel: () => void;
}

interface PoolData {
  tokenA: TokenSymbol;
  tokenB: TokenSymbol;
  amountA: number;
  amountB: number;
  fee: number;
}

const PoolCreationForm: React.FC<PoolCreationFormProps> = ({ onSubmit, onCancel }) => {
  const { SWAP_CONTRACT_INSTANCE } = useContractInstances();
  const [tokenA, setTokenA] = useState<TokenSymbol>('USDT');
  const [tokenB, setTokenB] = useState<TokenSymbol>('AFR');
  const [amountA, _setAmountA] = useState<string>('');
  const [amountB, _setAmountB] = useState<string>('');
  const [fee, setFee] = useState<number>(0.3);
  const [isCreating, setIsCreating] = useState(false);

  const parsedAmountA = useMemo(() => Number.parseFloat(amountA || '0') || 0, [amountA]);
  const parsedAmountB = useMemo(() => Number.parseFloat(amountB || '0') || 0, [amountB]);

  const tokenAPrice = MOCK_PRICES_USDT[tokenA] || 1;
  const tokenBPrice = MOCK_PRICES_USDT[tokenB] || 1;

  const totalValueA = parsedAmountA * tokenAPrice;
  const totalValueB = parsedAmountB * tokenBPrice;
  const totalPoolValue = totalValueA + totalValueB;

  const canCreate = tokenA !== tokenB;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    setIsCreating(true);
    try {
      const base = tokens.find(t => t.symbol === (tokenA as string));
      const quote = tokens.find(t => t.symbol === (tokenB as string));
      if (!base || !quote || !base.address || !quote.address) {
        toast.error('Invalid token selection.');
        setIsCreating(false);
        return;
      }

      const swap = await SWAP_CONTRACT_INSTANCE();
      if (!swap) {
        toast.error('Wallet not connected or wrong network');
        setIsCreating(false);
        return;
      }

      const tx = await swap.createPool(base.address, quote.address);
      console.log(`Loading - ${tx.hash}`);
      await tx.wait();
      console.log(`Success - ${tx.hash}`);

      const poolId = await swap.getPoolId();
      console.log(`Pool ID: ${poolId}`);
      toast.success(`✅ Pool created! ID: ${poolId.toString()}`);

      // keep existing UI flow
      onSubmit({
        tokenA,
        tokenB,
        amountA: parsedAmountA,
        amountB: parsedAmountB,
        fee
      });
    } catch (err) {
      console.error(err);
      toast.error('❌ Pool creation failed.');
    } finally {
      setIsCreating(false);
    }
  };

  // Amount inputs removed; keep state defaults for summary compatibility

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pool Pair Selection */}
      <div className="bg-secondary rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-primary mb-4">Select Token Pair</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Token A */}
          <div className="space-y-3">
            <label className="block text-sm text-secondary">First Token</label>
            <div className="flex items-center gap-3">
              <TokenSelect symbol={tokenA} onChange={setTokenA} />
            </div>
          </div>

          {/* Token B */}
          <div className="space-y-3">
            <label className="block text-sm text-secondary">Second Token</label>
            <div className="flex items-center gap-3">
              <TokenSelect symbol={tokenB} onChange={setTokenB} />
            </div>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="mt-4 p-4 bg-tertiary rounded-lg">
          <div className="text-sm text-secondary mb-2">Exchange Rate</div>
          <div className="text-primary font-semibold">
            1 {tokenA} = {(tokenAPrice / tokenBPrice).toFixed(6)} {tokenB}
          </div>
        </div>
      </div>

      {/* Pool Settings */}
      <div className="bg-secondary rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-primary mb-4">Pool Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Trading Fee</label>
            <div className="grid grid-cols-3 gap-2">
              {[0.05, 0.3, 1.0].map((feeOption) => (
                <button
                  key={feeOption}
                  type="button"
                  onClick={() => setFee(feeOption)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    fee === feeOption
                      ? 'bg-accent-green text-white'
                      : 'bg-tertiary text-primary hover:bg-quaternary'
                  }`}
                >
                  {feeOption}%
                </button>
              ))}
            </div>
            <div className="text-xs text-secondary mt-2">
              Higher fees = Higher rewards for liquidity providers
            </div>
          </div>
        </div>
      </div>

      {/* Pool Summary */}
      <div className="bg-secondary rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-primary mb-4">Pool Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-secondary">Pool Value:</span>
            <span className="text-primary font-semibold">${totalPoolValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Trading Fee:</span>
            <span className="text-accent-green font-semibold">{fee}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Initial Liquidity:</span>
            <span className="text-primary font-semibold">
              {parsedAmountA.toFixed(4)} {tokenA} + {parsedAmountB.toFixed(4)} {tokenB}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-tertiary text-primary rounded-xl font-semibold hover:bg-quaternary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canCreate || isCreating}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
            canCreate && !isCreating
              ? 'bg-accent-green text-white hover:bg-accent-green-hover'
              : 'bg-tertiary text-secondary cursor-not-allowed'
          }`}
        >
          {isCreating ? 'Creating Pool...' : 'Create Pool'}
        </button>
      </div>
    </form>
  );
};

const CreatePoolPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPool, setCreatedPool] = useState<PoolData | null>(null);

  const handlePoolCreate = (poolData: PoolData) => {
    setCreatedPool(poolData);
    setShowSuccessModal(true);
  };

  const handleGoToPools = () => {
    setShowSuccessModal(false);
    navigate('/activity?tab=liquidity');
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/activity?tab=liquidity')}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Liquidity Pools
          </button>
          
          <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-2">Create New Pool</h1>
          <p className="text-secondary">Create a new liquidity pool and start earning trading fees</p>
        </div>

        {/* Pool Creation Form */}
        <PoolCreationForm
          onSubmit={handlePoolCreate}
          onCancel={() => navigate('/activity?tab=liquidity')}
        />

        {/* Success Modal */}
        {showSuccessModal && createdPool && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-secondary rounded-2xl p-8 w-full max-w-md mx-4 border border-white/10 shadow-2xl">
              <div className="text-center">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 className="text-xl font-semibold text-primary mb-2">Pool Created Successfully!</h3>
                <p className="text-secondary mb-6">
                  Your {createdPool.tokenA}/{createdPool.tokenB} pool has been created with {createdPool.fee}% trading fee.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-secondary">Pool Pair:</span>
                    <span className="text-primary font-medium">{createdPool.tokenA}/{createdPool.tokenB}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Initial Liquidity:</span>
                    <span className="text-primary font-medium">
                      {createdPool.amountA.toFixed(4)} {createdPool.tokenA} + {createdPool.amountB.toFixed(4)} {createdPool.tokenB}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Trading Fee:</span>
                    <span className="text-accent-green font-medium">{createdPool.fee}%</span>
                  </div>
                </div>

                <button
                  onClick={handleGoToPools}
                  className="w-full px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green-hover transition-colors"
                >
                  View My Pools
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePoolPage;
