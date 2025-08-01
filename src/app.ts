const express = require('express');
const dotenv = require('dotenv');
const { TwitchEventSubClient: TwitchClient } = require('./twitchEvents');
const app = express();
const port = 3000;
const rootDir:string = 'E:\\Coding\\Programming Projects\\twitch_alerts\\';

dotenv.config({path: rootDir + '\\src\\.env'});

// check env variables exist
let client_id: string = process.env.CLIENT_ID!;
let client_secret: string = process.env.CLIENT_SECRET!;

// express setup
app.get('/', (req: any, res: any) => {
  res.send('Hello World!')
})
app.listen(port);

// Coonnect to twitch

const twitchClient:any = new TwitchClient(
    client_id,
    client_secret,
    (event:any, subscriptionType:any) => {
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
                console.log(`${event.user_name} chatted` )
            // Add more event types as needed
        }
    }
);

twitchClient.connect();

setTimeout(async () => {
    try {
        // Subscribe to channel follows
        await twitchClient.createSubscription({
            type: 'channel.follow',
            version: '2',
            condition: {
                broadcaster_user_id: client_id,
                moderator_user_id: client_id
            }
        });
        
        // Subscribe to channel subscriptions
        await twitchClient.createSubscription({
            type: 'channel.subscribe',
            version: '1',
            condition: {
                broadcaster_user_id: client_id
            }
        });

         // Subscribe to channel chat messages
        await twitchClient.createSubscription({
            type: 'channel.chat.message',
            version: '1',
            condition: {
                broadcaster_user_id: client_id
            }
        });
        
    } catch (error) {
        console.error('Failed to create subscriptions:', error);
    }
}, 2000);