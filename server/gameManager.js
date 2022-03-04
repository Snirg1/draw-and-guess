class GameManager {

    constructor(socketIO, maxNumOfPlayers) {
        this.maxNumOfPlayers = 2;
        this.state = new GameState();
        this.playersSockets = {};
        this.socketIO = socketIO;
        this.nextID = 0;
        this.currentDrawerID = -1;
        this.currentGuesserID = -1;
    }

    onConnection(playerSocket) {

        if (this.state.getConnectedCount() < this.maxNumOfPlayers) {
            this.playersSockets[this.nextID] = playerSocket;
            let ID = this.nextID;
            this.state.onUserConnection();
            playerSocket.emit(`player_connected`, {playerID: ID})
        }
        if (this.state.getConnectedCount() === this.maxNumOfPlayers) {
            this.currentGuesserID = this.nextID;
            this.startGame();
        } else {
            this.currentDrawerID = this.nextID;
        }
        this.nextID++;
    }

    onDisconnection(playerSocket) {
        let disconnectedPlayerID = this.getKeyByValue(this.playersSockets, playerSocket)
        this.playersSockets[disconnectedPlayerID] = null;
        this.state.stopGame();
        this.state.onUserDisconnection();
        this.currentDrawerID = disconnectedPlayerID == this.currentDrawerID ?
            this.currentGuesserID : this.currentDrawerID;
        this.currentGuesserID = -1;
        const leftPlayerSocket = this.playersSockets[this.currentDrawerID];
        if (leftPlayerSocket) {
            this.state.setSessionPoints(0);
            leftPlayerSocket.emit("other_user_disconnected", {
                isGameStarted: false,
                sessionPoints: this.state.sessionPoints
            })
        } else
            this.state.resetState();
    }

    onPlayerConnected(msgData) {
        let ID = this.state.getConnectedCount() - 1;
        this.socketIO.emit("player_connected", {playerID: ID})
    }

    startGame() {
        this.state.startGame()
        this.socketIO.emit('game-started', {currentDrawer: this.currentDrawerID, isGameStarted: true})
    }

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }

    onDrawerTurnFinished(msgData) {
        this.playersSockets[this.currentGuesserID].emit('guesser_turn', msgData)
    }

    onGuesserTurnFinished(msgData) {
        this.state.setSessionPoints(msgData.totalSessionPoints);
        let temp = this.currentDrawerID;
        this.currentDrawerID = this.currentGuesserID;
        this.currentGuesserID = temp;
        this.socketIO.emit("drawer_turn", {
            currentDrawer: this.currentDrawerID,
            sessionPoints: this.state.sessionPoints
        })
    }

    onChooseWord(msgData) {
        this.socketIO.broadcast.emit("player_connected",)
    }
}

class GameState {
    constructor() {
        this.isGameStarted = false;
        this.numberOfPlayers = 0;
        this.currentDrawer = 0;
        this.sessionPoints = 0;
        this.wordToGuess = null;
    }

    getCurrentDrawer() {
        return this.currentDrawer;
    }

    getConnectedCount() {
        return this.numberOfPlayers;
    }

    onUserConnection() {
        this.numberOfPlayers++
    }

    onUserDisconnection() {
        this.numberOfPlayers--
    }

    startGame() {
        this.isGameStarted = true;
    }

    stopGame() {
        this.isGameStarted = false;
    }

    setSessionPoints(newSessionPoints) {
        this.sessionPoints = newSessionPoints;
    }

    resetState() {
        this.isGameStarted = false;
        this.numberOfPlayers = 0;
        this.currentDrawer = 0;
        this.sessionPoints = 0;
        this.wordToGuess = null;
    }
}

module.exports = {GameManager}