// UI and Interactions Script
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 UI Script Loading...');
    
    // Get DOM elements
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const playBtn = document.getElementById('playBtn');
    const shareBtn = document.getElementById('shareBtn');
    const clearScoresBtn = document.getElementById('clearScoresBtn');
    const leaderboardBody = document.getElementById('leaderboardBody');
    const currentDate = document.getElementById('currentDate');
    const playerCount = document.getElementById('playerCount');
    const socialBtns = document.querySelectorAll('.social-btn');
    
    // Initialize date
    if (currentDate) {
        const now = new Date();
        currentDate.textContent = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Mobile menu toggle
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'rgba(0, 0, 0, 0.95)';
                navLinks.style.padding = '2rem';
                navLinks.style.zIndex = '1000';
            }
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (window.innerWidth <= 768 && navLinks) {
                    navLinks.style.display = 'none';
                }
                
                // Scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Play button scroll to game
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const gameSection = document.getElementById('game');
            if (gameSection) {
                gameSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
    
    // Share button
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const score = document.getElementById('finalScore')?.textContent || '00000';
            const level = document.getElementById('finalLevel')?.textContent || '01';
            const shareText = `🚀 I scored ${score} points and reached Level ${level} in Space Shooter! Can you beat my score? Play now: ${window.location.href}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Space Shooter Game',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                // Fallback: Copy to clipboard
                navigator.clipboard.writeText(shareText).then(() => {
                    alert('Score copied to clipboard! Share it with your friends!');
                });
            }
        });
    }
    
    // Clear scores button
    if (clearScoresBtn) {
        clearScoresBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all scores?')) {
                localStorage.removeItem('spaceShooterHighScore');
                localStorage.removeItem('spaceShooterLeaderboard');
                updateLeaderboard();
                alert('All scores cleared!');
            }
        });
    }
    
    // Social buttons
    socialBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.textContent.toLowerCase();
            const gameUrl = window.location.href;
            const gameTitle = 'Space Shooter Game';
            const gameDescription = '🚀 An awesome HTML5 space shooter game! Play now for free!';
            
            let shareUrl = '';
            
            switch(platform) {
                case '🐦 twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(gameDescription)}&url=${encodeURIComponent(gameUrl)}`;
                    break;
                case '📘 facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}`;
                    break;
                case '🔗 copy link':
                    navigator.clipboard.writeText(gameUrl).then(() => {
                        alert('Game link copied to clipboard!');
                    });
                    return;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });
    
    // Initialize leaderboard
    function updateLeaderboard() {
        if (!leaderboardBody) return;
        
        // Get leaderboard from localStorage or use default
        let leaderboard = JSON.parse(localStorage.getItem('spaceShooterLeaderboard')) || [
            { rank: 1, player: "Space Commander", score: 12500, level: 5, date: "2024-01-15" },
            { rank: 2, player: "Alien Hunter", score: 9800, level: 4, date: "2024-01-14" },
            { rank: 3, player: "Star Pilot", score: 8750, level: 4, date: "2024-01-13" },
            { rank: 4, player: "You", score: 0, level: 1, date: "Just now" },
            { rank: 5, player: "New Player", score: 5400, level: 3, date: "2024-01-12" }
        ];
        
        // Clear table
        leaderboardBody.innerHTML = '';
        
        // Add rows
        leaderboard.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${entry.rank}</td>
                <td>${entry.player}</td>
                <td>${entry.score.toLocaleString()}</td>
                <td>${entry.level}</td>
                <td>${entry.date}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }
    
    // Update player count (simulated)
    function updatePlayerCount() {
        if (playerCount) {
            // Simulate random player count between 1-50
            const count = Math.floor(Math.random() * 50) + 1;
            playerCount.textContent = count;
        }
    }
    
    // Initialize
    updateLeaderboard();
    updatePlayerCount();
    
    // Update player count every 30 seconds
    setInterval(updatePlayerCount, 30000);
    
    // Add particle effect to hero section
    createHeroParticles();
    
    console.log('✅ UI Script Ready!');
});

// Particle effect for hero section
function createHeroParticles() {
    const hero = document.querySelector('.hero-bg');
    if (!hero) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 3 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, ${Math.random() * 0.5 + 0.2})`;
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 10}s infinite ease-in-out`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        
        hero.appendChild(particle);
    }
}

// Add CSS for particle animation
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
    }
`;
document.head.appendChild(style);