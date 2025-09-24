# 🚀 Подготовка к хакатону Sui

## ✅ Установка и настройка

### 1. Установка Sui CLI
```bash
# Установка через Cargo (в процессе...)
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui

# Проверка версии
sui --version

# Создание кошелька
sui client new-address ed25519

# Подключение к devnet
sui client switch --env devnet
```

### 2. Получение тестовых монет
```bash
# Получить SUI в testnet
sui client faucet
```

## 📚 Ключевые концепции Sui

### Object Model
- **Owned objects** - принадлежат конкретному адресу
- **Shared objects** - доступны всем для изменения  
- **Immutable objects** - неизменяемые после создания

### Abilities
- `key` - объект может быть владельцем других объектов
- `store` - объект может храниться внутри других объектов
- `copy` - объект может быть скопирован
- `drop` - объект может быть уничтожен

### Entry Functions
```move
public entry fun create_item(name: String, ctx: &mut TxContext) {
    // Функция, которую можно вызвать напрямую из транзакции
}
```

## 🛠️ Шаблоны проектов

### Базовый NFT модуль
```move
module my_package::nft {
    use sui::object::{Self, UID};
    use std::string::String;

    public struct MyNFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: String,
    }

    public entry fun mint_nft(
        name: String,
        description: String, 
        url: String,
        ctx: &mut TxContext
    ) {
        let nft = MyNFT {
            id: object::new(ctx),
            name,
            description,
            url,
        };
        
        transfer::public_transfer(nft, tx_context::sender(ctx));
    }
}
```

### Базовый токен модуль
```move
module my_package::coin {
    use sui::coin::{Self, TreasuryCap};
    use sui::url;

    public struct COIN has drop {}

    fun init(witness: COIN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness, 
            6, // decimals
            b"SYMBOL",
            b"My Coin",
            b"Description",
            option::some(url::new_unsafe_from_bytes(b"https://image-url.com")),
            ctx
        );

        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx));
    }
}
```

## 🌐 Frontend интеграция

### TypeScript SDK
```bash
npm install @mysten/sui.js
```

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('devnet') });

// Вызов move функции
const txb = new TransactionBlock();
txb.moveCall({
    target: `${PACKAGE_ID}::module::function`,
    arguments: [/* arguments */],
});
```

## 📖 Полезные ресурсы

- [Sui Documentation](https://docs.sui.io/)
- [Move Book](https://move-language.github.io/move/)
- [Sui Examples](https://github.com/MystenLabs/sui/tree/main/examples)
- [Sui by Example](https://examples.sui.io/)
- [Sui SDK Docs](https://sdk.mystenlabs.com/)

## 🎯 Идеи для хакатона

### Beginner уровень
- NFT коллекция с уникальными атрибутами
- Простая игра с NFT персонажами
- Voting система на блокчейне
- Decentralized marketplace

### Advanced уровень  
- DeFi протокол (lending/borrowing)
- Gaming ecosystem с экономикой
- Social tokens платформа  
- Cross-chain bridge
- DAOs с комплексным governance

## 🏆 Советы для хакатона

1. **Начните просто** - сделайте MVP, потом добавляйте функции
2. **Используйте готовые решения** - Sui Examples, OpenZeppelin
3. **Фокус на UX** - простой и понятный интерфейс
4. **Тестируйте часто** - на devnet/testnet  
5. **Документируйте код** - жюри должно понимать проект
6. **Демо важно** - подготовьте хорошую презентацию

## ⚡ Быстрый старт чеклист

- [ ] Sui CLI установлен и работает
- [ ] Кошелек создан, devnet подключен
- [ ] Тестовые SUI получены
- [ ] Первый контракт написан и развернут
- [ ] Frontend подключен к блокчейну
- [ ] Все инструменты готовы
