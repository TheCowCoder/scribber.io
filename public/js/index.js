const joinBtn = id("join-btn");
const createBtn = id("create-btn");
const homePage = id("home-page");
const gamePage = id("game-page");
const otherGamesLeftDiv = id("other-games-left");
const mainGameDiv = id("main-game");
const otherGamesRightDiv = id("other-games-right");
const scoresDiv = id("scores");
const roomOptionsDiv = id("room-options");
const startBtn = id("start-btn");
const titleSpan = id("title");

const socketManager = new SocketManager(socketManagerEventHandler);



joinBtn.addEventListener("click", (e) => {
    joinBtn.disabled = true;
    joinBtn.innerHTML = "";

    const joinInput = document.createElement("input");
    joinBtn.appendChild(joinInput);
    joinInput.focus();


    // joinInput.addEventListener("input", (e) => {
    //     const char = joinInput.value.slice(-1);
    //     joinInput.value = joinInput.value.slice(0, -1) + char.toUpperCase();
    // });

    joinInput.addEventListener("focus", (e) => {
        joinInput.value = "";
    });

    joinInput.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            const roomID = joinInput.value.trim();
            if (!roomID) return alert("ENTER AN ROOM ID!!!!!!!!");

            // let username = prompt("What's your name?");
            // if (username === null) return joinBtn.disabled = false;
            // username = username.trim();
            // if (!username) return joinBtn.disabled = false;
            

            socketManager.joinRoom(roomID);
        }
    });
});

createBtn.addEventListener("click", (e) => {
    createBtn.disabled = true;

    // let username = prompt("What's your name?");
    // if (username === null) return createBtn.disabled = false;
    // username = username.trim();
    // if (!username) return createBtn.disabled = false;
    

    socketManager.createRoom();
});


// This is so that the SocketManager never has to do anything other than keeping the states of the room and players updated
// Everything that has to do with DOM elements or the game is done in this function
function socketManagerEventHandler(event, data) {
    switch (event) {
        case "joined": {
            console.log("Joined, setting username...");
            socketManager.setUsername("kid", (result) => {
                const URLRoomID = window.location.pathname.substring(1);
                if (!URLRoomID) return;
                if (URLRoomID.length != 5) {
                    alert("Room not found.");
                    window.history.replaceState({}, "Racle", "/");
                    document.title = "Racle";
                    titleSpan.innerText = "Racle";
                    return;
                }
    
                socketManager.joinRoom(URLRoomID);
            });
            return;
        }
        case "join room": {
            const result = data;
            createBtn.disabled = false;
            joinBtn.disabled = false;

            if (!result.success) {
                alert(result.message);
                window.history.replaceState({}, "Racle", "/");
                document.title = "Racle";
                titleSpan.innerText = "Racle";
                return;
            }

            console.log("Success joining room!", result);

            inRoom();
            return;
        }
        case "player join": {
            const player = data;
            const game = new OtherGame(player);
            game.addToDocument();
            return;
        }
        case "player leave": {
            const player = data;
            player.game.remove();
            return;
        }
        case "start game": {
            const result = data;
            console.log("Start game res:", result);
            if (!result.success) return alert(result.message);
            return;

        }
        case "game started": {
            startBtn.innerText = "Started";
            startBtn.disabled = true;

            socketManager.getPlayer().game.start();
            return;
        }
        case "username": {
            const player = data;
            player.game.setUsername(player.username);
            return;
        }
        case "guess": {
            const player = data;
            player.game.setResult(player.board[player.guessIndex - 1]);

            return;
        }
        case "score": {
            const player = data;
            player.game.setScore(player.score);

            return;
        }
        case "word guessed": {
            const player = data;
            player.game.wordNum ++
            player.game.numSolved ++;
            player.game.clearBoard();
 

            return;
        }
        case "word lost": {
            const player = data;
            player.game.wordNum ++;
            player.game.clearBoard();

            return;
        }
        case "win": {
            const player = data;
            player.game.scoreDiv.style.backgroundColor = "gold";
            startBtn.innerText = "Reset";
            startBtn.disabled = false;

            startBtn.onclick = e => {
                startBtn.disabled = true;
                startBtn.innerText = "Resetting";
                socketManager.resetGame();
            };

            return;
        }
        case "reset": {
            const room = data;

            startBtn.innerText = "Start";
            startBtn.disabled = false;

            startBtn.onclick = onStartBtnClicked;

            for (let socketID in socketManager.room.players) {
                const player = socketManager.room.players[socketID];
                player.game.remove();
            }

            socketManager.room = room;

            for (let socketID in room.players) {
                const player = room.players[socketID];
                let game;
        
                if (socketID == socketManager.socket.id) {
                    game = new Game(player);
                } else {
                    game = new OtherGame(player);
                }
        
                game.addToDocument();
            }

            return;
        }
        case "update guess": {
            const player = data.player;
            const guess = data.guess;
            
            if (player.guess.length > guess.length) {
                player.game.currentCol --;
                player.game.removeChar();
            } else if (player.guess.length < guess.length) {
                player.game.setChar("");
                player.game.currentCol ++;

            }
            player.guess = guess;

            return;
        }
        case "set score": {
            const player = data;
            player.game.setScore(player.score);


            return;
        }
    }
}

function onStartBtnClicked() {
    startBtn.disabled = true;
    startBtn.innerText = "Starting";
    socketManager.startGame();
}


// Called once the player has joined a room (this is called after the player creates a room or after a player joins an existing room using roomID)
function inRoom() {
    let room = socketManager.room;
    const title = "Racle | " + room.roomID;
    window.history.replaceState({}, title, "/" + room.roomID);
    document.title = title;
    titleSpan.innerText = title;

    homePage.classList.remove("visible");
    gamePage.classList.add("visible");

    // if (socketManager.room.host)
    if (socketManager.room.host.socketID == socketManager.getPlayer().socketID) {
        console.log("We are the host of this room");
        roomOptionsDiv.classList.add("visible");
    }

    startBtn.onclick = onStartBtnClicked;


    for (let socketID in room.players) {
        const player = room.players[socketID];
        let game;

        if (socketID == socketManager.socket.id) {
            game = new Game(player);
        } else {
            game = new OtherGame(player);
        }

        game.addToDocument();
    }

    window.onresize = () => {
        Game.resizeGames();
        Game.resizeScoreDivs();
    };

}

