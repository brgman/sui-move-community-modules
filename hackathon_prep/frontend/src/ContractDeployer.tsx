import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export const ContractDeployer: React.FC<{ onPackageDeployed?: (packageId: string) => void }> = ({ onPackageDeployed }) => {
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [packageIdInput, setPackageIdInput] = useState<string>('');
    const [deployedPackageId, setDeployedPackageId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [showDeployOption, setShowDeployOption] = useState(false);

    const validateAndSetPackageId = () => {
        if (!packageIdInput.trim()) {
            alert('❌ Введите Package ID!');
            return;
        }

        // Простая валидация формата Package ID (начинается с 0x и имеет правильную длину)
        const trimmedId = packageIdInput.trim();
        if (!trimmedId.startsWith('0x') || trimmedId.length !== 66) {
            alert('❌ Неверный формат Package ID!\n\nPackage ID должен:\n- Начинаться с 0x\n- Иметь длину 66 символов\n- Содержать только hex символы (0-9, a-f)');
            return;
        }

        setDeployedPackageId(trimmedId);
        onPackageDeployed?.(trimmedId);
        setError('');

        alert(`✅ Package ID установлен!\n\n📦 ${trimmedId}\n\nТеперь можете создавать NFT с этим контрактом!`);
    };

    const clearPackageId = () => {
        setDeployedPackageId('');
        setPackageIdInput('');
        onPackageDeployed?.('');
    };

    // Функция для деплоя контракта прямо из браузера
    const deployContractFromBrowser = async () => {
        if (!currentAccount) {
            setError('Подключите кошелек');
            return;
        }

        try {
            setIsDeploying(true);
            setError('');

            console.log('🚀 Начинаем деплой контракта из браузера...');

            // Получаем скомпилированный байткод
            // В реальном приложении байткод должен быть предварительно скомпилирован 
            // и доступен как статический ресурс или через API
            const response = await fetch('/bytecode/basic_nft.mv');
            if (!response.ok) {
                throw new Error('Не удалось загрузить байткод контракта. Сначала скомпилируйте контракт: sui move build');
            }

            const bytecodeBuffer = await response.arrayBuffer();
            const bytecode = Array.from(new Uint8Array(bytecodeBuffer));

            // Создаем транзакцию для публикации
            const tx = new Transaction();

            // Устанавливаем разумный газ бюджет (0.01 SUI)
            tx.setGasBudget(10000000); // 0.01 SUI

            // Публикуем пакет с явными зависимостями для Sui testnet
            const [upgradeCapability] = tx.publish({
                modules: [bytecode],
                dependencies: [
                    '0x0000000000000000000000000000000000000000000000000000000000000001', // std
                    '0x0000000000000000000000000000000000000000000000000000000000000002', // sui
                ]
            });

            // Передаем upgrade capability отправителю
            tx.transferObjects([upgradeCapability], currentAccount.address);

            console.log('📦 Отправляем транзакцию деплоя...');

            // Отправляем транзакцию
            signAndExecuteTransaction(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: (result) => {
                        console.log('✅ Контракт успешно задеплоен из браузера!', result);

                        // Получаем Transaction Digest для поиска в explorer
                        if (result.digest) {
                            console.log('📋 Transaction Digest:', result.digest);

                            // Показываем пользователю успех и инструкции
                            const explorerUrl = `https://suiscan.xyz/testnet/tx/${result.digest}`;

                            setError('');
                            alert(`✅ Контракт успешно задеплоен!\n\n🔍 Transaction Digest: ${result.digest}\n\n� Откройте Sui Explorer для получения Package ID:\n${explorerUrl}\n\n💡 После получения Package ID введите его в поле ниже для взаимодействия с контрактом.`);

                            // Переключаемся обратно на ввод Package ID
                            setShowDeployOption(false);
                        } else {
                            console.log('📋 Результат деплоя:', result);
                            setError('Контракт задеплоен, но не получен digest транзакции');
                        }

                        setIsDeploying(false);
                    },
                    onError: (error) => {
                        console.error('❌ Ошибка деплоя:', error);
                        let errorMessage = error.message;

                        if (errorMessage.includes('PublishUpgradeMissingDependency')) {
                            errorMessage = 'Ошибка зависимостей контракта. Попробуйте перезагрузить страницу и повторить деплой.';
                        } else if (errorMessage.includes('InsufficientGas')) {
                            errorMessage = 'Недостаточно SUI для оплаты газа (~0.01 SUI). Получите токены с https://faucet.sui.io';
                        } else if (errorMessage.includes('UserRejected')) {
                            errorMessage = 'Транзакция отклонена пользователем';
                        }

                        setError(`Ошибка деплоя: ${errorMessage}`);
                        setIsDeploying(false);
                    }
                }
            );

        } catch (error: any) {
            console.error('❌ Ошибка подготовки деплоя:', error);
            setError(`Ошибка: ${error.message}`);
            setIsDeploying(false);
        }
    };

    if (!currentAccount) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <h3>📦 Подключение к Smart Contract</h3>
                <p>🔒 Подключите кошелек для работы с контрактами</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', border: '2px solid #007bff', borderRadius: '10px', marginBottom: '20px' }}>
            <h3 style={{ color: '#007bff', marginBottom: '20px' }}>� Подключение к Smart Contract</h3>

            {!deployedPackageId ? (
                <div>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <button
                            onClick={() => setShowDeployOption(!showDeployOption)}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                backgroundColor: showDeployOption ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            {showDeployOption ? '📝 Ввести существующий Package ID' : '🚀 Задеплоить новый контракт'}
                        </button>
                    </div>

                    {showDeployOption ? (
                        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#e8f4fd', borderRadius: '8px', border: '2px solid #007bff' }}>
                            <h4 style={{ color: '#007bff', marginTop: 0 }}>🚀 Деплой контракта через браузер</h4>
                            <p>Задеплойте basic_nft контракт прямо из браузера используя ваш подключенный кошелек.</p>

                            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '6px', border: '1px solid #bee5eb' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#0c5460' }}>
                                    <strong>ℹ️ Как это работает:</strong>
                                </p>
                                <ol style={{ margin: '5px 0', paddingLeft: '20px', color: '#0c5460' }}>
                                    <li>Нажмите кнопку "Задеплоить контракт"</li>
                                    <li>Подтвердите транзакцию в кошельке</li>
                                    <li>После успешного деплоя откройте ссылку в Sui Explorer</li>
                                    <li>Найдите Package ID в деталях транзакции</li>
                                    <li>Скопируйте Package ID и введите его в форму ниже</li>
                                </ol>
                            </div>

                            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeeba' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                                    <strong>⚠️ Требования:</strong>
                                </p>
                                <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#856404' }}>
                                    <li>У вас должно быть достаточно SUI для оплаты газа (~0.01 SUI)</li>
                                    <li>Кошелек должен быть подключен к Sui testnet</li>
                                    <li>Контракт должен быть предварительно скомпилирован</li>
                                </ul>
                            </div>

                            <button
                                onClick={deployContractFromBrowser}
                                disabled={isDeploying}
                                style={{
                                    padding: '15px 30px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    backgroundColor: isDeploying ? '#6c757d' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: isDeploying ? 'not-allowed' : 'pointer',
                                    width: '100%',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {isDeploying ? '🔄 Деплоим контракт... (подтвердите в кошельке)' : '🚀 Задеплоить контракт через кошелек'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #bbdefb' }}>
                                <h4 style={{ color: '#1976d2', marginTop: 0 }}>🎯 Как получить Package ID:</h4>
                                <ol style={{ textAlign: 'left', margin: '10px 0', color: '#424242' }}>
                                    <li><strong>Скомпилируйте контракт:</strong> <code>sui move build</code></li>
                                    <li><strong>Разверните контракт:</strong> <code>sui client publish</code></li>
                                    <li><strong>Скопируйте Package ID</strong> из вывода команды</li>
                                    <li><strong>Вставьте его</strong> в поле ниже</li>
                                </ol>
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeeba' }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                                        <strong>💡 Для тестирования:</strong> Вы можете использовать любой существующий Package ID из Sui Explorer, чтобы протестировать интерфейс.
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                                    Package ID развернутого basic_nft контракта:
                                </label>
                                <input
                                    type="text"
                                    value={packageIdInput}
                                    onChange={(e) => setPackageIdInput(e.target.value)}
                                    placeholder="0x1234567890abcdef..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        border: '2px solid #ced4da',
                                        borderRadius: '6px',
                                        backgroundColor: '#fff'
                                    }}
                                />
                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                                    Package ID должен начинаться с 0x и иметь длину 66 символов
                                </div>
                            </div>

                            {error && (
                                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', border: '1px solid #f8bbd9' }}>
                                    <p style={{ color: '#c62828', margin: 0 }}><strong>❌ Ошибка:</strong> {error}</p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={validateAndSetPackageId}
                                    disabled={!packageIdInput.trim()}
                                    style={{
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        backgroundColor: !packageIdInput.trim() ? '#ccc' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: !packageIdInput.trim() ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    ✅ Подключить контракт
                                </button>
                            </div>

                            <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
                                <p>💡 Введите реальный Package ID развернутого basic_nft контракта</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ backgroundColor: '#d4edda', padding: '25px', borderRadius: '8px', border: '2px solid #c3e6cb' }}>
                    <h4 style={{ color: '#155724', marginTop: 0 }}>✅ Контракт подключен!</h4>
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={clearPackageId}
                            style={{
                                padding: '8px 16px',
                                fontSize: '14px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Изменить Package ID
                        </button>
                    </div>
                    <p style={{ color: '#155724', margin: '15px 0 0 0', fontWeight: 'bold' }}>
                        🎉 Контракт готов! Теперь можете создавать GameNFT!
                    </p>
                </div>
            )}
        </div>
    );
};