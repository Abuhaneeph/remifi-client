// Token interface
export interface Token {
  id: number
  symbol: string;
  name: string;
  balance: number;
  address?: string;
  pool:string[];
  poolId?: number[];
  img?: string; // Optional image URL for the token
}


// Token array
const tokens: Token[] = [
  { 
    id:1,
    symbol: 'APE', 
    name: 'ApeCoin', 
    balance: 0.5,
    address: '0xFd8Ee9856bBc5A2042259e6EE31e310fDC08D970', // Replace with your native token address
    pool: ["AFR","USDT"],
    poolId: [1,2],
    img: "https://coin-images.coingecko.com/coins/images/50913/large/apecoin.jpg?1729568016"
  },
  { 
    id:2,
    symbol: 'USDT', 
    name: 'USDT', 
    balance: 2,
    
     address: '0xd5Cb99b6f7AC35fB0A8071f7C700b45DA5556EbD', // Replace with actual USDC contract address
    pool: ["APE","AFX"],
    poolId: [2,6],
    img:'https://coin-images.coingecko.com/coins/images/39963/large/usdt.png?1724952731'
  },
   { 
    id:3,
    symbol: 'WETH', 
    name: 'Wrapped Ethereum', 
    balance: 1250,
    address: '0xe7Bf8D39D8Cd29a65fBADD303619Efdfb988610e', // Replace with actual AfriCoin contract address
    pool: [],
    poolId: [],
    img: 'https://coin-images.coingecko.com/coins/images/39713/large/WETH.PNG?1723731496',
        
  }, 

  { 
    id:4,
    symbol: 'AFR', 
    name: 'AfriRemit', 
    balance: 1250,
    address: '0x1bFF33dD4139592B43655b3b9a4673aBd7cAeC04', // Replace with actual AfriCoin contract address
    pool: ["APE"],
    poolId: [1],
    img: 'https://coin-images.coingecko.com/coins/images/34057/large/LOGOMARK.png?1708356054',
        
  },
     { 
    id:5,
    symbol: 'AFX', 
    name: 'AfriStable', 
    balance: 1250,
    address: '0x03C61d50De4b8Faf4FB6DEaF84329ed51A510Fb5', // Replace with actual AfriCoin contract address
    pool: ["cZAR", "USDT"],
    poolId: [5,6],
    img: 'https://www.xe.com/svgs/flags/ngn.static.svg',
        
  },
   { 
    id:6,
    symbol: 'cNGN', 
    name: 'Crypto Naira', 
    balance: 1250,
    address: '0x4BE9f0d6F4AD844918af0bf3c5e30ceC83240651', // Replace with actual AfriCoin contract address
  
    pool: ["cZAR"],
    poolId: [3],
    img: 'https://www.xe.com/svgs/flags/ngn.static.svg',
        
  },
   { 
    id:7,
    symbol: 'cZAR', 
    name: 'Crypto South African Rand', 
    balance: 1250,
    address: '0x2fe5eF2b81D385E9be7d6dA2e8bC1ded407f97D0', // Replace with actual AfriCoin contract address
    pool: ["cNGN","AFX"],
    poolId: [3,5],
    img: 'https://www.xe.com/svgs/flags/zar.static.svg',
        
  },
   { 
    id:8,
    symbol: 'cGHS', 
    name: 'Crypto Ghanaian Cedi', 
    balance: 1250,
    address: '0x5aC3255EBCf52Ab6E2A43cB27FA4D415dA95d629', // Replace with actual AfriCoin contract address
    pool: ["cKES"],
    poolId: [4],
    
    img: 'https://www.xe.com/svgs/flags/ghs.static.svg',
        
  },
   { 
    id:9,
    symbol: 'cKES', 
    name: '	Crypto Kenyan Shilling', 
    balance: 1250,
    address: '0x462D2453c8c36182CaC93598D91A53b40977eBbb', // Replace with actual AfriCoin contract address
    pool: ["cGHS"],
    poolId: [4],
    img: 'https://www.xe.com/svgs/flags/kes.static.svg',
        
  },
];

export default tokens;




/*
["0x88a4e1125FF42e0010192544EAABd78Db393406e","0x207d9E20755fEe1924c79971A3e2d550CE6Ff2CB","0x278ccC9E116Ac4dE6c1B2Ba6bfcC81F25ee48429","0x1255C3745a045f653E5363dB6037A2f854f58FBf","0x19a8a27E066DD329Ed78F500ca7B249D40241dC4","0x291ca1891b41a25c161fDCAE06350E6a524068d5","0xa01ada077F5C2DB68ec56f1a28694f4d495201c9"]


*/