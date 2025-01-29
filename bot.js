 TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Загрузка переменных окружения
 TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Проверка наличия обязательных переменных окружения
if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
    console.error('Ошибка: Не указаны обязательные переменные окружения. Убедитесь, что TELEGRAM_BOT_TOKEN и GEMINI_API_KEY указаны в файле .env.');
    process.exit(1); // Завершаем выполнение скрипта
}

// Создаем экземпляр бота
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });


// Функция для взаимодействия с Google Gemini API
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
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Ошибка при запросе к Gemini API:', error.response?.data || error.message);
        return 'Извините, произошла ошибка при обработке вашего запроса.';
    }
}


// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я ваш бот с Google Gemini. Напишите мне что-нибудь, и я постараюсь ответить.');
});


// Обработка текстовых сообщений

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // Игнорируем команду /start и пустые сообщения

    if (userMessage === '/start' || !userMessage.trim()) return;

    // Получаем ответ от Google Gemini
    const geminiResponse = await getGeminiResponse(userMessage);

    // Отправляем ответ пользователю
    bot.sendMessage(chatId, `Gemini ответ:\n${geminiResponse}`);
});

// Запуск бота
console.log('Бот запущен...');
