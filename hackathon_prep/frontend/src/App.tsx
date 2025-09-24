import React from 'react';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletInfo, NFTMinter } from './WalletComponents';
import './App.css';

// Настройка сети
const { networkConfig } = createNetworkConfig({
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
                <WalletProvider autoConnect>
                    <div style={{ 
                        maxWidth: '800px', 
                        margin: '0 auto', 
                        padding: '20px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h1>🎮 Hackathon NFT Project</h1>
                            <p>Подключите ваш браузерный кошелек Sui Wallet и создавайте NFT!</p>
                        </header>

                        <main>
                            <section style={{ 
                                backgroundColor: '#f8f9fa', 
                                padding: '20px', 
                                borderRadius: '8px',
                                marginBottom: '30px'
                            }}>
                                <WalletInfo />
                            </section>

                            <section style={{ 
                                backgroundColor: '#fff', 
                                padding: '20px', 
                                border: '2px solid #e9ecef',
                                borderRadius: '8px'
                            }}>
                                <NFTMinter />
                            </section>
                        </main>

                        <footer style={{ 
                            textAlign: 'center', 
                            marginTop: '40px',
                            color: '#6c757d',
                            fontSize: '14px'
                        }}>
                            <p>🔗 Убедитесь, что у вас установлено расширение Sui Wallet в браузере</p>
                            <p>💰 Получите тестовые токены: <a href="https://faucet.sui.io" target="_blank" rel="noopener noreferrer">faucet.sui.io</a></p>
                        </footer>
                    </div>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}

export default App;
