// Public, non-secret settings. Fill in the two empty values for CS2Reaper.
window.ZYRO_CONFIG = {
  skinrave: {
    api: 'https://zyro-leaderboard-backend.vercel.app/api',
    claim: 'https://skinrave.gg/en?r=ZYROREWARDS',
    rewards: [70, 30, 25, 15, 10] 
  },
  cs2reaper: {
    api: 'https://cs2reaper.com/api/race/creator/zyro',    // TODO: CS2Reaper leaderboard endpoint (use a backend proxy if it has CORS/key limits)
    claim: 'https://cs2reaper.com/r/zyro', 
    symbol: '$' 
  },
  socials: [
    { name: 'X', url: 'https://x.com/ZYROREWARDS1', icon: 'fa-brands fa-x-twitter' },
    { name: 'Kick', url: 'https://kick.com/zyrorewards', icon: 'fa-solid fa-k' },
    { name: 'Discord', url: 'https://discord.gg/ZEv8deeCqm', icon: 'fa-brands fa-discord' }
  ],
  notice: '18+ only. Gambling involves risk and can result in financial loss. Participate responsibly and only where legally permitted.'
};
