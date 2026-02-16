class AIPlayer {
    constructor(targetBoard) {
        this.targetBoard = targetBoard
        this.mode = 'HUNT'
        this.targetQueue = []
        this.hitCells = []
        this.orientation = null
    }

    chooseTarget() {
        if (this.mode === 'TARGET' && this.targetQueue.length > 0) {
            return this.chooseFromQueue()
        }

        return this.chooseCheckerboard()
    }

    chooseCheckerboard() {
        const checkerboardCells = []
        const fallbackCells = []

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const key = `${row},${col}`

                if (this.targetBoard.attackedCells.has(key)) {
                    continue
                }

                if ((row + col) % 2 === 0) {
                    checkerboardCells.push({ row, col })
                } else {
                    fallbackCells.push({ row, col })
                }
            }
        }

        if (checkerboardCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * checkerboardCells.length)
            return checkerboardCells[randomIndex]
        }

        const randomIndex = Math.floor(Math.random() * fallbackCells.length)
        return fallbackCells[randomIndex]
    }

    chooseFromQueue() {
        while (this.targetQueue.length > 0) {
            const target = this.targetQueue.shift()
            const key = `${target.row},${target.col}`

            if (!this.targetBoard.attackedCells.has(key)) {
                return target
            }
        }

        return this.chooseCheckerboard()
    }

    attack() {
        const target = this.chooseTarget()
        const attackResult = this.targetBoard.receiveAttack(target.row, target.col)

        console.log('AI attack:', target, 'result:', attackResult.result, 'mode before:', this.mode)

        this.processResult(target, attackResult)

        console.log('AI state after:', 'mode:', this.mode, 'queue:', this.targetQueue, 'hits:', this.hitCells)

        return {
            row: target.row,
            col: target.col,
            result: attackResult.result,
            ship: attackResult.ship
        }
    }

    processResult(target, result) {
        if (result.result === 'hit') {
            this.handleHit(target)
        } else if (result.result === 'sunk') {
            this.handleSunk()
        }
    }

    handleHit(target) {
        this.mode = 'TARGET'
        this.hitCells.push(target)

        if (this.hitCells.length >= 2) {
            this.detectOrientation()
        }

        this.queueAdjacentCells(target)
    }

    detectOrientation() {
        const [first, second] = this.hitCells

        if (first.row === second.row) {
            this.orientation = 'horizontal'
        } else {
            this.orientation = 'vertical'
        }

        this.filterQueueByOrientation()
    }

    queueAdjacentCells(target) {
        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ]

        for (const dir of directions) {
            const newRow = target.row + dir.row
            const newCol = target.col + dir.col

            if (!this.isValidTarget(newRow, newCol)) {
                continue
            }

            if (this.orientation === 'horizontal' && newRow !== target.row) {
                continue
            }

            if (this.orientation === 'vertical' && newCol !== target.col) {
                continue
            }

            const alreadyQueued = this.targetQueue.some(
                t => t.row === newRow && t.col === newCol
            )

            if (!alreadyQueued) {
                this.targetQueue.push({ row: newRow, col: newCol })
            }
        }
    }

    filterQueueByOrientation() {
        if (!this.orientation || this.hitCells.length < 2) {
            return
        }

        const referenceRow = this.hitCells[0].row
        const referenceCol = this.hitCells[0].col

        this.targetQueue = this.targetQueue.filter(target => {
            if (this.orientation === 'horizontal') {
                return target.row === referenceRow
            }

            return target.col === referenceCol
        })
    }

    handleSunk() {
        this.mode = 'HUNT'
        this.targetQueue = []
        this.hitCells = []
        this.orientation = null
    }

    isValidTarget(row, col) {
        if (row < 0 || row >= 10 || col < 0 || col >= 10) {
            return false
        }

        const key = `${row},${col}`
        return !this.targetBoard.attackedCells.has(key)
    }
}

export default AIPlayer
