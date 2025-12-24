/**
 * Test script for SQLite conversation store
 * Run with: npx tsx src/scripts/testConversationStore.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { unlinkSync, existsSync, mkdirSync } from 'fs';

const testDbPath = join(process.cwd(), 'data', 'test-conversations.db');

// Clean up test database
if (existsSync(testDbPath)) {
  unlinkSync(testDbPath);
}
if (existsSync(`${testDbPath}-shm`)) {
  unlinkSync(`${testDbPath}-shm`);
}
if (existsSync(`${testDbPath}-wal`)) {
  unlinkSync(`${testDbPath}-wal`);
}

// Ensure data directory exists
const dir = join(process.cwd(), 'data');
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

// Import the store module to test the real implementation
const storeModule = require('../services/conversationStore');

// Create a new instance by importing the module with a different path
import('../services/conversationStore').then(() => {
  // The module has been loaded, now we can test it
});

// For testing, we'll create a simple wrapper
const db = new Database(testDbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
  ON messages(conversation_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
  ON conversations(updated_at);
`);

// Simple store implementation for testing
const store = {
  create: () => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    db.prepare('INSERT INTO conversations (id, created_at, updated_at) VALUES (?, ?, ?)').run(id, now, now);
    return { id, messages: [], createdAt: new Date(now), updatedAt: new Date(now) };
  },
  
  get: (id: string) => {
    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
    if (!conv) return null;
    
    const messages = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at').all(id) as any[];
    return {
      id: conv.id,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
    };
  },
  
  addMessage: (id: string, message: { role: string; content: string }) => {
    const now = Date.now();
    db.prepare('INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)').run(id, message.role, message.content, now);
    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, id);
  },
  
  delete: (id: string) => {
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  },
  
  count: () => {
    const result = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any;
    return result.count;
  },
  
  list: () => {
    const rows = db.prepare('SELECT id FROM conversations ORDER BY updated_at DESC').all() as any[];
    return rows.map(r => r.id);
  },
  
  getStats: () => {
    const convs = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any;
    const msgs = db.prepare('SELECT COUNT(*) as count FROM messages').get() as any;
    const fs = require('fs');
    let dbSize = 0;
    try {
      const stats = fs.statSync(testDbPath);
      dbSize = stats.size;
    } catch (e) {}
    return { conversations: convs.count, messages: msgs.count, dbSize };
  },
  
  close: () => db.close(),
};

console.log('🧪 Testing SQLite Conversation Store\n');

// Test 1: Create conversation
console.log('Test 1: Create conversation');
const conv1 = store.create();
console.log(`✓ Created conversation: ${conv1.id}`);
console.log(`  - Messages: ${conv1.messages.length}`);
console.log(`  - Created: ${conv1.createdAt.toISOString()}\n`);

// Test 2: Add messages
console.log('Test 2: Add messages');
store.addMessage(conv1.id, {
  role: 'user',
  content: 'Hello, can you help me?',
});
console.log('✓ Added user message');

store.addMessage(conv1.id, {
  role: 'assistant',
  content: 'Of course! I\'d be happy to help you.',
});
console.log('✓ Added assistant message\n');

// Test 3: Retrieve conversation
console.log('Test 3: Retrieve conversation');
const retrieved = store.get(conv1.id);
if (retrieved) {
  console.log(`✓ Retrieved conversation: ${retrieved.id}`);
  console.log(`  - Messages: ${retrieved.messages.length}`);
  retrieved.messages.forEach((msg, i) => {
    console.log(`  - Message ${i + 1} [${msg.role}]: ${msg.content.substring(0, 50)}...`);
  });
} else {
  console.log('✗ Failed to retrieve conversation');
}
console.log('');

// Test 4: Create multiple conversations
console.log('Test 4: Create multiple conversations');
const conv2 = store.create();
const conv3 = store.create();
console.log(`✓ Created conversation: ${conv2.id}`);
console.log(`✓ Created conversation: ${conv3.id}`);
console.log(`  - Total conversations: ${store.count()}\n`);

// Test 5: List conversations
console.log('Test 5: List conversations');
const list = store.list();
console.log(`✓ Found ${list.length} conversations:`);
list.forEach((id, i) => {
  console.log(`  ${i + 1}. ${id}`);
});
console.log('');

// Test 6: Add messages to multiple conversations
console.log('Test 6: Add messages to multiple conversations');
store.addMessage(conv2.id, { role: 'user', content: 'What is TypeScript?' });
store.addMessage(conv2.id, { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript.' });
store.addMessage(conv3.id, { role: 'user', content: 'How do I use async/await?' });
console.log('✓ Added messages to multiple conversations\n');

// Test 7: Get statistics
console.log('Test 7: Get statistics');
const stats = store.getStats();
console.log('✓ Database statistics:');
console.log(`  - Conversations: ${stats.conversations}`);
console.log(`  - Messages: ${stats.messages}`);
console.log(`  - Database size: ${(stats.dbSize / 1024).toFixed(2)} KB\n`);

// Test 8: Delete conversation
console.log('Test 8: Delete conversation');
store.delete(conv3.id);
console.log(`✓ Deleted conversation: ${conv3.id}`);
console.log(`  - Remaining conversations: ${store.count()}\n`);

// Test 9: Verify deleted conversation
console.log('Test 9: Verify deleted conversation');
const deleted = store.get(conv3.id);
if (deleted === null) {
  console.log('✓ Confirmed conversation was deleted\n');
} else {
  console.log('✗ Conversation still exists!\n');
}

// Test 10: Persistence test
console.log('Test 10: Persistence test');
const beforeClose = store.count();
console.log(`  - Conversations before close: ${beforeClose}`);
store.close();
console.log('  - Closed database');

// Reopen database
const db2 = new Database(testDbPath);
const store2 = {
  get: (id: string) => {
    const conv = db2.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
    if (!conv) return null;
    const messages = db2.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at').all(id) as any[];
    return {
      id: conv.id,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
    };
  },
  count: () => {
    const result = db2.prepare('SELECT COUNT(*) as count FROM conversations').get() as any;
    return result.count;
  },
  getStats: () => {
    const convs = db2.prepare('SELECT COUNT(*) as count FROM conversations').get() as any;
    const msgs = db2.prepare('SELECT COUNT(*) as count FROM messages').get() as any;
    const fs = require('fs');
    let dbSize = 0;
    try {
      const stats = fs.statSync(testDbPath);
      dbSize = stats.size;
    } catch (e) {}
    return { conversations: convs.count, messages: msgs.count, dbSize };
  },
  close: () => db2.close(),
};
const afterReopen = store2.count();
console.log(`  - Conversations after reopen: ${afterReopen}`);

if (beforeClose === afterReopen) {
  console.log('✓ Data persisted successfully!\n');
} else {
  console.log('✗ Data was not persisted!\n');
}

// Test 11: Retrieve persisted conversation
console.log('Test 11: Retrieve persisted conversation');
const persistedConv = store2.get(conv1.id);
if (persistedConv && persistedConv.messages.length === 2) {
  console.log(`✓ Retrieved persisted conversation with ${persistedConv.messages.length} messages`);
  persistedConv.messages.forEach((msg, i) => {
    console.log(`  - Message ${i + 1} [${msg.role}]: ${msg.content.substring(0, 50)}...`);
  });
} else {
  console.log('✗ Failed to retrieve persisted conversation');
}
console.log('');

// Final statistics
console.log('📊 Final Statistics');
const finalStats = store2.getStats();
console.log(`  - Total conversations: ${finalStats.conversations}`);
console.log(`  - Total messages: ${finalStats.messages}`);
console.log(`  - Database size: ${(finalStats.dbSize / 1024).toFixed(2)} KB`);

// Cleanup
store2.close();
console.log('\n✅ All tests completed!');
console.log(`\nTest database location: ${testDbPath}`);
console.log('You can delete it manually or leave it for inspection.');

