#!/bin/bash

# Скрипт для деплоя контракта и автоматического обновления frontend

set -e

echo "🚀 Начинаем деплой basic_nft контракта..."

# Переходим в директорию hackathon_prep
cd "$(dirname "$0")"

echo "📁 Рабочая директория: $(pwd)"

# 1. Собираем контракт
echo "🔨 Компилируем Move контракт..."
sui move build

# 2. Публикуем контракт
echo "📦 Публикуем контракт в Sui testnet..."
DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 --json)

# 3. Извлекаем Package ID
PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')

if [ "$PACKAGE_ID" = "null" ] || [ -z "$PACKAGE_ID" ]; then
    echo "❌ Не удалось получить Package ID из результата деплоя"
    echo "Результат деплоя:"
    echo "$DEPLOY_OUTPUT" | jq '.'
    exit 1
fi

echo "✅ Контракт успешно задеплоен!"
echo "📋 Package ID: $PACKAGE_ID"

# 4. Обновляем байткод в frontend
echo "🔄 Обновляем байткод для браузерного деплоя..."
mkdir -p frontend/public/bytecode
cp build/hackathon_prep/bytecode_modules/basic_nft.mv frontend/public/bytecode/

# 5. Создаем файл конфигурации для frontend
echo "📝 Создаем конфигурацию для frontend..."
cat > frontend/src/contract-config.json << EOF
{
    "packageId": "$PACKAGE_ID",
    "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "network": "testnet",
    "deployer": "$(sui client active-address)"
}
EOF

echo ""
echo "🎉 Деплой завершен успешно!"
echo ""
echo "📋 Package ID: $PACKAGE_ID"
echo "🌐 Sui Explorer: https://suiscan.xyz/testnet/object/$PACKAGE_ID"
echo ""
echo "💡 Теперь вы можете:"
echo "   1. Скопировать Package ID: $PACKAGE_ID"
echo "   2. Вставить его в интерфейс по адресу http://localhost:3002/"
echo "   3. Создавать NFT с помощью подключенного кошелька"
echo ""
