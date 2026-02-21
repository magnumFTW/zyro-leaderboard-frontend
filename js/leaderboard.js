/* ===================================================================
 * LEADERBOARD.JS - Refactored Version
 * 
 * Features:
 * - Fetches leaderboard from backend API
 * - Competition timer with countdown
 * - Medal emojis for top 3 (🥇🥈🥉)
 * - Username censoring (De***j format)
 * - Dynamic rank-based rewards [70, 30, 25, 15, 10]
 * - SVG currency logo in both Wagered and Reward columns
 * - Shared .amount-with-icon class for consistent styling
 * - Clean reward display — no box, no badge
 * - Proper preloader hiding after data loads
 * - Particles.js background
 * - Auto-refresh every 10 minutes
 * ================================================================ */

// ===================================================================
// # CONFIGURATION
// ===================================================================

const CONFIG = {
    API_BASE_URL: 'https://zyro-leaderboard-backend.vercel.app/api',
    REFRESH_INTERVAL: 600000
};

// SVG Currency Logo (inline) — shared by both wagered and reward columns
const CURRENCY_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51 50" fill="none" class="currency-logo"><path fill="url(#a)" d="M23.276 4.31v4.31h4.023V0h-4.023v4.31Z"/><path fill="url(#b)" d="M16.954 6.293C12.098 8.391 8.506 12.04 6.236 17.126c-.431.977-.776 1.84-.776 1.954 0 .087.977.173 2.155.173H9.74l.575-1.293c.718-1.638 2.874-4.368 4.31-5.546.604-.489 1.983-1.38 3.018-1.925l1.896-1.064V7.443c0-1.409-.115-1.983-.345-1.983-.2.029-1.207.373-2.241.833Z"/><path fill="url(#c)" d="M31.322 7.471v2.012l1.38.69c3.189 1.609 6.12 4.482 7.614 7.47l.833 1.61h4.225L45 18.16c-1.84-5.23-5.977-9.598-11.264-11.925-.977-.431-1.926-.776-2.098-.776-.201 0-.316.718-.316 2.011Z"/><path fill="#fff" d="M22.27 13.046c-2.184.546-3.822 1.523-5.632 3.305-2.414 2.413-3.707 5.43-3.707 8.649 0 2.098-.201 2.012 5.345 2.012h5v2.873h4.023v-2.873h6.322l-.259.66c-.833 2.184-2.787 4.08-5.086 4.972-.92.345-1.84.43-3.477.345-2.414-.144-3.592-.661-5.805-2.673l-1.092-.977-1.35 1.38-1.35 1.379 1.091 1.15c3.937 4.108 10.374 5.028 15.374 2.24 1.58-.862 3.965-3.362 4.77-4.913.862-1.696 1.523-4.57 1.437-6.092l-.087-1.35-5.172-.145-5.173-.143-.086-1.523-.086-1.494h-3.994v3.16h-3.017c-1.667 0-3.018-.057-3.018-.143 0-.632 1.035-2.328 2.04-3.448 1.897-2.07 3.104-2.587 6.006-2.587 2.903 0 4.023.431 6.092 2.385l1.408 1.293 1.265-1.235c.718-.69 1.293-1.437 1.293-1.61 0-.574-2.931-3.045-4.483-3.735-2.672-1.236-5.804-1.552-8.592-.862Z"/><path fill="url(#d)" d="M0 25v2.012h8.62v-4.024H0V25Z"/><path fill="url(#e)" d="m42.011 24.914.087 1.954 4.396.086 4.368.086v-4.052h-8.937l.087 1.926Z"/><path fill="url(#f)" d="M5.632 31.236c.115.287.719 1.609 1.35 2.93 2.07 4.254 6.351 8.018 11.15 9.828l1.408.546v-4.167l-1.954-.976c-2.586-1.351-5.718-4.454-6.839-6.84l-.833-1.781H7.7c-1.983-.029-2.212.029-2.069.46Z"/><path fill="url(#g)" d="M40.546 31.667c-1.293 3.017-4.569 6.35-7.701 7.93l-1.523.748v4.167l1.092-.374c5.632-1.983 9.971-6.207 12.385-12.04l.575-1.35h-4.426l-.402.919Z"/><path fill="url(#h)" d="M23.276 45.69V50h4.023v-8.62h-4.023v4.31Z"/><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="matrix(0 -8.62069 4.02299 0 25.287 8.62)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient><radialGradient id="b" cx="0" cy="0" r="1" gradientTransform="matrix(0 -13.7931 14.0805 0 12.5 19.253)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient><radialGradient id="c" cx="0" cy="0" r="1" gradientTransform="matrix(0 -13.7931 14.0517 0 38.348 19.253)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient><radialGradient id="d" cx="0" cy="0" r="1" gradientTransform="matrix(0 -4.02299 8.62069 0 4.31 27.012)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient><radialGradient id="e" cx="0" cy="0" r="1" gradientTransform="matrix(0 -4.05172 8.93678 0 46.394 27.04)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient><radialGradient id="f" cx="0" cy="0" r="1" gradientTransform="matrix(0 -13.7706 13.9428 0 12.569 44.54)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient><radialGradient id="g" cx="0" cy="0" r="1" gradientTransform="matrix(0 -13.7644 14.0517 0 38.348 44.511)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient><radialGradient id="h" cx="0" cy="0" r="1" gradientTransform="matrix(0 -8.62069 4.02299 0 25.287 50)" gradientUnits="userSpaceOnUse"><stop stop-color="#4FEA9F"/><stop offset="1" stop-color="#38644F"/><stop offset="1" stop-color="#152F22"/></radialGradient></defs></svg>`;

// ===================================================================
// # STATE MANAGEMENT
// ===================================================================

let competitionState = {
    isActive: false,
    isEnded: false,
    startTime: null,
    endTime: null,
    remainingSeconds: 0,
    durationDays: 14
};

let countdownInterval = null;
let refreshInterval = null;

// Dynamic reward amounts for top 5 ranks
const RANK_REWARDS = [70, 30, 25, 15, 10];

// ===================================================================
// # UTILITY FUNCTIONS
// ===================================================================

function censorUsername(username) {
    if (!username || username.length <= 2) return username;
    if (username.length === 3) return username[0] + '*' + username[2];
    const firstTwo = username.slice(0, 2);
    const lastOne = username.slice(-1);
    const middleLength = username.length - 3;
    const asterisks = '*'.repeat(Math.max(3, middleLength));
    return firstTwo + asterisks + lastOne;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getMedalEmoji(rank) {
    switch(rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '';
    }
}

function getRankText(rank) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = rank % 100;
    return rank + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

function getRewardForRank(rank) {
    const index = rank - 1;
    return index < RANK_REWARDS.length ? RANK_REWARDS[index] : null;
}

function getTierColor(tier) {
    if (!tier) return '#9ca3af';
    const tierColors = {
        'IRON': '#9ca3af', 'BRONZE': '#cd7f32', 'SILVER': '#c0c0c0',
        'GOLD': '#ffd700', 'MITHRIL': '#4a90e2', 'SAPPHIRE': '#0f52ba',
        'EMERALD': '#50c878', 'RUBY': '#e0115f', 'DIAMOND': '#b9f2ff',
        'PLATINUM': '#e5e4e2', 'MASTER': '#9d4edd', 'GRANDMASTER': '#ff006e',
        'CHALLENGER': '#ff006e'
    };
    return tierColors[tier.toUpperCase()] || '#4FEA9F';
}

// ===================================================================
// # API FUNCTIONS
// ===================================================================

async function fetchLeaderboard() {
    const response = await fetch(`${CONFIG.API_BASE_URL}/leaderboard`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to fetch leaderboard');
    return result;
}

async function fetchCompetitionStatus() {
    const response = await fetch(`${CONFIG.API_BASE_URL}/status`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success && result.competition) {
        competitionState = {
            isActive: result.competition.isActive,
            isEnded: result.competition.isEnded,
            startTime: result.competition.startTime,
            endTime: result.competition.endTime,
            remainingSeconds: result.competition.remainingSeconds,
            durationDays: result.competition.durationDays || 30
        };
    }
    return result;
}

// ===================================================================
// # RENDER FUNCTIONS
// ===================================================================

function renderLeaderboard(players) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    if (!players || players.length === 0) {
        leaderboardBody.innerHTML = `
            <div class="loading" style="opacity: 0.7; font-size: 1.6rem;">
                No players found for the current competition period
            </div>`;
        return;
    }

    leaderboardBody.innerHTML = '';

    players.forEach((player, index) => {
        const rank = index + 1;
        const medal = getMedalEmoji(rank);
        const rankText = getRankText(rank);
        const isTopThree = rank <= 3;

        const displayName = censorUsername(player.user.username);
        const tier = player.user.levelTier;
        const tierColor = getTierColor(tier);
        const wageredAmount = formatNumber(Math.floor(player.wagered));

        const reward = getRewardForRank(rank);

        // Reward column — clean text + icon, no box
        const rewardHTML = reward
            ? `<div class="reward-column">
                 <span class="amount-with-icon">
                   <span>${reward}</span>
                   ${CURRENCY_LOGO_SVG}
                 </span>
               </div>`
            : `<div class="reward-column no-reward">—</div>`;

        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.style.animationDelay = `${index * 0.05}s`;

        item.innerHTML = `
            <div class="rank-badge ${isTopThree ? 'top-3' : ''} ${rank === 1 ? 'first' : ''} ${rank === 2 ? 'second' : ''} ${rank === 3 ? 'third' : ''}">
                ${medal} ${rankText}
            </div>
            <div class="user-info">
                <img src="${player.user.avatarUrl}" alt="${displayName}" class="user-avatar"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect width=%2250%22 height=%2250%22 fill=%22%23333%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23fff%22 font-size=%2224%22%3E?%3C/text%3E%3C/svg%3E'">
                <div>
                    <div class="username">${displayName}</div>
                    <div class="user-tier" style="color: ${tierColor};">Lv.${player.user.level || 0} • ${tier}</div>
                </div>
            </div>
            <div class="wagered">
                <div class="amount-with-icon">
                    <span>${wageredAmount}</span>
                    ${CURRENCY_LOGO_SVG}
                </div>
                <span class="earned-text">
                    ${player.wagered > 0 ? `Earned: ${parseFloat(player.earned || 0).toFixed(2)}` : 'Not wagered'}
                </span>
            </div>
            ${rewardHTML}
        `;

        leaderboardBody.appendChild(item);
    });
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    const timerInactive = document.getElementById('timer-inactive');
    const timerEnded = document.getElementById('timer-ended');
    if (!timerDisplay || !timerInactive || !timerEnded) return;

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

function updateCompetitionTitle() {
    const titleElement = document.getElementById('competition-title');
    if (titleElement) {
        titleElement.textContent = competitionState.durationDays
            ? `${competitionState.durationDays} Day Competition Ending In:`
            : 'Competition Ending In:';
    }
}

function updateCountdown() {
    if (competitionState.remainingSeconds <= 0) {
        if (countdownInterval) clearInterval(countdownInterval);
        competitionState.isEnded = true;
        updateTimerDisplay();
        return;
    }

    const days = Math.floor(competitionState.remainingSeconds / 86400);
    const hours = Math.floor((competitionState.remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((competitionState.remainingSeconds % 3600) / 60);
    const seconds = competitionState.remainingSeconds % 60;

    const pad = n => String(n).padStart(2, '0');
    const el = id => document.getElementById(id);

    if (el('days')) el('days').textContent = pad(days);
    if (el('hours')) el('hours').textContent = pad(hours);
    if (el('minutes')) el('minutes').textContent = pad(minutes);
    if (el('seconds')) el('seconds').textContent = pad(seconds);

    competitionState.remainingSeconds--;
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    if (competitionState.isActive && competitionState.remainingSeconds > 0) {
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}

// ===================================================================
// # MAIN UPDATE FUNCTION
// ===================================================================

async function updatePage() {
    try {
        const [statusResult, leaderboardResult] = await Promise.all([
            fetchCompetitionStatus(),
            fetchLeaderboard()
        ]);

        updateCompetitionTitle();
        updateTimerDisplay();

        if (competitionState.isActive) startCountdown();

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
                </div>`;
        }
    }
}

// ===================================================================
// # PRELOADER
// ===================================================================

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
}

// ===================================================================
// # PARTICLES.JS
// ===================================================================

function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: '#4FEA9F' },
                shape: { type: 'circle' },
                opacity: { value: 0.3, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#4FEA9F', opacity: 0.2, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'repulse' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                },
                modes: {
                    repulse: { distance: 100, duration: 0.4 },
                    push: { particles_nb: 4 }
                }
            },
            retina_detect: true
        });
    }
}

// ===================================================================
// # INITIALIZATION
// ===================================================================

async function initialize() {
    try {
        await updatePage();
        hidePreloader();
        refreshInterval = setInterval(async () => { await updatePage(); }, CONFIG.REFRESH_INTERVAL);
    } catch (error) {
        console.error('❌ Initialization error:', error);
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
                </div>`;
        }
    }
}

// ===================================================================
// # CLEANUP
// ===================================================================

window.addEventListener('beforeunload', () => {
    if (countdownInterval) clearInterval(countdownInterval);
    if (refreshInterval) clearInterval(refreshInterval);
});

// ===================================================================
// # START
// ===================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initialize(); initParticles(); });
} else {
    initialize();
    initParticles();
}