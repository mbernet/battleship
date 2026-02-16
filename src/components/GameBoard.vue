<script setup>
import { computed } from 'vue'

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

    if (!props.isEnemy && props.board.grid[row][col] !== null) {
        return 'ship'
    }

    return 'empty'
}

function isPreviewCell(row, col) {
    return props.previewCells.some(p => p.row === row && p.col === col)
}

function getCellClasses(row, col) {
    const state = getCellState(row, col)
    const isPreview = isPreviewCell(row, col)

    const base = 'w-8 h-8 sm:w-10 sm:h-10 border border-navy-600 transition-all duration-150 relative'

    const stateClasses = {
        empty: 'bg-navy-700',
        ship: 'bg-slate-500',
        hit: 'bg-red-600',
        miss: 'bg-navy-800',
        sunk: 'bg-red-900'
    }

    let classes = `${base} ${stateClasses[state]}`

    if (isPreview) {
        classes += props.isValidPlacement ?
            ' bg-green-500/50 border-green-400' :
            ' bg-red-500/50 border-red-400'
    }

    if (props.isEnemy && !props.disabled && state === 'empty') {
        classes += ' hover:bg-ocean-dark cursor-crosshair'
    }

    if (props.isPlacementMode && !props.isEnemy && state === 'empty') {
        classes += ' hover:bg-navy-500 cursor-pointer'
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
</script>

<template>
    <div class="inline-block">
        <div class="flex">
            <div class="w-8 h-8 sm:w-10 sm:h-10"></div>
            <div
                v-for="col in cols"
                :key="col"
                class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-ocean-light font-bold text-sm"
            >
                {{ col }}
            </div>
        </div>

        <div v-for="(rowLabel, rowIndex) in rows" :key="rowLabel" class="flex">
            <div class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-ocean-light font-bold text-sm">
                {{ rowLabel }}
            </div>
            <div
                v-for="(_, colIndex) in cols"
                :key="colIndex"
                :class="getCellClasses(rowIndex, colIndex)"
                @click="handleClick(rowIndex, colIndex)"
                @contextmenu="handleRightClick($event, rowIndex, colIndex)"
                @mouseenter="handleHover(rowIndex, colIndex)"
                @mouseleave="handleLeave"
            >
                <template v-if="getCellState(rowIndex, colIndex) === 'hit'">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                    </div>
                </template>
                <template v-else-if="getCellState(rowIndex, colIndex) === 'miss'">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-2 h-2 bg-slate-400 rounded-full"></div>
                    </div>
                </template>
                <template v-else-if="getCellState(rowIndex, colIndex) === 'sunk'">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2L12.09 8.26L18 9.27L14 13.14L15.18 19.02L10 16L4.82 19.02L6 13.14L2 9.27L7.91 8.26L10 2Z"/>
                        </svg>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
