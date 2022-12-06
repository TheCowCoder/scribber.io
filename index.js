const Utils = require("./classes/Utils.js");
const Player = require("./classes/Player");
const Room = require("./classes/Room.js");
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { Webhook, MessageBuilder } = require("discord-webhook-node");
const res = require("express/lib/response");



const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static("public"));


app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});


io.on("connection", (socket) => {
    console.log("A user connected!", socket.id);
    let player;

    socket.on("join", (callback) => {
        console.log(socket.id, "join");

        player = new Player(socket);

        console.log("created player");

        return callback({
            success: true
        });
    });

    socket.on("start game", (callback) => {
        if (!player) return callback({
            success: false,
            message: "Please wait a bit before starting the game."
        });

        if (!player.room) return callback({
            success: false,
            message: "You aren't in a room."
        });

        if (player.room.state !== "waiting to start") return callback({
            success: false,
            message: "This game is not ready to start."
        });

        if (player.room.host !== player) return callback({
            success: false,
            message: "Only the room host can start the game."
        });

        console.log("Game stargin!", player.username);

        player.room.start();

        player.room.emit("game started");

        return callback({
            success: true
        });
    })

    socket.on("username", (username, callback) => {
        if (!player) return callback({
            success: false,
            message: "Please wait a bit before setting your username."
        });

        player.username = username;

        if (player.room) player.room.emit("username", socket.id, username);

        return callback({
            success: true
        });
    })

    socket.on("join room", (roomID, callback) => {
        if (!player) return callback({
            success: false,
            message: "Please wait a bit before joining a room."
        });
        console.log(player.username, "joining room!");

        let room = Room.rooms[roomID];

        if (!room) return callback({
            success: false,
            message: "Room not found."
        });

        if (player.room) return callback({
            success: false,
            message: "You're already in a room."
        });

        if (room.state === "in progress") return callback({
            success: false,
            message: "Please wait until this game finishes to join it."
        });

        player.joinRoom(room);
        console.log("they joined");

        // Object.assign(player, newPlayer);

        player.broadcast("player join", player.getForClient());

        // socket.broadcast.emit("player join", player.getForClient());
        
        return callback({
            success: true,
            room: room.getForClient()
        });
    });

    socket.on("create room", (callback) => {
        if (!player) return callback({
            success: false,
            message: "Please wait a bit before creating a room."
        });

        if (player.room) return callback({
            success: false,
            message: "Please leave the room you are in before creating a room."
        });

        let room = Room.createRoom(player);
        console.log("Created room", room.roomID);
        player.joinRoom(room);
        console.log("Added player");

        return callback({
            success: true,
            room: room.getForClient()
        });
        
    });

    socket.on("guess", (guess, callback) => {
        if (!player) return callback({
            success: false,
            message: "Please wait a bit before making a guess."
        });

        if (!player.room) return callback({
            success: false,
            message: "You aren't in a room."
        });

        if (player.room.state !== "in progress") return callback({
            success: false,
            message: "This game is not in progress."
        });

        guess = guess.toLowerCase();

        if (!Utils.ALL_WORDS.includes(guess)) return callback({
            success: false,
            message: `"${guess}" is not in the word list.`
        });

        console.log(player.username, socket.id, "guessing", guess);
        console.log(player.wordIndex, player.room.words);


        let answer = player.room.words[player.wordIndex];
        console.log("Answer is", answer);

        const result = Utils.evaluateGuess(guess, answer);

        player.updateBoard(guess, result);
        const scoredResult = player.updateScore(result);

        console.log("Player score is:", player.score);
        console.log("Scored result:", scoredResult);

        player.broadcast("guess", socket.id, result);
        player.room.emit("score", socket.id, scoredResult);
        
        console.log("Sent score update", player.score, player.getTotalScore());



        if (Utils.isWinningResult(result)) {
            console.log("The player has beat the word and is ready for a new one!");
            const newWord = player.newWord();
            console.log("Their new word is:", newWord);
            console.log(player.room.words);
            player.broadcast("word guessed", socket.id);
        } else {
            console.log("It was not a winning result", player.board);
            if (player.isBoardFull()) {
                console.log("Their bord is full! THey LOST!");
                player.removeWordFromScore(player.wordIndex);
                player.room.emit("set score", socket.id, player.score);

                const newWord = player.newWord();
                console.log("Their new word is:", newWord);
                player.broadcast("word lost", socket.id);
            }
        }

        if (player.getTotalScore() >= 50) {
            console.log("The player has won the race with this guess!");
            player.room.emit("win", socket.id);
            player.room.gameOver();
            // player.room.reset();
            // player.room.emit("reset", player.room.getForClient());
        }

        return callback({
            success: true,
            result: result
        });
    });

    socket.on("reset", (callback) => {
        if (!player) return callback({
            success: false,
            message: "Please wait a bit before resetting the game."
        });

        if (!player.room) return callback({
            success: false,
            message: "You aren't in a room."
        });

        if (player.room.state !== "game over") return callback({
            success: false,
            message: "This game is not ready to reset."
        });

        if (player.room.host !== player) return callback({
            success: false,
            message: "Only the room host can reset the game."
        });

        console.log("Game reset!", player.username);

        player.room.reset();

        player.room.emit("reset", player.room.getForClient());


        return callback({
            success: true
        });
    });
   
    socket.on("update guess", (guess, callback) => {
        if (!player) return callback({
            success: false,
            message: "Please wait a bit before updating your guess."
        });

        if (!player.room) return callback({
            success: false,
            message: "You aren't in a room."
        });

        if (player.room.state !== "in progress") return callback({
            success: false,
            message: "This game is not in progress."
        });

        console.log("Update guess!", player.username, guess);


        player.broadcast("update guess", socket.id, guess);

        return callback({
            success: true
        });
    });


    socket.on("disconnecting", () => {
        console.log(socket.id, player.username, "disconnecting");
        if (player.room) player.room.emit("player leave", socket.id);
        player.remove()
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected!", socket.id);
    });
});


server.listen(PORT, () => {
    console.log("Listening on port", PORT);
});
