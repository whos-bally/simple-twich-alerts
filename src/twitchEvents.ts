
interface TwitchEventSubMessage {
    metadata: {
        message_id: string;
        message_type: 'session_welcome' | 'session_keepalive' | 'notification' | 'session_reconnect' | 'revocation';
        message_timestamp: string;
        subscription_type?: string;
        subscription_version?: string;
    };
    payload: {
        session?: {
            id: string;
            status: string;
            connected_at: string;
            keepalive_timeout_seconds: number;
            reconnect_url?: string;
        };
        subscription?: {
            id: string;
            status: string;
            type: string;
            version: string;
            condition: any;
            transport: {
                method: string;
                session_id: string;
            };
            created_at: string;
        };
        event?: any; // The actual event data varies by subscription type
    };
}

interface TwitchSubscriptionRequest {
    type: string;
    version: string;
    condition: any;
    transport: {
        method: 'websocket';
        session_id: string;
    };
}

class TwitchEventSubClient {
    private ws: WebSocket | null = null;
    private sessionId: string = '';
    private keepaliveTimeoutSeconds: number = 10;
    private keepaliveTimer: NodeJS.Timeout | null = null;
    private reconnectUrl: string = '';
    
    constructor(
        private clientId: string,
        private accessToken: string,
        private onNotification: (event: any, subscriptionType: string) => void
    ) {}
    
    public connect(): void {
        this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        if (!this.ws) return;
        
        this.ws.addEventListener('open', this.onOpen.bind(this));
        this.ws.addEventListener('message', this.onMessage.bind(this));
        this.ws.addEventListener('error', this.onError.bind(this));
        this.ws.addEventListener('close', this.onClose.bind(this));
    }
    
    private onOpen(event: Event): void {
        console.log('Connected to Twitch EventSub WebSocket');
    }
    
    private onMessage(event: MessageEvent): void {
        try {
            const message: TwitchEventSubMessage = JSON.parse(event.data);
            this.handleMessage(message);
        } catch (error) {
            console.error('Failed to parse Twitch message:', error);
        }
    }
    
    private handleMessage(message: TwitchEventSubMessage): void {
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
    
    private handleSessionWelcome(message: TwitchEventSubMessage): void {
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
    
    private handleKeepalive(): void {
        console.log('Received keepalive');
        this.resetKeepaliveTimer();
    }
    
    private handleNotification(message: TwitchEventSubMessage): void {
        if (message.payload.event && message.metadata.subscription_type) {
            console.log(`Received ${message.metadata.subscription_type} notification`);
            this.onNotification(message.payload.event, message.metadata.subscription_type);
        }
        this.resetKeepaliveTimer();
    }
    
    private handleSessionReconnect(message: TwitchEventSubMessage): void {
        if (message.payload.session?.reconnect_url) {
            console.log('Server requested reconnection');
            this.reconnectUrl = message.payload.session.reconnect_url;
            this.reconnect();
        }
    }
    
    private handleRevocation(message: TwitchEventSubMessage): void {
        console.log('Subscription revoked:', message.payload.subscription);
    }
    
    private startKeepaliveTimer(): void {
        this.keepaliveTimer = setTimeout(() => {
            console.warn('Keepalive timeout - connection may be dead');
            this.reconnect();
        }, (this.keepaliveTimeoutSeconds + 1) * 1000);
    }
    
    private resetKeepaliveTimer(): void {
        if (this.keepaliveTimer) {
            clearTimeout(this.keepaliveTimer);
        }
        this.startKeepaliveTimer();
    }
    
    private reconnect(): void {
        console.log('Reconnecting...');
        this.close();
        
        // Use reconnect URL if provided, otherwise use default
        const url = this.reconnectUrl || 'wss://eventsub.wss.twitch.tv/ws';
        this.ws = new WebSocket(url);
        this.setupEventListeners();
        this.reconnectUrl = '';
    }
    
    private onError(event: Event): void {
        console.error('WebSocket error:', event);
    }
    
    private onClose(event: CloseEvent): void {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        if (this.keepaliveTimer) {
            clearTimeout(this.keepaliveTimer);
        }
    }
    
    // Called when session is ready - override this or pass callback
    protected onSessionReady(): void {
        console.log('Session ready - you can now create subscriptions');
    }
    
    // Create a subscription using the Twitch API
    public async createSubscription(subscriptionData: Omit<TwitchSubscriptionRequest, 'transport'>): Promise<void> {
        if (!this.sessionId) {
            throw new Error('No active session - connect first');
        }
        
        const subscription: TwitchSubscriptionRequest = {
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
            
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }
    
    public close(): void {
        if (this.keepaliveTimer) {
            clearTimeout(this.keepaliveTimer);
        }
        if (this.ws) {
            this.ws.close();
        }
    }
    
    public getSessionId(): string {
        return this.sessionId;
    }
}
module.exports = { TwitchEventSubClient };
