class Utils {
  static makeId(length, possible) {
    let id = "";
    if (!possible) possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (!length) length = 6;

    for (const i = 0; i < length; i++) {
      id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
  }
  static randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  static randItem(array) {
    const randIndex = Utils.randInt(0, array.length);
    return array[randIndex];
  }
}

module.exports = Utils;
