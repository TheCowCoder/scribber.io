class SocketManager {
    constructor(eventHandler) {
        this.socket = io({ reconnection: false });
        this.eventHandler = eventHandler;

        this.room = null;

        this.socket.on("connect", this.onConnect.bind(this));
        this.socket.on("player join", this.onPlayerJoin.bind(this));
        this.socket.on("player leave", this.onPlayerLeave.bind(this));
        this.socket.on("game started", this.onGameStarted.bind(this));
        this.socket.on("username", this.onUsername.bind(this));
        this.socket.on("guess", this.onGuess.bind(this));
        this.socket.on("word guessed", this.onWordGuessed.bind(this));
        this.socket.on("score", this.onScore.bind(this));
        this.socket.on("word lost", this.onWordLost.bind(this));
        this.socket.on("win", this.onWin.bind(this));
        this.socket.on("reset", this.onReset.bind(this));
        this.socket.on("update guess", this.onUpdateGuess.bind(this));
        this.socket.on("set score", this.onSetScore.bind(this));
    }

    // Utils
    getPlayer() {
        return this.room.players[this.socket.id];
    }
    

    // Recieve from server

    onSetScore(socketID, score) {
        const player = this.room.players[socketID];
        player.score = score;
        this.eventHandler("set score", player);
    }

    onUpdateGuess(socketID, guess) {
        const player = this.room.players[socketID];

        console.log("got update guess", player.username, guess);
        // player.guess = guess;

        this.eventHandler("update guess", {
            player: player,
            guess: guess
        });
    }

    onReset(room) {
        console.log("RESET!", room);
   
        // this.room = room;
        this.eventHandler("reset", room);
    }

    onWin(socketID) {
        const player = this.room.players[socketID];
        console.log(player.username, "WON!!");



        this.eventHandler("win", player);
    }

    onWordLost(socketID) {
        const player = this.room.players[socketID];
        console.log(player.username, "Lost the word!");

        this.eventHandler("word lost", player);
    }

    onScore(socketID, scoredResult) {
        const player = this.room.players[socketID];
        console.log("Got score", scoredResult, player.username);
        player.score.push.apply(player.score, scoredResult);
        this.eventHandler("score", player);
    }

    onWordGuessed(socketID) {
        const player = this.room.players[socketID];
        console.log(player.username, "Guessed the word!");

        this.eventHandler("word guessed", player);
    }


    onGuess(socketID, result, scoredResult) {
        const player = this.room.players[socketID];
        console.log("Guess recieved");


        player.board[player.guessIndex] = result;

        player.guessIndex ++;

        player.guess = "";

        this.eventHandler("guess", player);
    }

    onConnect() {
        console.log("Connected to server!");
        this.socket.emit("join", (result) => {
            console.log("Joined server!", result);
            // this.setUsername("keed")
            this.eventHandler("joined");
        });
    }

    onPlayerJoin(player) {
        console.log("player join", player);
        
        this.room.players[player.socketID] = player;

        this.eventHandler("player join", player);
    }
    onPlayerLeave(socketID) {
        console.log("leave", socketID);
        let player = this.room.players[socketID];
        console.log("player leave", player);
        
        delete this.room.players[player.socketID];

        this.eventHandler("player leave", player);
    }

    onGameStarted() {
        console.log("Recieved game start!");
        this.room.state = "in progress";
        this.getPlayer().score = [];
        this.eventHandler("game started");
    }

    onUsername(socketID, username) {
        console.log("got username", username);
        const player = this.room.players[socketID];
        player.username = username;
        this.eventHandler("username", player);
    }

    // Send to server

    updateGuess(guess) {
        this.socket.emit("update guess", guess, (result) => {

        });
    }

    resetGame() {
        this.socket.emit("reset", (result) => {
            // if (result.success) this.room.state = "in progress";

            console.log("Game was reset.", result);
        });
    }

    submitGuess(guess, callback) {
        console.log("Guessing:", guess);
        this.socket.emit("guess", guess, (result) => {
            console.log("Got guess result:", result);
            
            return callback(result);
        });
    }

    startGame() {
        this.socket.emit("start game", (result) => {
            // if (result.success) this.room.state = "in progress";

            console.log("Game was started.");
        });
    }

    setUsername(username, callback) {
        this.socket.emit("username", username, (result) => {
            console.log("Success set username");
            if (callback) return callback(result);
        });
    }

    joinRoom(roomID) {
        this.socket.emit("join room", roomID, (result) => {
            if (result.success) this.room = result.room;

            this.eventHandler("join room", result);
        });
    }

    createRoom() {
        this.socket.emit("create room", (result) => {
            if (result.success) this.room = result.room;

            this.eventHandler("join room", result);
        });
    }

}