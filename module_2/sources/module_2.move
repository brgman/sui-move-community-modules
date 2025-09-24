module module_2::hero {

use std::string::String;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::object::UID;
use sui::sui::SUI;

const OWNER: address = @0x1;
const HERO_PRICE: u64 = 1000000000; // 1 SUI en MIST

// Structure pour stoquer les paiements
public struct Vault has key {
    id: UID,
    owner: any,
    balance: Balance<SUI>,
}

public struct Hero has key, store {
    id: UID,
    name: String,
    image_url: String,
    power: u64,
}

public struct Sa has key, store {
    id: UID,
};


// Fonction d'initialisation pour créer le Vault
fun init(ctx: &mut tx_context::TxContext) {
    let vault = Vault {
        id: object::new(ctx),
        owner: ctx.sender(), 
        balance: balance::zero<SUI>(),
    };
    transfer::share_object(vault);

    let admin_cap: AdminCup = AdminCup {
        id: 
    }
}

#[allow(lint(self_transfer))]
public entry fun create_hero(
    vault: &mut Vault,
    name: String,
    image_url: String,
    power: u64,
    payment: Coin<SUI>,
    ctx: &mut tx_context::TxContext,
) {
    // Vérifier que le paiement est suffisant
    assert!(coin::value(&payment) >= HERO_PRICE, 0);

    // Ajouter le paiement au vault
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut vault.balance, payment_balance);

    // Créer le héros
    let hero = Hero {
        id: object::new(ctx),
        name,
        image_url,
        power,
    };

    // Transférer le héros à l'expéditeur
    transfer::public_transfer(hero, tx_context::sender(ctx));
}

public entry fun transfer_hero(hero: Hero, to: address) {
    transfer::public_transfer(hero, to);
}

// Fonction pour retirer les fonds du vault (seulement pour le propriétaire)
public entry fun withdraw_from_vault(vault: &mut Vault, amount: u64, ctx: &mut tx_context::TxContext) {
    assert!(tx_context::sender(ctx) == OWNER, 1);
    let withdrawn = balance::split(&mut vault.balance, amount);
    let coin = coin::from_balance(withdrawn, ctx);
    transfer::public_transfer(coin, OWNER);
}

// Fonction pour mettre à jour la puissance d'un héros
entry fun upgrade_hero_power(hero: &mut Hero, additional_power: u64) {
    hero.power = hero.power + additional_power;
}

// Fonction pour changer le nom d'un héros
entry fun rename_hero(hero: &mut Hero, new_name: String) {
    hero.name = new_name;
}

// Fonction pour changer l'URL de l'image
entry fun update_hero_image(hero: &mut Hero, new_image_url: String) {
    hero.image_url = new_image_url;
}

// ========= GETTER FUNCTIONS =========

public fun hero_name(hero: &Hero): String {
    hero.name
}

public fun hero_power(hero: &Hero): u64 {
    hero.power
}

public fun hero_image_url(hero: &Hero): String {
    hero.image_url
}

public fun hero_id(hero: &Hero): &UID {
    &hero.id
}

public fun vault_balance(vault: &Vault): u64 {
    balance::value(&vault.balance)
}

// ========= TEST-ONLY FUNCTIONS =========

#[test_only]
public fun create_hero_for_testing(
    name: String,
    image_url: String,
    power: u64,
    ctx: &mut tx_context::TxContext,
): Hero {
    Hero {
        id: object::new(ctx),
        name,
        image_url,
        power,
    }
}

#[test_only]
public fun create_vault_for_testing(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        balance: balance::zero<SUI>(),
    }
}
