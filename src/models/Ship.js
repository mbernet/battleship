class Ship {
    constructor(size, name = null) {
        this.size = size
        this.name = name
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
