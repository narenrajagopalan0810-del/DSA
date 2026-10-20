# ⛩️ TOWER OF HANOI: SAMURAI RECURSION DOJO ⛩️

> **A high-performance algorithmic dojo uniting an ultra-fast Native C recursion engine with an immersive Edo/Neo-Tokyo Arcade experience.**

[![Language: C](https://img.shields.io/badge/Engine-Pure%20C%20(C99%2FC11)-00599C?style=for-the-badge&logo=c&logoColor=white)](c_backend/)
[![Architecture: WinSock2 / POSIX](https://img.shields.io/badge/Networking-WinSock2%20%2F%20POSIX-00ffaa?style=for-the-badge)](c_backend/server.c)
[![Algorithm: O(2^N) Recursion](https://img.shields.io/badge/Algorithm-Optimal%20Divide%20%26%20Conquer-ffcf33?style=for-the-badge)](c_backend/hanoi.c)
[![Frontend: Vanilla Arcade](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3%20%2F%20JS-ff3366?style=for-the-badge)](index.html)
[![Themes: 4 Japanese Edo Styles](https://img.shields.io/badge/Themes-Edo%20%2F%20Cyber%20%2F%20Sakura%20%2F%20Dojo-a855f7?style=for-the-badge)](styles.css)

---

## 📑 TABLE OF CONTENTS
1. [Executive Summary & Core Philosophy](#-executive-summary--core-philosophy)
2. [⚡ THE NATIVE C BACKEND: THE HEART OF THE DOJO](#-the-native-c-backend-the-heart-of-the-dojo)
   - [Core Architecture & Low-Level Design](#core-architecture--low-level-design)
   - [C Data Structures & State Representation](#c-data-structures--state-representation)
   - [The Recursive Divide-and-Conquer Engine](#the-recursive-divide-and-conquer-engine)
   - [Arbitrary State Hint Analyzer](#arbitrary-state-hint-analyzer)
   - [High-Speed WinSock2 / POSIX HTTP Server](#high-speed-winsock2--posix-http-server)
   - [C REST API Reference & Endpoints](#c-rest-api-reference--endpoints)
   - [Native C CLI Terminal Game (`hanoi_cli.c`)](#native-c-cli-terminal-game-hanoi_clic)
3. [⛩️ THE HERO PAGE: SENSEI KENJI'S SACRED CHRONICLES](#-the-hero-page-sensei-kenjis-sacred-chronicles)
   - [Pillar I: The Cosmic Legend of Benares](#pillar-i-the-cosmic-legend-of-benares)
   - [Pillar II: The Three Sacred Laws of Combat](#pillar-ii-the-three-sacred-laws-of-combat)
   - [Pillar III: The Recursion Strategy & Mathematical Proof ($2^N - 1$)](#pillar-iii-the-recursion-strategy--mathematical-proof-2n---1)
   - [Pillar IV: Live Interactive Mini-Dojo Visualizer](#pillar-iv-live-interactive-mini-dojo-visualizer)
4. [⚔️ KATANA SLASH TRANSITIONS & ARCADE VISUALS](#-katana-slash-transitions--arcade-visuals)
5. [🎮 ARCADE GAME DOJO & MODES](#-arcade-game-dojo--modes)
6. [🚀 QUICK START & COMPILATION GUIDE](#-quick-start--compilation-guide)
7. [📁 REPOSITORY DIRECTORY STRUCTURE](#-repository-directory-structure)

---

## 🌟 EXECUTIVE SUMMARY & CORE PHILOSOPHY

**Tower of Hanoi: Samurai Recursion Dojo** is not merely an educational puzzle—it is a full-stack technical demonstration of how **bare-metal native C programming** integrates seamlessly with modern, aesthetically breathtaking web design.

```
       =========================================================
       ⛩️            SAMURAI HANOI SYSTEM ARCHITECTURE         ⛩️
       =========================================================

       +-------------------------------------------------------+
       |               FRONTEND ARCADE INTERFACE               |
       |  - Master Kenji Hero Page & 4 Knowledge Pillars       |
       |  - 3-Disk Interactive Live Mini-Dojo Visualizer       |
       |  - Katana Slash Cinematic Screen Transitions          |
       |  - Web Audio 8-Bit Chime SFX & YouTube BGM Player     |
       |  - Animated Falling Sakura Canvas & CRT Scanlines     |
       +---------------------------+---------------------------+
                                   |
                         HTTP / REST API (Port 8080)
                         CORS Enabled / JSON Payloads
                                   |
       +---------------------------v---------------------------+
       |             ⚡ NATIVE C RECURSION ENGINE              |
       |                   (c_backend/)                        |
       |  +-------------------------------------------------+  |
       |  | server.c: Native WinSock2 / POSIX HTTP Server    |  |
       |  +-------------------------------------------------+  |
       |  | hanoi.c:                                        |  |
       |  |  • O(2^N) Recursive Optimal Step Generator      |  |
       |  |  • Strict Shogun Rule Move Validator            |  |
       |  |  • Arbitrary Board State Hint Analyzer          |  |
       |  |  • Zero-Allocation Stack Memory Serialization   |  |
       |  +-------------------------------------------------+  |
       |  | hanoi_cli.c: Standalone ANSI Pagoda CLI Terminal|  |
       |  +-------------------------------------------------+  |
       +-------------------------------------------------------+
```

---

## ⚡ THE NATIVE C BACKEND: THE HEART OF THE DOJO

The centerpiece of this project is the **Native C Backend** located in [`c_backend/`](c_backend/). Rather than delegating complex algorithm generation, rule verification, and board state analysis to interpreted client-side scripts, all core logic is implemented in **ISO C99/C11** for microsecond execution speeds, predictable memory footprints, and raw algorithmic purity.

### Core Architecture & Low-Level Design

The C backend is designed around three architectural pillars:
1. **Zero External Dependencies**: Pure standard C libraries (`<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<stdbool.h>`) plus native operating system sockets (`ws2_32.lib` on Windows WinSock2, standard POSIX sockets on Linux/macOS).
2. **Fixed-Buffer Stack Allocation**: Critical state objects avoid dynamic heap thrashing, operating with deterministic arrays and pre-allocated move buffers.
3. **Dual Execution Modes**:
   - **Daemon HTTP Server (`hanoi_server.exe`)**: Serves the REST API to the browser frontend and delivers static assets.
   - **Terminal CLI Suite (`hanoi_cli.exe`)**: Standalone interactive terminal application with ASCII pagoda renderings, auto-solver benchmarking, and interactive move evaluation.

---

### C Data Structures & State Representation

Defined in [`c_backend/hanoi.h`](c_backend/hanoi.h):

```c
#define MAX_DISKS 12
#define NUM_PEGS 3
#define MAX_MOVES 4096

/* Represents the complete Tower of Hanoi game state */
typedef struct {
    int pegs[NUM_PEGS][MAX_DISKS]; /* pegs[i][0] = bottom disk, pegs[i][counts[i]-1] = top disk */
    int counts[NUM_PEGS];          /* Disk count on each peg */
    int num_disks;                 /* Total disks active in trial (1 to MAX_DISKS) */
} HanoiState;

/* Represents a single verified disk move */
typedef struct {
    int disk;      /* Disk index (1 = smallest, N = largest) */
    int from_peg;  /* Source peg: 0=A, 1=B, 2=C */
    int to_peg;    /* Target peg: 0=A, 1=B, 2=C */
    int step;      /* Move sequence index (1-based) */
} HanoiMove;

/* Pre-allocated sequence of recursive moves */
typedef struct {
    HanoiMove moves[MAX_MOVES];
    int count;
} MoveList;
```

---

### The Recursive Divide-and-Conquer Engine

Located in [`c_backend/hanoi.c`](c_backend/hanoi.c), `hanoi_solve_recursive` implements the mathematically optimal $O(2^N - 1)$ sequence:

```c
void hanoi_solve_recursive(int n, int from_peg, int to_peg, int aux_peg, MoveList *list) {
    if (n <= 0) return;

    /* Base Case: Move single disk directly */
    if (n == 1) {
        if (list->count < MAX_MOVES) {
            list->moves[list->count].disk = 1;
            list->moves[list->count].from_peg = from_peg;
            list->moves[list->count].to_peg = to_peg;
            list->moves[list->count].step = list->count + 1;
            list->count++;
        }
        return;
    }

    /* Step 1: Move top n-1 disks from Source to Auxiliary */
    hanoi_solve_recursive(n - 1, from_peg, aux_peg, to_peg, list);

    /* Step 2: Move disk n from Source to Target */
    if (list->count < MAX_MOVES) {
        list->moves[list->count].disk = n;
        list->moves[list->count].from_peg = from_peg;
        list->moves[list->count].to_peg = to_peg;
        list->moves[list->count].step = list->count + 1;
        list->count++;
    }

    /* Step 3: Move n-1 disks from Auxiliary to Target */
    hanoi_solve_recursive(n - 1, aux_peg, to_peg, from_peg, list);
}
```

---

### Arbitrary State Hint Analyzer

Unlike trivial solvers that only understand the initial configuration, the native C function `hanoi_get_hint` in `hanoi.c` can evaluate **any arbitrary, mid-game board state** and compute the exact next optimal move:
- Identifies the highest disk $D$ currently on an incorrect peg.
- Determines whether the smaller sub-stack must be cleared to the auxiliary peg or if $D$ can immediately advance to target.
- Emits advice text: e.g. `"Move Disk 2 from Tower B to Tower C to free the path for the Shogun disk!"`.

---

### High-Speed WinSock2 / POSIX HTTP Server

Defined in [`c_backend/server.c`](c_backend/server.c):
- Listens on port `8080`.
- Implements custom non-blocking HTTP request parser handling `GET`, `POST`, and `OPTIONS` with pre-flight CORS support (`Access-Control-Allow-Origin: *`).
- Delivers JSON responses formatted in-memory without memory leaks.
- Capable of sustaining thousands of requests per second with negligible CPU usage.

---

### C REST API Reference & Endpoints

| Method | Endpoint | Description | Input / Parameters | Response Format |
|---|---|---|---|---|
| `GET` | `/api/health` | Verifies C server health & engine version | None | `{"status":"ok","engine":"Samurai C Hanoi","version":"1.0"}` |
| `GET` | `/api/solve` | Executes $O(2^N)$ C recursion algorithm | `?disks=N` (e.g. `disks=4`) | `{"disks":4,"min_moves":15,"count":15,"moves":[...]}` |
| `POST` | `/api/move` | Validates & executes move strictly in C | `{"from":0,"to":2,"disks":4,"towers":[[4,3,2,1],[],[]]}` | `{"valid":true,"state":{...},"moved_disk":1}` |
| `POST` | `/api/hint` | Solves next move from arbitrary state | `{"towers":[[4,3],[1],[2]],"disks":4}` | `{"has_hint":true,"from":1,"to":2,"disk":1,"advice":"..."}` |
| `GET` | `/api/metrics` | Returns complexity metrics ($2^N - 1$) | `?disks=N` | `{"disks":N,"min_moves":...,"complexity":"O(2^N)"}` |

---

### Native C CLI Terminal Game (`hanoi_cli.c`)

The C backend includes a full standalone terminal executable [`c_backend/hanoi_cli.c`](c_backend/hanoi_cli.c):

```
       =========================================================
         ⛩️  TOWER OF HANOI: SAMURAI TERMINAL EDITION  ⛩️
       =========================================================

             |                    |                    |        
            [1]                   |                    |        
           [ 2 ]                  |                    |        
          [  3  ]                 |                    |        
       ==================   ==================   ==================
           TOWER A              TOWER B              TOWER C    

       Moves Made: 0  |  Optimal Target: 7
       Command (e.g., 'A C', 'hint', 'solve', 'quit'): 
```

Features:
- ANSI colored disk lacquer graphics.
- Interactive terminal command parser (`A B`, `A C`, `B C`, `hint`, `solve`, `reset`, `quit`).
- Automated recursive benchmarking showing microseconds taken per depth.

---

## ⛩️ THE HERO PAGE: SENSEI KENJI'S SACRED CHRONICLES

When visiting the dojo, the user is greeted by a **full-page Hero Experience** featuring **Master Kenji** (`assets/samurai.jpg`). Designed with Japanese Edo and Neo-Tokyo aesthetics, it breaks down the Tower of Hanoi into **Four Sacred Pillars**:

### Pillar I: The Cosmic Legend of Benares
- **The 64 Golden Needles of Lord Brahma**: Deep mythology of the temple priests in Benares moving 64 golden disks on three diamond needles.
- **The Cosmic Math**: Demonstrates that $2^{64} - 1 = 18,446,744,073,709,551,615$ moves. At one move per second, completion requires **584.9 Billion Years** (over 42 times the age of our 13.8 billion-year-old universe!).
- **Historical Heritage**: The creation of the puzzle in 1883 by French mathematician Édouard Lucas under the pseudonym *"N. Claus de Siam"*.

### Pillar II: The Three Sacred Laws of Combat
1. **Law I: Singular Motion (単一の動き)**: Only one disk may be moved at a time.
2. **Law II: The Summit (頂の掟)**: Only the uppermost disk of a peg may be lifted.
3. **Law III: The Shogun's Armor (主従の掟)**: No larger disk may EVER rest atop a smaller disk.
- **Interactive Rule Comparator**: Live interactive tester demonstrating valid moves (green aura + placement chime) vs forbidden moves (red aura + error buzzer).

### Pillar III: The Recursion Strategy & Mathematical Proof ($2^N - 1$)
- **The 3 Samurai Katas**:
  - Kata 1: Move top $N-1$ disks from Source (A) to Auxiliary (B).
  - Kata 2: Move base disk $N$ directly from Source (A) to Target (C).
  - Kata 3: Move $N-1$ disks from Auxiliary (B) to Target (C).
- **Recurrence Formula Derivation**:
  $$T(N) = 2 \cdot T(N-1) + 1 \implies T(N) = 2^N - 1$$
- **Interactive Exponential Growth Slider**: Dynamic slider from 1 to 8 disks displaying optimal moves, samurai ranks (*Ronin Novice* to *Grand Shogun*), and live stack visualization.

### Pillar IV: Live Interactive Mini-Dojo Visualizer
- A self-contained 3-disk mini trial on the Hero Page.
- Features controls: `AUTO SOLVE DEMO`, `NEXT STEP`, `PREV STEP`, and `RESET`.
- **Sensei Kenji's Live Voice Narration**: Explains all 7 steps with tactical samurai commentary.
- **Interactive Play**: Visitors can click mini pegs to solve the 3-disk warmup manually!

---

## ⚔️ KATANA SLASH TRANSITIONS & ARCADE VISUALS

- **Cinematic Katana Screen Transition**: Dual diagonal blade strike streaks (`.slash-blade-1`, `.slash-blade-2`) with an authentic white-noise sword slash sound (`audio.playSlash()`) and luminous radial flash.
- **Seamless Navigation**: Smoothly switch between Hero Page and Arcade Arena at any time via `⚔️ ENTER DOJO` and `⛩️ HERO / LORE` buttons.
- **Unified Aesthetics**: Both views share the falling sakura petal canvas, CRT scanline overlay, and color tokens.

---

## 🎮 ARCADE GAME DOJO & MODES

1. **⛩️ Zen Normal Mode**: Relaxed trial with move counter, timer, undo history, and C backend hint engine.
2. **⏱️ Timed Challenge (60s)**: High-intensity countdown challenge.
3. **🎓 Sensei Tutorial**: Step-by-step guidance through recursive movements.
4. **4 Dynamic Themes**:
   - 🏯 *Edo Twilight* (Deep purple & gold lacquer)
   - ⚡ *Cyber Tokyo* (Electric cyan neon & dark navy)
   - 🌸 *Sakura Temple* (Crimson, blossom pink & mahogany)
   - 🌲 *Midnight Dojo* (Emerald jade & night obsidian)

---

## 🚀 QUICK START & COMPILATION GUIDE

### Option 1: One-Click Launch (Recommended)
Simply double-click or run:
```bat
start.bat
```
`start.bat` will:
1. Detect or compile `c_backend/hanoi_server.exe` using GCC/Clang/MSVC.
2. Launch the Native C WinSock2 Backend on `http://localhost:8080`.
3. Open `index.html` in your browser.

---

### Option 2: Manual C Backend Compilation

Using MinGW / GCC:
```bash
cd c_backend
gcc -O2 -Wall server.c hanoi.c -o hanoi_server.exe -lws2_32
gcc -O2 -Wall hanoi_cli.c hanoi.c -o hanoi_cli.exe
./hanoi_server.exe 8080
```

Using MSVC (`cl.exe`):
```cmd
cd c_backend
cl /O2 /W3 server.c hanoi.c ws2_32.lib /Fe:hanoi_server.exe
cl /O2 /W3 hanoi_cli.c hanoi.c /Fe:hanoi_cli.exe
hanoi_server.exe 8080
```

Using Makefile (Linux / macOS):
```bash
cd c_backend
make
./hanoi_server 8080
```

---

## 📁 REPOSITORY DIRECTORY STRUCTURE

```
d:/Projects/New folder/
├── index.html            # Main HTML with Hero Page & Arcade Arena
├── styles.css            # Complete Edo & Cyberpunk CSS Design System
├── script.js             # Client Engine, Katana Transitions & Mini-Dojo
├── audio.js              # Synthesized Web Audio API Sound Effects
├── start.bat             # One-click automated build & launch script
├── README.md             # Project documentation (this file)
├── assets/
│   └── samurai.jpg       # Master Sensei Kenji portrait artwork
└── c_backend/            # ⚡ NATIVE C ENGINE DIRECTORY
    ├── hanoi.h           # C Header: Data structures & function prototypes
    ├── hanoi.c           # C Engine: O(2^N) recursion solver & rule validator
    ├── server.c          # C WinSock2 / POSIX HTTP REST Server (Port 8080)
    ├── hanoi_cli.c       # C Terminal Standalone Pagoda Game
    ├── build.bat         # C compilation automation batch script
    ├── Makefile          # Cross-platform Unix/Windows Makefile
    ├── hanoi_server.exe  # Compiled Native C HTTP Server executable
    ├── hanoi_cli.exe     # Compiled Native C Terminal CLI executable
    ├── run_server.py     # Python bridge fallback runner
    └── hanoi_cli.py      # Python CLI fallback tool
```

---

*武士道精神 &bull; "Master the small, and the mountain shall yield to your blade." &mdash; Sensei Kenji*
