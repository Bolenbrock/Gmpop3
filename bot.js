const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Загрузка переменных окружения
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Проверка наличия обязательных переменных окружения
if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
    console.error('Ошибка: Не указаны обязательные переменные окружения. Убедитесь, что TELEGRAM_BOT_TOKEN и GEMINI_API_KEY указаны в файле .env.');
    process.exit(1); // Завершаем выполнение скрипта
}

// Создаем экземпляр бота
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

/**
 * Функция для взаимодействия с Google Gemini API.
 * @param {string} userMessage - Сообщение пользователя.
 * @returns {Promise<string>} - Ответ от Gemini API или сообщение об ошибке.
 */
async function getGeminiResponse(userMessage) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: userMessage }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        // Проверяем структуру ответа с использованием опциональной цепочки
        const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
            return responseText;
        } else {
            console.error('Ошибка: Неожиданный формат ответа от Gemini API:', response.data);
            return 'Извините, произошла ошибка при обработке вашего запроса.';
        }
    } catch (error) {
        console.error('Ошибка при запросе к Gemini API:', error.response?.data || error.message);
        return 'Извините, произошла ошибка при обработке вашего запроса.';
    }
}

/**
 * Обработка команды /start.
 */
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я ваш бот с Google Gemini. Напишите мне что-нибудь, и я постараюсь ответить.');
});

/**
 * Обработка текстовых сообщений.
 */
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // Игнорируем команду /start и пустые сообщения
    if (userMessage === '/start' || !userMessage?.trim()) {
        return;
    }

    try {
        // Получаем ответ от Google Gemini
        const geminiResponse = await getGeminiResponse(userMessage);

        // Отправляем ответ пользователю
        await bot.sendMessage(chatId, `Gemini ответ:\n${geminiResponse}`);
    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
    }
});

// Запуск бота
console.log('Бот запущен...');
