import { describe, it, expect } from 'vitest'
import Ship from './Ship.js'

describe('Ship', () => {
    it('should set correct size from constructor', () => {
        const ship = new Ship(3)

        expect(ship.size).toBe(3)
    })

    it('should mark position as hit', () => {
        const ship = new Ship(3)

        ship.hit(0)

        expect(ship.hits).toContain(0)
    })

    it('should return false for isSunk when not all positions hit', () => {
        const ship = new Ship(3)
        ship.hit(0)
        ship.hit(1)

        expect(ship.isSunk()).toBe(false)
    })

    it('should return true for isSunk when all positions hit', () => {
        const ship = new Ship(3)
        ship.hit(0)
        ship.hit(1)
        ship.hit(2)

        expect(ship.isSunk()).toBe(true)
    })

    it('should not add duplicate hits', () => {
        const ship = new Ship(3)
        ship.hit(0)
        ship.hit(0)

        expect(ship.hits.length).toBe(1)
    })
})
