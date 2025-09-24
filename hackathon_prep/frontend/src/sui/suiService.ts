import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const PACKAGE_ID = 'YOUR_PACKAGE_ID_HERE';

export class SuiService {
    private client: SuiClient;

    constructor(network: 'devnet' | 'testnet' | 'mainnet' = 'devnet') {
        this.client = new SuiClient({
            url: getFullnodeUrl(network)
        });
    }

    // Mint a new GameNFT
    async mintGameNFT(params: {
        name: string;
        description: string;
        imageUrl: string;
        level: number;
        power: number;
        rarity: number;
    }) {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${PACKAGE_ID}::basic_nft::mint_game_nft`,
            arguments: [
                txb.pure(Array.from(new TextEncoder().encode(params.name))),
                txb.pure(Array.from(new TextEncoder().encode(params.description))),
                txb.pure(Array.from(new TextEncoder().encode(params.imageUrl))),
                txb.pure(params.level),
                txb.pure(params.power),
                txb.pure(params.rarity),
            ],
        });

        return txb;
    }

    // Level up an NFT
    async levelUpNFT(nftId: string) {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${PACKAGE_ID}::basic_nft::level_up`,
            arguments: [txb.object(nftId)],
        });

        return txb;
    }

    // List NFT on marketplace
    async listNFT(params: {
        marketplaceId: string;
        nftId: string;
        price: number;
    }) {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${PACKAGE_ID}::marketplace::list_nft`,
            arguments: [
                txb.object(params.marketplaceId),
                txb.object(params.nftId),
                txb.pure(params.price),
            ],
        });

        return txb;
    }

    // Purchase NFT from marketplace  
    async purchaseNFT(params: {
        marketplaceId: string;
        nftId: string;
        coinId: string;
    }) {
        const txb = new TransactionBlock();

        txb.moveCall({
            target: `${PACKAGE_ID}::marketplace::purchase_nft`,
            arguments: [
                txb.object(params.marketplaceId),
                txb.pure(params.nftId),
                txb.object(params.coinId),
            ],
        });

        return txb;
    }

    // Get owned objects
    async getOwnedNFTs(address: string) {
        const objects = await this.client.getOwnedObjects({
            owner: address,
            filter: {
                StructType: `${PACKAGE_ID}::basic_nft::GameNFT`
            },
            options: {
                showContent: true,
                showDisplay: true,
            }
        });

        return objects.data;
    }

    // Get object details
    async getObjectDetails(objectId: string) {
        return await this.client.getObject({
            id: objectId,
            options: {
                showContent: true,
                showDisplay: true,
            }
        });
    }

    // Get marketplace listings
    async getMarketplaceListings(marketplaceId: string) {
        const marketplace = await this.client.getObject({
            id: marketplaceId,
            options: {
                showContent: true,
            }
        });

        return marketplace;
    }
}
