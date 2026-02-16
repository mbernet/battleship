import { animate } from 'animejs'

export function shakeBoard(boardElement) {
    if (!boardElement) {
        return
    }

    animate(boardElement, {
        translateX: [
            { to: -8, duration: 50 },
            { to: 8, duration: 50 },
            { to: -6, duration: 50 },
            { to: 6, duration: 50 },
            { to: -3, duration: 50 },
            { to: 0, duration: 50 }
        ],
        ease: 'inOutSine'
    })
}

export function pulseCell(cellElement) {
    if (!cellElement) {
        return
    }

    animate(cellElement, {
        scale: [
            { to: 1.3, duration: 150 },
            { to: 1, duration: 150 }
        ],
        ease: 'outElastic(1, .5)'
    })
}

export function fadeInMiss(cellElement) {
    if (!cellElement) {
        return
    }

    const dot = cellElement.querySelector('.miss-marker')

    if (dot) {
        animate(dot, {
            opacity: [0, 1],
            scale: [0.5, 1],
            duration: 250,
            ease: 'outQuad'
        })
    }
}

export function explodeHit(cellElement) {
    if (!cellElement) {
        return
    }

    const hitDot = cellElement.querySelector('.hit-marker')

    if (hitDot) {
        animate(hitDot, {
            scale: [0, 1.5, 1],
            opacity: [0, 1],
            duration: 300,
            ease: 'outElastic(1, .6)'
        })
    }
}

export function sunkExplosion(cellElement) {
    if (!cellElement) {
        return
    }

    const star = cellElement.querySelector('.sunk-marker')

    if (star) {
        animate(star, {
            rotate: [0, 360],
            scale: [0, 1.5, 1],
            duration: 500,
            ease: 'outElastic(1, .5)'
        })
    }
}
