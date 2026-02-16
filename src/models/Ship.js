class Ship {
    constructor(size) {
        this.size = size
        this.hits = []
    }

    hit(position) {
        if (!this.hits.includes(position)) {
            this.hits.push(position)
        }
    }

    isSunk() {
        return this.hits.length >= this.size
    }
}

export default Ship
