const Utils = require("./Utils.js");

class Room {
    static rooms = {};

    static createRoom(host) {
        // let roomID = makeID(4);
        let roomID = Utils.randItem(Utils.ALL_WORDS);
        while (roomID in Room.rooms) roomID = Utils.randItem(Utils.ALL_WORDS);
        
        let room = new Room(roomID, host);
        return room;

    }
    
    constructor(roomID, host) {
        this.roomID = roomID;
        this.players = {};
        this.state = "waiting to start";
        this.host = host;

        this.words = [];


        Room.rooms[roomID] = this;
    }

    reset() {
        this.state = "waiting to start";
        this.words = [];

        for (let socketID in this.players) {
            const player = this.players[socketID];
            player.reset();
        }

    }

    gameOver() {
        this.state = "game over";
    }

    start() {
        this.state = "in progress";
        this.addNewWord();
        for (let socketID in this.players) {
            const player = this.players[socketID];
            const newWord = player.newWord();
            console.log("New word for player", player.username, newWord);
        }
    }

    getForClient() {
        let room = {
            roomID: this.roomID,
            players: {},
            state: this.state,
            host: this.host.getForClient()
        };
        for (let socketID in this.players) {
            const player = this.players[socketID];
            room.players[socketID] = player.getForClient();
        }
        return room;
    }

    addNewWord() {
        const newWord = Utils.randItem(Utils.ANSWER_WORDS);
        // let newWord = "chere";
        this.words.push(newWord);
        return newWord;
    }

    addPlayer(player) {
        this.players[player.socket.id] = player;
    }
    removePlayer(player) {
        delete this.players[player.socket.id];
        if (Object.keys(this.players).length == 0) delete Room.rooms[this.roomID];
    }

    emit(...args) {
        for (let socketID in this.players) {
            const player = this.players[socketID];
            player.emit(...args);
        }
    }

}

module.exports = Room;
