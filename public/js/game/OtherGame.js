class OtherGame extends Game {
    static addOtherGame() {

    }

    constructor(player) {
        super(player);
    }

    getGameDiv() {
        return super.getGameDiv(true);
    }
    getScoreDiv() {
        return super.getScoreDiv(true);
    }

    setResult(result) {
        return super.setResult(result, false);
    }

    addToDocument() {
        if (otherGamesRightDiv.children.length > otherGamesLeftDiv.children.length) {
            otherGamesLeftDiv.appendChild(this.gameDiv);
        } else {
            otherGamesRightDiv.appendChild(this.gameDiv);
        }

        scoresDiv.appendChild(this.scoreDiv);
        Game.resizeGames();
        Game.resizeScoreDivs();
    }
}
