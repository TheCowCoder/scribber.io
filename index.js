const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const res = require("express/lib/response");

const Utils = require("./classes/Utils.js");
const Player = require("./classes/Player");
const Room = require("./classes/Room.js");


const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static("public"));


io.on("connection", (socket) => {
  console.log("A user connected!", socket.id);
  let player;

  socket.on("join", (callback) => {
    console.log(socket.id, "joined!");

    player = new Player(socket);

    console.log("created player");

    return callback({
      success: true
    });
  });


  socket.on("create room", (callback) => {
    if (!player) return callback({
      success: false,
      message: "Please wait a bit before creating a room."
    });
    if (player.room) return callback({
      success: false,
      message: "Please leave the room you're in before creating a new one."
    });
    

    const room = new Room(player);
    console.log("Created and joined room", room);


    return callback({
      success: true,
      room: room.getForClient()
    });
  });


  socket.on("join room", (roomId, callback) => {
    if (!player) return callback({
      success: false,
      message: "Please wait a bit before joining a room."
    });
    if (player.room) return callback({
      success: false,
      message: "Please leave the room you're in before joining another one."
    });
    
    console.log(player.username, "joining room", roomId);

    const room = Room.rooms[roomId];

    if (!room) return callback({
      success: false,
      message: "Room not found."
    });


    player.joinRoom(room);
    console.log("they joined the room", room);

    return callback({
      success: true,
      room: room.getForClient()
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

    if (player !== player.room.host) return callback({
      success: false,
      message: "Only the room host can start the game."
    });

    console.log("Game starting!", player.username);

    player.room.start();

    return callback({
      success: true
    });
  })


  socket.on("disconnecting", () => {
    console.log(socket.id, player.username, "disconnecting");
    
    player.delete();
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected!", socket.id);
  });
});


server.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
