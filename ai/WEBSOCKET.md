# WebSocket Integration Guide

## Overview
The Q AI Assistant now supports real-time WebSocket connections for instant AI responses, perfect for integrating with Next.js frontends.

## WebSocket Events

### Client → Server Events

**Authentication**
```javascript
socket.emit('authenticate', {
  userId: 'user123',
  userName: 'John Grower',
  membershipLevel: 'premium' // optional: basic, premium, pro
});
```

**Start Chat Session**
```javascript
socket.emit('start_session');
```

**Send Message**
```javascript
socket.emit('send_message', {
  message: 'What is the QPG watering method?',
  sessionId: 'optional-session-id' // uses current session if not provided
});
```

**Get Session History**
```javascript
socket.emit('get_session', {
  sessionId: 'session-uuid'
});
```

**Get User Sessions**
```javascript
socket.emit('get_user_sessions');
```

### Server → Client Events

**Authentication Success**
```javascript
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.success);
});
```

**Session Started**
```javascript
socket.on('session_started', (data) => {
  console.log('Session ID:', data.sessionId);
});
```

**AI Typing Indicator**
```javascript
socket.on('ai_typing', (data) => {
  console.log('AI is typing:', data.typing);
});
```

**Message Response**
```javascript
socket.on('message_response', (data) => {
  console.log('User message:', data.userMessage);
  console.log('AI response:', data.aiResponse);
  console.log('Follow-up questions:', data.aiResponse.metadata?.followUpQuestions);
});
```

**Session Data**
```javascript
socket.on('session_data', (data) => {
  console.log('Session:', data.session);
});
```

**User Sessions**
```javascript
socket.on('user_sessions', (data) => {
  console.log('Sessions:', data.sessions);
});
```

**Error Handling**
```javascript
socket.on('error', (data) => {
  console.error('Error:', data.message);
});
```

## Next.js Integration Example

### Install Socket.IO Client
```bash
npm install socket.io-client
```

### React Hook for WebSocket
```typescript
// hooks/useQAISocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const useQAISocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    
    newSocket.on('session_started', (data) => {
      setSessionId(data.sessionId);
    });

    newSocket.on('ai_typing', (data) => {
      setIsTyping(data.typing);
    });

    newSocket.on('message_response', (data) => {
      setMessages(prev => [
        ...prev,
        data.userMessage,
        data.aiResponse
      ]);
    });

    return () => newSocket.close();
  }, [serverUrl]);

  const authenticate = (userId: string, userName: string) => {
    socket?.emit('authenticate', { userId, userName });
  };

  const startSession = () => {
    socket?.emit('start_session');
  };

  const sendMessage = (message: string) => {
    socket?.emit('send_message', { message, sessionId });
  };

  return {
    connected,
    messages,
    isTyping,
    sessionId,
    authenticate,
    startSession,
    sendMessage,
  };
};
```

### React Component Example
```typescript
// components/QAIChat.tsx
import { useState, useEffect } from 'react';
import { useQAISocket } from '../hooks/useQAISocket';

export const QAIChat = () => {
  const [message, setMessage] = useState('');
  const [userId] = useState('user123');
  const [userName] = useState('John Grower');
  
  const {
    connected,
    messages,
    isTyping,
    sessionId,
    authenticate,
    startSession,
    sendMessage,
  } = useQAISocket('http://localhost:3000');

  useEffect(() => {
    if (connected) {
      authenticate(userId, userName);
    }
  }, [connected]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (!sessionId) {
      startSession();
    }
    
    sendMessage(message);
    setMessage('');
  };

  return (
    <div className="chat-container">
      <div className="status">
        Status: {connected ? 'Connected' : 'Disconnected'}
        {sessionId && ` | Session: ${sessionId.slice(0, 8)}...`}
      </div>
      
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Q AI'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        {isTyping && (
          <div className="message ai typing">
            <strong>Q AI:</strong>
            <p>Typing...</p>
          </div>
        )}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about plant cultivation..."
        />
        <button onClick={handleSendMessage} disabled={!connected}>
          Send
        </button>
      </div>
    </div>
  );
};
```

## Testing

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open the test page:**
   Open `websocket-client-example.html` in your browser

3. **Test the connection:**
   - Enter User ID and Name
   - Click "Connect"
   - Click "Start Session"
   - Send test messages

## Features

- ✅ Real-time bidirectional communication
- ✅ Authentication and user management
- ✅ Session management with persistence
- ✅ Typing indicators
- ✅ Error handling
- ✅ QPG Agent integration for sophisticated responses
- ✅ Follow-up question suggestions
- ✅ CORS support for cross-origin requests

## Production Considerations

- Configure proper CORS origins in production
- Implement rate limiting for WebSocket connections
- Add reconnection logic in client
- Monitor WebSocket connection counts
- Consider using Redis adapter for scaling across multiple servers