import React, { useState } from 'react';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletInfo, NFTMinter } from './WalletComponents';
import { ContractDeployer } from './ContractDeployer';
import './App.css';

// Настройка сети
const { networkConfig } = createNetworkConfig({
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

function App() {
    const [deployedPackageId, setDeployedPackageId] = useState<string>('');

    const handlePackageDeployed = (packageId: string) => {
        setDeployedPackageId(packageId);
        console.log('📦 Package ID получен в App:', packageId);
    };

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
                            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '10px' }}>
                                💡 Всё управление только через браузерное расширение - никаких CLI команд
                            </div>
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
                                border: '2px solid #28a745',
                                borderRadius: '8px',
                                marginBottom: '30px'
                            }}>
                                <ContractDeployer onPackageDeployed={handlePackageDeployed} />
                            </section>

                            <section style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                border: '2px solid #e9ecef',
                                borderRadius: '8px'
                            }}>
                                <NFTMinter packageId={deployedPackageId} />
                            </section>
                        </main>

                        <footer style={{
                            textAlign: 'center',
                            marginTop: '40px',
                            color: '#6c757d',
                            fontSize: '14px'
                        }}>
                            <p>🔗 Установите расширение Sui Wallet в браузере</p>
                            <p>💰 Получите тестовые токены: <a href="https://faucet.sui.io" target="_blank" rel="noopener noreferrer">faucet.sui.io</a></p>
                            <p>🎮 Всё управление только через браузерный кошелек!</p>
                        </footer>
                    </div>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}

export default App;
