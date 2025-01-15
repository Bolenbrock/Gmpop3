const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Установите ваш токен Telegram-бота и API-ключ Google Gemini из .env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8164082658:AAHUrdDL5PRTBF5Xb5UPtg5CHh8AseDsR_U'; // Замените на ваш токен
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB9hd88hfKcIEAFgmKPuzQNnD1icrjfb9k'; // Замените на ваш ключ

// Проверка наличия API-ключа Telegram-бота
if (!TELEGRAM_BOT_TOKEN) {
    console.error('Ошибка: Не указан токен Telegram-бота. Убедитесь, что он указан в файле .env или в коде.');
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

        // Проверяем, что ответ содержит данные и структуру, которую мы ожидаем
        if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0]) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            console.error('Ошибка: Неожиданный формат ответа от Gemini API:', response.data);
            return 'Извините, произошла ошибка при обработке вашего запроса.';
        }
    } catch (error) {
        console.error('
