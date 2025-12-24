import { WebSocket } from 'ws';

export interface FileChangeEvent {
  type: 'file_created' | 'file_modified' | 'file_deleted' | 'file_renamed';
  path: string;
  oldPath?: string; // For rename operations
  content?: string; // For created/modified files
}

class FileWatcherService {
  private clients: Set<WebSocket> = new Set();

  /**
   * Register a new WebSocket client
   */
  addClient(ws: WebSocket) {
    this.clients.add(ws);
    
    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.clients.delete(ws);
    });
  }

  /**
   * Broadcast a file change event to all connected clients
   */
  broadcastFileChange(event: FileChangeEvent) {
    const message = JSON.stringify(event);
    const deadClients: WebSocket[] = [];

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Error sending message to client:', error);
          deadClients.push(client);
        }
      } else {
        deadClients.push(client);
      }
    });

    // Clean up dead clients
    deadClients.forEach((client) => {
      this.clients.delete(client);
    });
  }

  /**
   * Notify that a file was created
   */
  notifyFileCreated(path: string, content?: string) {
    this.broadcastFileChange({
      type: 'file_created',
      path,
      content,
    });
  }

  /**
   * Notify that a file was modified
   */
  notifyFileModified(path: string, content?: string) {
    this.broadcastFileChange({
      type: 'file_modified',
      path,
      content,
    });
  }

  /**
   * Notify that a file was deleted
   */
  notifyFileDeleted(path: string) {
    this.broadcastFileChange({
      type: 'file_deleted',
      path,
    });
  }

  /**
   * Notify that a file was renamed
   */
  notifyFileRenamed(oldPath: string, newPath: string) {
    this.broadcastFileChange({
      type: 'file_renamed',
      path: newPath,
      oldPath,
    });
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

export const fileWatcher = new FileWatcherService();

