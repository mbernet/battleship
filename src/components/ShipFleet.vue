<script setup>
const props = defineProps({
    ships: {
        type: Array,
        required: true
    },
    label: {
        type: String,
        default: 'Fleet'
    },
    showHealth: {
        type: Boolean,
        default: true
    },
    isEnemy: {
        type: Boolean,
        default: false
    }
})

function getSegmentClass(ship, index) {
    if (!ship.placed) {
        return 'bg-navy-700 border border-navy-600'
    }

    if (ship.sunk) {
        return 'bg-red-900 border border-red-800'
    }

    const isHit = index <= ship.hits

    if (isHit) {
        return 'bg-red-600 border border-red-500'
    }

    return 'bg-slate-500 border border-slate-400'
}
</script>

<template>
    <div class="bg-navy-800/40 rounded-lg p-3 border border-navy-700/50 min-w-[140px]">
        <div class="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">{{ label }}</div>

        <div class="space-y-2">
            <div
                v-for="ship in ships"
                :key="ship.name"
                class="transition-all duration-300"
                :class="{ 'opacity-40': ship.sunk }"
            >
                <div class="flex items-center justify-between mb-1">
                    <span
                        class="text-xs font-medium"
                        :class="ship.sunk ? 'text-red-400 line-through' : ship.placed ? 'text-slate-300' : 'text-slate-500'"
                    >
                        {{ ship.name }}
                    </span>
                    <span v-if="ship.sunk" class="text-xs text-red-400">SUNK</span>
                    <span v-else-if="!ship.placed" class="text-xs text-slate-500">--</span>
                </div>

                <div class="flex gap-0.5">
                    <template v-if="isEnemy && ship.hidden">
                        <div
                            v-for="i in ship.size"
                            :key="i"
                            class="w-5 h-2.5 rounded-sm bg-navy-600 border border-navy-500"
                        >
                            <span class="text-[8px] text-navy-400 flex items-center justify-center h-full">?</span>
                        </div>
                    </template>
                    <template v-else>
                        <div
                            v-for="i in ship.size"
                            :key="i"
                            class="w-5 h-2.5 rounded-sm transition-colors duration-200"
                            :class="getSegmentClass(ship, i)"
                        ></div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
