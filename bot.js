require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const MailParser = require('mailparser').MailParser;
const Pop3 = require('pop3');

// Получение токена Telegram и данных для подключения к Gmail из переменных окружения
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;

// Создаем экземпляр Telegram-бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Функция для получения списка писем
async function getMailList(chatId) {
    const pop3Client = new Pop3({
        host: 'pop.gmail.com',
        port: 995,
        ssl: true,
        tls: true,
        username: GMAIL_EMAIL,
        password: GMAIL_PASSWORD,
    });

    try {
        await pop3Client.connect();
        const messages = await pop3Client.list();

        if (messages.length === 0) {
            bot.sendMessage(chatId, 'Нет новых писем.');
            await pop3Client.quit();
            return;
        }

        let messageCount = 0;
        for (let i = 0; i < messages.length; i++) {
            const message = await pop3Client.retrieve(messages[i].number);
            const mailparser = new MailParser();

            mailparser.on('headers', (headers) => {
                const from = headers.get('from');
                const subject = headers.get('subject');
                messageCount++;
                bot.sendMessage(chatId, `Письмо ${messageCount}:\nОт: ${from}\nТема: ${subject}`);
            });

            mailparser.write(message.raw);
            mailparser.end();

            // После обработки всех писем завершаем соединение
            if (i === messages.length - 1) {
                await pop3Client.quit();
            }
        }
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Ошибка при получении списка писем.');
        await pop3Client.quit();
    }
}

// Функция для удаления письма по номеру
async function deleteMail(number, chatId) {
    const pop3Client = new Pop3({
        host: 'pop.gmail.com',
        port: 995,
        ssl: true,
        tls: true,
        username: GMAIL_EMAIL,
        password: GMAIL_PASSWORD,
    });

    try {
        await pop3Client.connect();
        const messages = await pop3Client.list();

        if (number > messages.length || number < 1) {
            bot.sendMessage(chatId, 'Неверный номер письма.');
            await pop3Client.quit();
            return;
        }

        await pop3Client.deleteMessage(number);
        bot.sendMessage(chatId, 'Письмо успешно удалено.');
        await pop3Client.quit();
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Ошибка при удалении письма.');
        await pop3Client.quit();
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