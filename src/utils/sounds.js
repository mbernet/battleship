let audioContext = null

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    return audioContext
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
}

function playNoise(duration, volume = 0.2) {
    const ctx = getAudioContext()
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    noise.buffer = buffer
    filter.type = 'lowpass'
    filter.frequency.value = 500

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + duration)
}

export function playMiss() {
    playNoise(0.3, 0.15)
    playTone(200, 0.2, 'sine', 0.1)
}

export function playHit() {
    playTone(300, 0.1, 'square', 0.2)
    playTone(200, 0.15, 'sawtooth', 0.15)

    setTimeout(() => {
        playNoise(0.2, 0.3)
    }, 50)
}

export function playSunk() {
    playTone(400, 0.1, 'square', 0.25)
    playTone(300, 0.15, 'square', 0.2)
    playTone(200, 0.2, 'square', 0.15)

    setTimeout(() => {
        playNoise(0.4, 0.4)
        playTone(100, 0.3, 'sawtooth', 0.2)
    }, 100)

    setTimeout(() => {
        playNoise(0.3, 0.2)
    }, 300)
}

export function playVictory() {
    const notes = [523, 659, 784, 1047]

    notes.forEach((freq, i) => {
        setTimeout(() => {
            playTone(freq, 0.3, 'sine', 0.2)
            playTone(freq * 1.5, 0.3, 'sine', 0.1)
        }, i * 150)
    })
}

export function playDefeat() {
    const notes = [400, 350, 300, 200]

    notes.forEach((freq, i) => {
        setTimeout(() => {
            playTone(freq, 0.4, 'sawtooth', 0.15)
        }, i * 200)
    })
}
