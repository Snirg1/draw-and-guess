const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {GameManager} = require(`./gameManager`)

const gameManager = new GameManager(io);

io.on('connection', (socket)=> {
    gameManager.onConnection(socket);

    socket.on("player_connected", (msgData) => {
        gameManager.onPlayerConnected(msgData);
    });

    socket.on('disconnect', () => {
        gameManager.onDisconnection(socket);
    });

    socket.on('game-started', (msgData) => {
        io.emit("game-started", msgData);
    });

    socket.on("drawer_turn", (msgData) => {
        console.log("drawer_turn");
    });

    socket.on("guesser_turn", (msgData) => {
        io.emit("guesser_turn",msgData);
    });

    socket.on("drawer_turn_finished", (msgData) => {
        gameManager.onDrawerTurnFinished(msgData);
    });

    socket.on("guesser_turn_finished", (msgData) => {
        gameManager.onGuesserTurnFinished(msgData);
    });

})

var server_port = process.env.YOUR_PORT || process.env.PORT || 5000;
http.listen(server_port, () => {
    console.log("Started on : "+ server_port);
})
