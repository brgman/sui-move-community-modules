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
    const suiClient = useSuiClient();
    const [loading, setLoading] = useState(false);

    // Состояние для уведомлений
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
        show: boolean;
    }>({ message: '', type: 'success', show: false });

    // Состояние для созданных NFT
    const [createdNFTs, setCreatedNFTs] = useState<Array<{
        name: string;
        description: string;
        imageUrl: string;
        level: number;
        power: number;
        rarity: number;
        transactionDigest: string;
        objectId?: string;
        createdAt: number;
    }>>([]);

    // Параметры NFT
    const [nftParams, setNftParams] = useState({
        name: 'My Hero NFT',
        description: 'A powerful hero for the hackathon',
        imageUrl: 'https://example.com/hero.png',
        level: 1,
        power: 100,
        rarity: 4
    });

    // Функция для показа уведомлений
    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type, show: true });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 5000); // Скрываем через 5 секунд
    };

    const mintNFT = async () => {
        if (!currentAccount) {
            showNotification('❌ Сначала подключите браузерный кошелек Sui Wallet!', 'error');
            return;
        }

        // Используем реальный PACKAGE_ID переданный от ContractDeployer
        const PACKAGE_ID = packageId;

        // Проверка что Package ID установлен
        if (!packageId) {
            showNotification('❌ Package ID не установлен! Сначала разверните контракт выше.', 'error');
            return;
        }

        // Проверка корректности rarity
        if (nftParams.rarity < 1 || nftParams.rarity > 4) {
            showNotification('❌ Редкость должна быть от 1 до 4', 'error');
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
                    onSuccess: async (result) => {
                        console.log('✅ NFT успешно создан!', result);

                        // Пытаемся получить Object ID созданного NFT
                        let objectId: string | null = null;
                        try {
                            // Ждем несколько секунд чтобы транзакция была обработана
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            const txDetails = await suiClient.getTransactionBlock({
                                digest: result.digest,
                                options: {
                                    showEffects: true,
                                    showObjectChanges: true,
                                }
                            });

                            // Ищем созданный NFT объект
                            if (txDetails.effects?.created) {
                                for (const created of txDetails.effects.created) {
                                    // Находим immutable object (это скорее всего наш NFT)
                                    const objId = created.reference.objectId;
                                    if (objId && objId !== packageId) {
                                        objectId = objId;
                                        console.log('✅ Найден Object ID NFT:', objectId);
                                        break;
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn('⚠️ Не удалось получить Object ID NFT:', error);
                        }

                        // Добавляем созданный NFT в список
                        const newNFT = {
                            ...nftParams,
                            transactionDigest: result.digest,
                            objectId: objectId || undefined,
                            createdAt: Date.now()
                        };

                        setCreatedNFTs(prev => [newNFT, ...prev]); // Добавляем в начало списка

                        // Показываем уведомление об успехе
                        showNotification(
                            `🎉 NFT "${nftParams.name}" успешно создан! ${objectId ? 'Object ID получен.' : 'Ссылки доступны ниже.'}`,
                            'success'
                        );

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

                        showNotification(`❌ ${errorMessage}`, 'error');
                    }
                }
            );

        } catch (error) {
            console.error('❌ Ошибка при подготовке транзакции:', error);
            showNotification('❌ Ошибка при подготовке транзакции. Проверьте консоль браузера (F12).', 'error');
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

            {/* Уведомление */}
            {notification.show && (
                <div
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        padding: '15px 20px',
                        borderRadius: '8px',
                        color: 'white',
                        backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        maxWidth: '400px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                    onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                >
                    <span>{notification.message}</span>
                    <span style={{ marginLeft: '10px', fontSize: '16px' }}>×</span>
                </div>
            )}

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

            {/* Секция отображения созданных NFT */}
            {createdNFTs.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>🎉 Созданные NFT</h3>
                    <div style={{
                        display: 'grid',
                        gap: '20px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        marginTop: '15px'
                    }}>
                        {createdNFTs.map((nft, index) => {
                            const rarityName = ['', 'Common', 'Rare', 'Epic', 'Legendary'][nft.rarity];
                            const rarityColor = ['', '#6c757d', '#28a745', '#7b1fa2', '#ff6f00'][nft.rarity];

                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '20px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '12px',
                                        backgroundColor: '#f8f9fa',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ marginBottom: '15px' }}>
                                        <h4 style={{ margin: '0 0 8px 0', color: '#212529' }}>
                                            {nft.name}
                                        </h4>
                                        <p style={{
                                            margin: '0 0 8px 0',
                                            color: '#6c757d',
                                            fontSize: '14px',
                                            lineHeight: '1.4'
                                        }}>
                                            {nft.description}
                                        </p>
                                        <span style={{
                                            background: rarityColor,
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {rarityName}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '10px',
                                        marginBottom: '15px',
                                        fontSize: '14px'
                                    }}>
                                        <div>⚡ Уровень: <strong>{nft.level}</strong></div>
                                        <div>💪 Сила: <strong>{nft.power}</strong></div>
                                    </div>

                                    {nft.imageUrl && nft.imageUrl !== 'https://example.com/hero.png' && (
                                        <div style={{ marginBottom: '15px' }}>
                                            <img
                                                src={nft.imageUrl}
                                                alt={nft.name}
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '150px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px'
                                                }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
                                        Создан: {new Date(nft.createdAt).toLocaleString('ru-RU')}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <a
                                            href={`https://suiscan.xyz/testnet/tx/${nft.transactionDigest}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            🔗 Транзакция
                                        </a>
                                        {nft.objectId && (
                                            <a
                                                href={`https://suiscan.xyz/testnet/object/${nft.objectId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: '#17a2b8',
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                🎨 NFT Объект
                                            </a>
                                        )}
                                        <a
                                            href={`https://suiscan.xyz/testnet/account/${currentAccount?.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            👛 Кошелек
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
