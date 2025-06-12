class PomodoroTimer {
    constructor() {
        this.workTime = 25 * 60;
        this.breakTime = 5 * 60;
        this.longBreakTime = 15 * 60;
        this.currentTime = this.workTime;
        this.isRunning = false;
        this.isWorkSession = true;
        this.sessionCount = 0;
        this.timer = null;
        this.volume = 0.5;
        this.todayStats = this.loadTodayStats();
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.updateStatsDisplay();
        this.applyDarkMode();
        this.initializeCollapsibleSections();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('time');
        this.sessionTypeDisplay = document.getElementById('session-type');
        this.sessionCountDisplay = document.getElementById('session-count');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.workTimeInput = document.getElementById('work-time');
        this.breakTimeInput = document.getElementById('break-time');
        this.longBreakTimeInput = document.getElementById('long-break-time');
        this.applySettingsBtn = document.getElementById('apply-settings');
        this.progressFill = document.getElementById('progress-fill');
        this.volumeSlider = document.getElementById('volume-slider');
        this.todaySessionsDisplay = document.getElementById('today-sessions');
        this.totalTimeDisplay = document.getElementById('total-time');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        
        // 折りたたみ関連の要素
        this.settingsToggle = document.getElementById('settings-toggle');
        this.settingsContent = document.getElementById('settings-content');
        this.shortcutsToggle = document.getElementById('shortcuts-toggle');
        this.shortcutsContent = document.getElementById('shortcuts-content');
        this.settingsHeader = document.getElementById('settings-header');
        this.shortcutsHeader = document.getElementById('shortcuts-header');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.applySettingsBtn.addEventListener('click', () => this.applySettings());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        
        // 入力フィールドの変更で即座に設定を適用
        this.workTimeInput.addEventListener('input', () => this.handleTimeInputChange());
        this.breakTimeInput.addEventListener('input', () => this.handleTimeInputChange());
        this.longBreakTimeInput.addEventListener('input', () => this.handleTimeInputChange());
        
        // 折りたたみ機能
        this.settingsHeader.addEventListener('click', () => this.toggleCollapse('settings'));
        this.shortcutsHeader.addEventListener('click', () => this.toggleCollapse('shortcuts'));
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.textContent = 'Running...';
            this.startBtn.disabled = true;
            
            this.timer = setInterval(() => {
                this.currentTime--;
                this.updateDisplay();
                
                if (this.currentTime <= 0) {
                    this.handleSessionComplete();
                }
            }, 1000);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timer);
            this.startBtn.textContent = 'Start';
            this.startBtn.disabled = false;
        }
    }
    
    reset() {
        this.pause();
        this.currentTime = this.isWorkSession ? this.workTime : this.breakTime;
        this.updateDisplay();
    }
    
    handleSessionComplete() {
        this.pause();
        
        if (this.isWorkSession) {
            this.sessionCount++;
            this.todayStats.sessions++;
            this.todayStats.totalTime += this.workTime;
            this.saveTodayStats();
            this.updateSessionCount();
            this.updateStatsDisplay();
            
            if (this.sessionCount % 4 === 0) {
                this.currentTime = this.longBreakTime;
                this.sessionTypeDisplay.textContent = 'Long Break';
            } else {
                this.currentTime = this.breakTime;
                this.sessionTypeDisplay.textContent = 'Short Break';
            }
            this.isWorkSession = false;
        } else {
            this.currentTime = this.workTime;
            this.sessionTypeDisplay.textContent = 'Work Session';
            this.isWorkSession = true;
        }
        
        this.updateDisplay();
        this.playNotification();
        
        setTimeout(() => {
            this.start();
        }, 1000);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.title = `${this.timeDisplay.textContent} - Pomodoro Timer`;
    }
    
    updateSessionCount() {
        this.sessionCountDisplay.textContent = `Completed Sessions: ${this.sessionCount}`;
        this.updateProgressBar();
    }
    
    updateProgressBar() {
        const progressPercentage = (this.sessionCount % 4) * 25;
        this.progressFill.style.width = `${progressPercentage}%`;
    }
    
    handleTimeInputChange() {
        if (this.isRunning) {
            return;
        }
        
        const workMinutes = parseInt(this.workTimeInput.value);
        const breakMinutes = parseInt(this.breakTimeInput.value);
        const longBreakMinutes = parseInt(this.longBreakTimeInput.value);
        
        if (isNaN(workMinutes) || workMinutes < 1 || workMinutes > 60) {
            return;
        }
        
        if (isNaN(breakMinutes) || breakMinutes < 1 || breakMinutes > 30) {
            return;
        }
        
        if (isNaN(longBreakMinutes) || longBreakMinutes < 1 || longBreakMinutes > 60) {
            return;
        }
        
        this.workTime = workMinutes * 60;
        this.breakTime = breakMinutes * 60;
        this.longBreakTime = longBreakMinutes * 60;
        
        this.reset();
    }

    applySettings() {
        if (this.isRunning) {
            alert('Please stop the timer before changing settings.');
            return;
        }
        
        const workMinutes = parseInt(this.workTimeInput.value);
        const breakMinutes = parseInt(this.breakTimeInput.value);
        const longBreakMinutes = parseInt(this.longBreakTimeInput.value);
        
        if (workMinutes < 1 || workMinutes > 60) {
            alert('Work time must be between 1 and 60 minutes.');
            return;
        }
        
        if (breakMinutes < 1 || breakMinutes > 30) {
            alert('Break time must be between 1 and 30 minutes.');
            return;
        }
        
        if (longBreakMinutes < 1 || longBreakMinutes > 60) {
            alert('Long break time must be between 1 and 60 minutes.');
            return;
        }
        
        this.workTime = workMinutes * 60;
        this.breakTime = breakMinutes * 60;
        this.longBreakTime = longBreakMinutes * 60;
        
        this.reset();
        
        this.applySettingsBtn.textContent = 'Applied!';
        this.applySettingsBtn.style.background = '#22c55e';
        this.applySettingsBtn.style.color = 'white';
        
        setTimeout(() => {
            this.applySettingsBtn.textContent = 'Apply';
            this.applySettingsBtn.style.background = '';
            this.applySettingsBtn.style.color = '';
        }, 2000);
    }


    playBellSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const createBellTone = (frequency, duration, startTime) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, startTime);
            gainNode.gain.setValueAtTime(this.volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        const currentTime = audioContext.currentTime;
        createBellTone(800, 0.3, currentTime);
        createBellTone(600, 0.3, currentTime + 0.2);
        createBellTone(800, 0.3, currentTime + 0.4);
    }

    playNotification() {
        this.playBellSound();
        
        if ('Notification' in window && Notification.permission === 'granted') {
            const message = this.isWorkSession ? 'Take a break!' : 'Time to focus!';
            new Notification('Pomodoro Timer', {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjIgMjIgMTcuNTIgMjIgMTIgMTcuNTIgMiAxMiAyWk0xMyAxN0gxMVY3SDEzVjE3WiIgZmlsbD0iIzMxODJjZSIvPgo8L3N2Zz4K'
            });
        }
    }
    
    handleKeyPress(event) {
        if (event.target.tagName === 'INPUT') return;
        
        switch(event.key.toLowerCase()) {
            case ' ':
            case 'spacebar':
                event.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
                break;
            case 'r':
                event.preventDefault();
                this.reset();
                break;
        }
    }
    
    updateVolume(value) {
        this.volume = value / 100;
    }
    
    loadTodayStats() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('pomodoroStats');
        
        if (saved) {
            const stats = JSON.parse(saved);
            if (stats.date === today) {
                return stats;
            }
        }
        
        return {
            date: today,
            sessions: 0,
            totalTime: 0
        };
    }
    
    saveTodayStats() {
        localStorage.setItem('pomodoroStats', JSON.stringify(this.todayStats));
    }
    
    updateStatsDisplay() {
        if (this.todaySessionsDisplay) {
            this.todaySessionsDisplay.textContent = `Today's Sessions: ${this.todayStats.sessions}`;
        }
        
        if (this.totalTimeDisplay) {
            const hours = Math.floor(this.todayStats.totalTime / 3600);
            const minutes = Math.floor((this.todayStats.totalTime % 3600) / 60);
            this.totalTimeDisplay.textContent = `Total Focus Time: ${hours}h ${minutes}m`;
        }
    }
    
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyDarkMode();
    }
    
    applyDarkMode() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.darkModeToggle.textContent = '☀️ Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            this.darkModeToggle.textContent = '🌙 Dark Mode';
        }
    }
    
    toggleCollapse(section) {
        if (section === 'settings') {
            const isCollapsed = this.settingsContent.classList.contains('collapsed');
            if (isCollapsed) {
                this.settingsContent.classList.remove('collapsed');
                this.settingsContent.style.maxHeight = this.settingsContent.scrollHeight + 'px';
                this.settingsToggle.textContent = '−';
            } else {
                this.settingsContent.classList.add('collapsed');
                this.settingsContent.style.maxHeight = '0px';
                this.settingsToggle.textContent = '+';
            }
        } else if (section === 'shortcuts') {
            const isCollapsed = this.shortcutsContent.classList.contains('collapsed');
            if (isCollapsed) {
                this.shortcutsContent.classList.remove('collapsed');
                this.shortcutsContent.style.maxHeight = this.shortcutsContent.scrollHeight + 'px';
                this.shortcutsToggle.textContent = '−';
            } else {
                this.shortcutsContent.classList.add('collapsed');
                this.shortcutsContent.style.maxHeight = '0px';
                this.shortcutsToggle.textContent = '+';
            }
        }
    }
    
    initializeCollapsibleSections() {
        // 初期状態でコンテンツの高さを設定
        this.settingsContent.style.maxHeight = this.settingsContent.scrollHeight + 'px';
        this.shortcutsContent.style.maxHeight = this.shortcutsContent.scrollHeight + 'px';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    new PomodoroTimer();
});