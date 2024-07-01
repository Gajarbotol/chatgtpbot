const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Load environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Define the API URL and channel IDs
const API_URL = "https://chatgpt.apinepdev.workers.dev/?question=";
const CHANNEL_1 = 'gajarbotolx';
const CHANNEL_2 = 'gajarbotolxchat';

// Start command handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "Channel 1", url: `https://t.me/${CHANNEL_1}` },
        { text: "Channel 2", url: `https://t.me/${CHANNEL_2}` },
      ],
      [
        { text: "Check Joined Status", callback_data: 'check_joined' }
      ]
    ]
  };

  bot.sendMessage(chatId, 'Hi! I am your ChatGPT bot. Ask me anything.', {
    reply_markup: keyboard
  });
});

// Callback query handler
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (query.data === 'check_joined') {
    const isJoined = await checkUserJoinedStatus(userId);

    if (isJoined) {
      bot.editMessageText("Welcome! You have joined both channels.", {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    } else {
      bot.editMessageText("Please join both channels to continue.", {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: "Join Channel 1", url: `https://t.me/${CHANNEL_1}` }],
            [{ text: "Join Channel 2", url: `https://t.me/${CHANNEL_2}` }],
            [{ text: "Check Joined Status", callback_data: 'check_joined' }]
          ]
        }
      });
    }
  }
});

// Function to check if a user is a member of a channel
const checkUserMembership = async (userId, channel) => {
  try {
    const chatMember = await bot.getChatMember(`@${channel}`, userId);
    return chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator';
  } catch (error) {
    console.error(`Error checking membership for user ${userId} in channel ${channel}:`, error);
    return false;
  }
};

// Function to check user's joined status in both channels
const checkUserJoinedStatus = async (userId) => {
  const isMemberOfChannel1 = await checkUserMembership(userId, CHANNEL_1);
  const isMemberOfChannel2 = await checkUserMembership(userId, CHANNEL_2);
  return isMemberOfChannel1 && isMemberOfChannel2;
};

// Message handler
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userMessage = msg.text;

    // Check if user has joined both channels
    const isJoined = await checkUserJoinedStatus(userId);

    if (isJoined) {
      // Process the user's message if they have joined both channels
      try {
        const response = await axios.get(`${API_URL}${userMessage}`);
        const responseText = response.data.answer || 'Sorry, I could not process your request.';
        bot.sendMessage(chatId, responseText);
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, 'Sorry, an error occurred.');
      }
    } else {
      // Ask the user to join both channels if they haven't
      bot.sendMessage(chatId, "Please join both channels to continue.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Join Channel 1", url: `https://t.me/${CHANNEL_1}` }],
            [{ text: "Join Channel 2", url: `https://t.me/${CHANNEL_2}` }],
            [{ text: "Check Joined Status", callback_data: 'check_joined' }]
          ]
        }
      });
    }
  }
});
