const Utils = require("./Utils.js");

class Player {
  constructor(socket) {
    this.socket = socket;

    this.room = null;
    this.username = "Unnammed scribber";
    this.state = "waiting to play";
  }

  
  getForClient() {
    let player = {
      socketId: this.socket.id,
      username: this.username,
      roomId: this.room?.roomId || null
    };

    return player;
  }

  start() {
    this.state = "playing";
  }

  reset() {
    this.state = "waiting to play";
  }

  delete() {
    this.leaveRoom();
  }


  joinRoom(room) {
    this.room = room;
    room.addPlayer(this);

    this.broadcast("playerJoin", this.getForClient());
  }

  leaveRoom() {
    if (this.room) this.room.removePlayer(this);
    this.room = null;

    this.broadcast("playerLeave", this.getForClient());
  }


  emit(...args) {
    this.socket.emit(...args);
  }

  broadcast(...args) {
    for (const socketId in this.room.players) {
      if (socketId == this.socket.id) continue;
      const player = this.room.players[socketId];
      player.emit(...args);
    }
  }
}

module.exports = Player;
