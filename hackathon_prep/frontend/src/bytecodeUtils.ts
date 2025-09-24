import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Функция для чтения скомпилированного байткода
export function getCompiledBytecode() {
    try {
        // Путь к скомпилированному модулю
        const bytecodePath = join(__dirname, '../build/hackathon_prep/bytecode_modules/basic_nft.mv');

        // Читаем файл как буфер
        const bytecode = readFileSync(bytecodePath);

        // Конвертируем в массив чисел для передачи в браузер
        return Array.from(bytecode);

    } catch (error) {
        console.error('❌ Ошибка чтения байткода:', error);
        throw new Error(`Сначала выполните: sui move build`);
    }
}

// Функция для получения зависимостей (если нужны)
export function getDependencies() {
    // Для базового контракта зависимости обычно не нужны
    // Sui framework подключается автоматически
    return [];
}

// Экспорт для использования в браузере
if (typeof window !== 'undefined') {
    // Код для браузера
    (window as any).getBytecodeForDeploy = async () => {
        // В браузере байткод должен быть предварительно загружен
        // Например, через API endpoint или встроен в бандл
        throw new Error('Байткод должен быть получен с сервера или встроен в сборку');
    };
}

console.log('✅ Утилита для работы с байткодом готова');
