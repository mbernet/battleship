import Board from './Board.js'

class Game {
    constructor() {
        this.playerBoard = new Board()
        this.computerBoard = new Board()
        this.currentPlayer = 'player'
    }

    attack(row, col) {
        const targetBoard = this.currentPlayer === 'player' ?
            this.computerBoard :
            this.playerBoard

        return targetBoard.receiveAttack(row, col)
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === 'player' ?
            'computer' :
            'player'
    }

    getWinner() {
        if (this.computerBoard.allShipsSunk() && this.computerBoard.ships.length > 0) {
            return 'player'
        }

        if (this.playerBoard.allShipsSunk() && this.playerBoard.ships.length > 0) {
            return 'computer'
        }

        return null
    }

    isGameOver() {
        return this.getWinner() !== null
    }
}

export default Game
