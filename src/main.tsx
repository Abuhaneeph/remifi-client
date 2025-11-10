import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThirdwebProvider } from 'thirdweb/react'
import ContractInstanceProvider from './provider/ContractInstanceProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThirdwebProvider>
      <ContractInstanceProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ContractInstanceProvider>
    </ThirdwebProvider>
  </StrictMode>,
)
