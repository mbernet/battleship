<script setup>
import { computed, ref, defineExpose } from 'vue'

const boardRef = ref(null)

const props = defineProps({
    board: {
        type: Object,
        required: true
    },
    isEnemy: {
        type: Boolean,
        default: false
    },
    isPlacementMode: {
        type: Boolean,
        default: false
    },
    previewCells: {
        type: Array,
        default: () => []
    },
    isValidPlacement: {
        type: Boolean,
        default: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    lastAttack: {
        type: Object,
        default: null
    },
    showHiddenShips: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['cellClick', 'cellRightClick', 'cellHover', 'cellLeave'])

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function getCellState(row, col) {
    const key = `${row},${col}`

    if (props.board.attackedCells?.has(key)) {
        const cell = props.board.grid[row][col]

        if (cell !== null) {
            return cell.isSunk() ? 'sunk' : 'hit'
        }

        return 'miss'
    }

    if (props.board.grid[row][col] !== null && (!props.isEnemy || props.showHiddenShips)) {
        return 'ship'
    }

    return 'empty'
}

function isPreviewCell(row, col) {
    return props.previewCells.some(p => p.row === row && p.col === col)
}

function isLastAttack(row, col) {
    return props.lastAttack?.row === row && props.lastAttack?.col === col
}

function getCellClasses(row, col) {
    const state = getCellState(row, col)
    const isPreview = isPreviewCell(row, col)

    const base = 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-sm transition-all duration-150 relative border'

    const stateClasses = {
        empty: 'bg-navy-700/80 border-navy-600/50 hover:border-navy-500',
        ship: 'bg-gradient-to-br from-slate-400 to-slate-500 border-slate-400/50',
        hit: 'bg-gradient-to-br from-red-500 to-red-600 border-red-400/50',
        miss: 'bg-navy-800/80 border-navy-700/50',
        sunk: 'bg-gradient-to-br from-red-800 to-red-900 border-red-700/50'
    }

    let classes = `${base} ${stateClasses[state]}`

    if (isPreview) {
        classes += props.isValidPlacement ?
            ' !bg-emerald-500/60 !border-emerald-400 shadow-lg shadow-emerald-500/30' :
            ' !bg-red-500/60 !border-red-400 shadow-lg shadow-red-500/30'
    }

    if (props.isEnemy && !props.disabled && state === 'empty') {
        classes += ' hover:!bg-ocean-dark/70 hover:!border-ocean/50 cursor-crosshair hover:shadow-md hover:shadow-ocean/20'
    } else if (props.isEnemy && props.disabled) {
        classes += ' cursor-not-allowed'
    }

    if (props.isPlacementMode && !props.isEnemy && state === 'empty') {
        classes += ' hover:!bg-navy-500/70 hover:!border-navy-400 cursor-pointer'
    }

    if (isLastAttack(row, col)) {
        classes += ' ring-2 ring-offset-1 ring-offset-navy-900 ring-yellow-400 z-10 animate-pulse'
    }

    return classes
}

function handleClick(row, col) {
    if (props.disabled) {
        return
    }

    emit('cellClick', { row, col })
}

function handleRightClick(event, row, col) {
    event.preventDefault()

    if (props.disabled) {
        return
    }

    emit('cellRightClick', { row, col })
}

function handleHover(row, col) {
    emit('cellHover', { row, col })
}

function handleLeave() {
    emit('cellLeave')
}

function getBoardElement() {
    return boardRef.value
}

function getCellElement(row, col) {
    if (!boardRef.value) {
        return null
    }

    return boardRef.value.querySelector(`[data-cell="${row}-${col}"]`)
}

defineExpose({
    getBoardElement,
    getCellElement
})
</script>

<template>
    <div ref="boardRef" class="inline-block select-none">
        <!-- Column headers -->
        <div class="flex">
            <div class="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"></div>
            <div
                v-for="col in cols"
                :key="col"
                class="w-8 h-6 sm:w-9 sm:h-7 md:w-10 md:h-8 flex items-center justify-center text-ocean-light/70 font-semibold text-xs sm:text-sm"
            >
                {{ col }}
            </div>
        </div>

        <!-- Grid rows -->
        <div v-for="(rowLabel, rowIndex) in rows" :key="rowLabel" class="flex">
            <!-- Row label -->
            <div class="w-6 h-8 sm:w-7 sm:h-9 md:w-8 md:h-10 flex items-center justify-center text-ocean-light/70 font-semibold text-xs sm:text-sm">
                {{ rowLabel }}
            </div>

            <!-- Cells -->
            <div
                v-for="(_, colIndex) in cols"
                :key="colIndex"
                :data-cell="`${rowIndex}-${colIndex}`"
                :class="getCellClasses(rowIndex, colIndex)"
                @click="handleClick(rowIndex, colIndex)"
                @contextmenu="handleRightClick($event, rowIndex, colIndex)"
                @mouseenter="handleHover(rowIndex, colIndex)"
                @mouseleave="handleLeave"
            >
                <!-- Hit marker -->
                <template v-if="getCellState(rowIndex, colIndex) === 'hit'">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="hit-marker w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-500/50 animate-pulse"></div>
                    </div>
                </template>

                <!-- Miss marker -->
                <template v-else-if="getCellState(rowIndex, colIndex) === 'miss'">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="miss-marker w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-500 rounded-full opacity-60"></div>
                    </div>
                </template>

                <!-- Sunk marker -->
                <template v-else-if="getCellState(rowIndex, colIndex) === 'sunk'">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <svg class="sunk-marker w-4 h-4 sm:w-5 sm:h-5 text-orange-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2L12.09 8.26L18 9.27L14 13.14L15.18 19.02L10 16L4.82 19.02L6 13.14L2 9.27L7.91 8.26L10 2Z"/>
                        </svg>
                    </div>
                </template>

                <!-- Ship cell texture (non-enemy only) -->
                <template v-else-if="getCellState(rowIndex, colIndex) === 'ship'">
                    <div class="absolute inset-0.5 rounded-sm bg-gradient-to-br from-white/10 to-transparent"></div>
                </template>
            </div>
        </div>
    </div>
</template>
