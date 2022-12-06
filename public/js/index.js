const createRoomBtn = id("createRoomBtn");
const joinRoomBtn = id("joinRoomBtn");

const socketManager = new SocketManager();



joinBtn.addEventListener("click", (e) => {
  joinBtn.disabled = true;

  // socketManager.joinRoom();
});

createBtn.addEventListener("click", (e) => {
    createBtn.disabled = true;

    // socketManager.createRoom();
});




// socketManager.event

// function socketManagerEventHandler(event, data) {
//     switch (event) {
//         case "joined": {
//             console.log("Joined, setting username...");
//             socketManager.setUsername("kid", (result) => {
//                 const URLRoomID = window.location.pathname.substring(1);
//                 if (!URLRoomID) return;
//                 if (URLRoomID.length != 5) {
//                     alert("Room not found.");
//                     window.history.replaceState({}, "Racle", "/");
//                     document.title = "Racle";
//                     titleSpan.innerText = "Racle";
//                     return;
//                 }
    
//                 socketManager.joinRoom(URLRoomID);
//             });
//             return;
//         }
//         case "join room": {
//             const result = data;
//             createBtn.disabled = false;
//             joinBtn.disabled = false;

//             if (!result.success) {
//                 alert(result.message);
//                 window.history.replaceState({}, "Racle", "/");
//                 document.title = "Racle";
//                 titleSpan.innerText = "Racle";
//                 return;
//             }

//             console.log("Success joining room!", result);

//             inRoom();
//             return;
//         }
//         case "player join": {
//             const player = data;
//             const game = new OtherGame(player);
//             game.addToDocument();
//             return;
//         }
//         case "player leave": {
//             const player = data;
//             player.game.remove();
//             return;
//         }
//         case "start game": {
//             const result = data;
//             console.log("Start game res:", result);
//             if (!result.success) return alert(result.message);
//             return;

//         }
//         case "game started": {
//             startBtn.innerText = "Started";
//             startBtn.disabled = true;

//             socketManager.getPlayer().game.start();
//             return;
//         }


//         case "reset": {
//             const room = data;

//             startBtn.innerText = "Start";
//             startBtn.disabled = false;

//             startBtn.onclick = onStartBtnClicked;

//             for (let socketID in socketManager.room.players) {
//                 const player = socketManager.room.players[socketID];
//                 player.game.remove();
//             }

//             socketManager.room = room;

//             for (let socketID in room.players) {
//                 const player = room.players[socketID];
//                 let game;
        
//                 if (socketID == socketManager.socket.id) {
//                     game = new Game(player);
//                 } else {
//                     game = new OtherGame(player);
//                 }
        
//                 game.addToDocument();
//             }

//             return;
//         }
//     }
// }

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

