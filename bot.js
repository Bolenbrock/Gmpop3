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
    console.log(`getMailList: start, chatId: ${chatId}`);
      console.log(`getMailList: using email: ${GMAIL_EMAIL}, chatId: ${chatId}`);
    // Создаем экземпляр POP3 клиента
    const client = new Pop3({
        host: 'pop.gmail.com',
        port: 995,
        tls: true, // Используем TLS для безопасного соединения
        user: GMAIL_EMAIL,
        password: GMAIL_PASSWORD,
        timeout: 10000, // устанавливаем таймаут 10 секунд
    });
    console.log(`getMailList: pop3 client created, chatId: ${chatId}`);

    try {
        // Подключаемся к серверу
        console.log(`getMailList: connecting to pop3 server, chatId: ${chatId}`);
        await new Promise((resolve, reject) => {
            client.connect(function (err) {
                if(err) {
                     console.error(`getMailList: error connecting to pop3 server, chatId: ${chatId}, error: ${err}`);
                    reject(err)
                }
                console.log(`getMailList: connected to pop3 server, chatId: ${chatId}`);
                resolve()
            })
        });

       
        // Получаем список сообщений
          console.log(`getMailList: fetching list of messages, chatId: ${chatId}`);
        const messages = await new Promise((resolve, reject) => {
            client.list(function (err, list) {
                if (err) {
                    console.error(`getMailList: error fetching list of messages, chatId: ${chatId}, error: ${err}`);
                    reject(err);
                }
                console.log(`getMailList: successfully fetched list of messages, chatId: ${chatId}, message count: ${list.length}`);
                resolve(list);
            });
        });

        if (messages.length === 0) {
            bot.sendMessage(chatId, 'Нет новых писем.');
            console.log(`getMailList: no new messages found, chatId: ${chatId}`);
              await new Promise((resolve, reject) => {
               client.quit(function(err) {
                   if(err){
                         console.error(`getMailList: error while quitting from pop3 server, chatId: ${chatId}, error: ${err}`);
                       reject(err)
                   }
                    console.log(`getMailList: successfully quit from pop3 server, chatId: ${chatId}`);
                   resolve()
               })
           });
            return;
        }

        let messageCount = 0;
        for (const messageInfo of messages) {
             console.log(`getMailList: processing message, message number: ${messageInfo.number}, chatId: ${chatId}`);
            // Извлекаем сообщение по номеру
            const message = await new Promise((resolve, reject) => {
                client.retr(messageInfo.number, function (err, data) {
                    if (err){
                        console.error(`getMailList: error while retrieving message, message number: ${messageInfo.number}, chatId: ${chatId}, error: ${err}`);
                        reject(err)
                    }
                    console.log(`getMailList: successfully retrieved message, message number: ${messageInfo.number}, chatId: ${chatId}`);
                    resolve(data)
                })
            });
           
            const mailparser = new MailParser();

            mailparser.on('headers', (headers) => {
                const from = headers.get('from');
                const subject = headers.get('subject');
                messageCount++;
                bot.sendMessage(chatId, `Письмо ${messageCount}:\nОт: ${from}\nТема: ${subject}`);
                 console.log(`getMailList: send message to bot, message number: ${messageInfo.number}, chatId: ${chatId}, from: ${from}, subject: ${subject}`);
            });
              console.log(`getMailList: mailparser write, message number: ${messageInfo.number}, chatId: ${chatId}`);
            mailparser.write(message.raw);
            mailparser.end();
             console.log(`getMailList: mailparser end, message number: ${messageInfo.number}, chatId: ${chatId}`);
           
        }
          console.log(`getMailList: quitting from pop3 server, chatId: ${chatId}`);
         await new Promise((resolve, reject) => {
             client.quit(function(err) {
                 if(err){
                       console.error(`getMailList: error while quitting from pop3 server, chatId: ${chatId}, error: ${err}`);
                     reject(err)
                 }
                 console.log(`getMailList: successfully quit from pop3 server, chatId: ${chatId}`);
                 resolve()
             })
         });
    } catch (err) {
        console.error(`getMailList: catch error, chatId: ${chatId}, error: ${err}`);
        bot.sendMessage(chatId, 'Ошибка при получении списка писем.');
         await new Promise((resolve, reject) => {
             client.quit(function(err) {
                 if(err){
                       console.error(`getMailList: error while quitting from pop3 server, chatId: ${chatId}, error: ${err}`);
                     reject(err)
                 }
                 console.log(`getMailList: successfully quit from pop3 server, chatId: ${chatId}`);
                 resolve()
             })
         });
    }
    console.log(`getMailList: end, chatId: ${chatId}`);
}

// Функция для удаления письма по номеру
async function deleteMail(number, chatId) {
     console.log(`deleteMail: start, chatId: ${chatId}, number: ${number}`);
      console.log(`deleteMail: using email: ${GMAIL_EMAIL}, chatId: ${chatId}, number: ${number}`);
    const client = new Pop3({
        host: 'pop.gmail.com',
        port: 995,
        tls: true,
        user: GMAIL_EMAIL,
        password: GMAIL_PASSWORD,
         timeout: 10000, // устанавливаем таймаут 10 секунд
    });
     console.log(`deleteMail: pop3 client created, chatId: ${chatId}, number: ${number}`);
    try {
         console.log(`deleteMail: connecting to pop3 server, chatId: ${chatId}, number: ${number}`);
         await new Promise((resolve, reject) => {
             client.connect(function (err) {
                 if(err){
                      console.error(`deleteMail: error connecting to pop3 server, chatId: ${chatId}, number: ${number}, error: ${err}`);
                     reject(err)
                 }
                console.log(`deleteMail: successfully connected to pop3 server, chatId: ${chatId}, number: ${number}`);
                 resolve()
             })
         });
         console.log(`deleteMail: fetching list of messages, chatId: ${chatId}, number: ${number}`);
        const messages =  await new Promise((resolve, reject) => {
            client.list(function (err, list) {
                 if (err) {
                    console.error(`deleteMail: error fetching list of messages, chatId: ${chatId}, number: ${number}, error: ${err}`);
                    reject(err);
                }
                console.log(`deleteMail: successfully fetched list of messages, chatId: ${chatId}, number: ${number}, message count: ${list.length}`);
                resolve(list);
            })
        });

        if (number > messages.length || number < 1) {
             console.log(`deleteMail: incorrect message number, chatId: ${chatId}, number: ${number}`);
            bot.sendMessage(chatId, 'Неверный номер письма.');
             await new Promise((resolve, reject) => {
                 client.quit(function(err) {
                      if(err){
                            console.error(`deleteMail: error while quitting from pop3 server, chatId: ${chatId}, number: ${number}, error: ${err}`);
                         reject(err)
                     }
                     console.log(`deleteMail: successfully quit from pop3 server, chatId: ${chatId}, number: ${number}`);
                     resolve()
                 })
             });
            return;
        }

         console.log(`deleteMail: deleting message number: ${number}, chatId: ${chatId}`);
         await new Promise((resolve, reject) => {
            client.dele(number, function(err) {
                  if(err){
                         console.error(`deleteMail: error deleting message, message number: ${number}, chatId: ${chatId}, error: ${err}`);
                     reject(err)
                 }
                  console.log(`deleteMail: successfully deleted message, message number: ${number}, chatId: ${chatId}`);
                resolve()
            })
        });
        bot.sendMessage(chatId, 'Письмо успешно удалено.');
         console.log(`deleteMail: quitting from pop3 server, chatId: ${chatId}, number: ${number}`);
        await new Promise((resolve, reject) => {
            client.quit(function(err) {
                 if(err){
                       console.error(`deleteMail: error while quitting from pop3 server, chatId: ${chatId}, number: ${number}, error: ${err}`);
                     reject(err)
                 }
                   console.log(`deleteMail: successfully quit from pop3 server, chatId: ${chatId}, number: ${number}`);
                resolve()
            })
        });
    } catch (err) {
        console.error(`deleteMail: catch error, chatId: ${chatId}, number: ${number}, error: ${err}`);
        bot.sendMessage(chatId, 'Ошибка при удалении письма.');
         await new Promise((resolve, reject) => {
            client.quit(function(err) {
                if(err){
                     console.error(`deleteMail: error while quitting from pop3 server, chatId: ${chatId}, number: ${number}, error: ${err}`);
                    reject(err)
                }
                  console.log(`deleteMail: successfully quit from pop3 server, chatId: ${chatId}, number: ${number}`);
                resolve()
            })
        });
    }
     console.log(`deleteMail: end, chatId: ${chatId}, number: ${number}`);
}

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я бот для управления почтой Gmail.');
     console.log(`bot: /start, chatId: ${chatId}`);
});

// Обработчик команды /list
bot.onText(/\/list/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Получение списка новых писем...');
    getMailList(chatId);
      console.log(`bot: /list, chatId: ${chatId}`);
});

// Обработчик команды /delete
bot.onText(/\/delete (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const number = parseInt(match[1], 10);

    if (!isNaN(number)) {
        await deleteMail(number, chatId);
    } else {
        bot.sendMessage(chatId, 'Неверный формат номера письма. Используйте /delete <номер>');
         console.log(`bot: /delete incorrect format, chatId: ${chatId}, number: ${number}`);
    }
    console.log(`bot: /delete, chatId: ${chatId}, number: ${number}`);
});

console.log('Telegram bot started!');
