// server.js - Version Railway pur, pas de port fixe, overlay/admin + WebSocket

const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

console.log('==============================');
console.log('🚀 DÉMARRAGE DU SERVEUR');
console.log('==============================');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// ------------------------
// Fonctions de logs
// ------------------------
function logHTTP(req) {
    console.log(`[HTTP] ${new Date().toISOString()} → ${req.method} ${req.url} de ${req.ip}`);
}

function logWS(msg, socketId = '') {
    console.log(`[WS] ${new Date().toISOString()} ${socketId ? '[' + socketId + ']' : ''} → ${msg}`);
}

function logError(err) {
    console.error(`[ERROR] ${new Date().toISOString()} →`, err);
}

// ------------------------
// Middleware HTTP
// ------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    logHTTP(req);
    next();
});

// ------------------------
// Fichiers statiques
// ------------------------
app.use('/static', express.static(path.join(__dirname, 'public')));

// ------------------------
// Routes
// ------------------------
app.get('/', (req, res) => {
    console.log('[ROUTE] / (racine) demandée');
    res.json({
        message: 'Serveur Overlay en ligne ✅',
        time: new Date().toISOString(),
        url: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `Non détecté`
    });
});

app.get('/overlay', (req, res) => {
    console.log('[ROUTE] /overlay demandée');
    res.sendFile(path.join(__dirname, 'public', 'overlay.html'), (err) => {
        if(err) logError(err);
    });
});

app.get('/admin', (req, res) => {
    console.log('[ROUTE] /admin demandée');
    res.sendFile(path.join(__dirname, 'public', 'admin.html'), (err) => {
        if(err) logError(err);
    });
});

// ------------------------
// Données de l’overlay
// ------------------------
let overlayData = {
    nameTeam1: "Équipe 1",
    nameTeam2: "Équipe 2",
    scoreTeam1: 0,
    scoreTeam2: 0,
    logoTeam1: "",
    logoTeam2: "",
    gameMode: "Mode Jeu",
    timer: 0,
    pick1: "", pick2: "", pick3: "",
    pickVisible1: false, pickVisible2: false, pickVisible3: false
};

// ------------------------
// WebSocket
// ------------------------
io.on('connection', (socket) => {
    logWS("Client connecté", socket.id);

    // Envoyer l’état initial
    socket.emit('updateOverlay', overlayData);
    logWS("État initial envoyé au client", socket.id);

    // Recevoir update depuis admin
    socket.on('update', (data) => {
        logWS("Update reçu du client", socket.id);
        console.log(data);
        try {
            overlayData = { ...overlayData, ...data };
            io.emit('updateOverlay', overlayData);
            logWS("Update diffusé à tous les clients");
        } catch (err) {
            logError(err);
        }
    });

    socket.on('disconnect', () => {
        logWS("Client déconnecté", socket.id);
    });
});

// ------------------------
// Protection anti-crash
// ------------------------
process.on('uncaughtException', (err) => {
    logError("Exception non capturée : " + err);
});
process.on('unhandledRejection', (reason, promise) => {
    logError("Rejection non gérée : " + reason);
});

// ------------------------
// Lancement serveur (Railway fournit le port)
// ------------------------
const PORT = process.env.PORT;
if (!PORT) {
    logError("❌ Aucun port détecté ! Le serveur doit être lancé sur Railway.");
    process.exit(1);
}

server.listen(PORT, () => {
    console.log('==============================');
    console.log(`✅ SERVEUR LANCÉ SUR RAILWAY`);
    console.log(`🌍 URL PUBLIQUE : ${process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "Non détecté"}`);
    console.log('==============================');
});
