const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface FileChangeEvent {
  type: 'file_created' | 'file_modified' | 'file_deleted' | 'file_renamed';
  path: string;
  oldPath?: string;
  content?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Set<(event: FileChangeEvent) => void> = new Set();

  connect() {
    // Don't reconnect if already connected or connecting
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const wsUrl = API_BASE_URL.replace(/^http/, 'ws').replace(/^https/, 'wss') + '/ws';
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: FileChangeEvent = JSON.parse(event.data);
          this.listeners.forEach(listener => listener(data));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't attempt reconnect on error - wait for onclose
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.ws = null;
        
        // Only attempt reconnect if it wasn't a manual close
        if (event.code !== 1000) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.ws = null;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  onFileChange(listener: (event: FileChangeEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  disconnect() {
    if (this.ws) {
      // Use code 1000 (normal closure) to indicate manual disconnect
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }
}

export const websocketService = new WebSocketService();

