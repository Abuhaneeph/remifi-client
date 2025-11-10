import tokens from '../../lib/Tokens/tokens';

export type TokenSymbol = string;

export interface TokenMeta {
  symbol: TokenSymbol;
  name: string;
  icon: string; // public path or URL
  decimals: number;
}

// Build token metadata from canonical tokens list
export const TOKENS: Record<TokenSymbol, TokenMeta> = tokens.reduce((acc, t) => {
  acc[t.symbol] = {
    symbol: t.symbol,
    name: t.name,
    icon: t.img || '/assets/Icons.svg',
    decimals: 18,
  };
  return acc;
}, {} as Record<TokenSymbol, TokenMeta>);

export const POPULAR_TOKENS: TokenSymbol[] = tokens.slice(0, 5).map(t => t.symbol);

// Removed mock prices; keep exports for compatibility
export const MOCK_PRICES_USDT: Record<TokenSymbol, number> = {};

export function getQuote(_amount: number, _from: TokenSymbol, _to: TokenSymbol): number {
  return 0;
}

