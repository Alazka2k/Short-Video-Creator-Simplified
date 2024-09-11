const WebSocket = require('ws');
const config = require('../src/utils/config');

const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json');

ws.on('open', function open() {
  console.log('Connected to Discord WebSocket');
  ws.close();
});

ws.on('error', function error(err) {
  console.error('WebSocket Error:', err);
});

ws.on('close', function close() {
  console.log('Disconnected from Discord WebSocket');
});