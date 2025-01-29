require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const MailParser = require('mailparser').MailParser;
const poplib = require('poplib');
const fs = require('fs');

// Получение токена Telegram и данных для подключения к Gmail из переменных окружения
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;

// Создаем экземпляр Telegram-бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Функция для получения списка писем
async function getMailList(chatId) {
    const pop = new poplib({
        host: 'pop.gmail.com',
        port: 995,
        secure: true,
        username: GMAIL_EMAIL,
        password: GMAIL_PASSWORD,
    });

    pop.connect((err) => {
        if (err) {
            console.error(err);
            bot.sendMessage(chatId, 'Ошибка при подключении к почте.');
            return;
        }

        pop.list((err, messages) => {
            if (err) {
                console.error(err);
                bot.sendMessage(chatId, 'Ошибка при получении списка писем.');
                return;
            }

            if (messages.length === 0) {
                bot.sendMessage(chatId, 'Нет новых писем.');
                pop.quit();
                return;
            }

            let messageCount = 0;
            messages.forEach((message, index) => {
                pop.retrieve(index + 1, async (err, data) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    const mailparser = new MailParser();
                    mailparser.on('headers', (headers) => {
                        const from = headers.get('from');
                        const subject = headers.get('subject');
                        messageCount++;
                        bot.sendMessage(chatId, `Письмо ${messageCount}:\nОт: ${from}\nТема: ${subject}`);
                    });

                    mailparser.on('data', (data) => {
                        if (data.type === 'text') {
                            // Вывод текста письма (можно раскомментировать для отладки)
                            // console.log(data.text);
                        }
                    });

                    mailparser.write(data);
                    mailparser.end();

                    // После обработки всех писем завершаем соединение
                    if (index === messages.length - 1) {
                        pop.quit();
                    }
                });
            });
        });
    });
}

// Функция для удаления письма по номеру
function deleteMail(pop, number, chatId) {
    pop.delete(number, (err) => {
        if (err) {
            bot.sendMessage(chatId, 'Ошибка при удалении письма.');
            console.error(err);
            return;
        }
        bot.sendMessage(chatId, 'Письмо успешно удалено.');
        pop.quit();
    });
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
        const pop = new poplib({
            host: 'pop.gmail.com',
            port: 995,
            secure: true,
            username: GMAIL_EMAIL,
            password: GMAIL_PASSWORD,
        });

        pop.connect((err) => {
            if (err) {
                console.error(err);
                bot.sendMessage(chatId, 'Ошибка при подключении к почте.');
                return;
            }

            pop.list((err, messages) => {
                if (err) {
                    console.error(err);
                    bot.sendMessage(chatId, 'Ошибка при получении списка писем.');
                    return;
                }

                if (number > messages.length || number < 1) {
                    bot.sendMessage(chatId, 'Неверный номер письма.');
                    pop.quit();
                    return;
                }

                deleteMail(pop, number, chatId);
            });
        });
    } else {
        bot.sendMessage(chatId, 'Неверный формат номера письма. Используйте /delete <номер>');
    }
});

console.log('Telegram bot started!');