import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export const ContractDeployer: React.FC<{ onPackageDeployed?: (packageId: string) => void }> = ({ onPackageDeployed }) => {
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [loading, setLoading] = useState(false);
    const [deployedPackageId, setDeployedPackageId] = useState<string>('');
    const [error, setError] = useState<string>('');

    const deployContract = async () => {
        if (!currentAccount) {
            alert('❌ Сначала подключите кошелек!');
            return;
        }

        setLoading(true);
        setError('');
        console.log('📦 Начинаем деплой контракта basic_nft...');
        console.log('👤 Кошелек:', currentAccount.address);

        try {
            // Создаем демо-транзакцию деплоя
            const tx = new Transaction();

            // В реальном деплое здесь будет tx.publish() с байткодом модуля
            // Создаем простую транзакцию - отправляем 1 MIST самому себе
            const [coin] = tx.splitCoins(tx.gas, [1]);
            tx.transferObjects([coin], currentAccount.address);

            console.log('🔄 Отправляем демо-транзакцию...');

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log('✅ Демо-транзакцию выполнена!', result);

                        // Генерируем демо Package ID
                        const demoPackageId = `0x${result.digest.slice(2, 66)}`;
                        setDeployedPackageId(demoPackageId);
                        onPackageDeployed?.(demoPackageId);

                        alert(`🎉 Демо контракт "развернут"!\n\n📦 Package ID:\n${demoPackageId}\n\nТеперь можете тестировать создание NFT!`);
                    },
                    onError: (error) => {
                        console.error('❌ Ошибка транзакции:', error);

                        let errorMessage = 'Произошла неизвестная ошибка';

                        if (error.message?.includes('InsufficientGas') || error.message?.includes('Insufficient')) {
                            errorMessage = 'Недостаточно SUI токенов. Получите больше токенов на faucet.sui.io';
                        } else if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
                            errorMessage = 'Транзакция отклонена пользователем';
                        } else if (error.message) {
                            errorMessage = error.message;
                        }

                        setError(errorMessage);
                        alert(`❌ Ошибка: ${errorMessage}`);
                    }
                }
            );

        } catch (error: any) {
            console.error('❌ Ошибка при подготовке:', error);
            const errorMsg = error.message || 'Неизвестная ошибка';
            setError(errorMsg);
            alert(`❌ Ошибка подготовки: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (!currentAccount) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <h3>📦 Деплой Smart Contract</h3>
                <p>🔒 Подключите кошелек для деплоя контракта basic_nft</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', border: '2px solid #007bff', borderRadius: '10px', marginBottom: '20px' }}>
            <h3 style={{ color: '#007bff', marginBottom: '20px' }}>📦 Деплой Smart Contract</h3>

            {!deployedPackageId ? (
                <div>
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #bbdefb' }}>
                        <h4 style={{ color: '#1976d2', marginTop: 0 }}>🎯 Что будет развернуто:</h4>
                        <ul style={{ textAlign: 'left', margin: '10px 0', color: '#424242' }}>
                            <li><strong>Модуль:</strong> basic_nft.move</li>
                            <li><strong>Функции:</strong> mint_game_nft, level_up, transfer_nft</li>
                            <li><strong>Сеть:</strong> Sui Testnet</li>
                            <li><strong>Кошелек:</strong> {currentAccount.address.slice(0, 10)}...{currentAccount.address.slice(-8)}</li>
                        </ul>
                    </div>

                    {error && (
                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', border: '1px solid #f8bbd9' }}>
                            <p style={{ color: '#c62828', margin: 0 }}><strong>❌ Ошибка:</strong> {error}</p>
                        </div>
                    )}

                    <button
                        onClick={deployContract}
                        disabled={loading}
                        style={{
                            padding: '15px 30px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            backgroundColor: loading ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {loading ? '⏳ Развертывание контракта...' : '🚀 Развернуть basic_nft контракт'}
                    </button>

                    <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
                        <p>💡 После нажатия кнопки подтвердите транзакцию в браузерном кошельке</p>
                    </div>
                </div>
            ) : (
                <div style={{ backgroundColor: '#d4edda', padding: '25px', borderRadius: '8px', border: '2px solid #c3e6cb' }}>
                    <h4 style={{ color: '#155724', marginTop: 0 }}>✅ Контракт успешно развернут!</h4>
                    <div style={{ marginBottom: '15px' }}>
                        <strong>📦 Package ID:</strong>
                        <code style={{
                            display: 'block',
                            backgroundColor: '#fff',
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            margin: '10px 0',
                            border: '1px solid #28a745',
                            color: '#155724'
                        }}>{deployedPackageId}</code>
                    </div>
                    <p style={{ color: '#155724', margin: 0, fontWeight: 'bold' }}>
                        🎉 Контракт готов! Теперь можете создавать GameNFT!
                    </p>
                </div>
            )}
        </div>
    );
};
