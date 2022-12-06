const fs = require("fs");
const path = require("path");

class Utils {
    // static ALL_WORDS = JSON.parse(fs.readFileSync(path.join(__dirname, "data/all_words.json")));
    // static ANSWER_WORDS = JSON.parse(fs.readFileSync(path.join(__dirname, "data/answer_words.json")));

    static ALL_WORDS = JSON.parse(fs.readFileSync("data/all_words.json"));
    static ANSWER_WORDS = JSON.parse(fs.readFileSync("data/answer_words.json"));

    static makeID(length, possible) {
        let id = "";
        if (!possible) possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (!length) length = 6;

        for (let i = 0; i < length; i ++) {
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

    static evaluateGuess(guess, answer) {
        let result = Array(5).fill("absent");
        let usedIndexes = [];
        let presentMap = {};

        for (let guessIndex = 0; guessIndex < guess.length; guessIndex ++) {
            // Correct
            if (guess[guessIndex] === answer[guessIndex]) {
                if (presentMap[guessIndex]) {
                    result[presentMap[guessIndex]] = "absent";
                    delete presentMap[guessIndex];
                }
                result[guessIndex] = "correct";
                usedIndexes.push(guessIndex);

                continue;
            }
            // Present
            for (let answerIndex = 0; answerIndex < answer.length; answerIndex ++) {
                if (usedIndexes.includes(answerIndex)) continue;
                if (guess[guessIndex] === answer[answerIndex]) {
                    result[guessIndex] = "present";
                    usedIndexes.push(answerIndex);
                    presentMap[answerIndex] = guessIndex;
                    break;
                }
            }
        }
        return result;
    }

    static isWinningResult(result) {
        for (let col of result) {
            if (col !== "correct") return false;
        }
        return true;
    }
}

module.exports = Utils;
