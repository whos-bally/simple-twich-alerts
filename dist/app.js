"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const dotenv = require('dotenv');
const { TwitchEventSubClient: TwitchClient } = require('./twitchEvents');
const app = express();
const port = 3000;
const rootDir = 'E:\\Coding\\Programming Projects\\twitch_alerts\\';
dotenv.config({ path: rootDir + '\\src\\.env' });
// check env variables exist
let client_id = process.env.CLIENT_ID;
let client_secret = process.env.CLIENT_SECRET;
// express setup
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(port);
// Coonnect to twitch
const twitchClient = new TwitchClient(client_id, client_secret, (event, subscriptionType) => {
    console.log(`Received ${subscriptionType}:`, event);
    // Handle different event types
    switch (subscriptionType) {
        case 'channel.follow':
            console.log(`${event.user_name} followed!`);
            break;
        case 'channel.subscribe':
            console.log(`${event.user_name} subscribed!`);
            break;
        case 'channel.chat.message':
            console.log(`${event.user_name} chatted`);
        // Add more event types as needed
    }
});
twitchClient.connect();
//# sourceMappingURL=app.js.map