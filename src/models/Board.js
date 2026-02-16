class Board {
    constructor() {
        this.grid = Array.from({ length: 10 }, () => Array(10).fill(null))
        this.ships = []
        this.misses = []
        this.hits = []
        this.attackedCells = new Set()
    }

    placeShip(ship, row, col, direction) {
        const positions = this.getShipPositions(ship, row, col, direction)

        this.validatePlacement(positions)

        for (const pos of positions) {
            this.grid[pos.row][pos.col] = ship
        }

        this.ships.push(ship)
    }

    getShipPositions(ship, row, col, direction) {
        const positions = []

        for (let i = 0; i < ship.size; i++) {
            if (direction === 'horizontal') {
                positions.push({ row, col: col + i })
            } else {
                positions.push({ row: row + i, col })
            }
        }

        return positions
    }

    validatePlacement(positions) {
        for (const pos of positions) {
            if (pos.row < 0 || pos.row >= 10 || pos.col < 0 || pos.col >= 10) {
                throw new Error('Ship placement out of bounds')
            }

            if (this.grid[pos.row][pos.col] !== null) {
                throw new Error('Ship overlaps with another ship')
            }
        }
    }

    receiveAttack(row, col) {
        const key = `${row},${col}`

        if (this.attackedCells.has(key)) {
            throw new Error('Cell already attacked')
        }

        this.attackedCells.add(key)

        const cell = this.grid[row][col]

        if (cell === null) {
            this.misses.push({ row, col })
            return { result: 'miss', ship: null }
        }

        const ship = cell
        const shipPositions = this.findShipPositions(ship)
        const hitIndex = shipPositions.findIndex(pos => pos.row === row && pos.col === col)

        ship.hit(hitIndex)
        this.hits.push({ row, col })

        if (ship.isSunk()) {
            return { result: 'sunk', ship }
        }

        return { result: 'hit', ship }
    }

    findShipPositions(ship) {
        const positions = []

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.grid[row][col] === ship) {
                    positions.push({ row, col })
                }
            }
        }

        return positions
    }

    allShipsSunk() {
        return this.ships.every(ship => ship.isSunk())
    }
}

export default Board
