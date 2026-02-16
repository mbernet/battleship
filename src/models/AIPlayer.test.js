import { describe, it, expect } from 'vitest'
import AIPlayer from './AIPlayer.js'
import Board from './Board.js'
import Ship from './Ship.js'

describe('AIPlayer', () => {
    it('should choose a valid target cell', () => {
        const board = new Board()
        const ai = new AIPlayer(board)

        const target = ai.chooseTarget()

        expect(target.row).toBeGreaterThanOrEqual(0)
        expect(target.row).toBeLessThan(10)
        expect(target.col).toBeGreaterThanOrEqual(0)
        expect(target.col).toBeLessThan(10)
    })

    it('should not choose already attacked cells', () => {
        const board = new Board()
        const ai = new AIPlayer(board)

        board.receiveAttack(0, 0)
        board.receiveAttack(0, 1)

        for (let i = 0; i < 50; i++) {
            const target = ai.chooseTarget()
            expect(target).not.toEqual({ row: 0, col: 0 })
            expect(target).not.toEqual({ row: 0, col: 1 })
        }
    })

    it('should attack the chosen target', () => {
        const board = new Board()
        const ship = new Ship(2, 'Destroyer')
        board.placeShip(ship, 0, 0, 'horizontal')
        const ai = new AIPlayer(board)

        const result = ai.attack()

        expect(result).toHaveProperty('row')
        expect(result).toHaveProperty('col')
        expect(result).toHaveProperty('result')
        expect(['hit', 'miss', 'sunk']).toContain(result.result)
    })

    it('should return ship when hitting', () => {
        const board = new Board()
        const ship = new Ship(2, 'Destroyer')
        board.placeShip(ship, 0, 0, 'horizontal')
        const ai = new AIPlayer(board)

        let hitResult = null

        for (let i = 0; i < 100 && !hitResult; i++) {
            const result = ai.attack()

            if (result.result === 'hit' || result.result === 'sunk') {
                hitResult = result
            }
        }

        if (hitResult) {
            expect(hitResult.ship).toBe(ship)
        }
    })

    it('should eventually attack all cells', () => {
        const board = new Board()
        const ai = new AIPlayer(board)

        for (let i = 0; i < 100; i++) {
            ai.attack()
        }

        expect(board.attackedCells.size).toBe(100)
    })

    describe('Hunt mode (checkerboard pattern)', () => {
        it('should only target checkerboard cells where (row + col) % 2 === 0', () => {
            const board = new Board()
            const ai = new AIPlayer(board)

            for (let i = 0; i < 30; i++) {
                const target = ai.chooseTarget()
                expect((target.row + target.col) % 2).toBe(0)
            }
        })

        it('should skip already attacked cells in checkerboard', () => {
            const board = new Board()
            const ai = new AIPlayer(board)

            board.receiveAttack(0, 0)
            board.receiveAttack(2, 0)

            for (let i = 0; i < 30; i++) {
                const target = ai.chooseTarget()
                expect(target).not.toEqual({ row: 0, col: 0 })
                expect(target).not.toEqual({ row: 2, col: 0 })
            }
        })

        it('should fall back to non-checkerboard cells when checkerboard exhausted', () => {
            const board = new Board()
            const ai = new AIPlayer(board)

            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    if ((row + col) % 2 === 0) {
                        board.receiveAttack(row, col)
                    }
                }
            }

            const target = ai.chooseTarget()

            expect((target.row + target.col) % 2).toBe(1)
        })
    })

    describe('Target mode (after hit)', () => {
        it('should switch to TARGET mode after a hit', () => {
            const board = new Board()
            const ship = new Ship(3, 'Cruiser')
            board.placeShip(ship, 0, 0, 'horizontal')
            const ai = new AIPlayer(board)

            expect(ai.mode).toBe('HUNT')

            board.receiveAttack(0, 0)
            ai.processResult({ row: 0, col: 0 }, { result: 'hit', ship })

            expect(ai.mode).toBe('TARGET')
        })

        it('should queue 4 adjacent cells after hit (up/down/left/right)', () => {
            const board = new Board()
            const ship = new Ship(3, 'Cruiser')
            board.placeShip(ship, 5, 5, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            expect(ai.targetQueue).toContainEqual({ row: 4, col: 5 })
            expect(ai.targetQueue).toContainEqual({ row: 6, col: 5 })
            expect(ai.targetQueue).toContainEqual({ row: 5, col: 4 })
            expect(ai.targetQueue).toContainEqual({ row: 5, col: 6 })
        })

        it('should skip out-of-bounds cells in target queue', () => {
            const board = new Board()
            const ship = new Ship(2, 'Destroyer')
            board.placeShip(ship, 0, 0, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(0, 0)
            ai.processResult({ row: 0, col: 0 }, { result: 'hit', ship })

            expect(ai.targetQueue).not.toContainEqual({ row: -1, col: 0 })
            expect(ai.targetQueue).not.toContainEqual({ row: 0, col: -1 })
            expect(ai.targetQueue).toContainEqual({ row: 1, col: 0 })
            expect(ai.targetQueue).toContainEqual({ row: 0, col: 1 })
        })

        it('should skip already-attacked cells in target queue', () => {
            const board = new Board()
            const ship = new Ship(3, 'Cruiser')
            board.placeShip(ship, 5, 5, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(4, 5)
            board.receiveAttack(5, 4)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            expect(ai.targetQueue).not.toContainEqual({ row: 4, col: 5 })
            expect(ai.targetQueue).not.toContainEqual({ row: 5, col: 4 })
            expect(ai.targetQueue).toContainEqual({ row: 6, col: 5 })
            expect(ai.targetQueue).toContainEqual({ row: 5, col: 6 })
        })

        it('should attack from target queue in TARGET mode', () => {
            const board = new Board()
            const ship = new Ship(3, 'Cruiser')
            board.placeShip(ship, 5, 5, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            const target = ai.chooseTarget()

            const isInQueue = ai.targetQueue.some(
                t => t.row === target.row && t.col === target.col
            ) || (
                (target.row === 4 && target.col === 5) ||
                (target.row === 6 && target.col === 5) ||
                (target.row === 5 && target.col === 4) ||
                (target.row === 5 && target.col === 6)
            )

            expect(isInQueue).toBe(true)
        })
    })

    describe('Ship orientation detection', () => {
        it('should detect horizontal orientation after 2nd hit in same row', () => {
            const board = new Board()
            const ship = new Ship(3, 'Cruiser')
            board.placeShip(ship, 5, 5, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            board.receiveAttack(5, 6)
            ai.processResult({ row: 5, col: 6 }, { result: 'hit', ship })

            expect(ai.orientation).toBe('horizontal')
        })

        it('should detect vertical orientation after 2nd hit in same column', () => {
            const board = new Board()
            const ship = new Ship(3, 'Cruiser')
            board.placeShip(ship, 5, 5, 'vertical')
            const ai = new AIPlayer(board)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            board.receiveAttack(6, 5)
            ai.processResult({ row: 6, col: 5 }, { result: 'hit', ship })

            expect(ai.orientation).toBe('vertical')
        })

        it('should only queue cells in detected orientation direction', () => {
            const board = new Board()
            const ship = new Ship(4, 'Battleship')
            board.placeShip(ship, 3, 3, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(3, 3)
            ai.processResult({ row: 3, col: 3 }, { result: 'hit', ship })

            board.receiveAttack(3, 4)
            ai.processResult({ row: 3, col: 4 }, { result: 'hit', ship })

            const allHorizontal = ai.targetQueue.every(t => t.row === 3)

            expect(allHorizontal).toBe(true)
        })
    })

    describe('Reset to HUNT mode when ship sunk', () => {
        it('should clear target queue when ship is sunk', () => {
            const board = new Board()
            const ship = new Ship(2, 'Destroyer')
            board.placeShip(ship, 5, 5, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            expect(ai.targetQueue.length).toBeGreaterThan(0)

            ai.processResult({ row: 5, col: 6 }, { result: 'sunk', ship })

            expect(ai.targetQueue).toEqual([])
        })

        it('should return to HUNT mode after sinking a ship', () => {
            const board = new Board()
            const ship = new Ship(2, 'Destroyer')
            board.placeShip(ship, 5, 5, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            expect(ai.mode).toBe('TARGET')

            ai.processResult({ row: 5, col: 6 }, { result: 'sunk', ship })

            expect(ai.mode).toBe('HUNT')
        })

        it('should resume hunting with checkerboard pattern after sinking', () => {
            const board = new Board()
            const ship = new Ship(2, 'Destroyer')
            board.placeShip(ship, 5, 5, 'horizontal')
            const ai = new AIPlayer(board)

            board.receiveAttack(5, 5)
            ai.processResult({ row: 5, col: 5 }, { result: 'hit', ship })

            board.receiveAttack(5, 6)
            ai.processResult({ row: 5, col: 6 }, { result: 'sunk', ship })

            const target = ai.chooseTarget()

            expect((target.row + target.col) % 2).toBe(0)
        })
    })

    describe('No duplicate attacks', () => {
        it('should never attack the same cell twice', () => {
            const board = new Board()
            const ship = new Ship(5, 'Carrier')
            board.placeShip(ship, 0, 0, 'horizontal')
            const ai = new AIPlayer(board)

            const attackedCells = new Set()

            for (let i = 0; i < 100; i++) {
                const result = ai.attack()
                const key = `${result.row},${result.col}`

                expect(attackedCells.has(key)).toBe(false)
                attackedCells.add(key)
            }
        })
    })
})
