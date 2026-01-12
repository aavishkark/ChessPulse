import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (this.socket?.connected) {

            return;
        }

        this.socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        this.socket.on('connect', () => {

        });

        this.socket.on('disconnect', () => {

        });

        this.socket.on('connect_error', (error) => {
            // console.error('Connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        } else {
            // console.error('Socket not connected');
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.off(event);
            }
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export default new SocketService();
