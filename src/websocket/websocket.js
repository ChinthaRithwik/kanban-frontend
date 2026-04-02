import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export let stompClient = null;

// Track active subscriptions at the module level so we can unsubscribe before
// re-subscribing on reconnect — prevents accumulating N+1 handlers per topic
// across multiple connectWebSocket calls (e.g. React StrictMode double mount).
let subscriptions = [];

export const connectWebSocket = (boardId, {
  onEvent,
  onActivity,
  onPresence,
  onConnect,
  onDisconnect,
}) => {
  if (stompClient) {
    stompClient.deactivate();
  }

  const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws-kanban`);
  const token  = sessionStorage.getItem('token');

  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders:   { Authorization: `Bearer ${token}` },
    reconnectDelay:   5000,
    debug:            () => {},
  });

  stompClient.onConnect = () => {
    // Clean up any subscriptions from a previous connect/reconnect cycle
    subscriptions.forEach(sub => {
      try { sub.unsubscribe(); } catch { /* already gone */ }
    });
    subscriptions = [];

    subscriptions.push(
      stompClient.subscribe(`/topic/board/${boardId}`, (message) => {
        if (!message.body) return;
        try {
          const event = JSON.parse(message.body);
          onEvent?.(event);
        } catch { /* ignore malformed */ }
      })
    );

    subscriptions.push(
      stompClient.subscribe(`/topic/board/${boardId}/activity`, (msg) => {
        if (!msg.body) return;
        try {
          const event = JSON.parse(msg.body);
          onActivity?.(event);
        } catch { /* ignore malformed */ }
      })
    );

    subscriptions.push(
      stompClient.subscribe(`/topic/board/${boardId}/presence`, (msg) => {
        if (!msg.body) return;
        try {
          const users = JSON.parse(msg.body);
          onPresence?.(users);
        } catch { /* ignore malformed */ }
      })
    );

    onConnect?.();
  };

  stompClient.onStompError   = () => {};
  stompClient.onDisconnect   = () => { onDisconnect?.(); };
  stompClient.onWebSocketClose = () => { onDisconnect?.(); };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    subscriptions.forEach(sub => {
      try { sub.unsubscribe(); } catch { /* ignore */ }
    });
    subscriptions = [];
    stompClient.deactivate();
    stompClient = null;
  }
};