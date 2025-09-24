# 🚀 Подключение существующего кошелька к проекту хакатона

## ✅ Завершенная настройка

Ваш существующий кошелек успешно подключен к проекту! 

**Адрес кошелька:** `0x65a43d0738e914421957f18588ed50c7cca775ee240848854a0ca446843ccafa`

## 📋 Что было настроено

### 1. Sui CLI
- ✅ Sui CLI установлен и настроен
- ✅ PATH настроен для доступа к `~/.cargo/bin`
- ✅ Кошелек экспортирован и готов к использованию

### 2. Файлы проекта
- **`wallet-config.ts`** - класс для управления кошельком
- **`nft-manager.ts`** - менеджер для работы с вашими NFT
- **`export-private-key.js`** - скрипт для экспорта приватного ключа
- **`.env.example`** - пример переменных окружения
- **`.gitignore`** - исключает приватные данные из git

## 🔧 Следующие шаги

### 1. Получите тестовые SUI токены
Ваш кошелек пуст. Получите токены здесь:
```
https://faucet.sui.io/?address=0x65a43d0738e914421957f18588ed50c7cca775ee240848854a0ca446843ccafa
```

### 2. Разверните ваш NFT модуль
```bash
cd /Users/bergman/PycharmProjects/sui-move-community-modules/hackathon_prep
sui client publish --gas-budget 20000000
```

### 3. Обновите PACKAGE_ID
После деплоя обновите `PACKAGE_ID` в:
- `nft-manager.ts` 
- `.env.example` → `.env`

### 4. Тестируйте ваши NFT
```bash
# Установите dotenv для работы с .env файлом
npm install dotenv

# Запустите пример
node -r dotenv/config nft-manager.js
```

## 💻 Использование в коде

```typescript
import { nftManager } from './nft-manager';

// Создать NFT
await nftManager.mintGameNFT({
    name: 'My Hero',
    description: 'Legendary character',
    imageUrl: 'https://example.com/hero.png',
    level: 1,
    power: 100,
    rarity: 4 // 1=Common, 2=Rare, 3=Epic, 4=Legendary
});

// Посмотреть ваши NFT
const myNFTs = await nftManager.getMyNFTs();
console.log('My NFTs:', myNFTs);
```

## 🔒 Безопасность

- ✅ Приватный ключ не коммитится в git
- ✅ Используйте `.env` файл для хранения секретов  
- ⚠️ **НИКОГДА** не делитесь приватным ключом!

## 🛠 Команды для разработки

```bash
# Проверить баланс
sui client balance

# Посмотреть адреса
sui client addresses

# Проверить подключение к сети
sui client envs

# Получить объекты кошелька
sui client objects

# Деплой модуля
sui client publish --gas-budget 20000000

# Вызов функции (пример)
sui client call \
  --package <PACKAGE_ID> \
  --module basic_nft \
  --function mint_game_nft \
  --args "Hero Name" "Hero Description" "https://image.url" 1 100 4 \
  --gas-budget 5000000
```

## 🎯 Готово к хакатону!

Ваш кошелек подключен и готов для:
- ✅ Создания GameNFT
- ✅ Прокачки NFT (level up)  
- ✅ Передачи NFT другим игрокам
- ✅ Управления коллекцией через TypeScript

Удачи на хакатоне! 🚀
