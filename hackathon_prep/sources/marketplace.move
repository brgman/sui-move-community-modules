module hackathon_prep::marketplace;

use hackathon_prep::basic_nft::{Self, GameNFT};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID, ID};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

/// Marketplace shared object
public struct Marketplace has key {
    id: UID,
    listings: Table<ID, Listing>,
}

/// A listing in the marketplace
public struct Listing has store {
    nft_id: ID,
    price: u64,
    seller: address,
}

/// Events
public struct NFTListed has copy, drop {
    nft_id: ID,
    price: u64,
    seller: address,
}

public struct NFTPurchased has copy, drop {
    nft_id: ID,
    price: u64,
    seller: address,
    buyer: address,
}

/// Initialize the marketplace (called once when module is published)
fun init(ctx: &mut TxContext) {
    let marketplace = Marketplace {
        id: object::new(ctx),
        listings: table::new(ctx),
    };

    transfer::share_object(marketplace);
}

/// List an NFT for sale
public entry fun list_nft(
    marketplace: &mut Marketplace,
    nft: GameNFT,
    price: u64,
    ctx: &mut TxContext,
) {
    let nft_id = object::id(&nft);
    let seller = tx_context::sender(ctx);

    let listing = Listing {
        nft_id,
        price,
        seller,
    };

    // Store the NFT in the marketplace
    table::add(&mut marketplace.listings, nft_id, listing);

    // Transfer NFT to marketplace (it will be held until sold)
    transfer::public_transfer(nft, @hackathon_prep);

    event::emit(NFTListed {
        nft_id,
        price,
        seller,
    });
}

/// Purchase an NFT from the marketplace
public entry fun purchase_nft(
    marketplace: &mut Marketplace,
    nft_id: ID,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    // Get the listing
    let listing = table::remove(&mut marketplace.listings, nft_id);
    let Listing { nft_id: _, price, seller } = listing;

    // Check payment amount
    assert!(coin::value(&payment) >= price, 0);

    let buyer = tx_context::sender(ctx);

    // Transfer payment to seller
    transfer::public_transfer(payment, seller);

    // Emit purchase event
    event::emit(NFTPurchased {
        nft_id,
        price,
        seller,
        buyer,
    });

    // Note: In a real implementation, you'd need to transfer the NFT to buyer
    // This requires more complex object handling
}

/// Cancel a listing
public entry fun cancel_listing(marketplace: &mut Marketplace, nft_id: ID, ctx: &mut TxContext) {
    let listing = table::remove(&mut marketplace.listings, nft_id);
    let Listing { nft_id: _, price: _, seller } = listing;

    // Only seller can cancel
    assert!(tx_context::sender(ctx) == seller, 1);

    // Note: In a real implementation, you'd transfer NFT back to seller
}

/// Get listing info
public fun get_listing(marketplace: &Marketplace, nft_id: ID): (u64, address) {
    let listing = table::borrow(&marketplace.listings, nft_id);
    (listing.price, listing.seller)
}

/// Check if NFT is listed
public fun is_listed(marketplace: &Marketplace, nft_id: ID): bool {
    table::contains(&marketplace.listings, nft_id)
}
