<script setup>
import { ref, computed } from 'vue'
import GameBoard from './GameBoard.vue'
import { Board, Ship } from '../models/index.js'

const SHIPS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 }
]

const playerBoard = ref(new Board())
const computerBoard = ref(new Board())
const gamePhase = ref('placement')
const currentShipIndex = ref(0)
const placementDirection = ref('horizontal')
const hoverCell = ref(null)

const currentShip = computed(() => {
    if (currentShipIndex.value >= SHIPS.length) {
        return null
    }

    return SHIPS[currentShipIndex.value]
})

const previewCells = computed(() => {
    if (!currentShip.value || !hoverCell.value) {
        return []
    }

    const cells = []
    const { row, col } = hoverCell.value

    for (let i = 0; i < currentShip.value.size; i++) {
        if (placementDirection.value === 'horizontal') {
            cells.push({ row, col: col + i })
        } else {
            cells.push({ row: row + i, col })
        }
    }

    return cells
})

const isValidPlacement = computed(() => {
    if (previewCells.value.length === 0) {
        return false
    }

    for (const cell of previewCells.value) {
        if (cell.row < 0 || cell.row >= 10 || cell.col < 0 || cell.col >= 10) {
            return false
        }

        if (playerBoard.value.grid[cell.row][cell.col] !== null) {
            return false
        }
    }

    return true
})

function handlePlayerCellClick({ row, col }) {
    if (gamePhase.value !== 'placement' || !currentShip.value) {
        return
    }

    if (!isValidPlacement.value) {
        return
    }

    const ship = new Ship(currentShip.value.size)

    try {
        playerBoard.value.placeShip(ship, row, col, placementDirection.value)
        currentShipIndex.value++

        if (currentShipIndex.value >= SHIPS.length) {
            startGame()
        }
    } catch (e) {
        // Invalid placement, ignore
    }
}

function handlePlayerCellRightClick() {
    toggleDirection()
}

function handlePlayerCellHover({ row, col }) {
    if (gamePhase.value === 'placement') {
        hoverCell.value = { row, col }
    }
}

function handlePlayerCellLeave() {
    hoverCell.value = null
}

function toggleDirection() {
    placementDirection.value = placementDirection.value === 'horizontal' ?
        'vertical' :
        'horizontal'
}

function startGame() {
    gamePhase.value = 'battle'
    placeComputerShips()
}

function placeComputerShips() {
    for (const shipDef of SHIPS) {
        let placed = false

        while (!placed) {
            const row = Math.floor(Math.random() * 10)
            const col = Math.floor(Math.random() * 10)
            const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'
            const ship = new Ship(shipDef.size)

            try {
                computerBoard.value.placeShip(ship, row, col, direction)
                placed = true
            } catch (e) {
                // Try again
            }
        }
    }
}

function handleEnemyCellClick({ row, col }) {
    if (gamePhase.value !== 'battle') {
        return
    }

    try {
        computerBoard.value.receiveAttack(row, col)
    } catch (e) {
        // Already attacked
    }
}

function resetGame() {
    playerBoard.value = new Board()
    computerBoard.value = new Board()
    gamePhase.value = 'placement'
    currentShipIndex.value = 0
    placementDirection.value = 'horizontal'
    hoverCell.value = null
}
</script>

<template>
    <div class="min-h-screen bg-navy-900 text-white p-4 sm:p-8">
        <header class="text-center mb-8">
            <h1 class="text-4xl sm:text-5xl font-bold text-ocean-light tracking-wider mb-2">
                BATTLESHIP
            </h1>
            <p class="text-slate-400">Sink the enemy fleet</p>
        </header>

        <div v-if="gamePhase === 'placement'" class="text-center mb-6">
            <div class="inline-block bg-navy-800 rounded-lg px-6 py-4 border border-navy-600">
                <p class="text-lg mb-2">
                    Place your <span class="text-ocean-light font-bold">{{ currentShip?.name }}</span>
                    <span class="text-slate-400">({{ currentShip?.size }} cells)</span>
                </p>
                <p class="text-sm text-slate-400 mb-3">
                    Click to place &bull; Right-click or button to rotate
                </p>
                <button
                    @click="toggleDirection"
                    class="px-4 py-2 bg-navy-600 hover:bg-navy-500 rounded-lg transition-colors border border-navy-500"
                >
                    Direction: <span class="text-ocean-light font-bold">{{ placementDirection }}</span>
                </button>
            </div>

            <div class="mt-4 flex justify-center gap-2">
                <div
                    v-for="(ship, index) in SHIPS"
                    :key="ship.name"
                    class="flex items-center gap-1 px-3 py-1 rounded text-sm"
                    :class="index < currentShipIndex ? 'bg-green-900/50 text-green-400' :
                            index === currentShipIndex ? 'bg-ocean/20 text-ocean-light border border-ocean' :
                            'bg-navy-800 text-slate-500'"
                >
                    <span v-if="index < currentShipIndex">&#10003;</span>
                    {{ ship.name }}
                </div>
            </div>
        </div>

        <div class="flex flex-col lg:flex-row justify-center items-start gap-8 lg:gap-16">
            <div class="flex flex-col items-center">
                <h2 class="text-xl font-bold mb-4 text-slate-300">
                    <span class="text-ocean-light">&#9875;</span> Your Fleet
                </h2>
                <div class="bg-navy-800/50 p-4 rounded-xl border border-navy-600 shadow-2xl">
                    <GameBoard
                        :board="playerBoard"
                        :is-enemy="false"
                        :is-placement-mode="gamePhase === 'placement'"
                        :preview-cells="previewCells"
                        :is-valid-placement="isValidPlacement"
                        @cell-click="handlePlayerCellClick"
                        @cell-right-click="handlePlayerCellRightClick"
                        @cell-hover="handlePlayerCellHover"
                        @cell-leave="handlePlayerCellLeave"
                    />
                </div>
            </div>

            <div class="flex flex-col items-center">
                <h2 class="text-xl font-bold mb-4 text-slate-300">
                    <span class="text-red-500">&#9876;</span> Enemy Waters
                </h2>
                <div
                    class="bg-navy-800/50 p-4 rounded-xl border border-navy-600 shadow-2xl"
                    :class="{ 'opacity-50': gamePhase === 'placement' }"
                >
                    <GameBoard
                        :board="computerBoard"
                        :is-enemy="true"
                        :disabled="gamePhase === 'placement'"
                        @cell-click="handleEnemyCellClick"
                    />
                </div>
                <p v-if="gamePhase === 'placement'" class="mt-2 text-slate-500 text-sm">
                    Place your ships first
                </p>
            </div>
        </div>

        <div class="text-center mt-8">
            <button
                @click="resetGame"
                class="px-6 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors border border-red-800"
            >
                Reset Game
            </button>
        </div>
    </div>
</template>
