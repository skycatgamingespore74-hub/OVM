// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

// Port fourni par Railway ou fallback
const PORT = process.env.PORT || 3000;

// Middleware pour logs de toutes les requêtes HTTP
app.use((req, res, next) => {
    console.log(`[HTTP] ${new Date().toISOString()} → Requête ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    console.log(`[ROUTE] / (racine) demandée`);
    res.send('<h1>Serveur Overlay en ligne ✅</h1>');
});

app.get('/overlay', (req, res) => {
    console.log(`[ROUTE] /overlay demandée`);
    res.sendFile(__dirname + '/public/overlay.html');
});

app.get('/admin', (req, res) => {
    console.log(`[ROUTE] /admin demandée`);
    res.sendFile(__dirname + '/public/admin.html');
});

// Servir fichiers statiques (CSS, JS, images)
app.use('/static', express.static(__dirname + '/public'));

// Stockage temporaire des données (scores, noms, etc.)
let overlayData = {
    nameTeam1: "Crazy Raccoon",
    nameTeam2: "Elevate",
    scoreTeam1: 2,
    scoreTeam2: 2,
    logoTeam1: "",
    logoTeam2: "",
    gameMode: "J’aime crabe",
    timer: 0,
    pick1: "", pick2: "", pick3: "",
    pickVisible1: false, pickVisible2: false, pickVisible3: false
};

// WebSocket
io.on('connection', (socket) => {
    console.log(`[WS] Nouveau client connecté : ${socket.id}`);

    // Envoyer l’état actuel au nouveau client
    socket.emit('updateOverlay', overlayData);
    console.log(`[WS] État initial envoyé au client ${socket.id}`);

    // Quand l'admin envoie une mise à jour
    socket.on('update', (data) => {
        console.log(`[WS] Mise à jour reçue du client ${socket.id}`);
        console.log(data);

        // Mettre à jour le stockage
        overlayData = { ...overlayData, ...data };

        // Diffuser à tous les clients (overlay)
        io.emit('updateOverlay', overlayData);
        console.log(`[WS] Mise à jour diffusée à tous les clients`);
    });

    socket.on('disconnect', () => {
        console.log(`[WS] Client déconnecté : ${socket.id}`);
    });
});

// Démarrage du serveur
http.listen(PORT, () => {
    console.log(`\n🚀 Serveur lancé sur le port ${PORT}`);
    console.log(`📡 Routes disponibles :`);
    console.log(` - Racine : /`);
    console.log(` - Overlay : /overlay`);
    console.log(` - Admin : /admin`);
    console.log(`💻 URL Railway : https://ton-projet-railway.up.railway.app`);
});
