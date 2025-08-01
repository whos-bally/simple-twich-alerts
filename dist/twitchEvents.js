"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TwitchEventSubClient {
    clientId;
    accessToken;
    onNotification;
    ws = null;
    sessionId = '';
    keepaliveTimeoutSeconds = 10;
    keepaliveTimer = null;
    reconnectUrl = '';
    constructor(clientId, accessToken, onNotification) {
        this.clientId = clientId;
        this.accessToken = accessToken;
        this.onNotification = onNotification;
    }
    connect() {
        this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
        this.setupEventListeners();
    }
    setupEventListeners() {
        if (!this.ws)
            return;
        this.ws.addEventListener('open', this.onOpen.bind(this));
        this.ws.addEventListener('message', this.onMessage.bind(this));
        this.ws.addEventListener('error', this.onError.bind(this));
        this.ws.addEventListener('close', this.onClose.bind(this));
    }
    onOpen(event) {
        console.log('Connected to Twitch EventSub WebSocket');
    }
    onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        }
        catch (error) {
            console.error('Failed to parse Twitch message:', error);
        }
    }
    handleMessage(message) {
        const { message_type } = message.metadata;
        switch (message_type) {
            case 'session_welcome':
                this.handleSessionWelcome(message);
                break;
            case 'session_keepalive':
                this.handleKeepalive();
                break;
            case 'notification':
                this.handleNotification(message);
                break;
            case 'session_reconnect':
                this.handleSessionReconnect(message);
                break;
            case 'revocation':
                this.handleRevocation(message);
                break;
        }
    }
    handleSessionWelcome(message) {
        if (message.payload.session) {
            this.sessionId = message.payload.session.id;
            this.keepaliveTimeoutSeconds = message.payload.session.keepalive_timeout_seconds;
            console.log(`Session established: ${this.sessionId}`);
            // Start keepalive monitoring
            this.startKeepaliveTimer();
            // Now you can create subscriptions
            this.onSessionReady();
        }
    }
    handleKeepalive() {
        console.log('Received keepalive');
        this.resetKeepaliveTimer();
    }
    handleNotification(message) {
        if (message.payload.event && message.metadata.subscription_type) {
            console.log(`Received ${message.metadata.subscription_type} notification`);
            this.onNotification(message.payload.event, message.metadata.subscription_type);
        }
        this.resetKeepaliveTimer();
    }
    handleSessionReconnect(message) {
        if (message.payload.session?.reconnect_url) {
            console.log('Server requested reconnection');
            this.reconnectUrl = message.payload.session.reconnect_url;
            this.reconnect();
        }
    }
    handleRevocation(message) {
        console.log('Subscription revoked:', message.payload.subscription);
    }
    startKeepaliveTimer() {
        this.keepaliveTimer = setTimeout(() => {
            console.warn('Keepalive timeout - connection may be dead');
            this.reconnect();
        }, (this.keepaliveTimeoutSeconds + 1) * 1000);
    }
    resetKeepaliveTimer() {
        if (this.keepaliveTimer) {
            clearTimeout(this.keepaliveTimer);
        }
        this.startKeepaliveTimer();
    }
    reconnect() {
        console.log('Reconnecting...');
        this.close();
        // Use reconnect URL if provided, otherwise use default
        const url = this.reconnectUrl || 'wss://eventsub.wss.twitch.tv/ws';
        this.ws = new WebSocket(url);
        this.setupEventListeners();
        this.reconnectUrl = '';
    }
    onError(event) {
        console.error('WebSocket error:', event);
    }
    onClose(event) {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        if (this.keepaliveTimer) {
            clearTimeout(this.keepaliveTimer);
        }
    }
    // Called when session is ready - override this or pass callback
    onSessionReady() {
        console.log('Session ready - you can now create subscriptions');
    }
    // Create a subscription using the Twitch API
    async createSubscription(subscriptionData) {
        if (!this.sessionId) {
            throw new Error('No active session - connect first');
        }
        const subscription = {
            ...subscriptionData,
            transport: {
                method: 'websocket',
                session_id: this.sessionId
            }
        };
        try {
            const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
                method: 'POST',
                headers: {
                    'Client-Id': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
            if (!response.ok) {
                throw new Error(`Failed to create subscription: ${response.statusText}`);
            }
            const result = await response.json();
            console.log('Subscription created:', result);
        }
        catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }
    close() {
        if (this.keepaliveTimer) {
            clearTimeout(this.keepaliveTimer);
        }
        if (this.ws) {
            this.ws.close();
        }
    }
    getSessionId() {
        return this.sessionId;
    }
}
module.exports = { TwitchEventSubClient };
//# sourceMappingURL=twitchEvents.js.map