const TelegramBot = require('node-telegram-bot-api');

// Замените на ваш токен
const token = '8164082658:AAHUrdDL5PRTBF5Xb5UPtg5CHh8AseDsR_U';

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [['Команда 1', 'Команда 2'], ['/help']],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
  bot.sendMessage(chatId, 'Выберите действие:', options);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpText = `
  Вот список доступных команд:
  /start - Начать работу с ботом
  /help - Получить справку
  `;
  bot.sendMessage(chatId, helpText);
});

// Обработчик текстовых сообщений и нажатий на кнопки
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === 'Команда 1') {
    bot.sendMessage(chatId, 'Вы выбрали Команду 1');
  } else if (text === 'Команда 2') {
    bot.sendMessage(chatId, 'Вы выбрали Команду 2');
  } else if (text !== '/start' && text !== '/help') {
    bot.sendMessage(chatId, `Вы сказали: ${text}`);
  }
});