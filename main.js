// main.js
const tmi = require("tmi.js");
const fs = require("fs");
const questions = require("./questions.js");

// Your Twitch bot's configuration
const config = {
  options: { debug: true },
  connection: { reconnect: true },
  identity: {
    username: "your_bot_username",
password: "your_bot_oauth_token"
},
channels: ["your_channel_name"]
};


// Create the leaderboard object
const leaderboard = {};

// Update leaderboard with the current player's score
const updateLeaderboard = (username, points) => {
  if (!leaderboard[username] || points > leaderboard[username]) {
    leaderboard[username] = points;
  }
};

// Display the leaderboard in chat
const displayLeaderboard = () => {
  const sortedLeaderboard = Object.entries(leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((entry, index) => `${index + 1}. ${entry[0]}: ${entry[1]} points`)
    .join(", ");

  client.say(config.channels[0], `Leaderboard: ${sortedLeaderboard}`);
};

// Reset the leaderboard
const resetLeaderboard = () => {
  Object.keys(leaderboard).forEach((key) => {
    delete leaderboard[key];
  });
};


// Game state and other variables
let gameState = "idle";
let currentPlayer = "";
let currentQuestion = null;
let currentAnswer = "";
let currentScore = 0;
let questionTimeout = null;
let retryTimeout = null;


// Helper functions and event handlers
const getRandomQuestion = () => {
  const index = Math.floor(Math.random() * questions.length);
  return questions[index];
};

const startFastestFinger = () => {
  gameState = "fastestFinger";
  client.say(
    config.channels[0],
    "Who Wants to Be a Millionaire: Fastest Finger Question. Be the first to answer this question correctly:"
  );

  currentQuestion = getRandomQuestion();
  currentAnswer = currentQuestion.answer;
  client.say(config.channels[0], `${currentQuestion.question} ${currentQuestion.options}`);
};

const startMainGame = (username) => {
  gameState = "mainGame";
  currentPlayer = username;
  currentScore = 0;

  client.say(config.channels[0], `Congratulations, ${username}! You're now playing the main game.`);
  askMainGameQuestion();
};

const askMainGameQuestion = () => {
  currentQuestion = getRandomQuestion();
  currentAnswer = currentQuestion.answer;

  client.say(
    config.channels[0],
    `🔹🔹🔹 Question: ${currentQuestion.question} ${currentQuestion.options}. You have 15 seconds to answer. 🔹🔹🔹`
  );

  clearTimeout(questionTimeout);
  questionTimeout = setTimeout(handleIncorrectAnswer, 15 * 1000);
};

const handleCorrectAnswer = () => {
  currentScore += 100;
  client.say(config.channels[0], `Correct! Your score is now ${currentScore}.`);

  if (currentScore === 1200) {
    endMainGame();
  } else {
    askMainGameQuestion();
  }
};

const handleIncorrectAnswer = () => {
  client.say(
    config.channels[0],
    `Sorry, that is not the correct answer. Your score is ${currentScore}. Thank you for playing Who Wants to Be a Millionaire!`
  );
  endMainGame();
};

const endMainGame = () => {
  clearTimeout(questionTimeout);
  updateLeaderboard(currentPlayer, currentScore);
  gameState = "idle";
  setTimeout(startFastestFinger, 5 * 60 * 1000);
};


// Create the Twitch client and connect
const client = new tmi.Client(config);
client.connect();

// Listen to chat messages
client.on("message", (channel, userstate, message, self) => {
  if (self) return; // Ignore messages from the bot

  const username = userstate.username;
  const command = message.trim().toLowerCase();

  // Handle commands and game logic
  if (gameState === "fastestFinger" && message.trim() === currentAnswer) {
    clearTimeout(retryTimeout);
    startMainGame(username);
  } else if (gameState === "mainGame" && username === currentPlayer) {
    if (message.trim() === currentAnswer) {
      clearTimeout(questionTimeout);
      handleCorrectAnswer();
    } else {
      clearTimeout(questionTimeout);
      handleIncorrectAnswer();
    }
  } else if (command === "$leaderboard") {
    displayLeaderboard();
  } else if (command === "$reset" && username === config.channels[0].slice(1)) {
    resetLeaderboard();
    client.say(config.channels[0], "The leaderboard has been reset.");
  }
});


setTimeout(startFastestFinger, 5 * 60 * 1000);



