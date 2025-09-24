module hackathon_prep_new::basic_nft;

use std::string::String;
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
    name: String,
    description: String,
    image_url: String,
    level: u64,
    power: u64,
    rarity: u8,
    ctx: &mut TxContext,
) {
    // Validate rarity (1-4)
    assert!(rarity >= 1 && rarity <= 4, 0);

    let id = object::new(ctx);
    let nft_id = object::uid_to_address(&id);
    let sender = tx_context::sender(ctx);

    let nft = GameNFT {
        id,
        name,
        description,
        image_url: url::new_unsafe(image_url),
        level,
        power,
        rarity,
    };

    // Emit event
    event::emit(NFTMinted {
        id: nft_id,
        minted_by: sender,
        name: nft.name,
        rarity: nft.rarity,
    });

    // Transfer to sender
    transfer::public_transfer(nft, sender);
}

/// Level up NFT (increases level and power)
public entry fun level_up(nft: &mut GameNFT, _ctx: &TxContext) {
    nft.level = nft.level + 1;
    nft.power = nft.power + (nft.rarity as u64 * 10); // More rare = more power gain

    // Could add level restrictions based on rarity
    if (nft.rarity == 1) {
        assert!(nft.level <= 10, 1); // Common max level 10
    } else if (nft.rarity == 2) {
        assert!(nft.level <= 25, 1); // Rare max level 25
    } else if (nft.rarity == 3) {
        assert!(nft.level <= 50, 1); // Epic max level 50
    };
    // Legendary (4) has no level limit
}

/// Transfer NFT to another address
public entry fun transfer_nft(nft: GameNFT, recipient: address, _ctx: &TxContext) {
    transfer::public_transfer(nft, recipient);
}

/// Get NFT stats (read-only)
public fun get_nft_stats(nft: &GameNFT): (String, u64, u64, u8) {
    (nft.name, nft.level, nft.power, nft.rarity)
}
