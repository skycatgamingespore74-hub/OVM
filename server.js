const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// Servir fichiers statiques dans public
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connecté');

  // Reçoit mise à jour de l'admin
  socket.on('update', (data) => {
    // Transmet à tous les overlays connectés
    io.emit('updateOverlay', data);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

http.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
