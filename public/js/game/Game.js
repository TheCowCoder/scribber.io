// TODO: Utils for this function:
function animate(element, className) {
    for (let otherClassName of element.classList) {
        if (otherClassName.slice(0, "anim".length) === "anim" && otherClassName !== className) {
            element.classList.remove(otherClassName);
        }
    }

    if (element.classList.contains(className)) {
        const parent = element.parentElement;
        const nextSibling = element.nextElementSibling;
        element.remove();

        if (nextSibling) {
            parent.insertBefore(element, nextSibling);
        } else {
            parent.appendChild(element);
        }
    }
    element.classList.add(className);

    return new Promise((resolve, reject) => {
        element.addEventListener("animationend", onAnimationEnd);

        function onAnimationEnd(e) {
            const element = e.currentTarget;
            element.classList.remove(className);
            element.removeEventListener("animationend", onAnimationEnd);
            resolve();
        }
    })

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


class Game {
    static ALL_WORDS = null;

    static resizeGames() {

        let totalGamesWidth = 0;
        let totalGamesHeight = 0;

        for (let socketID in socketManager.room.players) {
            const player = socketManager.room.players[socketID];
            if (!player.game) return;
            let board = player.game.gameDiv.lastElementChild;

            for (let row of board.children) {
                for (let letter of row.children) {
                    letter.style.width = null;
                    letter.style.height = null;
                }
            }

            totalGamesWidth += player.game.gameDiv.offsetWidth;
            totalGamesHeight += player.game.gameDiv.offsetHeight;
        }
        totalGamesHeight /= 2;

        let overflowX = totalGamesWidth - document.body.offsetWidth;
        let overflowY = totalGamesHeight - document.body.offsetHeight;

        if (overflowX < 0 && overflowY < 0) return;
        for (let socketID in socketManager.room.players) {
            if (socketID == socketManager.socket.id) continue;

            const player = socketManager.room.players[socketID];
            let board = player.game.gameDiv.lastElementChild;
            for (let row of board.children) {
                for (let letter of row.children) {
                    let deltaX = -((overflowX / row.children.length) / Object.keys(socketManager.room.players).length);
                    let deltaY = -((overflowY / board.children.length) / Object.keys(socketManager.room.players).length);

                    let delta = Math.min(deltaX, deltaY);

                    if (delta == deltaX) {
                        delta -= 10;
                    }
                    else if (delta == deltaY) {
                        delta -= 20;
                    }

                    letter.style.width = letter.offsetWidth + delta + "px";
                    letter.style.height = letter.offsetHeight + delta + "px";
                }
            }
        }
    }

    static resizeScoreDivs() {
        for (let socketID in socketManager.room.players) {
            const player = socketManager.room.players[socketID];
            if (!player.game) return;
            player.game.scoreBarCtx.canvas.width = window.innerWidth - 300;
            player.game.setScore(player.score);
        }
    }

    constructor(player) {
        this.socketManager = socketManager;
        this.player = player;

        this.scoreGoal = 50;

        this.gameDiv = this.getGameDiv();
        this.scoreDiv = this.getScoreDiv();
        this.scoreBarCtx = this.scoreDiv.lastElementChild.previousElementSibling.getContext("2d");

        

        this.player.game = this;

        this.board = null;

        this.currentRow = 0;
        this.currentCol = 0;

        this.lastAnimatedLetter = null;

        this.readyToClear = false;

        this.lastScoreIndex = -1;

        this.wordNum = 0;
        this.numSolved = 0;

        this.setWordNum();


        fetch('/assets/json/all_words.json').then(response => {
            return response.json();
        }).then(ALL_WORDS => {
            Game.ALL_WORDS = ALL_WORDS;
        });
    }


    setGuess(guess) {
        // if (guess)
    }

    start() {
        this.setWordNum();

        console.log("Game started (from Game class)");
        // document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.onkeydown = this.onKeyDown.bind(this);
    }

    onKeyDown(e) {
        if (this.readyToClear) return;
        if (e.key === "Enter") {
            this.submitGuess();
            return;
        }
        if (e.key === "Backspace") {
            if (e.ctrlKey) {
                this.clearRow();
            } else {
                this.backspace();
            }
            return;
        }
        // TODO: Make advanced arrow key navigation and selection
        if (e.key == "a" && e.ctrlKey) {

        }

        if (e.key.length !== 1) return;
        const char = e.key.toUpperCase();
        if (!Letter.validChars.includes(char)) return;
        this.typeChar(char);
    }

    typeChar(char) {
        if (this.currentCol == 5) return;
        this.setChar(char);
        this.currentCol ++;

        this.socketManager.updateGuess(this.getCurrentGuess());
    }

    backspace() {
        if (this.currentCol == 0) return;
        this.currentCol --;
        this.removeChar();

        this.socketManager.updateGuess(this.getCurrentGuess());
    }

    setChar(char) {
        const letterDiv = this.getCurrentLetterDiv();
        letterDiv.firstElementChild.innerText = char;
        letterDiv.classList.add("filled");
        // letterDiv.animate("pop");
        animate(letterDiv, "anim-pop");
    }

    removeChar() {
        const letterDiv = this.getCurrentLetterDiv();
        letterDiv.firstElementChild.innerText = "";
        letterDiv.classList.remove("filled");
    }

    clearRow() {
        let currentCol = this.currentCol;
        for (let i = 0; i < currentCol; i ++) {
            this.backspace();
        }
    }

    clearBoard() {
        for (let rowDiv of this.gameDiv.lastElementChild.children) {
            for (let letterDiv of rowDiv.children) {
                letterDiv.firstElementChild.innerText = "";
                letterDiv.classList.remove("filled");
                letterDiv.classList.remove("correct");
                letterDiv.classList.remove("present");
                letterDiv.classList.remove("absent");
            }
        }
        this.currentRow = 0;
        this.currentCol = 0;
        this.readyToClear = false;
        this.setWordNum();
    }

    getCurrentLetterDiv() {
        return this.getLetterDiv(this.currentRow, this.currentCol);
    }

    getCurrentRowDiv() {
        return this.gameDiv.lastElementChild.children[this.currentRow];
    }

    getLetterDiv(row, col) {
        return this.gameDiv.lastElementChild.children[row].children[col];
    }
    getScoreLetterDiv(col) {
        return this.scoreDiv.lastElementChild.previousElementSibling.children[col];
    }

    getCurrentGuess() {
        let currentGuess = "";
        for (let colNum = 0; colNum < this.currentCol; colNum ++) {
            currentGuess += this.getLetterDiv(this.currentRow, colNum).firstElementChild.innerText;
        }
        return currentGuess;
    }

    isWinningResult(result) {
        for (let col of result) {
            if (col !== "correct") return false;
        }
        return true;
    }

    submitGuess() {
        let guess = this.getCurrentGuess().toLowerCase();
        console.log("Submit guess", guess);

        if (guess.length !== 5) return animate(this.getCurrentRowDiv(), "anim-jiggle");
        if (!Game.ALL_WORDS.includes(guess)) return animate(this.getCurrentRowDiv(), "anim-jiggle");

        this.socketManager.submitGuess(guess, result => {
            if (!result.success) return alert(result.message);

            this.setResult(result.result);

            if (this.isWinningResult(result.result)) {
                console.log("Beat the current word!");
                this.wordNum ++;
                this.numSolved ++;

                this.readyToClear = true;

                // if (this.lastAnimatedLetter) {
                //     console.log("Not ready to clear board because animation is in progress", this.lastAnimatedLetter);
                //     this.lastAnimatedLetter.addEventListener("animationend", onAnimationEnd.bind(this));
                //     function onAnimationEnd(e) {
                //         if (e.animationName !== "FlipOut") return;
                //         const lastAnimatedLetter = e.currentTarget;
                //         console.log("Animation of last letter ended", lastAnimatedLetter);
                //         lastAnimatedLetter.removeEventListener("animationend", onAnimationEnd);
                //         this.clearBoard();

                //     }
                // } else {
                //     console.log("No animatino in progress, clearing");
                //     this.clearBoard();
                // }
 
            } else {
                console.log("The guess wasn't a winning one");
                this.checkGameOver();
            }

        });
    }



    setScore(score) {
        this.scoreBarCtx.clearRect(0, 0, this.scoreBarCtx.canvas.width, this.scoreBarCtx.canvas.height);

        let currentX = 0;
        let currentWordIndex = 0;

        // let newScore

        for (let itemIndex = 0; itemIndex < score.length; itemIndex ++) {
            const item = score[itemIndex];
            if (item.type === "correct") {
                this.scoreBarCtx.fillStyle = "#6aaa64";
            } else if (item.type === "present") {
                this.scoreBarCtx.fillStyle = "#c9b458";
            }

            if (itemIndex > this.lastScoreIndex) {
                // this.scoreBarCtx.fillStyle = "blue";
                this.lastScoreIndex = itemIndex;
            }

            const scaledItemWidth = (this.scoreBarCtx.canvas.width / this.scoreGoal) * item.score;
            this.scoreBarCtx.fillRect(currentX - 1, 0, scaledItemWidth + 1, this.scoreBarCtx.canvas.height);

            this.scoreBarCtx.fillStyle = "black";

            this.scoreBarCtx.fillRect(currentX - 1, 0, 0 + 1, this.scoreBarCtx.canvas.height);

            if (item.data.wordIndex > currentWordIndex) {
                this.scoreBarCtx.fillRect(currentX - 1, 0, 2 + 1, this.scoreBarCtx.canvas.height);
            }
            currentWordIndex = item.data.wordIndex;

            currentX += scaledItemWidth;
        }


    }


    setResult(result, shouldAnimate) {
        if (shouldAnimate === undefined) shouldAnimate = true;

        if (shouldAnimate) {
            async function animateResult(currentRow) {
                this.lastAnimatedLetter = this.getLetterDiv(currentRow, 4);
                for (let colNum = 0; colNum < result.length; colNum ++) {
                    const currentLetterDiv = this.getLetterDiv(currentRow, colNum);
    
                    // I am using an if stement here on purpose, I know i could have just done classList.add(result[colNum]) but I don't just want to set whatever the server responds with as a class
                    if (result[colNum] === "correct") {
                        animateSingleLetter.bind(this)(currentLetterDiv, currentRow, colNum, "correct")
                    } else if (result[colNum] === "present") {
                        animateSingleLetter.bind(this)(currentLetterDiv, currentRow, colNum, "present")
                    } else if (result[colNum] === "absent") {
                        animateSingleLetter.bind(this)(currentLetterDiv, currentRow, colNum, "absent")
                    }
                    await sleep(100);
                }
            }
    
            async function animateSingleLetter(letterDiv, rowNum, colNum, status) {
                await animate(letterDiv, "anim-flip-in");
                letterDiv.classList.add(status);
                await animate(letterDiv, "anim-flip-out");
    
                if (colNum == 4 && this.currentRow - 1 == rowNum) {
                    console.log("Last row finished!");
                    this.lastAnimatedLetter = null;
    
                    if (this.readyToClear) {
                        this.clearBoard();
                    }
                }
    
            }
            animateResult.bind(this)(this.currentRow);
            
        } else {
            for (let colNum = 0; colNum < result.length; colNum ++) {
                const currentLetterDiv = this.getLetterDiv(this.currentRow, colNum);

                // I am using an if stement here on purpose, I know i could have just done classList.add(result[colNum]) but I don't just want to set whatever the server responds with as a class
                if (result[colNum] === "correct") {
                    currentLetterDiv.classList.add("correct");
                } else if (result[colNum] === "present") {
                    currentLetterDiv.classList.add("present");
                } else if (result[colNum] === "absent") {
                    currentLetterDiv.classList.add("absent");
                }
            }
        }


        console.log("SET RESULT", this.currentRow);
        this.currentRow ++;
        this.currentCol = 0;
    }

    checkGameOver() {
        if (this.currentRow == 6) {
            this.gameOver();
        }
    }

    gameOver() {
        // alert("GAME OVER!!!");
        console.log("Local game over detected, clearing board");
        this.readyToClear = true;
        this.wordNum ++;
        this.setWordNum();
        // this.clearBoard();
    }

    getGameDiv(isOtherGame) {
        const gameDiv = document.createElement("div");
        gameDiv.classList.add("game");

        if (isOtherGame) gameDiv.classList.add("other");


        const userDiv = document.createElement("div");
        userDiv.classList.add("user");

        const usernameSpan = document.createElement("span");
        usernameSpan.innerText = this.player.username;
        userDiv.appendChild(usernameSpan);

        const wordNumSpan = document.createElement("span");
        wordNumSpan.innerText = "  •  Solved ";

        const wordNumSpanInner = document.createElement("span");
        wordNumSpanInner.innerText = "-/-";

        wordNumSpan.appendChild(wordNumSpanInner);

        userDiv.appendChild(wordNumSpan);

        gameDiv.appendChild(userDiv);

        const boardDiv = document.createElement("div");
        boardDiv.classList.add("board");

        for (let rowNum = 0; rowNum < 6; rowNum ++) {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("row");
            for (let letterNum = 0; letterNum < 5; letterNum ++) {
                const letterDiv = document.createElement("div");
                letterDiv.classList.add("letter");

                const letterSpan = document.createElement("span");
                letterDiv.appendChild(letterSpan);

                rowDiv.appendChild(letterDiv);
            }
            boardDiv.appendChild(rowDiv);
        }

        gameDiv.appendChild(boardDiv);
        return gameDiv;
    }


    getScoreDiv(isOtherGame) {
        const scoreDiv = document.createElement("div");
        scoreDiv.classList.add("score");

        if (isOtherGame) scoreDiv.classList.add("other");


        const userDiv = document.createElement("div");
        userDiv.classList.add("user");

        const usernameSpan = document.createElement("span");
        usernameSpan.innerText = this.player.username;
        userDiv.appendChild(usernameSpan);

        scoreDiv.appendChild(userDiv);

        const scoreBarCanvas = document.createElement("canvas");
        scoreBarCanvas.classList.add("score-bar");

        scoreBarCanvas.height = 40;

        scoreDiv.appendChild(scoreBarCanvas);

        const finishDiv = document.createElement("div");
        finishDiv.classList.add("finish");

        const flagImg = document.createElement("img");
        flagImg.src = "assets/images/flag.png";
        flagImg.alt = "Finish!";

        finishDiv.appendChild(flagImg);

        scoreDiv.appendChild(finishDiv);

        return scoreDiv;
    }

    setWordNum() {
        this.gameDiv.firstElementChild.lastElementChild.lastElementChild.innerText = `${this.numSolved}/${this.wordNum}`;
    }

    setUsername(username) {
        this.gameDiv.firstElementChild.firstElementChild.innerText = username;
        this.scoreDiv.firstElementChild.firstElementChild.innerText = username;
    }

    addToDocument() {
        console.log("Adding to doc", this.scoreDiv);
        mainGameDiv.appendChild(this.gameDiv);
        scoresDiv.appendChild(this.scoreDiv);

        Game.resizeGames();
        Game.resizeScoreDivs();
    }

    remove() {
        this.gameDiv.remove();
        this.scoreDiv.remove();
        this.player.game = null;
        // document.removeEventListener("keydown", this.onKeyDown.bind(this));

    }


}
