require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const MailParser = require('mailparser').MailParser;
const Pop3 = require('node-pop3'); // Используем node-pop3

// Получение токена Telegram и данных для подключения к Gmail из переменных окружения
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;

// Создаем экземпляр Telegram-бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Функция для получения списка писем
async function getMailList(chatId) {
    // Создаем экземпляр POP3 клиента
    const client = new Pop3({
        host: 'pop.gmail.com',
        port: 995,
        tls: true, // Используем TLS для безопасного соединения
        user: GMAIL_EMAIL,
        password: GMAIL_PASSWORD,
    });

    try {
        // Подключаемся к серверу
        await client.connect();
       
        // Получаем список сообщений
        const messages = await client.list();

        if (messages.length === 0) {
            bot.sendMessage(chatId, 'Нет новых писем.');
            await client.quit();
            return;
        }

        let messageCount = 0;
        for (const messageInfo of messages) {
            // Извлекаем сообщение по номеру
            const message = await client.retr(messageInfo.number);
           
            const mailparser = new MailParser();

            mailparser.on('headers', (headers) => {
                const from = headers.get('from');
                const subject = headers.get('subject');
                messageCount++;
                bot.sendMessage(chatId, `Письмо ${messageCount}:\nОт: ${from}\nТема: ${subject}`);
            });

            mailparser.write(message.raw);
            mailparser.end();

           
        }
         await client.quit(); // Закрываем соединение
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Ошибка при получении списка писем.');
         await client.quit(); // Закрываем соединение даже при ошибке
    }
}

// Функция для удаления письма по номеру
async function deleteMail(number, chatId) {
    const client = new Pop3({
        host: 'pop.gmail.com',
        port: 995,
        tls: true,
        user: GMAIL_EMAIL,
        password: GMAIL_PASSWORD,
    });

    try {
         await client.connect();
        const messages = await client.list();

        if (number > messages.length || number < 1) {
            bot.sendMessage(chatId, 'Неверный номер письма.');
            await client.quit();
            return;
        }

        await client.dele(number);
        bot.sendMessage(chatId, 'Письмо успешно удалено.');
        await client.quit();
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Ошибка при удалении письма.');
        await client.quit();
    }
}

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я бот для управления почтой Gmail.');
});

// Обработчик команды /list
bot.onText(/\/list/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Получение списка новых писем...');
    getMailList(chatId);
});

// Обработчик команды /delete
bot.onText(/\/delete (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const number = parseInt(match[1], 10);

    if (!isNaN(number)) {
        await deleteMail(number, chatId);
    } else {
        bot.sendMessage(chatId, 'Неверный формат номера письма. Используйте /delete <номер>');
    }
});

console.log('Telegram bot started!');