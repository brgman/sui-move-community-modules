import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

/**
 * Утилита для поиска развернутых пакетов basic_nft
 */

const client = new SuiClient({
    url: getFullnodeUrl('testnet')
});

export async function findBasicNftPackages(ownerAddress?: string): Promise<any[]> {
    try {
        console.log('🔍 Поиск развернутых пакетов basic_nft...');

        if (ownerAddress) {
            // Ищем объекты у конкретного адреса
            const objects = await client.getOwnedObjects({
                owner: ownerAddress,
                options: {
                    showType: true,
                    showContent: true,
                }
            });

            console.log(`📦 Найдено объектов у ${ownerAddress}:`, objects.data.length);

            // Фильтруем пакеты
            const packages = objects.data.filter(obj =>
                obj.data?.type?.includes('Package') ||
                obj.data?.type?.includes('basic_nft')
            );

            return packages;
        }

        return [];
    } catch (error) {
        console.error('❌ Ошибка при поиске пакетов:', error);
        return [];
    }
}

export async function checkPackageExists(packageId: string): Promise<boolean> {
    try {
        const packageObj = await client.getObject({
            id: packageId,
            options: {
                showContent: true,
                showType: true,
            }
        });

        console.log('📦 Пакет найден:', packageObj);
        return packageObj.data !== null;
    } catch (error) {
        console.error(`❌ Пакет ${packageId} не найден:`, error);
        return false;
    }
}

// Экспорт для использования в React компонентах
export { client as suiClient };
