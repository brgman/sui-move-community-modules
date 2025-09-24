#!/usr/bin/env node

/**
 * Скрипт для экспорта приватного ключа из Sui CLI
 * ВНИМАНИЕ: Никогда не делитесь приватным ключом и не коммитьте его в репозиторий!
 */

const { execSync } = require('child_process');

async function exportPrivateKey() {
    try {
        console.log('🔑 Экспорт приватного ключа из Sui CLI...\n');
        
        // Получаем информацию о кошельках в JSON формате
        const addressesOutput = execSync('sui client addresses --json', { encoding: 'utf-8' });
        const addresses = JSON.parse(addressesOutput);
        
        console.log(`Активный адрес: ${addresses.activeAddress}`);
        
        // Находим alias для активного адреса
        const activeAddressInfo = addresses.addresses.find(addr => addr[1] === addresses.activeAddress);
        const alias = activeAddressInfo ? activeAddressInfo[0] : null;
        
        if (!alias) {
            throw new Error('Не удалось найти alias для активного адреса');
        }
        
        console.log(`Alias кошелька: ${alias}`);
        
        // Экспортируем приватный ключ используя alias
        const privateKeyOutput = execSync(`sui keytool export --key-identity ${alias}`, { encoding: 'utf-8' });
        
        // Приватный ключ будет в формате suiprivkey...
        const privateKeyMatch = privateKeyOutput.match(/(suiprivkey[A-Za-z0-9]+)/);
        
        if (privateKeyMatch) {
            const privateKey = privateKeyMatch[1];
            console.log('\n✅ Приватный ключ успешно экспортирован!');
            console.log('📋 Скопируйте этот ключ для использования в приложении:\n');
            console.log('----------------------------------------');
            console.log(privateKey);
            console.log('----------------------------------------\n');
            
            console.log('🔧 Использование в коде:');
            console.log(`import { walletConfig } from './wallet-config';`);
            console.log(`walletConfig.importWalletFromSuiPrivateKey('${privateKey}');`);
            console.log('\n⚠️  ВАЖНО: Никогда не делитесь этим ключом и не сохраняйте его в открытом виде!');
            
        } else {
            console.error('❌ Не удалось найти приватный ключ в выводе команды');
            console.log('Полный вывод:');
            console.log(privateKeyOutput);
        }
        
    } catch (error) {
        console.error('❌ Ошибка при экспорте приватного ключа:', error.message);
        console.log('\n💡 Убедитесь что:');
        console.log('1. Sui CLI установлен и настроен');
        console.log('2. У вас есть активный кошелек');
        console.log('3. Запустите: sui client active-address');
    }
}

exportPrivateKey();
