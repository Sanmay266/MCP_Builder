import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

interface WebSocketMessage {
    type: string;
    code?: string;
    timestamp?: number;
    [key: string]: any;
}

export function useWebSocket(projectId: number) {
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        function connect() {
            if (ws.current?.readyState === WebSocket.OPEN) return;

            const socket = new WebSocket(`${WS_BASE_URL}/ws/${projectId}`);
            ws.current = socket;

            socket.onopen = () => {
                console.log('WebSocket Connected');
                setIsConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setLastMessage(message);
                } catch (e) {
                    console.error('WebSocket parsing error', e);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
                // Attempt to reconnect in 3 seconds
                reconnectTimeout.current = setTimeout(connect, 3000);
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error', error);
                socket.close();
            };
        }

        if (projectId) {
            connect();
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [projectId]);

    const sendMessage = (msg: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(msg));
        }
    };

    return { lastMessage, isConnected, sendMessage };
}
