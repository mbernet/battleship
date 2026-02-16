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
})
