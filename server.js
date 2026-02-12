// server.js - Version ultra debug pour Railway
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

// Utiliser le port fourni par Railway
const PORT = process.env.PORT || 3000;

// ------------------------
// Fonctions de log
// ------------------------
function logHTTP(req) {
    console.log(`[HTTP] ${new Date().toISOString()} → ${req.method} ${req.url} de ${req.ip}`);
}
function logWS(msg, socketId="") {
    console.log(`[WS] ${new Date().toISOString()} ${socketId ? "["+socketId+"]" : ""} → ${msg}`);
}
function logError(err) {
    console.error(`[ERROR] ${new Date().toISOString()} →`, err);
}

// ------------------------
// Middleware HTTP pour logs
// ------------------------
app.use((req, res, next) => {
    logHTTP(req);
    next();
});

// ------------------------
// Routes HTTP
// ------------------------
app.get('/', (req, res) => {
    console.log("[ROUTE] / (racine) demandée");
    res.send('<h1>Serveur Overlay en ligne ✅</h1>');
});

app.get('/overlay', (req, res) => {
    console.log("[ROUTE] /overlay demandée");
    const filePath = path.join(__dirname, 'public', 'overlay.html');
    res.sendFile(filePath, (err) => {
        if(err) logError(err);
    });
});

app.get('/admin', (req, res) => {
    console.log("[ROUTE] /admin demandée");
    const filePath = path.join(__dirname, 'public', 'admin.html');
    res.sendFile(filePath, (err) => {
        if(err) logError(err);
    });
});

// Servir fichiers statiques pour CSS/JS/images
app.use('/static', express.static(path.join(__dirname, 'public')));

// ------------------------
// Stockage temporaire overlay
// ------------------------
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

// ------------------------
// Fonctions WebSocket
// ------------------------
function sendOverlayUpdate() {
    try {
        io.emit('updateOverlay', overlayData);
        logWS("État overlay envoyé à tous les clients");
    } catch(err) {
        logError(err);
    }
}

// ------------------------
// WebSocket
// ------------------------
io.on('connection', (socket) => {
    logWS("Nouveau client connecté", socket.id);

    // Envoyer l’état actuel au nouveau client
    socket.emit('updateOverlay', overlayData);
    logWS("État initial envoyé au client", socket.id);

    // Recevoir mise à jour de l’admin
    socket.on('update', (data) => {
        logWS("Mise à jour reçue du client", socket.id);
        console.log(data);

        try {
            // Fusionner les nouvelles données
            overlayData = { ...overlayData, ...data };
            sendOverlayUpdate();
        } catch(err) {
            logError(err);
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        logWS("Client déconnecté", socket.id);
    });
});

// ------------------------
// Gestion des erreurs serveur
// ------------------------
process.on('uncaughtException', (err) => {
    logError("Exception non capturée : " + err);
});
process.on('unhandledRejection', (reason, promise) => {
    logError("Rejection non gérée : " + reason);
});

// ------------------------
// Démarrage du serveur
// ------------------------
http.listen(PORT, () => {
    console.log(`\n🚀 Serveur lancé sur le port ${PORT}`);
    console.log("📡 Routes disponibles :");
    console.log(" - Racine : /");
    console.log(" - Overlay : /overlay");
    console.log(" - Admin : /admin");
    console.log("💻 URL Railway : https://ton-projet-railway.up.railway.app");
});
