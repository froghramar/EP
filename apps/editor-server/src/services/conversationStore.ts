import Database from 'better-sqlite3';
import { join } from 'path';
import { Message } from './claudeAgent';

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationRow {
  id: string;
  created_at: number;
  updated_at: number;
}

interface MessageRow {
  id: number;
  conversation_id: string;
  role: string;
  content: string;
  created_at: number;
}

/**
 * SQLite-based conversation store with proper persistence
 */
class ConversationStore {
  private db: Database.Database;
  private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(dbPath?: string) {
    // Use provided path or default to data directory
    const path = dbPath || join(process.cwd(), 'data', 'conversations.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    const dir = join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
    this.initDatabase();
    this.scheduleCleanup();
  }

  /**
   * Initialize database schema
   */
  private initDatabase(): void {
    // Create conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
      ON messages(conversation_id);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
      ON conversations(updated_at);
    `);
  }

  /**
   * Create a new conversation
   */
  create(): Conversation {
    const id = this.generateId();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO conversations (id, created_at, updated_at)
      VALUES (?, ?, ?)
    `);

    stmt.run(id, now, now);

    return {
      id,
      messages: [],
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  /**
   * Get a conversation by ID
   */
  get(id: string): Conversation | null {
    const conversationRow = this.db.prepare(`
      SELECT id, created_at, updated_at
      FROM conversations
      WHERE id = ?
    `).get(id) as ConversationRow | undefined;

    if (!conversationRow) {
      return null;
    }

    // Check if expired
    if (Date.now() - conversationRow.updated_at > this.MAX_AGE_MS) {
      this.delete(id);
      return null;
    }

    // Get messages
    const messageRows = this.db.prepare(`
      SELECT role, content, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(id) as MessageRow[];

    const messages: Message[] = messageRows.map(row => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
    }));

    return {
      id: conversationRow.id,
      messages,
      createdAt: new Date(conversationRow.created_at),
      updatedAt: new Date(conversationRow.updated_at),
    };
  }

  /**
   * Add a message to a conversation
   */
  addMessage(id: string, message: Message): void {
    const conversation = this.get(id);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const now = Date.now();

    // Insert message
    const insertStmt = this.db.prepare(`
      INSERT INTO messages (conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `);

    insertStmt.run(id, message.role, message.content, now);

    // Update conversation timestamp
    const updateStmt = this.db.prepare(`
      UPDATE conversations
      SET updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(now, id);
  }

  /**
   * Delete a conversation
   */
  delete(id: string): void {
    // Delete messages (cascade)
    this.db.prepare(`DELETE FROM messages WHERE conversation_id = ?`).run(id);
    
    // Delete conversation
    this.db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id);
  }

  /**
   * Get conversation count
   */
  count(): number {
    const result = this.db.prepare(`SELECT COUNT(*) as count FROM conversations`).get() as { count: number };
    return result.count;
  }

  /**
   * Get all conversations (summary without full messages)
   */
  getAll(): Array<{ id: string; createdAt: Date; updatedAt: Date; messageCount: number; preview: string }> {
    const rows = this.db.prepare(`
      SELECT 
        c.id,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at ASC LIMIT 1) as preview
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `).all() as Array<{
      id: string;
      created_at: number;
      updated_at: number;
      message_count: number;
      preview: string | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      messageCount: row.message_count,
      preview: row.preview || '',
    }));
  }

  /**
   * Get all conversation IDs
   */
  list(): string[] {
    const rows = this.db.prepare(`
      SELECT id FROM conversations
      ORDER BY updated_at DESC
    `).all() as { id: string }[];

    return rows.map(row => row.id);
  }

  /**
   * Clean up old conversations
   */
  cleanup(): number {
    const cutoff = Date.now() - this.MAX_AGE_MS;

    // Delete old conversations
    const stmt = this.db.prepare(`
      DELETE FROM conversations
      WHERE updated_at < ?
    `);

    const result = stmt.run(cutoff);
    return result.changes;
  }

  /**
   * Schedule periodic cleanup
   */
  private scheduleCleanup(): void {
    // Run cleanup every hour
    setInterval(() => {
      const deleted = this.cleanup();
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} expired conversations`);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Generate a unique conversation ID
   */
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database statistics
   */
  getStats(): {
    conversations: number;
    messages: number;
    dbSize: number;
  } {
    const conversations = this.db.prepare(`SELECT COUNT(*) as count FROM conversations`).get() as { count: number };
    const messages = this.db.prepare(`SELECT COUNT(*) as count FROM messages`).get() as { count: number };
    
    // Get database file size
    const fs = require('fs');
    let dbSize = 0;
    try {
      const stats = fs.statSync(this.db.name);
      dbSize = stats.size;
    } catch (e) {
      // Ignore errors
    }

    return {
      conversations: conversations.count,
      messages: messages.count,
      dbSize,
    };
  }
}

// Export singleton instance
export const conversationStore = new ConversationStore();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing conversation store...');
  conversationStore.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing conversation store...');
  conversationStore.close();
  process.exit(0);
});
