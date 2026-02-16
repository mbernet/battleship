<script setup>
import { ref, computed, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import confetti from 'canvas-confetti'
import Swal from 'sweetalert2'
import GameBoard from './GameBoard.vue'
import ShipFleet from './ShipFleet.vue'
import { Board, Ship, AIPlayer } from '../models/index.js'
import { playMiss, playHit, playSunk, playVictory, playDefeat } from '../utils/sounds.js'
import { shakeBoard, pulseCell, fadeInMiss, explodeHit, sunkExplosion } from '../utils/animations.js'

const toast = useToast()

const playerBoardRef = ref(null)
const computerBoardRef = ref(null)

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
const isPlayerTurn = ref(true)
const isProcessingTurn = ref(false)
const isComputerThinking = ref(false)
const aiPlayer = ref(null)
const winner = ref(null)
const lastPlayerAttack = ref(null)
const lastComputerAttack = ref(null)
const debugMode = ref(false)

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

const playerShipsStatus = computed(() => {
    return SHIPS.map((shipDef, index) => {
        const placedShip = playerBoard.value.ships.find(s => s.name === shipDef.name)

        return {
            ...shipDef,
            placed: index < currentShipIndex.value || gamePhase.value !== 'placement',
            sunk: placedShip?.isSunk() || false,
            hits: placedShip?.hits?.length || 0
        }
    })
})

const computerShipsStatus = computed(() => {
    return SHIPS.map(shipDef => {
        const placedShip = computerBoard.value.ships.find(s => s.name === shipDef.name)

        return {
            ...shipDef,
            placed: gamePhase.value !== 'placement',
            sunk: placedShip?.isSunk() || false,
            hits: placedShip?.hits?.length || 0,
            hidden: !placedShip?.isSunk()
        }
    })
})

const playerShipsRemaining = computed(() => {
    return playerBoard.value.ships.filter(ship => !ship.isSunk()).length
})

const computerShipsRemaining = computed(() => {
    return computerBoard.value.ships.filter(ship => !ship.isSunk()).length
})

function handlePlayerCellClick({ row, col }) {
    if (gamePhase.value !== 'placement' || !currentShip.value) {
        return
    }

    if (!isValidPlacement.value) {
        return
    }

    const ship = new Ship(currentShip.value.size, currentShip.value.name)

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
    aiPlayer.value = new AIPlayer(playerBoard.value)
}

function placeComputerShips() {
    for (const shipDef of SHIPS) {
        let placed = false

        while (!placed) {
            const row = Math.floor(Math.random() * 10)
            const col = Math.floor(Math.random() * 10)
            const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'
            const ship = new Ship(shipDef.size, shipDef.name)

            try {
                computerBoard.value.placeShip(ship, row, col, direction)
                placed = true
            } catch (e) {
                // Try again
            }
        }
    }
}

async function handleEnemyCellClick({ row, col }) {
    if (gamePhase.value !== 'battle' || !isPlayerTurn.value || isProcessingTurn.value) {
        return
    }

    const key = `${row},${col}`

    if (computerBoard.value.attackedCells.has(key)) {
        toast.warning('Already attacked this cell!')
        return
    }

    isProcessingTurn.value = true

    const attackResult = computerBoard.value.receiveAttack(row, col)
    lastPlayerAttack.value = { row, col }

    await nextTick()
    playAttackEffects(attackResult, computerBoardRef.value, row, col)

    showAttackToast(attackResult, 'player')

    if (computerBoard.value.allShipsSunk()) {
        winner.value = 'player'
        gamePhase.value = 'gameOver'
        isProcessingTurn.value = false
        showVictory()
        return
    }

    isPlayerTurn.value = false
    isComputerThinking.value = true
    setTimeout(computerTurn, 500)
}

function showAttackToast() {
    // Removed - visual feedback on board is sufficient
}

async function computerTurn() {
    const attackResult = aiPlayer.value.attack()
    lastComputerAttack.value = { row: attackResult.row, col: attackResult.col }

    isComputerThinking.value = false

    await nextTick()
    playAttackEffects(attackResult, playerBoardRef.value, attackResult.row, attackResult.col)

    showAttackToast(attackResult, 'computer')

    if (playerBoard.value.allShipsSunk()) {
        winner.value = 'computer'
        gamePhase.value = 'gameOver'
        isProcessingTurn.value = false
        showDefeat()
        return
    }

    isPlayerTurn.value = true
    isProcessingTurn.value = false
}

function playAttackEffects(attackResult, boardRef, row, col) {
    if (!boardRef) {
        return
    }

    const cellElement = boardRef.getCellElement(row, col)
    const boardElement = boardRef.getBoardElement()

    if (attackResult.result === 'miss') {
        playMiss()
        fadeInMiss(cellElement)
    } else if (attackResult.result === 'hit') {
        playHit()
        shakeBoard(boardElement)
        pulseCell(cellElement)
        explodeHit(cellElement)
    } else if (attackResult.result === 'sunk') {
        playSunk()
        shakeBoard(boardElement)
        sunkExplosion(cellElement)

        confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.7 }
        })
    }
}

function showVictory() {
    playVictory()

    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
    })

    setTimeout(() => {
        confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        })
        confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        })
    }, 250)
}

function showDefeat() {
    playDefeat()
}

function confirmReset() {
    if (gamePhase.value === 'placement' && currentShipIndex.value === 0) {
        return
    }

    Swal.fire({
        title: 'Reset Game?',
        text: 'Your current progress will be lost.',
        icon: 'warning',
        confirmButtonText: 'Reset',
        confirmButtonColor: '#dc2626',
        background: '#0f2240',
        color: '#fff',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#1e3a5f'
    }).then((result) => {
        if (result.isConfirmed) {
            resetGame()
        }
    })
}

function resetGame() {
    playerBoard.value = new Board()
    computerBoard.value = new Board()
    gamePhase.value = 'placement'
    currentShipIndex.value = 0
    placementDirection.value = 'horizontal'
    hoverCell.value = null
    isPlayerTurn.value = true
    isProcessingTurn.value = false
    isComputerThinking.value = false
    aiPlayer.value = null
    winner.value = null
    lastPlayerAttack.value = null
    lastComputerAttack.value = null
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-b from-navy-900 via-navy-900 to-navy-800 text-white p-4 sm:p-6 lg:p-8">
        <!-- Header -->
        <header class="text-center mb-6 sm:mb-8">
            <div class="inline-block relative">
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-ocean-light via-ocean to-ocean-light">
                    BATTLESHIP
                </h1>
                <div class="absolute -inset-1 bg-gradient-to-r from-ocean-light/20 via-ocean/10 to-ocean-light/20 blur-xl -z-10"></div>
            </div>
            <p class="text-slate-400 mt-2 text-sm sm:text-base">Naval Combat Strategy Game</p>
        </header>

        <!-- Turn Indicator / Phase Banner -->
        <div class="max-w-md mx-auto mb-6">
            <div
                v-if="gamePhase === 'placement'"
                class="bg-gradient-to-r from-ocean/20 via-ocean/30 to-ocean/20 rounded-xl p-4 border border-ocean/40 shadow-lg shadow-ocean/10"
            >
                <div class="flex items-center justify-between mb-3">
                    <span class="text-ocean-light font-semibold">Deploy Your Fleet</span>
                    <span class="text-slate-400 text-sm">{{ currentShipIndex }}/5 placed</span>
                </div>

                <div class="flex items-center gap-3 mb-3">
                    <div class="flex-1 bg-navy-800 rounded-lg p-3 border border-navy-600">
                        <div class="text-lg font-bold text-white">{{ currentShip?.name }}</div>
                        <div class="flex gap-1 mt-1">
                            <div
                                v-for="i in currentShip?.size"
                                :key="i"
                                class="w-6 h-3 bg-slate-400 rounded-sm"
                            ></div>
                        </div>
                    </div>
                    <button
                        @click="toggleDirection"
                        class="p-3 bg-navy-700 hover:bg-navy-600 rounded-lg transition-all border border-navy-500 hover:border-ocean/50 group"
                        title="Rotate ship (or right-click)"
                    >
                        <svg
                            class="w-6 h-6 text-ocean-light transition-transform group-hover:rotate-90"
                            :class="{ 'rotate-90': placementDirection === 'vertical' }"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                <p class="text-xs text-slate-400 text-center">
                    Click on your board to place • Right-click to rotate
                </p>
            </div>

            <div
                v-else-if="gamePhase === 'battle'"
                class="rounded-xl p-4 border shadow-lg transition-all duration-300"
                :class="isPlayerTurn && !isProcessingTurn
                    ? 'bg-gradient-to-r from-emerald-900/40 via-emerald-800/50 to-emerald-900/40 border-emerald-500/50 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-900/40 via-amber-800/50 to-amber-900/40 border-amber-500/50 shadow-amber-500/20'"
            >
                <div class="flex items-center justify-center gap-3">
                    <div
                        class="w-3 h-3 rounded-full animate-pulse"
                        :class="isPlayerTurn && !isProcessingTurn ? 'bg-emerald-400' : 'bg-amber-400'"
                    ></div>
                    <span class="text-lg font-bold" :class="isPlayerTurn && !isProcessingTurn ? 'text-emerald-300' : 'text-amber-300'">
                        {{ isPlayerTurn && !isProcessingTurn ? 'Your Turn — Fire at Enemy Waters!' : 'Enemy is Targeting...' }}
                    </span>
                </div>
            </div>

            <div
                v-else-if="gamePhase === 'gameOver'"
                class="rounded-xl p-4 border shadow-lg"
                :class="winner === 'player'
                    ? 'bg-gradient-to-r from-emerald-900/40 via-emerald-800/50 to-emerald-900/40 border-emerald-500/50 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-red-900/40 via-red-800/50 to-red-900/40 border-red-500/50 shadow-red-500/20'"
            >
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <div class="text-2xl font-black" :class="winner === 'player' ? 'text-emerald-300' : 'text-red-300'">
                            {{ winner === 'player' ? 'VICTORY' : 'DEFEAT' }}
                        </div>
                        <p class="text-sm" :class="winner === 'player' ? 'text-emerald-400/70' : 'text-red-400/70'">
                            {{ winner === 'player' ? 'Enemy fleet destroyed!' : 'Your fleet was destroyed.' }}
                        </p>
                    </div>
                    <button
                        @click="resetGame"
                        class="px-4 py-2 rounded-lg font-semibold transition-all"
                        :class="winner === 'player'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white'"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Game Area -->
        <div class="flex flex-col xl:flex-row justify-center items-start gap-6 lg:gap-8 xl:gap-12">
            <!-- Player Section -->
            <div class="flex flex-col items-center w-full xl:w-auto">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-ocean/20 flex items-center justify-center">
                        <svg class="w-5 h-5 text-ocean-light" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                    </div>
                    <h2 class="text-lg sm:text-xl font-bold text-slate-200">Your Fleet</h2>
                    <span
                        v-if="gamePhase !== 'placement'"
                        class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                        :class="playerShipsRemaining > 2 ? 'bg-emerald-900/50 text-emerald-400' : playerShipsRemaining > 0 ? 'bg-amber-900/50 text-amber-400' : 'bg-red-900/50 text-red-400'"
                    >
                        {{ playerShipsRemaining }}/5
                    </span>
                </div>

                <div class="flex flex-col lg:flex-row items-center lg:items-start gap-4">
                    <div class="bg-navy-800/60 p-3 sm:p-4 rounded-xl border border-navy-600/50 shadow-xl relative backdrop-blur-sm">
                        <div
                            v-if="isComputerThinking"
                            class="absolute inset-0 bg-navy-900/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
                        >
                            <div class="flex items-center gap-2 text-amber-300 font-bold">
                                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Enemy targeting...
                            </div>
                        </div>
                        <GameBoard
                            ref="playerBoardRef"
                            :board="playerBoard"
                            :is-enemy="false"
                            :is-placement-mode="gamePhase === 'placement'"
                            :preview-cells="previewCells"
                            :is-valid-placement="isValidPlacement"
                            :last-attack="lastComputerAttack"
                            @cell-click="handlePlayerCellClick"
                            @cell-right-click="handlePlayerCellRightClick"
                            @cell-hover="handlePlayerCellHover"
                            @cell-leave="handlePlayerCellLeave"
                        />
                    </div>

                    <ShipFleet
                        :ships="playerShipsStatus"
                        label="Your Ships"
                        :show-health="gamePhase !== 'placement'"
                    />
                </div>
            </div>

            <!-- Divider -->
            <div class="hidden xl:flex flex-col items-center justify-center self-center py-8">
                <div class="w-px h-16 bg-gradient-to-b from-transparent via-navy-500 to-transparent"></div>
                <div class="text-navy-500 text-2xl my-2">VS</div>
                <div class="w-px h-16 bg-gradient-to-b from-transparent via-navy-500 to-transparent"></div>
            </div>

            <!-- Enemy Section -->
            <div class="flex flex-col items-center w-full xl:w-auto">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <h2 class="text-lg sm:text-xl font-bold text-slate-200">Enemy Waters</h2>
                    <span
                        v-if="gamePhase !== 'placement'"
                        class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                        :class="computerShipsRemaining > 2 ? 'bg-red-900/50 text-red-400' : computerShipsRemaining > 0 ? 'bg-amber-900/50 text-amber-400' : 'bg-emerald-900/50 text-emerald-400'"
                    >
                        {{ computerShipsRemaining }}/5
                    </span>
                </div>

                <div class="flex flex-col lg:flex-row items-center lg:items-start gap-4">
                    <div
                        class="bg-navy-800/60 p-3 sm:p-4 rounded-xl border border-navy-600/50 shadow-xl backdrop-blur-sm transition-opacity duration-300"
                        :class="{ 'opacity-40 pointer-events-none': gamePhase === 'placement' }"
                    >
                        <GameBoard
                            ref="computerBoardRef"
                            :board="computerBoard"
                            :is-enemy="true"
                            :disabled="gamePhase !== 'battle' || !isPlayerTurn || isProcessingTurn"
                            :last-attack="lastPlayerAttack"
                            :show-hidden-ships="debugMode"
                            @cell-click="handleEnemyCellClick"
                        />
                    </div>

                    <ShipFleet
                        :ships="computerShipsStatus"
                        label="Enemy Ships"
                        :show-health="false"
                        :is-enemy="true"
                    />
                </div>

                <p v-if="gamePhase === 'placement'" class="mt-3 text-slate-500 text-sm">
                    Deploy your fleet to begin battle
                </p>
            </div>
        </div>

        <!-- Legend -->
        <div class="max-w-md mx-auto mt-8 bg-navy-800/40 rounded-lg p-3 border border-navy-700/50">
            <div class="flex flex-wrap justify-center gap-4 text-xs">
                <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 bg-navy-700 rounded border border-navy-600"></div>
                    <span class="text-slate-400">Water</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 bg-slate-500 rounded border border-slate-400"></div>
                    <span class="text-slate-400">Ship</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 bg-navy-800 rounded border border-navy-600 flex items-center justify-center">
                        <div class="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                    <span class="text-slate-400">Miss</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 bg-red-600 rounded border border-red-500 flex items-center justify-center">
                        <div class="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    </div>
                    <span class="text-slate-400">Hit</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 bg-red-900 rounded border border-red-800 flex items-center justify-center">
                        <svg class="w-2.5 h-2.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2L12.09 8.26L18 9.27L14 13.14L15.18 19.02L10 16L4.82 19.02L6 13.14L2 9.27L7.91 8.26L10 2Z"/>
                        </svg>
                    </div>
                    <span class="text-slate-400">Sunk</span>
                </div>
            </div>
        </div>

        <!-- Reset Button & Debug Toggle -->
        <div class="flex justify-center items-center gap-4 mt-6">
            <button
                @click="confirmReset"
                class="px-4 py-2 text-sm text-slate-400 hover:text-red-300 transition-colors"
            >
                Reset Game
            </button>
            <button
                @click="debugMode = !debugMode"
                class="px-3 py-2 text-sm rounded transition-colors flex items-center gap-1.5"
                :class="debugMode
                    ? 'bg-amber-900/50 text-amber-300 border border-amber-600/50'
                    : 'text-slate-500 hover:text-slate-300'"
                title="Debug: Show enemy ships"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="debugMode" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path v-if="debugMode" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span>Debug</span>
            </button>
        </div>
    </div>
</template>
