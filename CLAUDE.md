# Battleship Game

Player vs Computer battleship game built with Vue 3 + Vite. Demo project for a training session on AI-assisted development.

## Commands

- `npm run dev` — Start dev server with hot reload
- `npm run build` — Production build
- `npm run test` — Run Vitest unit tests
- `npm run test:watch` — Run tests in watch mode

## Tech Stack

- Vue 3 (Composition API, `<script setup>`)
- Vite
- Plain JavaScript (no TypeScript)
- Tailwind CSS via Play CDN (no build step)
- Vitest for testing
- canvas-confetti, howler, animejs, sweetalert2, vue-toastification

## UI & Libraries

- **Tailwind CSS** via Play CDN (`<script src="https://cdn.tailwindcss.com">`) — use utility classes for all styling, no custom CSS files
- **canvas-confetti** — Confetti effects on sinking ships and winning
- **howler** — Sound effects (explosions, splash, victory)
- **animejs** — DOM animations (board shake on hit, cell transitions)
- **sweetalert2** — Modal dialogs for game over, victory, confirmations
- **vue-toastification** — Toast notifications for shot feedback ("Miss!", "Hit!", "Sunk!")

When adding visual effects, always enhance — never block gameplay. Animations should be fast (<300ms) and non-intrusive.

## Architecture

```
src/
  models/        # Game logic classes (pure JS, no Vue dependency)
    Ship.js
    Board.js
    Player.js
    AIPlayer.js
    Game.js
  components/    # Vue components (presentation only)
  composables/   # Vue composables (bridge between models and UI)
  assets/        # Styles, images, sounds
```

### Key principle: separate logic from UI

All game logic lives in `src/models/` as plain JS classes with zero framework dependency. Vue components only handle rendering and user interaction. This makes the game logic fully testable without mounting components.

## Development Workflow

1. **Write the test first** — Every new class or method starts with a failing test
2. **Implement the minimum** — Make the test pass, nothing more
3. **Refactor** — Clean up while tests are green
4. **Verify** — Run `npm run test` before considering a task done

## Git Workflow

- Commit after each working feature: git commit -m "feat: short description"
- Keep commits small and atomic — one feature per commit

## Code Style

- ES modules (`import`/`export`), no CommonJS
- Classes for models, Composition API for components
- Descriptive method names in English
- Small, focused methods — max ~20 lines per method
- No comments explaining *what*, only *why* when needed

## Design Principles

- **Single Responsibility** — Each class has one job (Ship tracks hits, Board manages grid, AIPlayer decides moves)
- **Dependency Injection** — Game receives Board and Player instances, doesn't create them
- **Pure functions where possible** — Model methods should be deterministic and side-effect free
- **Fail fast** — Validate inputs at boundaries, throw clear errors

## Game Rules

- 10×10 grid per player
- Ships: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2)
- Players alternate turns
- Hit/miss/sunk feedback after each shot
- Computer uses hunt/target algorithm (random until hit, then searches adjacent cells)
- Game ends when all ships of one player are sunk

## Testing Guidelines

- Test files live next to source: `Ship.js` → `Ship.test.js`
- Test behaviour, not implementation
- Each test should be independent — no shared mutable state
- Name tests as sentences: `'should mark cell as hit when ship is present'`
