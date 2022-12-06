const Utils = require("./Utils.js");

class Room {
  static rooms = {};

  static makeRoomId() {
    let roomId = Utils.makeID(4);
    while (roomId in Room.rooms) roomId = Utils.makeId(4);
    return roomId;
  }

  constructor(host) {
    this.roomId = Room.makeRoomId();
    this.players = {};
    this.state = "waiting to start";
    
    this.host = host;
    this.host.joinRoom(this);

    Room.rooms[roomId] = this;
  }

  getForClient() {
    let room = {
      roomID: this.roomID,
      players: {},
      state: this.state,
      host: this.host.getForClient()
    };
    
    for (const socketID in this.players) {
      const player = this.players[socketID];
      room.players[socketID] = player.getForClient();
    }
    
    return room;
  }

  start() {
    this.state = "in progress";

    for (const socketID in this.players) {
      const player = this.players[socketID];

      player.start();
    }

    this.emit("gameStart");
  }

  reset() {
    this.state = "waiting to start";

    for (const socketID in this.players) {
      const player = this.players[socketID];
      
      player.reset();
    }
  }


  delete() {
    for (const socketId in this.players) {
      this.players[socketId].leaveRoom();
    }
    delete Room.rooms[this.roomId];
  }


  addPlayer(player) {
    this.players[player.socket.id] = player;
    player.room = this;
  }
  removePlayer(player) {
    delete this.players[player.socket.id];
    player.room = null;

    if (Object.keys(this.players).length == 0) {
      this.delete();
      console.log("Last player left, deleting this room.");
    }
  }

  emit(...args) {
    for (const socketID in this.players) {
      const player = this.players[socketID];
      player.emit(...args);
    }
  }
}

module.exports = Room;
