import { describe, it, expect } from 'vitest'
import Game from './Game.js'
import Board from './Board.js'
import Ship from './Ship.js'

describe('Game', () => {
    it('should create player and computer boards', () => {
        const game = new Game()

        expect(game.playerBoard).toBeInstanceOf(Board)
        expect(game.computerBoard).toBeInstanceOf(Board)
    })

    it('should start with player as current player', () => {
        const game = new Game()

        expect(game.currentPlayer).toBe('player')
    })

    it('should attack opponent board', () => {
        const game = new Game()
        const ship = new Ship(2)
        game.computerBoard.placeShip(ship, 0, 0, 'horizontal')

        const result = game.attack(0, 0)

        expect(result.result).toBe('hit')
    })

    it('should switch turn between players', () => {
        const game = new Game()

        game.switchTurn()

        expect(game.currentPlayer).toBe('computer')

        game.switchTurn()

        expect(game.currentPlayer).toBe('player')
    })

    it('should return null for getWinner when game ongoing', () => {
        const game = new Game()
        const ship = new Ship(2)
        game.computerBoard.placeShip(ship, 0, 0, 'horizontal')

        expect(game.getWinner()).toBe(null)
    })

    it('should return player as winner when computer ships all sunk', () => {
        const game = new Game()
        const ship = new Ship(2)
        game.computerBoard.placeShip(ship, 0, 0, 'horizontal')

        game.attack(0, 0)
        game.attack(0, 1)

        expect(game.getWinner()).toBe('player')
    })

    it('should return computer as winner when player ships all sunk', () => {
        const game = new Game()
        const ship = new Ship(2)
        game.playerBoard.placeShip(ship, 0, 0, 'horizontal')
        game.switchTurn()

        game.attack(0, 0)
        game.attack(0, 1)

        expect(game.getWinner()).toBe('computer')
    })

    it('should return correct isGameOver state', () => {
        const game = new Game()
        const ship = new Ship(2)
        game.computerBoard.placeShip(ship, 0, 0, 'horizontal')

        expect(game.isGameOver()).toBe(false)

        game.attack(0, 0)
        game.attack(0, 1)

        expect(game.isGameOver()).toBe(true)
    })
})
