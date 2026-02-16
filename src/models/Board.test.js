import { describe, it, expect } from 'vitest'
import Board from './Board.js'
import Ship from './Ship.js'

describe('Board', () => {
    it('should create a 10x10 grid', () => {
        const board = new Board()

        expect(board.grid.length).toBe(10)
        expect(board.grid[0].length).toBe(10)
    })

    it('should place ship horizontally', () => {
        const board = new Board()
        const ship = new Ship(3)

        board.placeShip(ship, 0, 0, 'horizontal')

        expect(board.grid[0][0]).toBe(ship)
        expect(board.grid[0][1]).toBe(ship)
        expect(board.grid[0][2]).toBe(ship)
    })

    it('should place ship vertically', () => {
        const board = new Board()
        const ship = new Ship(3)

        board.placeShip(ship, 0, 0, 'vertical')

        expect(board.grid[0][0]).toBe(ship)
        expect(board.grid[1][0]).toBe(ship)
        expect(board.grid[2][0]).toBe(ship)
    })

    it('should throw error for horizontal out of bounds', () => {
        const board = new Board()
        const ship = new Ship(3)

        expect(() => board.placeShip(ship, 0, 8, 'horizontal')).toThrow()
    })

    it('should throw error for vertical out of bounds', () => {
        const board = new Board()
        const ship = new Ship(3)

        expect(() => board.placeShip(ship, 8, 0, 'vertical')).toThrow()
    })

    it('should throw error for overlapping ships', () => {
        const board = new Board()
        const ship1 = new Ship(3)
        const ship2 = new Ship(2)

        board.placeShip(ship1, 0, 0, 'horizontal')

        expect(() => board.placeShip(ship2, 0, 1, 'vertical')).toThrow()
    })

    it('should return miss for empty cell', () => {
        const board = new Board()

        const result = board.receiveAttack(0, 0)

        expect(result.result).toBe('miss')
        expect(result.ship).toBe(null)
    })

    it('should return hit for ship cell', () => {
        const board = new Board()
        const ship = new Ship(3)
        board.placeShip(ship, 0, 0, 'horizontal')

        const result = board.receiveAttack(0, 0)

        expect(result.result).toBe('hit')
        expect(result.ship).toBe(ship)
    })

    it('should return sunk when ship fully hit', () => {
        const board = new Board()
        const ship = new Ship(2, 'Destroyer')
        board.placeShip(ship, 0, 0, 'horizontal')

        board.receiveAttack(0, 0)
        const result = board.receiveAttack(0, 1)

        expect(result.result).toBe('sunk')
        expect(result.ship).toBe(ship)
        expect(result.ship.name).toBe('Destroyer')
    })

    it('should throw error for already attacked cell', () => {
        const board = new Board()
        board.receiveAttack(0, 0)

        expect(() => board.receiveAttack(0, 0)).toThrow()
    })

    it('should track missed attacks', () => {
        const board = new Board()

        board.receiveAttack(0, 0)

        expect(board.misses).toContainEqual({ row: 0, col: 0 })
    })

    it('should track hit attacks', () => {
        const board = new Board()
        const ship = new Ship(3)
        board.placeShip(ship, 0, 0, 'horizontal')

        board.receiveAttack(0, 0)

        expect(board.hits).toContainEqual({ row: 0, col: 0 })
    })

    it('should return true for allShipsSunk when all ships sunk', () => {
        const board = new Board()
        const ship = new Ship(2)
        board.placeShip(ship, 0, 0, 'horizontal')

        board.receiveAttack(0, 0)
        board.receiveAttack(0, 1)

        expect(board.allShipsSunk()).toBe(true)
    })

    it('should return false for allShipsSunk when ships remain', () => {
        const board = new Board()
        const ship = new Ship(2)
        board.placeShip(ship, 0, 0, 'horizontal')

        board.receiveAttack(0, 0)

        expect(board.allShipsSunk()).toBe(false)
    })
})
