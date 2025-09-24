module hackathon_prep::basic_nft;

use std::string::{Self, String};
use sui::event;
use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::url::{Self, Url};

/// NFT structure
public struct GameNFT has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: Url,
    level: u64,
    power: u64,
    rarity: u8, // 1-Common, 2-Rare, 3-Epic, 4-Legendary
}

/// Event emitted when NFT is minted
public struct NFTMinted has copy, drop {
    id: address,
    minted_by: address,
    name: String,
    rarity: u8,
}

/// Mint a new GameNFT
public entry fun mint_game_nft(
    name: vector<u8>,
    description: vector<u8>,
    image_url: vector<u8>,
    level: u64,
    power: u64,
    rarity: u8,
    ctx: &mut TxContext,
) {
    assert!(rarity >= 1 && rarity <= 4, 0); // Valid rarity range

    let id = object::new(ctx);
    let nft_id = object::uid_to_address(&id);

    let nft = GameNFT {
        id,
        name: string::utf8(name),
        description: string::utf8(description),
        image_url: url::new_unsafe_from_bytes(image_url),
        level,
        power,
        rarity,
    };

    event::emit(NFTMinted {
        id: nft_id,
        minted_by: tx_context::sender(ctx),
        name: nft.name,
        rarity,
    });

    transfer::public_transfer(nft, tx_context::sender(ctx));
}

/// Level up the NFT (increases power)
public entry fun level_up(nft: &mut GameNFT) {
    nft.level = nft.level + 1;
    nft.power = nft.power + (nft.rarity as u64) * 10; // More power for rarer NFTs
}

/// Transfer NFT to another address
public entry fun transfer_nft(nft: GameNFT, recipient: address) {
    transfer::public_transfer(nft, recipient);
}

// === Getter functions ===

public fun name(nft: &GameNFT): &String {
    &nft.name
}

public fun description(nft: &GameNFT): &String {
    &nft.description
}

public fun image_url(nft: &GameNFT): &Url {
    &nft.image_url
}

public fun level(nft: &GameNFT): u64 {
    nft.level
}

public fun power(nft: &GameNFT): u64 {
    nft.power
}

public fun rarity(nft: &GameNFT): u8 {
    nft.rarity
}

public fun get_nft_stats(nft: &GameNFT): (String, u64, u64, u8) {
    (nft.name, nft.level, nft.power, nft.rarity)
}

// === Client-side code (for reference, not executable in Move) ===

import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';

// Создание клиента
const client = new SuiClient({ 
    url: 'https://fullnode.testnet.sui.io:443' 
});

// Импорт существующего кошелька через приватный ключ
const privateKeyBytes = /* ваш приватный ключ в bytes */;
const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

// Получение адреса
const address = keypair.toSuiAddress();
console.log('Wallet address:', address);
