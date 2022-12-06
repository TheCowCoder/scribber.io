class SocketManager {
  constructor() {
    this.socket = io({ reconnection: false });

    this.room = null;

    const onevent = this.socket.onevent;
    this.socket.onevent = (packet) => {
        const args = packet.data || [];
        onevent.call(this, packet);
        packet.data = ["*"].concat(args);
        onevent.call(this, packet);
    };

    socket.on("*", this.receiveEvent.bind(this));

    // this.socket.on("connect", this.onConnect.bind(this));
    // this.socket.on("playerJoin", this.onPlayerJoin.bind(this));
    // this.socket.on("playerLeave", this.onPlayerLeave.bind(this));
    // this.socket.on("gameStart", this.onGameStart.bind(this));

    this.events = {};
  }

  addEventListener(event, callback) {
    this.events[event] = callback;
  }

  // Utils
  getPlayer() {
    return this.room.players[this.socket.id];
  }


  // Recieve from server
  receiveEvent(event, ...args) {
    console.log("[SocketManager] receive", event, args);
    if (this.events[event]) this.events[event](...args);

    console.log("got event", "on" + event[0].toUpperCase() + event.slice(1));
    // this["on" + event[0].toUpperCase() + event.slice(1)]
  }
  
  onConnect() {
    console.log("[SocketManager] [receive] onConnect");
  }

  onPlayerJoin(player, room) {
    console.log("[SocketManager] [receive] onPlayerJoin", player, room);

    this.room = room;
  }

  onPlayerLeave(player, room) {
    console.log("[SocketManager] [receive] onPlayerLeave", player, room);

    this.room = room;
  }

  onGameStart(room) {
    console.log("[SocketManager] [receive] onGameStart", room);

    this.room = room;
  }

  // Send to server
  sendEvent(event, ...args) {
    return new Promise((resolve, reject) => {
      this.socket.emit("startGame", ...args, (result) => {
        console.log("[SocketManager] [send]", event, ...args, result);
        if (!result.success) {
          console.log("[SocketManager] [ERROR]", event);
          return reject(result);
        }

        if (result.room) {
          this.room = result.room;
        }
        return resolve(result);
      });
    });
  }
  
  async startGame() {
    const result = await this.sendEvent("startGame");
    return result;
  }

  async resetGame() {
    const result = await this.sendEvent("resetGame");
    return result;
  }

  async createRoom() {
    const result = await this.sendEvent("createRoom");
    return result;
  }

  async joinRoom(roomId) {
    const result = await this.sendEvent("joinRoom", roomId);
    return result;
  }
}
