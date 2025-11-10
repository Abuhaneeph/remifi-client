import React from 'react';
import type { TokenSymbol } from '../swap/tokens';

interface StakingPosition {
  id: string;
  token: TokenSymbol;
  stakedAmount: number;
  apy: number;
  earnedRewards: number;
  stakingPeriod: number; // in days
}

interface StakingPool {
  token: TokenSymbol;
  apy: number;
  minStake: number;
  maxStake?: number;
  lockPeriod?: number; // in days
}

interface StakingCardProps {
  activePositions?: StakingPosition[];
  availablePools?: StakingPool[];
  onClaimRewards?: (positionId: string) => void;
  onStake?: (pool: StakingPool) => void;
}

const StakingCard: React.FC<StakingCardProps> = ({ 
  activePositions = [], 
  availablePools = [],
  onClaimRewards,
  onStake
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Active Staking Positions */}
      <div className="bg-secondary rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-primary mb-4">Active Positions</h3>
        {activePositions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-secondary">No active staking positions</div>
          </div>
        ) : (
          <div className="space-y-4">
            {activePositions.map((position) => (
              <div key={position.id} className="flex items-center justify-between p-4 bg-tertiary rounded-lg">
                <div>
                  <div className="text-primary font-medium">{position.token} Staking</div>
                  <div className="text-sm text-secondary">
                    Staked: {position.stakedAmount.toLocaleString()} {position.token}
                  </div>
                  {position.stakingPeriod > 0 && (
                    <div className="text-xs text-secondary">
                      Locked for {position.stakingPeriod} days
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-accent-green font-semibold">{position.apy}% APY</div>
                  <div className="text-sm text-secondary">
                    Earned: {position.earnedRewards.toFixed(2)} {position.token}
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => activePositions.length > 0 && onClaimRewards?.(activePositions[0].id)}
              className="w-full mt-4 px-4 py-2 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green-hover transition-colors"
            >
              Claim Rewards
            </button>
          </div>
        )}
      </div>

      {/* Available Staking Options */}
      <div className="bg-secondary rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-primary mb-4">Available Pools</h3>
        {availablePools.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-secondary">No staking pools available</div>
          </div>
        ) : (
          <div className="space-y-3">
            {availablePools.map((pool, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-tertiary rounded-lg">
                <div>
                  <div className="text-primary font-medium">{pool.token} Pool</div>
                  <div className="text-sm text-secondary">
                    Min: {pool.minStake.toLocaleString()} {pool.token}
                  </div>
                  {pool.maxStake && (
                    <div className="text-sm text-secondary">
                      Max: {pool.maxStake.toLocaleString()} {pool.token}
                    </div>
                  )}
                  {pool.lockPeriod && (
                    <div className="text-xs text-secondary">
                      Lock: {pool.lockPeriod} days
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-accent-green font-semibold">{pool.apy}% APY</div>
                  <button 
                    onClick={() => onStake?.(pool)}
                    className="text-xs text-accent-green hover:underline"
                  >
                    Stake
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StakingCard;
