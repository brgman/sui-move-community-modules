import { walletConfig } from './wallet-config';
import { Transaction } from '@mysten/sui/transactions';

/**
 * Пример использования вашего существующего кошелька с basic_nft модулем
 * ВНИМАНИЕ: Замените PRIVATE_KEY на ваш реальный приватный ключ
 */

// ⚠️ ВАЖНО: Никогда не коммитьте приватный ключ в репозиторий!
// Используйте переменные окружения или безопасное хранилище
const PRIVATE_KEY = 'suiprivkey1qz5trqhm0wl8qzhc40nr9x8l7sthukmll0akzeqvdu94u49lhvqewrx6ws2';

// ID пакета вашего развернутого модуля (нужно будет обновить после деплоя)
const PACKAGE_ID = 'YOUR_PACKAGE_ID_HERE';

export class NFTManager {
    private initialized = false;

    async init() {
        if (!this.initialized) {
            // Импортируем ваш существующий кошелек
            walletConfig.importWalletFromSuiPrivateKey(PRIVATE_KEY);
            this.initialized = true;
            console.log('✅ Кошелек подключен к NFT менеджеру');
        }
    }

    // Проверить баланс кошелька
    async checkBalance(): Promise<string> {
        await this.init();
        const balance = await walletConfig.getBalance();
        console.log(`💰 Баланс кошелька: ${balance} SUI`);
        return balance;
    }

    // Создать новый GameNFT
    async mintGameNFT(params: {
        name: string;
        description: string;
        imageUrl: string;
        level: number;
        power: number;
        rarity: number;
    }) {
        await this.init();

        console.log('🎨 Создание нового GameNFT...');
        
        // Проверяем корректность rarity
        if (params.rarity < 1 || params.rarity > 4) {
            throw new Error('Rarity должна быть от 1 до 4');
        }

        const tx = new Transaction();

        tx.moveCall({
            target: `${PACKAGE_ID}::basic_nft::mint_game_nft`,
            arguments: [
                tx.pure.string(params.name),
                tx.pure.string(params.description),
                tx.pure.string(params.imageUrl),
                tx.pure.u64(params.level),
                tx.pure.u64(params.power),
                tx.pure.u8(params.rarity),
            ],
        });

        try {
            const result = await walletConfig.signAndExecuteTransaction(tx);
            console.log('✅ GameNFT успешно создан!');
            console.log('Transaction digest:', result.digest);
            return result;
        } catch (error) {
            console.error('❌ Ошибка при создании NFT:', error);
            throw error;
        }
    }

    // Повысить уровень NFT
    async levelUpNFT(nftObjectId: string) {
        await this.init();

        console.log(`⬆️ Повышение уровня NFT ${nftObjectId}...`);

        const tx = new Transaction();

        tx.moveCall({
            target: `${PACKAGE_ID}::basic_nft::level_up`,
            arguments: [tx.object(nftObjectId)],
        });

        try {
            const result = await walletConfig.signAndExecuteTransaction(tx);
            console.log('✅ NFT успешно прокачан!');
            console.log('Transaction digest:', result.digest);
            return result;
        } catch (error) {
            console.error('❌ Ошибка при прокачке NFT:', error);
            throw error;
        }
    }

    // Передать NFT другому адресу
    async transferNFT(nftObjectId: string, recipientAddress: string) {
        await this.init();

        console.log(`📤 Передача NFT ${nftObjectId} адресу ${recipientAddress}...`);

        const tx = new Transaction();

        tx.moveCall({
            target: `${PACKAGE_ID}::basic_nft::transfer_nft`,
            arguments: [
                tx.object(nftObjectId),
                tx.pure.address(recipientAddress)
            ],
        });

        try {
            const result = await walletConfig.signAndExecuteTransaction(tx);
            console.log('✅ NFT успешно передан!');
            console.log('Transaction digest:', result.digest);
            return result;
        } catch (error) {
            console.error('❌ Ошибка при передаче NFT:', error);
            throw error;
        }
    }

    // Получить все NFT принадлежащие кошельку
    async getMyNFTs() {
        await this.init();
        
        console.log('🔍 Поиск ваших NFT...');
        
        const objects = await walletConfig.getOwnedObjects();
        
        // Фильтруем только GameNFT объекты
        const nfts = objects.filter(obj => 
            obj.data?.type?.includes('::basic_nft::GameNFT')
        );

        console.log(`📊 Найдено ${nfts.length} NFT`);
        return nfts;
    }
}

// Пример использования
async function example() {
    const nftManager = new NFTManager();
    
    try {
        // Проверяем баланс
        await nftManager.checkBalance();
        
        // Создаем новый NFT
        const mintResult = await nftManager.mintGameNFT({
            name: 'Legendary Dragon',
            description: 'A powerful dragon NFT for the hackathon',
            imageUrl: 'https://example.com/dragon.png',
            level: 1,
            power: 100,
            rarity: 4 // Legendary
        });
        
        // Получаем список наших NFT
        await nftManager.getMyNFTs();
        
        console.log('🎉 Пример выполнен успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка в примере:', error);
    }
}

// Экспортируем экземпляр для использования
export const nftManager = new NFTManager();

// Раскомментируйте для запуска примера:
// example();
