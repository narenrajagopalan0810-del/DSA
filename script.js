/**
 * Tower of Hanoi: Samurai Recursion Dojo - Game Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Game State Variables ---
    let diskCount = 4;
    let towers = [[], [], []]; // Tower stacks holding disk numbers (1 = smallest, N = largest)
    let moveCount = 0;
    let minMoves = 15; // 2^n - 1
    let selectedTower = null;
    let historyStack = []; // For Undo functionality
    let gameMode = 'normal'; // 'normal', 'timed', 'tutorial'
    
    // Timer Variables
    let timerInterval = null;
    let secondsElapsed = 0;
    let timeRemaining = 60; // For Timed mode
    let gameStarted = false;
    let gameOver = false;

    // Auto Solver Variables
    let solverMoves = [];
    let isSolving = false;
    let solverPaused = false;
    let solverTimeoutId = null;
    let solverStepIndex = 0;
    let solverSpeed = 400; // ms per step

    // Themes
    const themes = ['theme-edo', 'theme-cyber', 'theme-sakura', 'theme-dojo'];
    let currentThemeIdx = 0;

    // --- C Backend Engine Integration ---
    const BACKEND_URL = (window.location.protocol.startsWith('http')) 
        ? window.location.origin 
        : 'http://localhost:8080';
    let isCBackendOnline = false;
    let cBackendDetails = null;

    // --- YouTube BGM Player Integration ---
    let ytPlayer = null;
    let isMusicPlaying = false;
    const YOUTUBE_VIDEO_ID = 'qY8pobUrJoM'; // User requested YouTube track

    const btnMusic = document.getElementById('btnMusic');
    const musicIcon = document.getElementById('musicIcon');
    const musicText = document.getElementById('musicText');

    // Load YouTube IFrame Player API Script dynamically
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = function() {
        ytPlayer = new YT.Player('ytPlayer', {
            height: '180',
            width: '320',
            videoId: YOUTUBE_VIDEO_ID,
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'loop': 1,
                'playlist': YOUTUBE_VIDEO_ID,
                'playsinline': 1,
                'rel': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };

    function onPlayerReady(event) {
        event.target.setVolume(60);
    }

    function onPlayerStateChange(event) {
        const heroMusicText = document.getElementById('heroMusicText');
        const heroMusicBtn = document.getElementById('btnHeroMusic');

        if (event.data === YT.PlayerState.PLAYING) {
            isMusicPlaying = true;
            musicText.textContent = "BGM: ON";
            btnMusic.classList.add('btn-accent');
            if (heroMusicText) heroMusicText.textContent = "BGM: ON";
            if (heroMusicBtn) heroMusicBtn.classList.add('btn-accent');
        } else {
            isMusicPlaying = false;
            musicText.textContent = "BGM: OFF";
            btnMusic.classList.remove('btn-accent');
            if (heroMusicText) heroMusicText.textContent = "BGM: OFF";
            if (heroMusicBtn) heroMusicBtn.classList.remove('btn-accent');
        }
    }

    function toggleMusic() {
        if (!ytPlayer || typeof ytPlayer.playVideo !== 'function') {
            speakSensei("Loading YouTube BGM... please wait a moment!");
            return;
        }

        if (isMusicPlaying) {
            ytPlayer.pauseVideo();
        } else {
            ytPlayer.playVideo();
            speakSensei("🎶 Background samurai music activated!");
        }
    }

    btnMusic.addEventListener('click', () => {
        audio.playSlash();
        toggleMusic();
    });

    const btnHeroMusic = document.getElementById('btnHeroMusic');
    if (btnHeroMusic) {
        btnHeroMusic.addEventListener('click', () => {
            audio.playSlash();
            toggleMusic();
        });
    }

    // Auto-start music on first user click anywhere if desired
    const startMusicOnFirstClick = () => {
        if (ytPlayer && typeof ytPlayer.playVideo === 'function' && !isMusicPlaying) {
            ytPlayer.playVideo();
            window.removeEventListener('click', startMusicOnFirstClick);
        }
    };
    window.addEventListener('click', startMusicOnFirstClick, { once: true });

    // --- DOM Element References ---
    const stack0 = document.getElementById('stack-0');
    const stack1 = document.getElementById('stack-1');
    const stack2 = document.getElementById('stack-2');
    const towerWrappers = document.querySelectorAll('.tower-wrapper');

    const moveCountEl = document.getElementById('moveCount');
    const minMovesEl = document.getElementById('minMoves');
    const timerEl = document.getElementById('timer');
    const bestTimeEl = document.getElementById('bestTime');
    const diskCountVal = document.getElementById('diskCountVal');

    const btnLessDisks = document.getElementById('btnLessDisks');
    const btnMoreDisks = document.getElementById('btnMoreDisks');
    const btnReset = document.getElementById('btnReset');
    const btnUndo = document.getElementById('btnUndo');
    const btnAutoSolve = document.getElementById('btnAutoSolve');
    const modeSelect = document.getElementById('modeSelect');

    const btnSound = document.getElementById('btnSound');
    const btnCRT = document.getElementById('btnCRT');
    const btnTheme = document.getElementById('btnTheme');
    const btnScores = document.getElementById('btnScores');
    const btnHelp = document.getElementById('btnHelp');

    const senseiText = document.getElementById('senseiText');
    const senseiImg = document.getElementById('senseiImg');
    const btnAskRecursion = document.getElementById('btnAskRecursion');
    const btnAskHint = document.getElementById('btnAskHint');
    const btnSidebarHeroLore = document.getElementById('btnSidebarHeroLore');
    const btnBackToHero = document.getElementById('btnBackToHero');
    const btnMuteSpeech = document.getElementById('btnMuteSpeech');

    // Solver Bar DOM
    const solverBar = document.getElementById('solverBar');
    const speedSlider = document.getElementById('speedSlider');
    const btnPauseSolve = document.getElementById('btnPauseSolve');
    const btnStopSolve = document.getElementById('btnStopSolve');

    // Modals
    const scoresModal = document.getElementById('scoresModal');
    const closeScoresModal = document.getElementById('closeScoresModal');
    const scoresTbody = document.getElementById('scoresTbody');
    const btnClearScores = document.getElementById('btnClearScores');

    const recursionModal = document.getElementById('recursionModal');
    const closeRecursionModal = document.getElementById('closeRecursionModal');

    const victoryModal = document.getElementById('victoryModal');
    const victoryTitle = document.getElementById('victoryTitle');
    const victoryMsg = document.getElementById('victoryMsg');
    const vMoves = document.getElementById('vMoves');
    const vMinMoves = document.getElementById('vMinMoves');
    const vTime = document.getElementById('vTime');
    const vGrade = document.getElementById('vGrade');
    const btnPlayAgain = document.getElementById('btnPlayAgain');
    const btnNextLevel = document.getElementById('btnNextLevel');

    // C Backend Modal DOM Elements
    const btnCBackend = document.getElementById('btnCBackend');
    const cBackendDot = document.getElementById('cBackendDot');
    const cBackendText = document.getElementById('cBackendText');
    const cBackendModal = document.getElementById('cBackendModal');
    const closeCBackendModal = document.getElementById('closeCBackendModal');
    const cBackendModalStatus = document.getElementById('cBackendModalStatus');
    const btnTestCBackend = document.getElementById('btnTestCBackend');

    // --- Typewriter Text Engine for Samurai Sensei ---
    let senseiTypingId = null;

    function speakSensei(text, expression = 'normal') {
        if (senseiTypingId) clearInterval(senseiTypingId);
        senseiText.textContent = '';
        let index = 0;

        senseiTypingId = setInterval(() => {
            if (index < text.length) {
                senseiText.textContent += text.charAt(index);
                if (index % 3 === 0) {
                    audio.playSpeechBlip();
                }
                index++;
            } else {
                clearInterval(senseiTypingId);
                senseiTypingId = null;
            }
        }, 22);
    }

    // --- Game Logic & Initialization ---
    function initGame() {
        stopTimer();
        stopAutoSolve();

        moveCount = 0;
        secondsElapsed = 0;
        timeRemaining = 60;
        gameStarted = false;
        gameOver = false;
        selectedTower = null;
        historyStack = [];

        minMoves = Math.pow(2, diskCount) - 1;

        moveCountEl.textContent = '0';
        minMovesEl.textContent = minMoves;
        updateTimerDisplay();
        updateBestTimeDisplay();
        btnUndo.disabled = true;

        // Populate Tower 0 with disks (1 = top smallest disk, N = bottom largest disk)
        towers = [[], [], []];
        for (let i = diskCount; i >= 1; i--) {
            towers[0].push(i);
        }

        renderTowers();

        // Initial Sensei greeting based on mode
        if (gameMode === 'normal') {
            speakSensei(`Zen Dojo ready! Move ${diskCount} disks from Tower A to Tower C. Minimum moves required: ${minMoves}. Take your time, warrior!`);
        } else if (gameMode === 'timed') {
            speakSensei(`Timed Challenge activated! You have 60 seconds to move all ${diskCount} disks to Tower C! Move swiftly!`);
        } else if (gameMode === 'tutorial') {
            speakSensei(`Tutorial Dojo: Watch how recursion solves ${diskCount} disks step-by-step! Click AUTO SOLVE or follow along.`);
        }
    }

    function renderTowers() {
        [stack0, stack1, stack2].forEach((stack, idx) => {
            stack.innerHTML = '';
            towers[idx].forEach((diskVal) => {
                const diskEl = document.createElement('div');
                diskEl.className = `disk disk-${diskVal}`;
                
                // Calculate percentage width dynamically based on disk value
                const widthPercent = 30 + ((diskVal / diskCount) * 65);
                diskEl.style.width = `${widthPercent}%`;
                diskEl.textContent = diskVal;
                diskEl.dataset.disk = diskVal;

                // Make top disk draggable
                if (towers[idx][towers[idx].length - 1] === diskVal && !isSolving) {
                    diskEl.draggable = true;
                    diskEl.addEventListener('dragstart', (e) => handleDragStart(e, idx));
                }

                stack.appendChild(diskEl);
            });
        });

        // Update selected state visual
        towerWrappers.forEach((wrapper, idx) => {
            if (selectedTower === idx) {
                wrapper.classList.add('selected');
                const topDisk = stackWrapper(idx).lastElementChild;
                if (topDisk) topDisk.classList.add('selected-disk');
            } else {
                wrapper.classList.remove('selected');
            }
        });
    }

    function stackWrapper(idx) {
        if (idx === 0) return stack0;
        if (idx === 1) return stack1;
        return stack2;
    }

    // --- Drag and Drop Handlers ---
    let draggedSourceTower = null;

    function handleDragStart(e, towerIdx) {
        if (gameOver || isSolving) return;
        draggedSourceTower = towerIdx;
        e.dataTransfer.setData('text/plain', towerIdx);
        audio.playPickup();
    }

    towerWrappers.forEach((wrapper) => {
        const tIdx = parseInt(wrapper.dataset.tower, 10);

        wrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedSourceTower !== null) {
                attemptMove(draggedSourceTower, tIdx);
                draggedSourceTower = null;
            }
        });

        // Click-to-move interaction
        wrapper.addEventListener('click', () => {
            if (gameOver || isSolving) return;

            if (selectedTower === null) {
                // Select tower if it has disks
                if (towers[tIdx].length > 0) {
                    selectedTower = tIdx;
                    audio.playPickup();
                    renderTowers();
                } else {
                    audio.playError();
                    speakSensei("That tower is empty! Select a tower with disks first.");
                }
            } else {
                // If clicking same tower, deselect
                if (selectedTower === tIdx) {
                    selectedTower = null;
                    renderTowers();
                } else {
                    attemptMove(selectedTower, tIdx);
                    selectedTower = null;
                }
            }
        });
    });

    // --- Clear & Highlight Hint Towers ---
    function clearHintHighlights() {
        towerWrappers.forEach(w => {
            w.classList.remove('hint-source', 'hint-target');
        });
    }

    function highlightHintMove(fromPeg, toPeg) {
        clearHintHighlights();
        const fromWrapper = document.getElementById(`tower-${fromPeg}`);
        const toWrapper = document.getElementById(`tower-${toPeg}`);
        if (fromWrapper) fromWrapper.classList.add('hint-source');
        if (toWrapper) toWrapper.classList.add('hint-target');

        setTimeout(() => {
            clearHintHighlights();
        }, 3500);
    }

    // --- Move Validation & Execution (Delegated strictly to Native C Backend) ---
    async function attemptMove(fromIdx, toIdx) {
        if (fromIdx === toIdx) return;
        if (towers[fromIdx].length === 0) return;

        clearHintHighlights();

        // Validate and execute via Native C engine!
        try {
            const res = await fetch(`${BACKEND_URL}/api/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    towers: towers,
                    from: fromIdx,
                    to: toIdx,
                    disks: diskCount
                })
            });
            const data = await res.json();
            if (!data.valid) {
                audio.playError();
                speakSensei(data.error || "Forbidden move! Rejected by Native C Backend engine.");
                return;
            }

            // Move is successfully validated & executed by Native C Backend!
            if (!gameStarted && !isSolving) {
                startTimer();
                gameStarted = true;
            }

            historyStack.push({
                towers: JSON.parse(JSON.stringify(towers)),
                moves: moveCount
            });
            btnUndo.disabled = false;

            towers = data.towers;
            moveCount++;
            moveCountEl.textContent = moveCount;

            audio.playPlace();
            renderTowers();

            if (!isSolving) {
                if (moveCount === 1) {
                    speakSensei(`Good first step! Validated by Native C: Moved Disk ${data.moved_disk} to ${getPegName(toIdx)}.`);
                } else if (moveCount > minMoves + 5 && moveCount % 4 === 0) {
                    speakSensei(`You've taken ${moveCount} moves. Minimum required: ${minMoves}. Stay focused!`);
                }
            }

            if (data.is_solved || (towers[2] && towers[2].length === diskCount)) {
                handleVictory();
            }
        } catch (err) {
            console.error("Native C Backend unreachable:", err);
            audio.playError();
            speakSensei("⛩️ Native C Backend server is required to validate moves! Please launch start.bat (hanoi_server.exe).");
            checkCBackend();
        }
    }

    function getPegName(idx) {
        return idx === 0 ? 'Tower A' : idx === 1 ? 'Tower B' : 'Tower C';
    }

    // --- Undo Move ---
    btnUndo.addEventListener('click', () => {
        if (historyStack.length === 0 || gameOver || isSolving) return;
        const previousState = historyStack.pop();
        towers = previousState.towers;
        moveCount = previousState.moves;
        moveCountEl.textContent = moveCount;
        if (historyStack.length === 0) btnUndo.disabled = true;
        audio.playSlash();
        renderTowers();
        speakSensei("Move undone! Time to rethink your recursion strategy.");
    });

    // --- Timer System ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (gameMode === 'timed') {
                timeRemaining--;
                updateTimerDisplay();
                if (timeRemaining <= 0) {
                    handleTimeOut();
                }
            } else {
                secondsElapsed++;
                updateTimerDisplay();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        if (gameMode === 'timed') {
            const secs = Math.max(0, timeRemaining);
            timerEl.textContent = `00:${secs < 10 ? '0' : ''}${secs}`;
            if (secs <= 10) {
                timerEl.style.color = 'var(--accent-red)';
            } else {
                timerEl.style.color = 'var(--accent-neon)';
            }
        } else {
            const mins = Math.floor(secondsElapsed / 60);
            const secs = secondsElapsed % 60;
            timerEl.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
            timerEl.style.color = 'var(--accent-neon)';
        }
    }

    function handleTimeOut() {
        stopTimer();
        gameOver = true;
        audio.playError();
        speakSensei("Time expired, warrior! The timed challenge caught you. Click Reset to try again!");
    }

    // --- Victory Handler ---
    function handleVictory() {
        stopTimer();
        gameOver = true;
        audio.playVictory();

        // Calculate Grade
        let grade = "⭐⭐⭐ PERFECT";
        if (moveCount > minMoves && moveCount <= minMoves + 4) {
            grade = "⭐⭐ GREAT";
        } else if (moveCount > minMoves + 4) {
            grade = "⭐ SOLVED";
        }

        const timeStr = timerEl.textContent;
        saveHighScore(diskCount, gameMode, moveCount, secondsElapsed, timeStr);

        vMoves.textContent = moveCount;
        vMinMoves.textContent = minMoves;
        vTime.textContent = timeStr;
        vGrade.textContent = grade;

        if (moveCount === minMoves) {
            victoryTitle.textContent = "LEGENDARY RECURSION MASTER!";
            victoryMsg.textContent = `Flawless execution! You solved ${diskCount} disks in the theoretical minimum of ${minMoves} moves!`;
        } else {
            victoryTitle.textContent = "VICTORY OF THE SAMURAI!";
            victoryMsg.textContent = `You cleared the stage in ${moveCount} moves! Sensei Kenji honors your perseverance.`;
        }

        victoryModal.classList.remove('hidden');
        speakSensei(`SUGOI! You cleared all ${diskCount} disks! Your name is recorded in the Hall of Fame.`);
    }

    // --- Recursive Auto Solver Algorithm (Calculated in Native C) ---
    async function startAutoSolve() {
        if (isSolving) return;

        // Query Native C Backend recursive solver
        try {
            const res = await fetch(`${BACKEND_URL}/api/solve?disks=${diskCount}`);
            const data = await res.json();
            if (!data.moves || data.moves.length === 0) {
                throw new Error("No moves returned from Native C engine");
            }
            initGame();
            isSolving = true;
            solverPaused = false;
            solverMoves = data.moves;
            solverStepIndex = 0;

            speakSensei(`⚡ Native C Engine computed ${data.total_moves} recursive moves in microseconds! Watch the execution:`);
            solverBar.classList.remove('hidden');
            btnAutoSolve.disabled = true;
            executeNextSolverStep();
        } catch (err) {
            console.error("Native C Solver error:", err);
            audio.playError();
            speakSensei("⛩️ Native C Backend required to compute recursive steps! Please launch start.bat (hanoi_server.exe).");
            checkCBackend();
        }
    }

    function executeNextSolverStep() {
        if (!isSolving || solverPaused) return;

        if (solverStepIndex < solverMoves.length) {
            const step = solverMoves[solverStepIndex];
            attemptMove(step.from, step.to);
            solverStepIndex++;

            solverTimeoutId = setTimeout(() => {
                executeNextSolverStep();
            }, solverSpeed);
        } else {
            // Finished solving
            stopAutoSolve();
            speakSensei("Recursion demonstration complete! You have witnessed the power of divide and conquer.");
        }
    }

    function stopAutoSolve() {
        isSolving = false;
        solverPaused = false;
        if (solverTimeoutId) clearTimeout(solverTimeoutId);
        solverBar.classList.add('hidden');
        btnAutoSolve.disabled = false;
        btnPauseSolve.textContent = "⏸️ PAUSE";
    }

    btnAutoSolve.addEventListener('click', () => {
        audio.playSlash();
        startAutoSolve();
    });

    btnPauseSolve.addEventListener('click', () => {
        if (!isSolving) return;
        solverPaused = !solverPaused;
        if (solverPaused) {
            btnPauseSolve.textContent = "▶️ RESUME";
            if (solverTimeoutId) clearTimeout(solverTimeoutId);
            speakSensei("Auto-solver paused. Take a look at the current configuration!");
        } else {
            btnPauseSolve.textContent = "⏸️ PAUSE";
            speakSensei("Resuming recursion playback!");
            executeNextSolverStep();
        }
    });

    btnStopSolve.addEventListener('click', () => {
        audio.playSlash();
        stopAutoSolve();
        initGame();
    });

    speedSlider.addEventListener('input', (e) => {
        // Slider value 100ms - 1000ms (inverse speed: 100ms is fastest)
        solverSpeed = 1100 - parseInt(e.target.value, 10);
    });

    // --- Stepper Controls ---
    btnLessDisks.addEventListener('click', () => {
        if (diskCount > 3) {
            diskCount--;
            diskCountVal.textContent = diskCount;
            audio.playSlash();
            initGame();
        }
    });

    btnMoreDisks.addEventListener('click', () => {
        if (diskCount < 8) {
            diskCount++;
            diskCountVal.textContent = diskCount;
            audio.playSlash();
            initGame();
        }
    });

    btnReset.addEventListener('click', () => {
        audio.playSlash();
        initGame();
    });

    modeSelect.addEventListener('change', (e) => {
        gameMode = e.target.value;
        audio.playSlash();
        initGame();
    });

    // --- Sensei Quick Interactive Actions ---
    btnAskRecursion.addEventListener('click', () => {
        audio.playSlash();
        speakSensei("Recursion is when a function calls itself to solve smaller sub-problems. In Hanoi: to move N disks to Target, first recursively move N-1 disks to Auxiliary!");
    });

    if (btnSidebarHeroLore) {
        btnSidebarHeroLore.addEventListener('click', () => {
            playKatanaTransition(heroPageWrapper, arcadeWrapper);
        });
    }

    if (btnBackToHero) {
        btnBackToHero.addEventListener('click', () => {
            playKatanaTransition(heroPageWrapper, arcadeWrapper);
        });
    }

    btnAskHint.addEventListener('click', async () => {
        audio.playSlash();
        clearHintHighlights();

        if (towers[2].length === diskCount) {
            speakSensei("The puzzle is already solved! Reset or increase the disk count for a new challenge.");
            return;
        }

        // Query Native C Backend optimal next-move analyzer
        try {
            const res = await fetch(`${BACKEND_URL}/api/hint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    towers: towers,
                    disks: diskCount
                })
            });
            const data = await res.json();
            if (data.has_hint) {
                speakSensei(`⚡ Native C Sensei: ${data.advice}`);
                highlightHintMove(data.from, data.to);
            } else {
                speakSensei(data.advice || "Ponder your moves carefully, warrior.");
            }
        } catch (e) {
            console.error("Native C Backend hint error:", e);
            audio.playError();
            speakSensei("⛩️ Native C Backend required to calculate optimal next-move hint! Please launch start.bat (hanoi_server.exe).");
            checkCBackend();
        }
    });

    btnMuteSpeech.addEventListener('click', () => {
        audio.speechSFX = !audio.speechSFX;
        btnMuteSpeech.textContent = audio.speechSFX ? "🔊" : "🔇";
    });

    // --- Theme & Visual Effects ---
    function cycleThemes() {
        document.body.classList.remove(themes[currentThemeIdx]);
        currentThemeIdx = (currentThemeIdx + 1) % themes.length;
        document.body.classList.add(themes[currentThemeIdx]);
        audio.playSlash();
    }

    btnTheme.addEventListener('click', cycleThemes);
    const btnHeroTheme = document.getElementById('btnHeroTheme');
    if (btnHeroTheme) {
        btnHeroTheme.addEventListener('click', cycleThemes);
    }

    function toggleCRTFilter() {
        if (arcadeWrapper) arcadeWrapper.classList.toggle('crt-effect');
        if (heroPageWrapper) heroPageWrapper.classList.toggle('crt-effect');
        audio.playSlash();
    }

    btnCRT.addEventListener('click', toggleCRTFilter);
    const btnHeroCRT = document.getElementById('btnHeroCRT');
    if (btnHeroCRT) {
        btnHeroCRT.addEventListener('click', toggleCRTFilter);
    }

    function toggleAudioSFX() {
        audio.enabled = !audio.enabled;
        const iconText = audio.enabled ? "🔊" : "🔇";
        document.getElementById('soundIcon').textContent = iconText;
        const heroSoundIcon = document.getElementById('heroSoundIcon');
        if (heroSoundIcon) heroSoundIcon.textContent = iconText;
    }

    btnSound.addEventListener('click', toggleAudioSFX);
    const btnHeroSound = document.getElementById('btnHeroSound');
    if (btnHeroSound) {
        btnHeroSound.addEventListener('click', toggleAudioSFX);
    }

    // --- Local Storage & Leaderboard ---
    function saveHighScore(disks, mode, moves, timeSecs, timeFormatted) {
        let scores = JSON.parse(localStorage.getItem('hanoi_samurai_scores') || '[]');
        scores.push({
            disks: disks,
            mode: mode.toUpperCase(),
            moves: moves,
            time: timeFormatted,
            date: new Date().toLocaleDateString()
        });
        // Sort by fewest moves and shortest time
        scores.sort((a, b) => a.moves - b.moves);
        scores = scores.slice(0, 15); // Keep top 15
        localStorage.setItem('hanoi_samurai_scores', JSON.stringify(scores));
        updateBestTimeDisplay();
    }

    function updateBestTimeDisplay() {
        const scores = JSON.parse(localStorage.getItem('hanoi_samurai_scores') || '[]');
        const matching = scores.filter(s => s.disks === diskCount);
        if (matching.length > 0) {
            bestTimeEl.textContent = matching[0].time;
        } else {
            bestTimeEl.textContent = '--:--';
        }
    }

    function renderScoresTable() {
        const scores = JSON.parse(localStorage.getItem('hanoi_samurai_scores') || '[]');
        scoresTbody.innerHTML = '';

        if (scores.length === 0) {
            scoresTbody.innerHTML = `<tr><td colspan="5" style="color: var(--text-muted)">No high scores recorded yet. Clear a stage!</td></tr>`;
            return;
        }

        scores.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.disks} Disks</td>
                <td><span style="color:var(--accent-gold)">${s.mode}</span></td>
                <td>${s.time}</td>
                <td>${s.moves}</td>
                <td>${s.date}</td>
            `;
            scoresTbody.appendChild(tr);
        });
    }

    btnScores.addEventListener('click', () => {
        renderScoresTable();
        scoresModal.classList.remove('hidden');
        audio.playSlash();
    });

    closeScoresModal.addEventListener('click', () => {
        scoresModal.classList.add('hidden');
    });

    btnClearScores.addEventListener('click', () => {
        localStorage.removeItem('hanoi_samurai_scores');
        renderScoresTable();
        updateBestTimeDisplay();
        audio.playSlash();
    });

    // --- Lessons Modal ---
    btnHelp.addEventListener('click', () => {
        recursionModal.classList.remove('hidden');
        audio.playSlash();
    });

    closeRecursionModal.addEventListener('click', () => {
        recursionModal.classList.add('hidden');
    });

    // --- Victory Modal Buttons ---
    btnPlayAgain.addEventListener('click', () => {
        victoryModal.classList.add('hidden');
        initGame();
    });

    btnNextLevel.addEventListener('click', () => {
        victoryModal.classList.add('hidden');
        if (diskCount < 8) {
            diskCount++;
            diskCountVal.textContent = diskCount;
        }
        initGame();
    });

    // --- Animated Falling Sakura Canvas Engine ---
    const canvas = document.getElementById('sakuraCanvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    class SakuraPetal {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.size = Math.random() * 8 + 6;
            this.speedY = Math.random() * 1.2 + 0.8;
            this.speedX = Math.random() * 1.5 - 0.75;
            this.rotation = Math.random() * 360;
            this.rotSpeed = Math.random() * 2 - 1;
            this.opacity = Math.random() * 0.6 + 0.3;
        }

        update() {
            this.y += this.speedY;
            this.x += Math.sin(this.y * 0.01) + this.speedX;
            this.rotation += this.rotSpeed;

            if (this.y > height + 20) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = '#ffb3d9';

            // Draw petal shape
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-this.size, -this.size / 2, -this.size, this.size, 0, this.size * 1.5);
            ctx.bezierCurveTo(this.size, this.size, this.size, -this.size / 2, 0, 0);
            ctx.fill();

            ctx.restore();
        }
    }

    const petals = Array.from({ length: 35 }, () => new SakuraPetal());

    function animateSakura() {
        ctx.clearRect(0, 0, width, height);
        petals.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateSakura);
    }

    animateSakura();

    // --- C Backend Health Monitor & Modal Handlers ---
    const btnHeroCBackend = document.getElementById('btnHeroCBackend');
    const heroCBackendText = document.getElementById('heroCBackendText');
    const heroCBackendDot = document.getElementById('heroCBackendDot');

    async function checkCBackend(notifyUser = false) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${BACKEND_URL}/api/health`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                isCBackendOnline = true;
                cBackendDetails = data;
                if (btnCBackend) {
                    btnCBackend.classList.remove('offline');
                    btnCBackend.classList.add('online');
                }
                if (btnHeroCBackend) {
                    btnHeroCBackend.classList.remove('offline');
                    btnHeroCBackend.classList.add('online');
                }
                if (cBackendText) cBackendText.textContent = "NATIVE C: ACTIVE 🟢";
                if (heroCBackendText) heroCBackendText.textContent = "NATIVE C: ACTIVE 🟢";
                if (cBackendModalStatus) {
                    cBackendModalStatus.innerHTML = `🟢 <strong style="color: #00ffaa;">ONLINE</strong> &mdash; Engine: <code>${data.engine}</code> (v${data.version})<br>All move validations, recursion solving, and hints are running in Native C!`;
                }
                if (notifyUser) {
                    speakSensei("⛩️ Native C Backend connection verified! High-performance C recursion engine online.");
                }
                return true;
            }
        } catch (e) {
            // Not connected
        }

        isCBackendOnline = false;
        if (btnCBackend) {
            btnCBackend.classList.remove('online');
            btnCBackend.classList.add('offline');
        }
        if (btnHeroCBackend) {
            btnHeroCBackend.classList.remove('online');
            btnHeroCBackend.classList.add('offline');
        }
        if (cBackendText) cBackendText.textContent = "NATIVE C: OFFLINE 🔴";
        if (heroCBackendText) heroCBackendText.textContent = "NATIVE C: OFFLINE 🔴";
        if (cBackendModalStatus) {
            cBackendModalStatus.innerHTML = `🔴 <strong style="color: #ff5555;">OFFLINE</strong> (Port 8080)<br>Run <code>start.bat</code> to launch <code>hanoi_server.exe</code>. The Native C backend is strictly required!`;
        }
        if (notifyUser) {
            speakSensei("Native C Backend server is not running on port 8080. Start it via start.bat!");
        }
        return false;
    }

    if (btnCBackend) {
        btnCBackend.addEventListener('click', () => {
            audio.playSlash();
            checkCBackend(false);
            if (cBackendModal) cBackendModal.classList.remove('hidden');
        });
    }

    if (btnHeroCBackend) {
        btnHeroCBackend.addEventListener('click', () => {
            audio.playSlash();
            checkCBackend(false);
            if (cBackendModal) cBackendModal.classList.remove('hidden');
        });
    }

    if (closeCBackendModal) {
        closeCBackendModal.addEventListener('click', () => {
            if (cBackendModal) cBackendModal.classList.add('hidden');
        });
    }

    if (btnTestCBackend) {
        btnTestCBackend.addEventListener('click', () => {
            audio.playSlash();
            checkCBackend(true);
        });
    }

    // ==============================================================
    // HERO PAGE CONTROLLER & KATANA TRANSITIONS
    // ==============================================================
    const katanaSlashOverlay = document.getElementById('katanaSlashOverlay');
    const heroPageWrapper = document.getElementById('heroPageWrapper');
    const arcadeWrapper = document.getElementById('arcadeWrapper');

    function playKatanaTransition(toShow, toHide, onMidpoint) {
        audio.playSlash();
        if (katanaSlashOverlay) {
            katanaSlashOverlay.classList.remove('active');
            void katanaSlashOverlay.offsetWidth; // Force CSS reflow to re-trigger animations
            katanaSlashOverlay.classList.add('active');
        }

        setTimeout(() => {
            if (toHide) toHide.classList.add('hidden');
            if (toShow) {
                toShow.classList.remove('hidden');
                toShow.classList.add('page-fade-in');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => toShow.classList.remove('page-fade-in'), 450);
            }
            if (typeof onMidpoint === 'function') onMidpoint();
        }, 220);

        setTimeout(() => {
            if (katanaSlashOverlay) katanaSlashOverlay.classList.remove('active');
        }, 550);
    }

    // Navigation and Entry buttons
    const btnHeroEnterTop = document.getElementById('btnHeroEnterTop');
    const btnHeroEnterMain = document.getElementById('btnHeroEnterMain');
    const btnHeroQuick3 = document.getElementById('btnHeroQuick3');

    if (btnHeroEnterTop) {
        btnHeroEnterTop.addEventListener('click', () => {
            playKatanaTransition(arcadeWrapper, heroPageWrapper);
        });
    }

    if (btnHeroEnterMain) {
        btnHeroEnterMain.addEventListener('click', () => {
            playKatanaTransition(arcadeWrapper, heroPageWrapper);
        });
    }

    if (btnHeroQuick3) {
        btnHeroQuick3.addEventListener('click', () => {
            diskCount = 3;
            diskCountVal.textContent = diskCount;
            modeSelect.value = 'normal';
            gameMode = 'normal';
            initGame();
            playKatanaTransition(arcadeWrapper, heroPageWrapper);
        });
    }

    // Hero Discourse Quick Nav Chapter Pills
    const heroChapterPills = document.querySelectorAll('.hero-chapter-pill');
    const heroSpeechParagraph = document.getElementById('heroSpeechParagraph');

    const heroSpeechLines = {
        'heroLegend': `"Ah, the sacred temple of Benares! Brahma's 64 golden disks remind every samurai that the greatest battles demand infinite patience. 584 billion years to finish—never rush your cognitive strike!"`,
        'heroLaws': `"Commit the Three Sacred Laws to heart: A single disk per motion, top disk only, and NEVER place heavy armor upon a light blade! Dishonor will halt your blade instantly!"`,
        'heroStrategy': `"Divide and Conquer! To conquer N disks: shift N-1 to Auxiliary, strike the base disk to Target, then reunite the stack. Exactly 2^N - 1 strikes—pure mathematical elegance!"`,
        'heroMiniDemo': `"Observe the 3-disk trial below! In exactly 7 strikes, the tower travels from Origin to Target. Step through each move or run Auto Solve to see recursion alive!"`
    };

    heroChapterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            audio.playSlash();
            const targetId = pill.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (heroSpeechParagraph && heroSpeechLines[targetId]) {
                heroSpeechParagraph.innerHTML = heroSpeechLines[targetId];
                audio.playSpeechBlip();
            }
        });
    });

    // Pillar 2: Interactive Law Comparator
    const btnTestValid = document.getElementById('btnTestValid');
    const btnTestInvalid = document.getElementById('btnTestInvalid');
    const cardValidMove = document.getElementById('cardValidMove');
    const cardInvalidMove = document.getElementById('cardInvalidMove');
    const lawFeedbackText = document.getElementById('lawFeedbackText');

    if (btnTestValid) {
        btnTestValid.addEventListener('click', () => {
            audio.playPlace();
            if (cardValidMove) {
                cardValidMove.classList.add('active-pulse');
                setTimeout(() => cardValidMove.classList.remove('active-pulse'), 800);
            }
            if (lawFeedbackText) {
                lawFeedbackText.innerHTML = `Sensei Kenji says: 🟢 <strong style="color: #00ff88;">HONORABLE MOVE!</strong> Smaller Disk 1 comfortably rests atop larger Disk 3. Order is preserved!`;
            }
        });
    }

    if (btnTestInvalid) {
        btnTestInvalid.addEventListener('click', () => {
            audio.playError();
            if (cardInvalidMove) {
                cardInvalidMove.classList.add('active-pulse');
                setTimeout(() => cardInvalidMove.classList.remove('active-pulse'), 800);
            }
            if (lawFeedbackText) {
                lawFeedbackText.innerHTML = `Sensei Kenji says: 🔴 <strong style="color: #ff3366;">DISHONOR!</strong> Placing heavy Disk 3 atop smaller Disk 1 is strictly forbidden by the Shogun!`;
            }
        });
    }

    // Pillar 3: Interactive Complexity Slider
    const heroDiskRange = document.getElementById('heroDiskRange');
    const heroDiskCountDisplay = document.getElementById('heroDiskCountDisplay');
    const heroMinMovesOutput = document.getElementById('heroMinMovesOutput');
    const heroRankOutput = document.getElementById('heroRankOutput');
    const heroEstTimeOutput = document.getElementById('heroEstTimeOutput');
    const heroStackPreview = document.getElementById('heroStackPreview');
    const heroLaunchCountText = document.getElementById('heroLaunchCountText');
    const btnLaunchWithSelectedDisks = document.getElementById('btnLaunchWithSelectedDisks');

    const ranksByDisk = [
        "", // 0
        "RONIN NOVICE",
        "WHITE BELT WARRIOR",
        "SAMURAI APPRENTICE",
        "WARRIOR DISCIPLE",
        "DOJO LIEUTENANT",
        "KATANA MASTER",
        "HIGH COMMANDER",
        "GRAND SHOGUN"
    ];

    const estTimesByDisk = [
        "",
        "~1 SEC",
        "~3 SECS",
        "~7 SECS",
        "~15 SECS",
        "~35 SECS",
        "~1.5 MINS",
        "~3.5 MINS",
        "~7.5 MINS"
    ];

    const diskGradients = [
        "linear-gradient(180deg, #ff4b4b, #b30000)", // 1
        "linear-gradient(180deg, #ff9933, #cc5200)", // 2
        "linear-gradient(180deg, #ffdb4d, #b38600)", // 3
        "linear-gradient(180deg, #33cc66, #00802b)", // 4
        "linear-gradient(180deg, #33ccff, #006699)", // 5
        "linear-gradient(180deg, #9966ff, #4b0082)", // 6
        "linear-gradient(180deg, #ff66cc, #990066)", // 7
        "linear-gradient(180deg, #e6e6e6, #737373)"  // 8
    ];

    function updateHeroComplexityCalc() {
        if (!heroDiskRange) return;
        const val = parseInt(heroDiskRange.value);
        const moves = Math.pow(2, val) - 1;

        if (heroDiskCountDisplay) heroDiskCountDisplay.textContent = `${val} DISKS`;
        if (heroMinMovesOutput) heroMinMovesOutput.textContent = moves.toLocaleString();
        if (heroRankOutput) heroRankOutput.textContent = ranksByDisk[val] || "SAMURAI MASTER";
        if (heroEstTimeOutput) heroEstTimeOutput.textContent = estTimesByDisk[val] || "~10 MINS";
        if (heroLaunchCountText) heroLaunchCountText.textContent = val;

        // Render preview stack
        if (heroStackPreview) {
            heroStackPreview.innerHTML = '';
            for (let i = val; i >= 1; i--) {
                const disk = document.createElement('div');
                disk.className = 'preview-disk-item';
                const widthPercent = 35 + ((i - 1) / (8 - 1)) * 60;
                disk.style.width = `${widthPercent}%`;
                disk.style.background = diskGradients[i - 1];
                heroStackPreview.appendChild(disk);
            }
        }
    }

    if (heroDiskRange) {
        heroDiskRange.addEventListener('input', () => {
            audio.playPickup();
            updateHeroComplexityCalc();
        });
        updateHeroComplexityCalc();
    }

    if (btnLaunchWithSelectedDisks && heroDiskRange) {
        btnLaunchWithSelectedDisks.addEventListener('click', () => {
            const val = parseInt(heroDiskRange.value);
            diskCount = val;
            diskCountVal.textContent = diskCount;
            initGame();
            playKatanaTransition(arcadeWrapper, heroPageWrapper);
        });
    }

    // Pillar 4: Live 3-Disk Mini-Dojo Visualizer
    let miniTowers = [[3, 2, 1], [], []];
    let miniCurrentStep = 0;
    let miniAutoTimer = null;
    let miniSelectedPeg = null;

    const miniSolution = [
        { from: 0, to: 2, disk: 1, text: "Step 1 of 7: Move Disk 1 from Origin (A) → Target (C). (Small scout claims destination!)" },
        { from: 0, to: 1, disk: 2, text: "Step 2 of 7: Move Disk 2 from Origin (A) → Auxiliary (B). (Middle disk stations on Auxiliary!)" },
        { from: 2, to: 1, disk: 1, text: "Step 3 of 7: Move Disk 1 from Target (C) → Auxiliary (B). (Disks 1 & 2 are assembled on B!)" },
        { from: 0, to: 2, disk: 3, text: "Step 4 of 7: Move Disk 3 from Origin (A) → Target (C). (The Shogun base disk strikes Target C!)" },
        { from: 1, to: 0, disk: 1, text: "Step 5 of 7: Move Disk 1 from Auxiliary (B) → Origin (A). (Free Disk 2 on Auxiliary!)" },
        { from: 1, to: 2, disk: 2, text: "Step 6 of 7: Move Disk 2 from Auxiliary (B) → Target (C). (Disk 2 rests atop base Disk 3 on Target!)" },
        { from: 0, to: 2, disk: 1, text: "Step 7 of 7: Move Disk 1 from Origin (A) → Target (C). (Final kata! Complete victory in exactly 7 moves!)" }
    ];

    const btnMiniPrev = document.getElementById('btnMiniPrev');
    const btnMiniAuto = document.getElementById('btnMiniAuto');
    const btnMiniNext = document.getElementById('btnMiniNext');
    const btnMiniReset = document.getElementById('btnMiniReset');
    const miniStepBadge = document.getElementById('miniStepBadge');
    const miniKataStatus = document.getElementById('miniKataStatus');
    const miniCommentarySpeech = document.getElementById('miniCommentarySpeech');

    function renderMiniDojo() {
        for (let pegIdx = 0; pegIdx < 3; pegIdx++) {
            const stackEl = document.getElementById(`miniStack-${pegIdx}`);
            const pegCol = document.getElementById(`miniPeg-${pegIdx}`);
            if (!stackEl) continue;

            stackEl.innerHTML = '';
            const stack = miniTowers[pegIdx];

            if (pegCol) {
                if (miniSelectedPeg === pegIdx) {
                    pegCol.classList.add('mini-selected');
                } else {
                    pegCol.classList.remove('mini-selected');
                }
            }

            stack.forEach((diskNum, idx) => {
                const diskEl = document.createElement('div');
                diskEl.className = `mini-disk-item mini-disk-${diskNum}`;
                diskEl.textContent = diskNum;
                if (miniSelectedPeg === pegIdx && idx === stack.length - 1) {
                    diskEl.classList.add('selected');
                }
                stackEl.appendChild(diskEl);
            });
        }

        if (miniStepBadge) miniStepBadge.textContent = `STEP ${miniCurrentStep} / 7`;
        if (btnMiniPrev) btnMiniPrev.disabled = (miniCurrentStep === 0);
        if (btnMiniNext) btnMiniNext.disabled = (miniCurrentStep >= miniSolution.length);

        if (miniTowers[2].length === 3) {
            if (miniKataStatus) {
                miniKataStatus.textContent = "CLEARED! 🎉";
                miniKataStatus.style.background = "rgba(0, 255, 136, 0.25)";
                miniKataStatus.style.color = "#00ff88";
            }
        } else {
            if (miniKataStatus) {
                miniKataStatus.textContent = miniAutoTimer ? "SOLVING..." : (miniCurrentStep > 0 ? "IN PROGRESS" : "STANDBY");
                miniKataStatus.style.background = "rgba(255, 207, 51, 0.15)";
                miniKataStatus.style.color = "var(--accent-gold)";
            }
        }
    }

    function stepMiniForward() {
        if (miniCurrentStep < miniSolution.length) {
            const move = miniSolution[miniCurrentStep];
            const popped = miniTowers[move.from].pop();
            miniTowers[move.to].push(popped);
            audio.playPlace();
            if (miniCommentarySpeech) {
                miniCommentarySpeech.textContent = move.text;
                audio.playSpeechBlip();
            }
            miniCurrentStep++;
            renderMiniDojo();

            if (miniCurrentStep === miniSolution.length) {
                stopMiniAuto();
                audio.playVictory();
            }
        }
    }

    function stepMiniBackward() {
        if (miniCurrentStep > 0) {
            miniCurrentStep--;
            const move = miniSolution[miniCurrentStep];
            const popped = miniTowers[move.to].pop();
            miniTowers[move.from].push(popped);
            audio.playPickup();
            if (miniCommentarySpeech) {
                miniCommentarySpeech.textContent = (miniCurrentStep === 0)
                    ? "Reset to initial state. Ready to step forward!"
                    : miniSolution[miniCurrentStep - 1].text;
            }
            renderMiniDojo();
        }
    }

    function stopMiniAuto() {
        if (miniAutoTimer) {
            clearInterval(miniAutoTimer);
            miniAutoTimer = null;
        }
        if (btnMiniAuto) {
            btnMiniAuto.textContent = "▶️ AUTO SOLVE DEMO";
            btnMiniAuto.classList.remove('btn-danger');
            btnMiniAuto.classList.add('btn-accent');
        }
        renderMiniDojo();
    }

    function startMiniAuto() {
        if (miniCurrentStep >= miniSolution.length) {
            miniTowers = [[3, 2, 1], [], []];
            miniCurrentStep = 0;
            renderMiniDojo();
        }

        if (btnMiniAuto) {
            btnMiniAuto.textContent = "⏸️ PAUSE DEMO";
            btnMiniAuto.classList.remove('btn-accent');
            btnMiniAuto.classList.add('btn-danger');
        }

        miniAutoTimer = setInterval(() => {
            if (miniCurrentStep < miniSolution.length) {
                stepMiniForward();
            } else {
                stopMiniAuto();
            }
        }, 650);
        renderMiniDojo();
    }

    if (btnMiniNext) {
        btnMiniNext.addEventListener('click', () => {
            stopMiniAuto();
            stepMiniForward();
        });
    }

    if (btnMiniPrev) {
        btnMiniPrev.addEventListener('click', () => {
            stopMiniAuto();
            stepMiniBackward();
        });
    }

    if (btnMiniReset) {
        btnMiniReset.addEventListener('click', () => {
            stopMiniAuto();
            audio.playSlash();
            miniTowers = [[3, 2, 1], [], []];
            miniCurrentStep = 0;
            miniSelectedPeg = null;
            if (miniCommentarySpeech) {
                miniCommentarySpeech.textContent = `"Sensei Kenji says: 'Mini-Dojo reset! 3 disks in initial formation at Tower A. Ready for your command!'"`;
            }
            renderMiniDojo();
        });
    }

    if (btnMiniAuto) {
        btnMiniAuto.addEventListener('click', () => {
            audio.playSlash();
            if (miniAutoTimer) {
                stopMiniAuto();
            } else {
                startMiniAuto();
            }
        });
    }

    // Manual peg clicking for Mini-Dojo
    for (let i = 0; i < 3; i++) {
        const pegCol = document.getElementById(`miniPeg-${i}`);
        if (pegCol) {
            pegCol.addEventListener('click', () => {
                stopMiniAuto();
                if (miniSelectedPeg === null) {
                    if (miniTowers[i].length > 0) {
                        miniSelectedPeg = i;
                        audio.playPickup();
                    }
                } else if (miniSelectedPeg === i) {
                    miniSelectedPeg = null;
                    audio.playPickup();
                } else {
                    const fromStack = miniTowers[miniSelectedPeg];
                    const toStack = miniTowers[i];
                    const movingDisk = fromStack[fromStack.length - 1];
                    const topDestDisk = toStack[toStack.length - 1];

                    if (!topDestDisk || movingDisk < topDestDisk) {
                        toStack.push(fromStack.pop());
                        audio.playPlace();
                        if (miniCommentarySpeech) {
                            miniCommentarySpeech.textContent = `You moved Disk ${movingDisk} from Peg ${String.fromCharCode(65 + miniSelectedPeg)} → Peg ${String.fromCharCode(65 + i)}!`;
                        }
                        if (miniTowers[2].length === 3) {
                            audio.playVictory();
                            if (miniCommentarySpeech) {
                                miniCommentarySpeech.textContent = `🎉 Master Kenji exclaims: "Brilliant! You solved the 3-disk mini trial with your own blade!"`;
                            }
                        }
                    } else {
                        audio.playError();
                        if (miniCommentarySpeech) {
                            miniCommentarySpeech.textContent = `❌ Forbidden! Disk ${movingDisk} cannot be placed on smaller Disk ${topDestDisk}!`;
                        }
                    }
                    miniSelectedPeg = null;
                }
                renderMiniDojo();
            });
        }
    }

    renderMiniDojo();

    // Start Game & Initial C Backend Check
    initGame();
    checkCBackend(false);
    setInterval(() => checkCBackend(false), 5000);
});
