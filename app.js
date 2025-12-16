// ===== Constants =====
const WORK_TIME = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes in seconds
const LONG_BREAK = 15 * 60; // 15 minutes in seconds
const SESSIONS_UNTIL_LONG_BREAK = 4;

// ===== State Management =====
let timers = [];
let timerIntervals = {};

// ===== DOM Elements =====
const addTimerBtn = document.getElementById('add-timer-btn');
const timersContainer = document.getElementById('timers-container');
const emptyState = document.getElementById('empty-state');

// ===== Timer Class =====
class PomodoroTimer {
    constructor(id, title = '', customDuration = 25) {
        this.id = id;
        this.title = title;
        this.customDuration = customDuration; // in minutes
        this.timeLeft = customDuration * 60; // convert to seconds
        this.isRunning = false;
        this.phase = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.sessionsCompleted = 0;
        this.createdAt = Date.now(); // Track when timer was created
        this.isCountUp = false; // false = countdown, true = countup (stopwatch)
        this.elapsedTime = 0; // For stopwatch mode
    }

    start() {
        this.isRunning = true;
    }

    pause() {
        this.isRunning = false;
    }

    reset() {
        this.isRunning = false;
        this.phase = 'work';
        if (this.isCountUp) {
            this.elapsedTime = 0;
        } else {
            this.timeLeft = this.customDuration * 60; // Use custom duration
        }
    }

    tick() {
        if (this.isRunning) {
            if (this.isCountUp) {
                // Stopwatch mode - count up
                this.elapsedTime++;
            } else {
                // Countdown mode
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    
                    if (this.timeLeft === 0) {
                        this.onTimerComplete();
                    }
                }
            }
        }
    }

    onTimerComplete() {
        this.isRunning = false;
        playNotificationSound();
        
        if (this.phase === 'work') {
            this.sessionsCompleted++;
            
            if (this.sessionsCompleted % SESSIONS_UNTIL_LONG_BREAK === 0) {
                this.phase = 'longBreak';
                this.timeLeft = LONG_BREAK;
            } else {
                this.phase = 'shortBreak';
                this.timeLeft = SHORT_BREAK;
            }
        } else {
            this.phase = 'work';
            this.timeLeft = WORK_TIME;
        }
    }

    getPhaseDisplay() {
        switch (this.phase) {
            case 'work':
                return 'Focus Time';
            case 'shortBreak':
                return 'Short Break';
            case 'longBreak':
                return 'Long Break';
            default:
                return '';
        }
    }

    formatTime() {
        const timeToDisplay = this.isCountUp ? this.elapsedTime : this.timeLeft;
        const minutes = Math.floor(timeToDisplay / 60);
        const seconds = timeToDisplay % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    getCreatedAtDisplay() {
        const date = new Date(this.createdAt);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// ===== Timezone Functions =====
function getUserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getTimezoneAbbreviation() {
    const date = new Date();
    const timeZoneString = date.toLocaleTimeString('en-US', { timeZoneName: 'short' });
    const match = timeZoneString.match(/\b([A-Z]{2,5})\b$/);
    return match ? match[1] : getUserTimezone().split('/').pop();
}

function getMidnightInUserTimezone() {
    const now = new Date();
    const userTimezone = getUserTimezone();
    
    // Get current date in user's timezone
    const dateString = now.toLocaleString('en-US', { 
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // Parse the date
    const [month, day, year] = dateString.split('/');
    
    // Create midnight in user's timezone for today
    const todayMidnight = new Date(`${year}-${month}-${day}T00:00:00`);
    
    // Adjust for timezone offset
    const localMidnight = new Date(todayMidnight.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // If we've passed midnight today, return tomorrow's midnight
    const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const midnightToday = new Date(nowInTimezone);
    midnightToday.setHours(0, 0, 0, 0);
    
    const midnightTomorrow = new Date(midnightToday);
    midnightTomorrow.setDate(midnightTomorrow.getDate() + 1);
    
    return midnightTomorrow.getTime();
}

function shouldResetTimers() {
    const lastResetTime = localStorage.getItem('lastResetTime');
    const nextMidnight = getMidnightInUserTimezone();
    
    if (!lastResetTime) {
        return true;
    }
    
    const now = Date.now();
    const lastReset = parseInt(lastResetTime);
    
    // If current time is past the stored reset time, we need to reset
    return now >= lastReset;
}

function resetAllTimers() {
    timers.forEach(timer => {
        timer.reset();
    });
    
    // Set next reset time to next midnight in user's timezone
    const nextMidnight = getMidnightInUserTimezone();
    localStorage.setItem('lastResetTime', nextMidnight.toString());
    
    saveTimers();
    renderTimers();
}

// ===== Local Storage Functions =====
function saveTimers() {
    const timersData = timers.map(timer => ({
        id: timer.id,
        title: timer.title,
        customDuration: timer.customDuration,
        timeLeft: timer.timeLeft,
        isRunning: timer.isRunning, // Now persist running state
        phase: timer.phase,
        sessionsCompleted: timer.sessionsCompleted,
        lastSaveTime: Date.now(), // Track when we saved
        createdAt: timer.createdAt,
        isCountUp: timer.isCountUp,
        elapsedTime: timer.elapsedTime
    }));
    
    localStorage.setItem('timers', JSON.stringify(timersData));
}

function loadTimers() {
    const timersData = localStorage.getItem('timers');
    
    if (timersData) {
        const parsed = JSON.parse(timersData);
        const now = Date.now();
        
        timers = parsed.map(data => {
            const timer = new PomodoroTimer(data.id, data.title || '', data.customDuration || 25);
            timer.phase = data.phase;
            timer.sessionsCompleted = data.sessionsCompleted;
            timer.createdAt = data.createdAt || now;
            timer.isCountUp = data.isCountUp || false;
            timer.elapsedTime = data.elapsedTime || 0;
            
            // Calculate elapsed time if timer was running
            if (data.isRunning && data.lastSaveTime) {
                const elapsedSeconds = Math.floor((now - data.lastSaveTime) / 1000);
                
                if (timer.isCountUp) {
                    // Stopwatch mode - add elapsed time
                    timer.elapsedTime += elapsedSeconds;
                    timer.isRunning = true;
                } else {
                    // Countdown mode
                    timer.timeLeft = Math.max(0, data.timeLeft - elapsedSeconds);
                    timer.isRunning = timer.timeLeft > 0;
                    
                    if (timer.timeLeft === 0) {
                        timer.onTimerComplete();
                    }
                }
            } else {
                timer.timeLeft = data.timeLeft;
                timer.isRunning = false;
            }
            
            return timer;
        });
    }
}

// ===== Timer Management Functions =====
function addTimer() {
    const id = Date.now();
    const defaultTitle = `Timer #${timers.length + 1}`;
    const timer = new PomodoroTimer(id, defaultTitle, 25);
    timers.push(timer);
    
    saveTimers();
    renderTimers();
    startTimerInterval(timer);
}

function startTimerInterval(timer) {
    if (timerIntervals[timer.id]) {
        clearInterval(timerIntervals[timer.id]);
    }
    
    timerIntervals[timer.id] = setInterval(() => {
        timer.tick();
        updateTimerDisplay(timer);
        saveTimers();
    }, 1000);
}

function stopTimerInterval(timer) {
    if (timerIntervals[timer.id]) {
        clearInterval(timerIntervals[timer.id]);
        delete timerIntervals[timer.id];
    }
}

// ===== UI Functions =====
function renderTimers() {
    timersContainer.innerHTML = '';
    
    if (timers.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        timers.forEach(timer => {
            const timerCard = createTimerCard(timer);
            timersContainer.appendChild(timerCard);
        });
    }
}

function createTimerCard(timer) {
    const card = document.createElement('div');
    card.className = 'timer-card';
    card.id = `timer-${timer.id}`;
    
    const displayTitle = timer.title || `Timer #${timers.indexOf(timer) + 1}`;
    
    card.innerHTML = `
        <div class="timer-header">
            <div class="timer-title timer-title-editable" id="title-${timer.id}" onclick="editTimerTitle(${timer.id})">${displayTitle}</div>
            <button class="timer-delete" onclick="deleteTimer(${timer.id})" aria-label="Delete timer">×</button>
        </div>
        
        <div class="timer-meta">
            <span class="timer-created">Created ${timer.getCreatedAtDisplay()}</span>
        </div>
        
        <div class="timer-display">
            <div class="timer-time ${timer.isRunning ? 'active' : ''}" id="time-${timer.id}">
                ${timer.formatTime()}
            </div>
            <div class="timer-phase" id="phase-${timer.id}">${timer.isCountUp ? 'Stopwatch' : timer.getPhaseDisplay()}</div>
            <div class="timer-session" id="session-${timer.id}">
                ${timer.isCountUp ? 'Count Up Mode' : `Session ${timer.sessionsCompleted + 1}`}
            </div>
            
            <div class="timer-mode-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" id="mode-${timer.id}" ${timer.isCountUp ? 'checked' : ''} onchange="toggleTimerMode(${timer.id})" />
                    <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">${timer.isCountUp ? 'Stopwatch' : 'Countdown'}</span>
            </div>
            
            ${!timer.isCountUp ? `
            <div class="timer-duration-input">
                <label for="duration-${timer.id}">Duration:</label>
                <input type="number" id="duration-${timer.id}" min="1" max="60" value="${timer.customDuration}" onchange="updateTimerDuration(${timer.id}, this.value)" />
                <span>min</span>
            </div>
            ` : ''}
        </div>
        
        <div class="timer-controls">
            <button class="btn btn-secondary btn-small" onclick="toggleTimer(${timer.id})" id="toggle-${timer.id}">
                ${timer.isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button class="btn btn-secondary btn-small" onclick="resetTimer(${timer.id})">
                ↻ Reset
            </button>
        </div>
    `;
    
    return card;
}

function updateTimerDisplay(timer) {
    const timeElement = document.getElementById(`time-${timer.id}`);
    const phaseElement = document.getElementById(`phase-${timer.id}`);
    const sessionElement = document.getElementById(`session-${timer.id}`);
    const toggleButton = document.getElementById(`toggle-${timer.id}`);
    const toggleLabel = document.querySelector(`#timer-${timer.id} .toggle-label`);
    
    if (timeElement) {
        timeElement.textContent = timer.formatTime();
        
        if (timer.isRunning) {
            timeElement.classList.add('active');
        } else {
            timeElement.classList.remove('active');
        }
    }
    
    if (phaseElement) {
        phaseElement.textContent = timer.isCountUp ? 'Stopwatch' : timer.getPhaseDisplay();
    }
    
    if (sessionElement) {
        sessionElement.textContent = timer.isCountUp ? 'Count Up Mode' : `Session ${timer.sessionsCompleted + 1}`;
    }
    
    if (toggleButton) {
        toggleButton.innerHTML = timer.isRunning ? '⏸ Pause' : '▶ Start';
    }
    
    if (toggleLabel) {
        toggleLabel.textContent = timer.isCountUp ? 'Stopwatch' : 'Countdown';
    }
}

// ===== Timer Control Functions =====
function toggleTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    
    if (timer.isRunning) {
        timer.pause();
        stopTimerInterval(timer);
    } else {
        timer.start();
        startTimerInterval(timer);
    }
    
    updateTimerDisplay(timer);
    saveTimers();
}

function resetTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    
    stopTimerInterval(timer);
    timer.reset();
    updateTimerDisplay(timer);
    saveTimers();
}

// ===== Timer Editing Functions =====
function editTimerTitle(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    
    const titleElement = document.getElementById(`title-${id}`);
    if (!titleElement) return;
    
    const currentTitle = timer.title || `Timer #${timers.indexOf(timer) + 1}`;
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'timer-title-input';
    input.value = currentTitle;
    input.maxLength = 20;
    
    // Replace title with input
    titleElement.replaceWith(input);
    input.focus();
    input.select();
    
    // Save on blur or enter
    const saveTitle = () => {
        const newTitle = input.value.trim() || currentTitle;
        timer.title = newTitle;
        
        // Recreate title element
        const newTitleElement = document.createElement('div');
        newTitleElement.className = 'timer-title timer-title-editable';
        newTitleElement.id = `title-${id}`;
        newTitleElement.textContent = newTitle;
        newTitleElement.onclick = () => editTimerTitle(id);
        
        input.replaceWith(newTitleElement);
        saveTimers();
    };
    
    input.addEventListener('blur', saveTitle);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

function updateTimerDuration(id, newDuration) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    
    const duration = parseInt(newDuration);
    if (isNaN(duration) || duration < 1 || duration > 60) {
        // Reset to current value if invalid
        const input = document.getElementById(`duration-${id}`);
        if (input) input.value = timer.customDuration;
        return;
    }
    
    timer.customDuration = duration;
    
    // If timer is in work phase and not running, update the time
    if (timer.phase === 'work' && !timer.isRunning) {
        timer.timeLeft = duration * 60;
        updateTimerDisplay(timer);
    }
    
    saveTimers();
}

function toggleTimerMode(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    
    // Stop timer if running
    if (timer.isRunning) {
        timer.pause();
        stopTimerInterval(timer);
    }
    
    // Toggle mode
    timer.isCountUp = !timer.isCountUp;
    
    // Reset timer values
    if (timer.isCountUp) {
        timer.elapsedTime = 0;
    } else {
        timer.timeLeft = timer.customDuration * 60;
        timer.phase = 'work';
    }
    
    saveTimers();
    renderTimers(); // Re-render to show/hide duration input
}

// ===== Current Time Display =====
function updateCurrentTime() {
    const timeDisplay = document.getElementById('time-display');
    const timezoneDisplay = document.getElementById('timezone-display');
    const footerTimezone = document.getElementById('footer-timezone');
    
    if (timeDisplay) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
        timeDisplay.textContent = timeString;
    }
    
    if (timezoneDisplay && !timezoneDisplay.dataset.initialized) {
        const tzAbbr = getTimezoneAbbreviation();
        timezoneDisplay.textContent = tzAbbr;
        timezoneDisplay.dataset.initialized = 'true';
    }
    
    if (footerTimezone && !footerTimezone.dataset.initialized) {
        const tzAbbr = getTimezoneAbbreviation();
        footerTimezone.textContent = tzAbbr;
        footerTimezone.dataset.initialized = 'true';
    }
}

// ===== Audio Notification =====
function playNotificationSound() {
    // Create a pleasant multi-tone notification
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Play C-E-G chord progression (C5, E5, G5)
    const notes = [523.25, 659.25, 783.99];
    
    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * 0.15);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.5);
    });
}

// ===== Initialization =====
function init() {
    // Load timers from storage
    loadTimers();
    
    // Check if we need to reset timers (midnight in user's timezone passed)
    if (shouldResetTimers()) {
        resetAllTimers();
    }
    
    // Render initial state
    renderTimers();
    
    // Start intervals for any existing timers
    timers.forEach(timer => {
        if (timer.isRunning) {
            startTimerInterval(timer);
        }
    });
    
    // Initialize current time display
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update every minute instead of every second
    
    // Check for reset every minute
    setInterval(() => {
        if (shouldResetTimers()) {
            resetAllTimers();
        }
    }, 60000);
}

// ===== Event Listeners =====
addTimerBtn.addEventListener('click', addTimer);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===== Delete Confirmation =====
let timerToDelete = null;

function showDeleteConfirmation(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    
    timerToDelete = id;
    const modal = document.getElementById('delete-modal');
    const message = document.getElementById('delete-message');
    
    const timerTitle = timer.title || `Timer #${timers.indexOf(timer) + 1}`;
    message.textContent = `Are you sure you want to delete "${timerTitle}"?`;
    
    modal.classList.remove('hidden');
}

function confirmDelete() {
    if (timerToDelete !== null) {
        actuallyDeleteTimer(timerToDelete);
        timerToDelete = null;
    }
    closeDeleteModal();
}

function cancelDelete() {
    timerToDelete = null;
    closeDeleteModal();
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.add('hidden');
}

function actuallyDeleteTimer(id) {
    // Stop the interval
    if (timerIntervals[id]) {
        clearInterval(timerIntervals[id]);
        delete timerIntervals[id];
    }
    
    // Remove from array
    timers = timers.filter(timer => timer.id !== id);
    
    saveTimers();
    renderTimers();
}

// Modal event listeners
document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
document.getElementById('cancel-delete').addEventListener('click', cancelDelete);
document.getElementById('delete-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop') || e.target.id === 'delete-modal') {
        cancelDelete();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('delete-modal');
        if (!modal.classList.contains('hidden')) {
            cancelDelete();
        }
    }
});

// ===== Theme Toggle =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

// Theme toggle event listener
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// Initialize theme
initTheme();

// ===== PWA Service Worker Registration =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Make functions globally available for onclick handlers
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.deleteTimer = showDeleteConfirmation; // Changed to show confirmation first
window.editTimerTitle = editTimerTitle;
window.updateTimerDuration = updateTimerDuration;
window.toggleTimerMode = toggleTimerMode;
