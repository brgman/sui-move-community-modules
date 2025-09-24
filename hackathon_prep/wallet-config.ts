import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Buffer } from 'buffer';

// Конфигурация для подключения к существующему кошельку
export class WalletConfig {
    private client: SuiClient;
    private keypair: Ed25519Keypair | null = null;

    // Ваш текущий адрес кошелька из CLI
    public readonly walletAddress = '0x65a43d0738e914421957f18588ed50c7cca775ee240848854a0ca446843ccafa';

    constructor(network: 'devnet' | 'testnet' | 'mainnet' = 'testnet') {
        this.client = new SuiClient({
            url: getFullnodeUrl(network)
        });
    }

    // Метод для импорта кошелька через приватный ключ (Bech32 формат suiprivkey...)
    importWalletFromSuiPrivateKey(privateKeyBech32: string) {
        try {
            this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBech32);

            const address = this.keypair.toSuiAddress();
            console.log('Imported wallet address:', address);

            if (address !== this.walletAddress) {
                console.warn('Warning: Imported address does not match expected address');
                console.warn(`Expected: ${this.walletAddress}`);
                console.warn(`Got: ${address}`);
            }

            return address;
        } catch (error) {
            console.error('Failed to import wallet:', error);
            throw error;
        }
    }

    // Метод для импорта кошелька через приватный ключ в base64 формате (устаревший)
    importWalletFromPrivateKey(privateKeyBase64: string) {
        try {
            const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
            this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

            const address = this.keypair.toSuiAddress();
            console.log('Imported wallet address:', address);

            if (address !== this.walletAddress) {
                console.warn('Warning: Imported address does not match expected address');
            }

            return address;
        } catch (error) {
            console.error('Failed to import wallet:', error);
            throw error;
        }
    }

    // Получить клиент Sui
    getClient(): SuiClient {
        return this.client;
    }

    // Получить keypair (если импортирован)
    getKeypair(): Ed25519Keypair {
        if (!this.keypair) {
            throw new Error('Wallet not imported. Please call importWalletFromPrivateKey first.');
        }
        return this.keypair;
    }

    // Проверить баланс кошелька
    async getBalance(): Promise<string> {
        try {
            const balance = await this.client.getBalance({
                owner: this.walletAddress
            });
            return balance.totalBalance;
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    // Получить все объекты, принадлежащие кошельку
    async getOwnedObjects() {
        try {
            const objects = await this.client.getOwnedObjects({
                owner: this.walletAddress,
                options: {
                    showContent: true,
                    showType: true,
                }
            });
            return objects.data;
        } catch (error) {
            console.error('Failed to get owned objects:', error);
            throw error;
        }
    }

    // Подписать и выполнить транзакцию
    async signAndExecuteTransaction(transactionBlock: any) {
        if (!this.keypair) {
            throw new Error('Wallet not imported. Please call importWalletFromPrivateKey first.');
        }

        try {
            const result = await this.client.signAndExecuteTransaction({
                signer: this.keypair,
                transaction: transactionBlock,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                }
            });
            return result;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }
}

// Экспорт экземпляра для использования в приложении
export const walletConfig = new WalletConfig('testnet');
