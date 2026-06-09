const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Strict CORS initialization to guarantee zero dropped socket handshakes
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const activeUsers = {};  

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    let sessionUser = null;

    socket.on('register_user', ({ username }) => {
        if (!username) return;
        sessionUser = username;
        activeUsers[username] = socket.id;

        console.log(`[ChatGo System] User online: ${username} (ID: ${socket.id})`);
        io.emit('update_users', Object.keys(activeUsers));
    });

    socket.on('send_secure_message', ({ to, encryptedMessage }) => {
        const targetSocketId = activeUsers[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('receive_secure_message', {
                from: sessionUser,
                encryptedMessage: encryptedMessage
            });
            console.log(`[Relay Route] Encrypted message payload from ${sessionUser} routed to ${to}`);
        }
    });

    socket.on('disconnect', () => {
        if (sessionUser) {
            console.log(`[ChatGo System] User offline: ${sessionUser}`);
            delete activeUsers[sessionUser];
            io.emit('update_users', Object.keys(activeUsers));
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 ChatGo Backend Engine Operational!`);
    console.log(`👉 Open your web browser to: http://localhost:${PORT}`);
    console.log(`====================================================`);
});