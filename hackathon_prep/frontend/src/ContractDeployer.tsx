import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export const ContractDeployer: React.FC<{ onPackageDeployed?: (packageId: string) => void }> = ({ onPackageDeployed }) => {
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const suiClient = useSuiClient();
    const [packageIdInput, setPackageIdInput] = useState<string>('');
    const [deployedPackageId, setDeployedPackageId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [showDeployOption, setShowDeployOption] = useState(false);
    const [deployStatus, setDeployStatus] = useState<string>('');
    const [lastTransactionDigest, setLastTransactionDigest] = useState<string>('');
    const [userBalance, setUserBalance] = useState<string>('');

    const validateAndSetPackageId = () => {
        if (!packageIdInput.trim()) {
            alert('❌ Введите Package ID!');
            return;
        }

        const trimmedId = packageIdInput.trim();
        if (!trimmedId.startsWith('0x') || trimmedId.length !== 66) {
            alert('❌ Неверный формат Package ID!\\n\\nPackage ID должен:\\n- Начинаться с 0x\\n- Иметь длину 66 символов\\n- Содержать только hex символы (0-9, a-f)');
            return;
        }

        setDeployedPackageId(trimmedId);
        onPackageDeployed?.(trimmedId);
        setError('');

        console.log('✅ Package ID установлен:', trimmedId);
    };

    const clearPackageId = () => {
        setDeployedPackageId('');
        setPackageIdInput('');
        setDeployStatus('');
        setLastTransactionDigest('');
        setUserBalance('');
        onPackageDeployed?.('');
    };

    // Функция для повторного извлечения Package ID из известной транзакции
    const retryExtractPackageId = async () => {
        if (!lastTransactionDigest) return;

        setIsDeploying(true);
        const packageId = await extractPackageIdFromTransaction(lastTransactionDigest);

        if (packageId) {
            setDeployedPackageId(packageId);
            setPackageIdInput(packageId);
            onPackageDeployed?.(packageId);
            setDeployStatus(`✅ Package ID успешно извлечен: ${packageId}`);
            setError('');
        } else {
            setError('❌ Все еще не удается извлечь Package ID. Попробуйте ввести его вручную.');
        }

        setIsDeploying(false);
    };

    // Функция для автоматического извлечения Package ID из транзакции
    const extractPackageIdFromTransaction = async (digest: string): Promise<string | null> => {
        try {
            setDeployStatus('🔍 Извлекаем Package ID из транзакции...');

            // Добавляем небольшую задержку для обеспечения финализации транзакции
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Получаем детали транзакции
            const txDetails = await suiClient.getTransactionBlock({
                digest: digest,
                options: {
                    showObjectChanges: true,
                    showEffects: true,
                    showEvents: true,
                }
            });

            console.log('📋 Детали транзакции:', txDetails);

            // Способ 1: Ищем Package ID в objectChanges
            if (txDetails.objectChanges) {
                for (const change of txDetails.objectChanges) {
                    if (change.type === 'published') {
                        const packageId = change.packageId;
                        console.log('✅ Найден Package ID в objectChanges:', packageId);
                        return packageId;
                    }
                }
            }

            // Способ 2: Ищем в effects.created
            if (txDetails.effects && txDetails.effects.created) {
                for (const created of txDetails.effects.created) {
                    if (created.owner === 'Immutable') {
                        const packageId = created.reference.objectId;
                        console.log('✅ Найден Package ID в effects.created:', packageId);
                        return packageId;
                    }
                }
            }

            // Способ 3: Ищем в событиях публикации
            if (txDetails.events) {
                for (const event of txDetails.events) {
                    if (event.type.includes('::package::PublishedEvent')) {
                        const packageId = (event.parsedJson as any)?.package_id;
                        if (packageId) {
                            console.log('✅ Найден Package ID в events:', packageId);
                            return packageId;
                        }
                    }
                }
            }

            // Способ 4: Попробуем найти любой immutable object
            if (txDetails.effects && txDetails.effects.created) {
                for (const created of txDetails.effects.created) {
                    const objectId = created.reference.objectId;
                    if (objectId && objectId.startsWith('0x') && objectId.length === 66) {
                        console.log('✅ Найден потенциальный Package ID:', objectId);
                        return objectId;
                    }
                }
            }

            console.log('❌ Package ID не найден в транзакции');
            return null;

        } catch (error) {
            console.error('❌ Ошибка извлечения Package ID:', error);
            return null;
        }
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
            setDeployStatus('🚀 Начинаем деплой контракта...');

            console.log('🚀 Начинаем деплой контракта из браузера...');

            // Проверяем баланс пользователя
            setDeployStatus('💰 Проверяем баланс...');
            try {
                const balance = await suiClient.getBalance({
                    owner: currentAccount.address,
                    coinType: '0x2::sui::SUI'
                });

                const balanceInSui = parseInt(balance.totalBalance) / 1000000000;
                console.log(`💰 Баланс пользователя: ${balanceInSui} SUI`);
                setUserBalance(`${balanceInSui.toFixed(4)} SUI`);

                if (parseInt(balance.totalBalance) < 50000000) { // Меньше 0.05 SUI
                    throw new Error(`Недостаточно SUI для деплоя. Текущий баланс: ${balanceInSui.toFixed(4)} SUI. Требуется минимум 0.05 SUI. Получите токены на https://faucet.sui.io`);
                }

                setDeployStatus(`✅ Баланс достаточен: ${balanceInSui.toFixed(4)} SUI`);
            } catch (balanceError: any) {
                if (balanceError.message.includes('Недостаточно SUI')) {
                    throw balanceError;
                }
                console.warn('⚠️ Не удалось проверить баланс:', balanceError);
                setDeployStatus('⚠️ Не удалось проверить баланс, продолжаем...');
            }

            // Получаем скомпилированный байткод
            const response = await fetch('/bytecode/basic_nft.mv');
            if (!response.ok) {
                throw new Error('Не удалось загрузить байткод контракта. Убедитесь что файл /bytecode/basic_nft.mv доступен.');
            }

            const bytecodeBuffer = await response.arrayBuffer();
            const bytecode = Array.from(new Uint8Array(bytecodeBuffer));

            setDeployStatus('📦 Создаем транзакцию деплоя...');

            // Создаем транзакцию для публикации
            const tx = new Transaction();

            // Устанавливаем разумный газ бюджет для деплоя (0.05 SUI)
            tx.setGasBudget(50000000); // 0.05 SUI - достаточно для публикации

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
            setDeployStatus('📝 Подтвердите транзакцию в кошельке...');

            // Отправляем транзакцию
            signAndExecuteTransaction(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: async (result) => {
                        console.log('✅ Контракт успешно задеплоен из браузера!', result);

                        if (result.digest) {
                            console.log('📋 Transaction Digest:', result.digest);
                            setLastTransactionDigest(result.digest);
                            setDeployStatus('🎉 Деплой завершен! Получаем Package ID...');

                            // Автоматически извлекаем Package ID
                            const packageId = await extractPackageIdFromTransaction(result.digest);

                            if (packageId) {
                                // Успешно получили Package ID - заполняем интерфейс
                                setDeployedPackageId(packageId);
                                setPackageIdInput(packageId);
                                onPackageDeployed?.(packageId);
                                setDeployStatus(`✅ Package ID получен и установлен автоматически!`);
                                setError('');
                                setShowDeployOption(false);

                                console.log('🎯 Package ID автоматически установлен:', packageId);
                            } else {
                                // Не удалось автоматически получить Package ID
                                const explorerUrl = `https://suiscan.xyz/testnet/tx/${result.digest}`;
                                setError(`⚠️ Контракт задеплоен успешно, но не удалось автоматически извлечь Package ID. Проверьте транзакцию в explorer и введите Package ID вручную: ${explorerUrl}`);
                                setDeployStatus('⚠️ Требуется ручной ввод Package ID');
                                setShowDeployOption(false);

                                console.log('🔗 Explorer URL:', explorerUrl);
                            }
                        } else {
                            console.log('📋 Результат деплоя:', result);
                            setError('Контракт задеплоен, но не получен digest транзакции');
                            setDeployStatus('❌ Нет digest транзакции');
                        }

                        setIsDeploying(false);
                    },
                    onError: (error) => {
                        console.error('❌ Ошибка деплоя:', error);
                        let errorMessage = error.message;

                        if (errorMessage.includes('PublishUpgradeMissingDependency')) {
                            errorMessage = 'Ошибка зависимостей контракта. Попробуйте перезагрузить страницу и повторить деплой.';
                        } else if (errorMessage.includes('InsufficientGas')) {
                            errorMessage = 'Недостаточно SUI для оплаты газа (~0.05 SUI). Получите токены с https://faucet.sui.io';
                        } else if (errorMessage.includes('UserRejected')) {
                            errorMessage = 'Транзакция отклонена пользователем';
                        }

                        setError(`Ошибка деплоя: ${errorMessage}`);
                        setDeployStatus('❌ Деплой не удался');
                        setIsDeploying(false);
                    }
                }
            );

        } catch (error: any) {
            console.error('❌ Ошибка подготовки деплоя:', error);
            setError(`Ошибка: ${error.message}`);
            setDeployStatus('❌ Ошибка подготовки');
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
            <h3 style={{ color: '#007bff', marginBottom: '20px' }}>📦 Подключение к Smart Contract</h3>

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

                    {/* Отображение статуса деплоя */}
                    {deployStatus && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '8px',
                            border: '1px solid #bbdefb',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1976d2' }}>
                                {deployStatus}
                            </p>
                            {lastTransactionDigest && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    <a
                                        href={`https://suiscan.xyz/testnet/tx/${lastTransactionDigest}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            textDecoration: 'none',
                                            borderRadius: '4px',
                                            display: 'inline-block'
                                        }}
                                    >
                                        🔍 Проверить статус
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

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
                                    <li>Package ID будет автоматически получен и установлен</li>
                                    <li>Можете сразу начать создавать NFT!</li>
                                </ol>
                            </div>

                            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeeba' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                                    <strong>⚠️ Требования:</strong>
                                </p>
                                <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#856404' }}>
                                    <li>У вас должно быть достаточно SUI для оплаты газа (~0.05 SUI)</li>
                                    {userBalance && <li style={{ color: userBalance.includes('0.0000') ? '#dc3545' : '#28a745' }}>Текущий баланс: {userBalance}</li>}
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
                                <h4 style={{ color: '#1976d2', marginTop: 0 }}>🎯 Ввод существующего Package ID:</h4>
                                <p style={{ margin: '10px 0', color: '#424242' }}>
                                    Если у вас уже есть задеплоенный контракт, введите его Package ID ниже.
                                </p>
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

                    {error && (
                        <div style={{
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            padding: '15px',
                            borderRadius: '8px',
                            margin: '20px 0',
                            border: '1px solid #f8bbd9'
                        }}>
                            <p style={{ margin: 0 }}>❌ {error}</p>

                            {lastTransactionDigest && (
                                <div style={{ marginTop: '15px' }}>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                                        <strong>Transaction Digest:</strong> {lastTransactionDigest}
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={retryExtractPackageId}
                                            disabled={isDeploying}
                                            style={{
                                                padding: '8px 16px',
                                                fontSize: '14px',
                                                backgroundColor: isDeploying ? '#6c757d' : '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: isDeploying ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {isDeploying ? '🔄 Извлекаем...' : '🔄 Повторить извлечение Package ID'}
                                        </button>

                                        <a
                                            href={`https://suiscan.xyz/testnet/tx/${lastTransactionDigest}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '8px 16px',
                                                fontSize: '14px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                display: 'inline-block'
                                            }}
                                        >
                                            🔍 Открыть в Explorer
                                        </a>
                                    </div>
                                </div>
                            )}
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

                    {deployStatus && (
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '10px',
                            borderRadius: '6px',
                            margin: '10px 0',
                            border: '1px solid #28a745'
                        }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#155724' }}>
                                {deployStatus}
                            </p>
                            {lastTransactionDigest && (
                                <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
                                    Transaction: {lastTransactionDigest}
                                </p>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

                        {lastTransactionDigest && (
                            <a
                                href={`https://suiscan.xyz/testnet/tx/${lastTransactionDigest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    display: 'inline-block'
                                }}
                            >
                                🔍 Статус деплоя
                            </a>
                        )}
                    </div>
                    <p style={{ color: '#155724', margin: '15px 0 0 0', fontWeight: 'bold' }}>
                        🎉 Контракт готов! Теперь можете создавать GameNFT!
                    </p>
                </div>
            )}
        </div>
    );
};
