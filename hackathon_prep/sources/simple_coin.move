module hackathon_prep::simple_coin;

use std::option;
use sui::coin::{Self, TreasuryCap, Coin};
use sui::url;

/// The SIMPLE_COIN witness
public struct SIMPLE_COIN has drop {}

/// Initialize the coin
fun init(witness: SIMPLE_COIN, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency<SIMPLE_COIN>(
        witness,
        9, // decimals
        b"HACK", // symbol
        b"Hackathon Coin", // name
        b"A coin for hackathon participants", // description
        option::some(url::new_unsafe_from_bytes(b"https://hackathon.sui.io/coin.png")),
        ctx,
    );

    // Freeze metadata so it can't be changed
    transfer::public_freeze_object(metadata);

    // Give treasury capability to the deployer
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
}

/// Mint new coins (only treasury cap holder can do this)
public entry fun mint(
    treasury_cap: &mut TreasuryCap<SIMPLE_COIN>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let new_coin = coin::mint(treasury_cap, amount, ctx);
    transfer::public_transfer(new_coin, recipient);
}

/// Burn coins
public entry fun burn(treasury_cap: &mut TreasuryCap<SIMPLE_COIN>, coin: Coin<SIMPLE_COIN>) {
    coin::burn(treasury_cap, coin);
}

/// Get total supply
public fun total_supply(treasury_cap: &TreasuryCap<SIMPLE_COIN>): u64 {
    coin::total_supply(treasury_cap)
}
