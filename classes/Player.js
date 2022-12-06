const Utils = require("./Utils.js");

class Player {
    static getEmptyBoard() {
        let board = Array.from({length: 6}, () => Array(5).fill(null));
        return board;
    }

    constructor(socket) {
        this.socket = socket;
        
        this.board;
        this.boardForClient;
        this.clearBoard();  // Initializes this.board and this.boardForClient to empty boards
        
        this.wordIndex = -1;  // Starts at -1 because on game start a word is generated and wordIndex goes to 0
        this.guessIndex = 0;
        this.score = [];
    }

    reset() {
        this.clearBoard();
        this.wordIndex = -1;
        this.guessIndex = 0;
        this.score = [];
    }

    removeWordFromScore(wordIndex) {
        for (let i = 0; i < this.score.length; i ++) {
            const currentScoreItem = this.score[i];
            if (currentScoreItem.data.wordIndex === wordIndex) {
                this.score.splice(i, 1);
                i --;
            }
        }
    }

    getForClient() {
        let player = {
            socketID: this.socket.id,
            username: this.username,
            board: this.boardForClient,
            guessIndex: this.guessIndex,
            score: this.score,
            guess: ""
        };

        return player;
    }

    updateBoard(guess, result) {
        this.board[this.guessIndex] = guess.split("");
        this.boardForClient[this.guessIndex] = result;

        this.guessIndex ++;
    }

    clearBoard() {
        this.guessIndex = 0;
        this.board = Player.getEmptyBoard();
        this.boardForClient = Player.getEmptyBoard();
    }

    isBoardFull() {
        for (let row of this.board) {
            for (let char of row) {
                if (char === null) return false;
            }
        }
        return true;
    }

    scoreResult(result) {
        let score = [];
        for (let colNum = 0; colNum < result.length; colNum ++) {
            let currentItemScore = {
                type: null,
                score: null,
                data: {
                    wordIndex: this.wordIndex,
                    guessIndex: this.guessIndex
                }
            };
            if (result[colNum] === "correct") {
                currentItemScore.type = "correct";
                currentItemScore.score = 5

            } else if (result[colNum] === "present") {
                currentItemScore.type = "present";
                currentItemScore.score = 2;
            }
            if (currentItemScore.type !== null) score.push(currentItemScore);
        }
        return score;
    }

    updateScore(result) {
        const scoredResult = this.scoreResult(result);
        this.score.push.apply(this.score, scoredResult);
        return scoredResult;
    }

    getTotalScore() {
        let total = 0;
        for (let item of this.score) {
            if (item.data.wordIndex === this.wordIndex) continue;
            total += item.score;
        }
        return total;
    }

    newWord() {
        this.wordIndex ++;
        console.log("getting new word", this.room.words.length - 1, this.wordIndex);
        let word;
        if (this.room.words.length - 1 < this.wordIndex) {
            word = this.room.addNewWord();
        } else {
            word = this.room.words[this.wordIndex];
        }
        this.clearBoard();
        return word;
    }

    joinRoom(room) {
        this.room = room;
        room.addPlayer(this);
    }

    leaveRoom() {
        this.room.removePlayer(this);
        this.room = null;
    }

    remove() {
        if (this.room) this.room.removePlayer(this);
    }

    emit(...args) {
        this.socket.emit(...args);
    }

    broadcast(...args) {
        for (let socketID in this.room.players) {
            if (socketID == this.socket.id) continue;
            const player = this.room.players[socketID];
            player.emit(...args);
        }
    }
}

module.exports = Player;
