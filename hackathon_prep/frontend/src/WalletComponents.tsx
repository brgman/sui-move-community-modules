import React, { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// Компонент для отображения информации о кошельке
export const WalletInfo: React.FC = () => {
    const currentAccount = useCurrentAccount();
    const [balance, setBalance] = useState<string>('0');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const suiClient = useSuiClient();

    // Получение баланса кошелька
    useEffect(() => {
        if (currentAccount?.address && suiClient) {
            setIsLoading(true);
            suiClient.getBalance({
                owner: currentAccount.address,
            }).then((balanceData) => {
                const balanceInSui = (parseInt(balanceData.totalBalance) / 1_000_000_000).toFixed(4);
                setBalance(balanceInSui);
            }).catch((error) => {
                console.error('Ошибка получения баланса:', error);
                setBalance('Ошибка');
            }).finally(() => {
                setIsLoading(false);
            });
        } else {
            setBalance('0');
            setIsLoading(false);
        }
    }, [currentAccount, suiClient]);

    return (
        <div className="wallet-info">
            <h2>🔗 Подключение кошелька</h2>

            {!currentAccount ? (
                <div>
                    <p>Подключите ваш Sui Wallet из браузерного расширения:</p>
                    <ConnectButton />

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '6px' }}>
                        <h4>📋 Подключение браузерного кошелька Sui Wallet:</h4>
                        <ol style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                            <li>Установите расширение <a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank" rel="noopener">Sui Wallet</a></li>
                            <li><strong>Создайте новый кошелек</strong> или импортируйте существующий в расширении</li>
                            <li><strong>Переключитесь на Testnet</strong> в настройках расширения</li>
                            <li>Получите тестовые токены на <a href="https://faucet.sui.io" target="_blank" rel="noopener">faucet.sui.io</a></li>
                            <li>Нажмите кнопку "Connect Wallet" выше</li>
                        </ol>
                    </div>
                </div>
            ) : (
                <div>
                    <h3>✅ Кошелек подключен!</h3>

                    <p><strong>Адрес:</strong></p>
                    <code style={{
                        display: 'block',
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        wordBreak: 'break-all',
                        margin: '10px 0'
                    }}>{currentAccount.address}</code>
                    <p><strong>Баланс:</strong> {isLoading ? '⏳ Загрузка...' : `${balance} SUI`}</p>

                    {!isLoading && parseFloat(balance) === 0 && (
                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px' }}>
                            <p>⚠️ У вас нет SUI токенов!</p>
                            <a href={`https://faucet.sui.io?address=${currentAccount.address}`} target="_blank" rel="noopener noreferrer">
                                🚰 Получить тестовые токены
                            </a>
                        </div>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <ConnectButton />
                    </div>
                </div>
            )}
        </div>
    );
};

// Компонент для создания GameNFT
export const NFTMinter: React.FC<{ packageId?: string }> = ({ packageId }) => {
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [loading, setLoading] = useState(false);

    // Параметры NFT
    const [nftParams, setNftParams] = useState({
        name: 'My Hero NFT',
        description: 'A powerful hero for the hackathon',
        imageUrl: 'https://example.com/hero.png',
        level: 1,
        power: 100,
        rarity: 4
    });

    const mintNFT = async () => {
        if (!currentAccount) {
            alert('❌ Сначала подключите браузерный кошелек Sui Wallet!');
            return;
        }

        // Используем реальный PACKAGE_ID переданный от ContractDeployer
        const PACKAGE_ID = packageId;

        // Проверка что Package ID установлен
        if (!packageId) {
            alert(`❌ Package ID не установлен!\n\nДля создания NFT нужно:\n\n1. Подключить браузерный кошелек Sui Wallet\n2. Развернуть basic_nft контракт через CLI\n3. Ввести реальный Package ID в секции выше\n\nБез реального Package ID создание NFT невозможно!`);
            return;
        }

        // Проверка корректности rarity
        if (nftParams.rarity < 1 || nftParams.rarity > 4) {
            alert('❌ Редкость должна быть от 1 до 4');
            return;
        }

        setLoading(true);
        console.log('🎨 Создание NFT с параметрами:', nftParams);
        console.log('📦 Package ID:', PACKAGE_ID);
        console.log('👤 Кошелек:', currentAccount.address);

        try {
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::basic_nft::mint_game_nft`,
                arguments: [
                    tx.pure.string(nftParams.name),
                    tx.pure.string(nftParams.description),
                    tx.pure.string(nftParams.imageUrl),
                    tx.pure.u64(nftParams.level),
                    tx.pure.u64(nftParams.power),
                    tx.pure.u8(nftParams.rarity),
                ],
            });

            console.log('📝 Отправляем транзакцию на подпись...');

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log('✅ NFT успешно создан!', result);
                        alert(`🎉 NFT "${nftParams.name}" успешно создан!\n\n📋 Transaction: ${result.digest}\n\nПроверьте ваш кошелек - NFT должен появиться там.`);

                        // Сбрасываем форму
                        setNftParams({
                            name: 'My Hero NFT',
                            description: 'A powerful hero for the hackathon',
                            imageUrl: 'https://example.com/hero.png',
                            level: 1,
                            power: 100,
                            rarity: 4
                        });
                    },
                    onError: (error) => {
                        console.error('❌ Ошибка при создании NFT:', error);

                        let errorMessage = 'Произошла неизвестная ошибка';

                        if (error.message?.includes('Invalid input')) {
                            errorMessage = 'Некорректный Package ID. Проверьте что модуль правильно развернут.';
                        } else if (error.message?.includes('Insufficient')) {
                            errorMessage = 'Недостаточно SUI токенов для транзакции. Получите токены на faucet.sui.io';
                        } else if (error.message?.includes('User rejected')) {
                            errorMessage = 'Транзакция отклонена пользователем';
                        } else if (error.message) {
                            errorMessage = error.message;
                        }

                        alert(`❌ Ошибка: ${errorMessage}\n\nДетали в консоли браузера (F12)`);
                    }
                }
            );

        } catch (error) {
            console.error('❌ Ошибка при подготовке транзакции:', error);
            alert('❌ Ошибка при подготовке транзакции. Проверьте консоль браузера (F12).');
        } finally {
            setLoading(false);
        }
    };

    if (!currentAccount) {
        return (
            <div className="nft-minter">
                <p>🔒 Подключите кошелек для создания NFT</p>
            </div>
        );
    }

    return (
        <div className="nft-minter">
            <h3>🎨 Создать Game NFT</h3>

            {/* Индикатор Package ID */}
            <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: packageId ? '#d4edda' : '#fff3cd',
                borderRadius: '8px',
                border: `1px solid ${packageId ? '#c3e6cb' : '#ffeeba'}`
            }}>
                <strong>📦 Package ID:</strong>
                {packageId ? (
                    <code style={{
                        display: 'block',
                        backgroundColor: '#fff',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        margin: '8px 0 0 0',
                        color: '#155724'
                    }}>{packageId}</code>
                ) : (
                    <span style={{ color: '#856404', marginLeft: '8px' }}>
                        ⏳ Сначала разверните контракт выше
                    </span>
                )}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    Имя NFT:
                    <input
                        type="text"
                        value={nftParams.name}
                        onChange={(e) => setNftParams({ ...nftParams, name: e.target.value })}
                        style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    Описание:
                    <textarea
                        value={nftParams.description}
                        onChange={(e) => setNftParams({ ...nftParams, description: e.target.value })}
                        style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    URL изображения:
                    <input
                        type="url"
                        value={nftParams.imageUrl}
                        onChange={(e) => setNftParams({ ...nftParams, imageUrl: e.target.value })}
                        style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    />
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <label>
                    Уровень:
                    <input
                        type="number"
                        min="1"
                        value={nftParams.level}
                        onChange={(e) => setNftParams({ ...nftParams, level: parseInt(e.target.value) })}
                        style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    />
                </label>

                <label>
                    Сила:
                    <input
                        type="number"
                        min="1"
                        value={nftParams.power}
                        onChange={(e) => setNftParams({ ...nftParams, power: parseInt(e.target.value) })}
                        style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    />
                </label>

                <label>
                    Редкость (1-4):
                    <select
                        value={nftParams.rarity}
                        onChange={(e) => setNftParams({ ...nftParams, rarity: parseInt(e.target.value) })}
                        style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                    >
                        <option value={1}>1 - Common</option>
                        <option value={2}>2 - Rare</option>
                        <option value={3}>3 - Epic</option>
                        <option value={4}>4 - Legendary</option>
                    </select>
                </label>
            </div>

            <button
                onClick={mintNFT}
                disabled={loading}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? '⏳ Создание...' : '🎨 Создать NFT'}
            </button>
        </div>
    );
};
