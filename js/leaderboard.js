/* ===================================================================
 * LEADERBOARD.JS - Complete Working Version
 * 
 * Features:
 * - Fetches leaderboard from backend API
 * - Competition timer with countdown
 * - Medal emojis for top 3 (🥇🥈🥉)
 * - Username censoring (De***j format)
 * - Proper preloader hiding after data loads
 * - Particles.js background
 * - Auto-refresh every 30 seconds
 * ================================================================ */

// ===================================================================
// # CONFIGURATION
// ===================================================================

const CONFIG = {
    API_BASE_URL: 'https://zyro-leaderboard-backend.vercel.app/api',
    REFRESH_INTERVAL: 30000 // Refresh every 30 seconds
};

// ===================================================================
// # STATE MANAGEMENT
// ===================================================================

let competitionState = {
    isActive: false,
    isEnded: false,
    startTime: null,
    endTime: null,
    remainingSeconds: 0
};

let countdownInterval = null;
let refreshInterval = null;

// ===================================================================
// # UTILITY FUNCTIONS
// ===================================================================

/**
 * Censor username - show first two and last letter, rest as asterisks
 * Examples: "Debraj" → "De***j", "John" → "Jo*n", "Al" → "Al"
 */
function censorUsername(username) {
    if (!username || username.length <= 2) return username;
    
    if (username.length === 3) {
        return username[0] + '*' + username[2];
    }
    
    const firstTwo = username.slice(0, 2);
    const lastOne = username.slice(-1);
    const middleLength = username.length - 3;
    const asterisks = '*'.repeat(Math.max(3, middleLength));
    
    return firstTwo + asterisks + lastOne;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Get medal emoji for rank
 */
function getMedalEmoji(rank) {
    switch(rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '';
    }
}

/**
 * Get rank display text
 */
function getRankText(rank) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    
    // Add ordinal suffix for 4th, 5th, etc. (without # symbol)
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = rank % 100;
    return rank + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

/**
 * Get tier color based on tier name
 */
function getTierColor(tier) {
    if (!tier) return '#9ca3af'; // Default gray for missing tier
    
    const tierColors = {
        'IRON': '#9ca3af',
        'BRONZE': '#cd7f32',
        'SILVER': '#c0c0c0',
        'GOLD': '#ffd700',
        'MITHRIL': '#4a90e2',
        'SAPPHIRE': '#0f52ba',
        'EMERALD': '#50c878',
        'RUBY': '#e0115f',
        'DIAMOND': '#b9f2ff',
        'PLATINUM': '#e5e4e2',
        'MASTER': '#9d4edd',
        'GRANDMASTER': '#ff006e',
        'CHALLENGER': '#ff006e'
    };
    
    // Convert to uppercase to match API format
    const tierUpper = tier.toUpperCase();
    return tierColors[tierUpper] || '#22c55e'; // Default green if tier not found
}

// ===================================================================
// # API FUNCTIONS
// ===================================================================

/**
 * Fetch leaderboard data from backend
 */
async function fetchLeaderboard() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/leaderboard`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch leaderboard');
        }
        
        return result;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
}

/**
 * Fetch competition status
 */
async function fetchCompetitionStatus() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/status`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.competition) {
            competitionState = {
                isActive: result.competition.isActive,
                isEnded: result.competition.isEnded,
                startTime: result.competition.startTime,
                endTime: result.competition.endTime,
                remainingSeconds: result.competition.remainingSeconds
            };
        }
        
        return result;
    } catch (error) {
        console.error('Error fetching competition status:', error);
        throw error;
    }
}

// ===================================================================
// # RENDER FUNCTIONS
// ===================================================================

/**
 * Render leaderboard items
 */
function renderLeaderboard(players) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    if (!leaderboardBody) {
        console.error('Leaderboard body element not found');
        return;
    }
    
    if (!players || players.length === 0) {
        leaderboardBody.innerHTML = `
            <div class="loading" style="opacity: 0.7; font-size: 1.6rem;">
                No players found for the current competition period
            </div>
        `;
        return;
    }
    
    leaderboardBody.innerHTML = '';
    
    players.forEach((player, index) => {
        const rank = index + 1;
        const medal = getMedalEmoji(rank);
        const rankText = getRankText(rank);
        const isTopThree = rank <= 3;
        
        // Censor username
        const displayName = censorUsername(player.user.username);
        
        // Get tier info
        const tier = player.user.tier || 'Bronze';
        const tierColor = getTierColor(tier);
        
        // Format wagered amount
        const wageredAmount = formatNumber(Math.floor(player.wagered));
        
        // Create leaderboard item
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.style.animationDelay = `${index * 0.05}s`;
        
        // Reward amounts for top 5
        const rewards = {
            1: 75,
            2: 50,
            3: 25,
            4: 15,
            5: 10
        };

        const reward = rewards[rank];
        const rewardHTML = reward ? `
            <span class="reward-badge">
                💎 Reward: ${reward} gems
            </span>
        ` : '';

        item.innerHTML = `
            <div class="rank-badge ${isTopThree ? 'top-3' : ''} ${rank === 1 ? 'first' : ''} ${rank === 2 ? 'second' : ''} ${rank === 3 ? 'third' : ''}">
                ${medal} ${rankText}
            </div>
            <div class="user-info">
                <img src="${player.user.avatarUrl}" alt="${displayName}" class="user-avatar" onerror="this.src='https://via.placeholder.com/50'">
                <div>
                    <div class="username">${displayName}</div>
                    <div class="user-tier" style="color: ${tierColor};">Lv.${player.user.level || 0} • ${tier}</div>
                </div>
            </div>
            <div class="wagered">
                $${wageredAmount}
                <span style="display: block; font-size: 1.1rem; opacity: 0.7; margin-top: 0.3rem;">
                    ${player.wagered > 0 ? `Earned: $${player.earned ? player.earned.toFixed(2) : '0.00'}` : 'Not wagered yet'}
                </span>
                ${rewardHTML}
            </div>
        `;
    
        leaderboardBody.appendChild(item); 
    });
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    const timerInactive = document.getElementById('timer-inactive');
    const timerEnded = document.getElementById('timer-ended');
    
    if (!timerDisplay || !timerInactive || !timerEnded) {
        console.error('Timer elements not found');
        return;
    }
    
    // Hide all timer states
    timerDisplay.style.display = 'none';
    timerInactive.style.display = 'none';
    timerEnded.style.display = 'none';
    
    if (competitionState.isEnded) {
        timerEnded.style.display = 'block';
    } else if (competitionState.isActive && competitionState.remainingSeconds > 0) {
        timerDisplay.style.display = 'block';
        updateCountdown();
    } else {
        timerInactive.style.display = 'block';
    }
}

/**
 * Update countdown timer
 */
function updateCountdown() {
    if (competitionState.remainingSeconds <= 0) {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        competitionState.isEnded = true;
        updateTimerDisplay();
        return;
    }
    
    const days = Math.floor(competitionState.remainingSeconds / 86400);
    const hours = Math.floor((competitionState.remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((competitionState.remainingSeconds % 3600) / 60);
    const seconds = competitionState.remainingSeconds % 60;
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    
    competitionState.remainingSeconds--;
}

/**
 * Start countdown interval
 */
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    if (competitionState.isActive && competitionState.remainingSeconds > 0) {
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}

// ===================================================================
// # MAIN UPDATE FUNCTION
// ===================================================================

/**
 * Update entire page with fresh data
 */
async function updatePage() {
    try {
        // Fetch both status and leaderboard in parallel
        const [statusResult, leaderboardResult] = await Promise.all([
            fetchCompetitionStatus(),
            fetchLeaderboard()
        ]);
        
        // Update timer display
        updateTimerDisplay();
        
        // Start countdown if active
        if (competitionState.isActive) {
            startCountdown();
        }
        
        // Render leaderboard
        if (leaderboardResult.data && leaderboardResult.data.list) {
            renderLeaderboard(leaderboardResult.data.list);
        } else {
            renderLeaderboard([]);
        }
        
        console.log('✅ Page updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating page:', error);
        
        const leaderboardBody = document.getElementById('leaderboard-body');
        if (leaderboardBody) {
            leaderboardBody.innerHTML = `
                <div class="loading" style="color: #dc2626;">
                    Failed to load leaderboard. Please refresh the page.
                    <br><br>
                    <small style="font-size: 1.4rem; opacity: 0.7;">Make sure backend is running at ${CONFIG.API_BASE_URL}</small>
                </div>
            `;
        }
    }
}

// ===================================================================
// # PRELOADER HANDLING
// ===================================================================

/**
 * Hide preloader once everything is loaded
 * Called after initial data fetch completes
 */
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Smooth fade out
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.5s ease-out';
        
        // Remove from DOM after fade completes
        setTimeout(() => {
            preloader.style.display = 'none';
            console.log('✅ Preloader hidden');
        }, 500);
    }
}

// ===================================================================
// # PARTICLES.JS CONFIGURATION
// ===================================================================

/**
 * Initialize particles.js background
 */
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#22c55e'
                },
                shape: {
                    type: 'circle'
                },
                opacity: {
                    value: 0.3,
                    random: true
                },
                size: {
                    value: 3,
                    random: true
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#22c55e',
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    repulse: {
                        distance: 100,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
        
        console.log('✅ Particles initialized');
    } else {
        console.warn('⚠️ particles.js not loaded');
    }
}

// ===================================================================
// # INITIALIZATION
// ===================================================================

/**
 * Initialize everything when DOM is ready
 */
async function initialize() {
    console.log('🚀 Initializing leaderboard...');
    console.log(`📡 Backend API: ${CONFIG.API_BASE_URL}`);
    
    try {
        // Initial page update
        await updatePage();
        
        // Hide preloader after successful load
        hidePreloader();
        
        // Setup auto-refresh
        refreshInterval = setInterval(async () => {
            console.log('🔄 Auto-refreshing data...');
            await updatePage();
        }, CONFIG.REFRESH_INTERVAL);
        
        console.log('✅ Leaderboard initialized successfully');
        console.log(`🔄 Auto-refresh every ${CONFIG.REFRESH_INTERVAL / 1000}s`);
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        
        // Hide preloader even on error to prevent infinite loading
        hidePreloader();
        
        const leaderboardBody = document.getElementById('leaderboard-body');
        if (leaderboardBody) {
            leaderboardBody.innerHTML = `
                <div class="loading" style="color: #dc2626;">
                    ⚠️ Failed to initialize leaderboard
                    <br><br>
                    <small style="font-size: 1.4rem; opacity: 0.7;">
                        Please check:<br>
                        1. Backend server is running<br>
                        2. API URL: ${CONFIG.API_BASE_URL}<br>
                        3. Browser console for errors
                    </small>
                </div>
            `;
        }
    }
}

// ===================================================================
// # CLEANUP
// ===================================================================

/**
 * Cleanup intervals on page unload
 */
window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        console.log('🧹 Countdown interval cleared');
    }
    if (refreshInterval) {
        clearInterval(refreshInterval);
        console.log('🧹 Refresh interval cleared');
    }
});

// ===================================================================
// # START APPLICATION
// ===================================================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded');
        initialize();
        initParticles();
    });
} else {
    // DOM is already loaded
    console.log('📄 DOM already loaded');
    initialize();
    initParticles();
}