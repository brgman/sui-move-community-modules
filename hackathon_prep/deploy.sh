#!/bin/bash

# 🚀 Скрипт для быстрого развертывания проектов Sui на хакатоне

echo "🔧 Подготовка к хакатону Sui..."

# Проверка установки Sui CLI
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI не установлен. Дождитесь завершения установки через Cargo."
    exit 1
fi

echo "✅ Sui CLI найден"

# Создание кошелька (если не существует)
if [ ! -f ~/.sui/sui_config/client.yaml ]; then
    echo "🔑 Создание нового кошелька..."
    sui client new-address ed25519
else
    echo "✅ Кошелек уже существует"
fi

# Переключение на devnet
echo "🌐 Подключение к devnet..."
sui client switch --env devnet

# Получение тестовых монет
echo "💰 Запрос тестовых SUI..."
sui client faucet

# Сборка проекта
echo "🔨 Сборка Move проекта..."
sui move build

if [ $? -eq 0 ]; then
    echo "✅ Проект собран успешно!"
    
    # Публикация контрактов
    echo "📦 Публикация контрактов на devnet..."
    PUBLISH_OUTPUT=$(sui client publish --gas-budget 100000000 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ Контракты опубликованы!"
        echo "$PUBLISH_OUTPUT"
        
        # Извлекаем Package ID
        PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | grep "│ Package ID" | awk '{print $4}')
        echo "📋 Package ID: $PACKAGE_ID"
        
        # Сохраняем Package ID в файл
        echo "PACKAGE_ID=$PACKAGE_ID" > .env
        echo "✅ Package ID сохранен в .env файл"
        
    else
        echo "❌ Ошибка при публикации контрактов"
        echo "$PUBLISH_OUTPUT"
        exit 1
    fi
else
    echo "❌ Ошибка при сборке проекта"
    exit 1
fi

echo ""
echo "🎉 Проект готов к разработке!"
echo "📋 Package ID: $PACKAGE_ID"
echo "🌐 Network: devnet"
echo "💼 Ваш адрес: $(sui client active-address)"
echo ""
echo "📚 Полезные команды:"
echo "  sui client objects             # Посмотреть ваши объекты"
echo "  sui client gas                 # Проверить баланс"
echo "  sui move build                 # Собрать проект"
echo "  sui move test                  # Запустить тесты"
echo "  sui explorer                   # Открыть explorer"
