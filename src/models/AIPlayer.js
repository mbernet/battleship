class AIPlayer {
    constructor(targetBoard) {
        this.targetBoard = targetBoard
    }

    chooseTarget() {
        const availableCells = []

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const key = `${row},${col}`

                if (!this.targetBoard.attackedCells.has(key)) {
                    availableCells.push({ row, col })
                }
            }
        }

        const randomIndex = Math.floor(Math.random() * availableCells.length)

        return availableCells[randomIndex]
    }

    attack() {
        const target = this.chooseTarget()
        const attackResult = this.targetBoard.receiveAttack(target.row, target.col)

        return {
            row: target.row,
            col: target.col,
            result: attackResult.result,
            ship: attackResult.ship
        }
    }
}

export default AIPlayer
