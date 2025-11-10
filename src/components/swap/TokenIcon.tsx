import React from 'react';
import { TOKENS, type TokenSymbol } from './tokens';

interface TokenIconProps {
  symbol: TokenSymbol;
  size?: number;
}

const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 20 }) => {
  const meta = TOKENS[symbol];
  const src = meta?.icon || '/assets/Icons.svg';
  const alt = `${meta?.name || symbol} icon`;
  return (
    <img src={src} alt={alt} style={{ width: size, height: size }} className="rounded-full" />
  );
};

export default TokenIcon;

