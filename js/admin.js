/* ===================================================================
 * ADMIN PANEL LOGIC - admin.js
 * 
 * Handles:
 * - Admin authentication
 * - Start/reset competition controls
 * - Status display and countdown
 * - API communication with backend
 * 
 * Place this file in: admin.js (same directory as index-admin.html)
 * ================================================================ */

(function() {
    'use strict';

    // ===================================================================
    // # CONFIGURATION
    // ===================================================================
    const CONFIG = {
        API_BASE_URL: 'https://zyro-leaderboard-backend.vercel.app/api', // Change to production URL
        STATUS_REFRESH_INTERVAL: 5000, // 5 seconds
        TIMER_UPDATE_INTERVAL: 1000 // 1 second
    };

    // ===================================================================
    // # STATE
    // ===================================================================
    let isAuthenticated = false;
    let adminApiKey = '';
    let competitionState = {
        isActive: false,
        isEnded: false,
        startTime: null,
        endTime: null,
        remainingSeconds: 0
    };
    let statusRefreshInterval = null;
    let countdownInterval = null;

    // ===================================================================
    // # DOM ELEMENTS
    // ===================================================================
    const elements = {
        loginSection: document.getElementById('login-section'),
        adminControls: document.getElementById('admin-controls'),
        loginForm: document.getElementById('login-form'),
        adminPassword: document.getElementById('admin-password'),
        loginError: document.getElementById('login-error'),
        statusValue: document.getElementById('status-value'),
        startTime: document.getElementById('start-time'),
        endTime: document.getElementById('end-time'),
        countdown: document.getElementById('countdown'),
        adminDays: document.getElementById('admin-days'),
        adminHours: document.getElementById('admin-hours'),
        adminMinutes: document.getElementById('admin-minutes'),
        adminSeconds: document.getElementById('admin-seconds'),
        startBtn: document.getElementById('start-btn'),
        resetBtn: document.getElementById('reset-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        controlMessage: document.getElementById('control-message')
    };

    // ===================================================================
    // # INITIALIZATION
    // ===================================================================
    function init() {
        console.log('🔒 Admin panel initializing...');

        // Check if already authenticated (from sessionStorage)
        const savedKey = sessionStorage.getItem('adminApiKey');
        if (savedKey) {
            adminApiKey = savedKey;
            verifyAuthentication();
        }

        // Event listeners
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.startBtn.addEventListener('click', handleStartCompetition);
        elements.resetBtn.addEventListener('click', handleResetCompetition);
        elements.logoutBtn.addEventListener('click', handleLogout);

        console.log('✅ Admin panel ready');
    }

    // ===================================================================
    // # AUTHENTICATION
    // ===================================================================
    async function handleLogin(e) {
        e.preventDefault();

        const password = elements.adminPassword.value.trim();
        
        if (!password) {
            showLoginError('Please enter a password');
            return;
        }

        // The password IS the API key
        adminApiKey = password;

        // Try to authenticate by calling a protected endpoint
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/status`, {
                headers: {
                    'X-API-Key': adminApiKey
                }
            });

            if (response.ok) {
                // Authentication successful
                isAuthenticated = true;
                sessionStorage.setItem('adminApiKey', adminApiKey);
                showAdminControls();
                fetchStatus();
                startStatusRefresh();
            } else if (response.status === 401 || response.status === 403) {
                showLoginError('Invalid admin password');
            } else {
                showLoginError('Authentication failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoginError('Connection error. Is the backend running?');
        }
    }

    async function verifyAuthentication() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/status`, {
                headers: {
                    'X-API-Key': adminApiKey
                }
            });

            if (response.ok) {
                isAuthenticated = true;
                showAdminControls();
                fetchStatus();
                startStatusRefresh();
            } else {
                // Invalid stored key
                sessionStorage.removeItem('adminApiKey');
                adminApiKey = '';
            }
        } catch (error) {
            console.error('Verification error:', error);
        }
    }

    function handleLogout() {
        isAuthenticated = false;
        adminApiKey = '';
        sessionStorage.removeItem('adminApiKey');
        stopStatusRefresh();
        stopCountdown();
        showLoginSection();
        elements.adminPassword.value = '';
    }

    // ===================================================================
    // # COMPETITION CONTROLS
    // ===================================================================
    async function handleStartCompetition() {
        if (!isAuthenticated) return;

        const confirmed = confirm('Start a new 30-day competition?\n\nThis will create a new competition timer.');
        if (!confirmed) return;

        elements.startBtn.disabled = true;
        showControlMessage('Starting competition...', 'info');

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': adminApiKey
                },
                body: JSON.stringify({ durationDays: 30 })
            });

            const data = await response.json();

            if (data.success) {
                showControlMessage('✅ Competition started successfully!', 'success');
                fetchStatus();
            } else {
                showControlMessage(`❌ ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Start error:', error);
            showControlMessage('❌ Failed to start competition. Check console.', 'error');
        } finally {
            elements.startBtn.disabled = false;
        }
    }

    async function handleResetCompetition() {
        if (!isAuthenticated) return;

        const confirmed = confirm('⚠️ WARNING: Reset the competition?\n\nThis will:\n- Stop the current competition\n- Clear all timer data\n- Reset the leaderboard\n\nAre you sure?');
        if (!confirmed) return;

        elements.resetBtn.disabled = true;
        showControlMessage('Resetting competition...', 'info');

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/reset`, {
                method: 'POST',
                headers: {
                    'X-API-Key': adminApiKey
                }
            });

            const data = await response.json();

            if (data.success) {
                showControlMessage('✅ Competition reset successfully!', 'success');
                fetchStatus();
            } else {
                showControlMessage(`❌ ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Reset error:', error);
            showControlMessage('❌ Failed to reset competition. Check console.', 'error');
        } finally {
            elements.resetBtn.disabled = false;
        }
    }

    // ===================================================================
    // # FETCH STATUS
    // ===================================================================
    async function fetchStatus() {
        if (!isAuthenticated) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/status`, {
                headers: {
                    'X-API-Key': adminApiKey
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Session expired
                    handleLogout();
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.competition) {
                competitionState = {
                    isActive: data.competition.isActive,
                    isEnded: data.competition.isEnded,
                    startTime: data.competition.startTime,
                    endTime: data.competition.endTime,
                    remainingSeconds: data.competition.remainingSeconds || 0
                };

                updateStatusDisplay();

                // Start/stop countdown based on state
                if (competitionState.isActive && !competitionState.isEnded) {
                    startCountdown();
                } else {
                    stopCountdown();
                }

                // Enable/disable buttons
                updateButtonStates();
            }
        } catch (error) {
            console.error('Status fetch error:', error);
        }
    }

    // ===================================================================
    // # UPDATE UI
    // ===================================================================
    function updateStatusDisplay() {
        // Update status badge
        elements.statusValue.className = 'status-badge';
        if (competitionState.isEnded) {
            elements.statusValue.textContent = 'Ended';
            elements.statusValue.classList.add('ended');
        } else if (competitionState.isActive) {
            elements.statusValue.textContent = 'Active';
            elements.statusValue.classList.add('active');
        } else {
            elements.statusValue.textContent = 'Inactive';
            elements.statusValue.classList.add('inactive');
        }

        // Update timestamps
        if (competitionState.startTime) {
            elements.startTime.textContent = formatDateTime(competitionState.startTime);
        } else {
            elements.startTime.textContent = '—';
        }

        if (competitionState.endTime) {
            elements.endTime.textContent = formatDateTime(competitionState.endTime);
        } else {
            elements.endTime.textContent = '—';
        }
    }

    function updateButtonStates() {
        // Disable start button if competition is active
        elements.startBtn.disabled = competitionState.isActive && !competitionState.isEnded;
        
        // Disable reset button if no competition
        elements.resetBtn.disabled = !competitionState.isActive && !competitionState.isEnded;
    }

    // ===================================================================
    // # COUNTDOWN TIMER
    // ===================================================================
    function updateCountdown() {
        if (!competitionState.isActive || !competitionState.endTime) {
            elements.countdown.textContent = '—';
            return;
        }

        const now = new Date().getTime();
        const end = new Date(competitionState.endTime).getTime();
        const distance = end - now;

        if (distance < 0) {
            elements.adminDays.textContent = '00';
            elements.adminHours.textContent = '00';
            elements.adminMinutes.textContent = '00';
            elements.adminSeconds.textContent = '00';
            stopCountdown();
            fetchStatus(); // Refresh to get updated status
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        elements.adminDays.textContent = String(days).padStart(2, '0');
        elements.adminHours.textContent = String(hours).padStart(2, '0');
        elements.adminMinutes.textContent = String(minutes).padStart(2, '0');
        elements.adminSeconds.textContent = String(seconds).padStart(2, '0');

        // Add pulse effect if less than 1 day remaining
        if (days === 0 && hours < 24) {
            elements.countdown.classList.add('ending');
        } else {
            elements.countdown.classList.remove('ending');
        }
    }

    function startCountdown() {
        stopCountdown();
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, CONFIG.TIMER_UPDATE_INTERVAL);
    }

    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }

    // ===================================================================
    // # AUTO-REFRESH STATUS
    // ===================================================================
    function startStatusRefresh() {
        stopStatusRefresh();
        statusRefreshInterval = setInterval(fetchStatus, CONFIG.STATUS_REFRESH_INTERVAL);
    }

    function stopStatusRefresh() {
        if (statusRefreshInterval) {
            clearInterval(statusRefreshInterval);
            statusRefreshInterval = null;
        }
    }

    // ===================================================================
    // # UI HELPERS
    // ===================================================================
    function showLoginSection() {
        elements.loginSection.classList.remove('hidden');
        elements.adminControls.classList.add('hidden');
    }

    function showAdminControls() {
        elements.loginSection.classList.add('hidden');
        elements.adminControls.classList.remove('hidden');
        elements.loginError.classList.remove('show');
    }

    function showLoginError(message) {
        elements.loginError.textContent = message;
        elements.loginError.classList.add('show');
    }

    function showControlMessage(message, type) {
        elements.controlMessage.textContent = message;
        elements.controlMessage.className = `message show ${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            elements.controlMessage.classList.remove('show');
        }, 5000);
    }

    // ===================================================================
    // # UTILITY FUNCTIONS
    // ===================================================================
    function formatDateTime(isoString) {
        if (!isoString) return '—';
        
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // ===================================================================
    // # CLEANUP
    // ===================================================================
    window.addEventListener('beforeunload', () => {
        stopStatusRefresh();
        stopCountdown();
    });

    // ===================================================================
    // # START
    // ===================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();