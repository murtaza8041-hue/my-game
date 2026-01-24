// Game Main Script
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Space Shooter Game Loading...');
    
    // Get DOM elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const levelCompleteScreen = document.getElementById('levelCompleteScreen');
    const startBtn = document.getElementById('startBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const soundBtn = document.getElementById('soundBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    const finalScoreElement = document.getElementById('finalScore');
    const finalLevelElement = document.getElementById('finalLevel');
    const aliensDestroyedElement = document.getElementById('aliensDestroyed');
    
    // Mobile controls
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const shootBtn = document.getElementById('shootBtn');
    
    // Game state
    let game = {
        running: false,
        paused: false,
        score: 0,
        highScore: localStorage.getItem('spaceShooterHighScore') || 0,
        lives: 3,
        level: 1,
        aliensDestroyed: 0,
        soundEnabled: true,
        lastTime: 0,
        deltaTime: 0,
        player: null,
        bullets: [],
        aliens: [],
        explosions: [],
        powerUps: [],
        particles: []
    };
    
    // Initialize high score display
    highScoreElement.textContent = game.highScore.toString().padStart(5, '0');
    
    // Set canvas size
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Player class
    class Player {
        constructor() {
            this.width = 50;
            this.height = 50;
            this.x = canvas.width / 2 - this.width / 2;
            this.y = canvas.height - 100;
            this.speed = 5;
            this.color = '#00f3ff';
            this.lastShot = 0;
            this.shootDelay = 300; // ms
            this.shield = false;
            this.shieldTimer = 0;
            this.rapidFire = false;
            this.rapidFireTimer = 0;
        }
        
        draw() {
            // Draw shield
            if (this.shield) {
                ctx.beginPath();
                ctx.arc(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    this.width / 2 + 10,
                    0,
                    Math.PI * 2
                );
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Draw spaceship body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Main body
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            
            // Cockpit
            ctx.fillStyle = '#0080ff';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 3,
                10,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Engine glow
            ctx.fillStyle = this.rapidFire ? '#ffaa00' : '#ff0000';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 3, this.y + this.height);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height + 20);
            ctx.lineTo(this.x + 2 * this.width / 3, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
        
        update(keys) {
            // Movement
            if (keys['ArrowLeft'] || keys['a'] || keys['A'] || game.mobileLeft) {
                this.x -= this.speed;
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D'] || game.mobileRight) {
                this.x += this.speed;
            }
            
            // Boundary checking
            this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
            
            // Update timers
            const currentTime = Date.now();
            if (this.shield && currentTime > this.shieldTimer) {
                this.shield = false;
            }
            if (this.rapidFire && currentTime > this.rapidFireTimer) {
                this.rapidFire = false;
                this.shootDelay = 300;
            }
        }
        
        shoot() {
            const currentTime = Date.now();
            if (currentTime - this.lastShot > this.shootDelay) {
                this.lastShot = currentTime;
                
                // Create bullet(s)
                if (this.rapidFire) {
                    // Rapid fire: three bullets
                    game.bullets.push(new Bullet(this.x + 10, this.y));
                    game.bullets.push(new Bullet(this.x + this.width / 2, this.y));
                    game.bullets.push(new Bullet(this.x + this.width - 10, this.y));
                } else {
                    // Normal fire: one bullet
                    game.bullets.push(new Bullet(this.x + this.width / 2, this.y));
                }
                
                // Play shoot sound
                if (game.soundEnabled) {
                    playShootSound();
                }
            }
        }
    }
    
    // Bullet class
    class Bullet {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 3;
            this.height = 15;
            this.speed = 10;
            this.color = '#00ffaa';
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
            
            // Add glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
        }
        
        update() {
            this.y -= this.speed;
            return this.y < 0; // Return true if off screen
        }
    }
    
    // Alien class
    class Alien {
        constructor(type = 'small') {
            this.type = type;
            
            // Set properties based on type
            switch(type) {
                case 'small':
                    this.width = 30;
                    this.height = 30;
                    this.speed = 1.5;
                    this.health = 1;
                    this.points = 100;
                    this.color = '#00ffaa';
                    break;
                case 'medium':
                    this.width = 50;
                    this.height = 50;
                    this.speed = 1;
                    this.health = 2;
                    this.points = 250;
                    this.color = '#ffaa00';
                    break;
                case 'large':
                    this.width = 70;
                    this.height = 70;
                    this.speed = 0.7;
                    this.health = 3;
                    this.points = 500;
                    this.color = '#ff5500';
                    break;
                case 'boss':
                    this.width = 100;
                    this.height = 100;
                    this.speed = 0.3;
                    this.health = 10;
                    this.points = 1000;
                    this.color = '#ff00ff';
                    break;
            }
            
            this.x = Math.random() * (canvas.width - this.width);
            this.y = -this.height;
            this.wave = Math.random() * Math.PI * 2;
            this.waveSpeed = Math.random() * 0.05 + 0.02;
            this.originalX = this.x;
        }
        
        draw() {
            // Draw alien body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Draw alien details
            ctx.fillStyle = '#000';
            // Eyes
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 3,
                this.y + this.height / 3,
                this.width / 8,
                0,
                Math.PI * 2
            );
            ctx.arc(
                this.x + 2 * this.width / 3,
                this.y + this.height / 3,
                this.width / 8,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Draw health bar for medium+ aliens
            if (this.health > 1) {
                const healthWidth = this.width;
                const healthHeight = 5;
                const healthX = this.x;
                const healthY = this.y - 10;
                
                // Background
                ctx.fillStyle = '#333';
                ctx.fillRect(healthX, healthY, healthWidth, healthHeight);
                
                // Health
                const healthPercent = this.health / (this.type === 'medium' ? 2 : 
                                                     this.type === 'large' ? 3 : 10);
                ctx.fillStyle = this.health > 1 ? '#00ff00' : '#ff0000';
                ctx.fillRect(healthX, healthY, healthWidth * healthPercent, healthHeight);
            }
        }
        
        update() {
            // Wave movement
            this.wave += this.waveSpeed;
            this.x = this.originalX + Math.sin(this.wave) * 50;
            
            // Move downward
            this.y += this.speed;
            
            // Check if reached bottom
            if (this.y > canvas.height) {
                return 'reached_bottom';
            }
            
            return 'alive';
        }
        
        hit() {
            this.health--;
            return this.health <= 0;
        }
    }
    
    // Power-up class
    class PowerUp {
        constructor(type) {
            this.type = type;
            this.width = 30;
            this.height = 30;
            this.x = Math.random() * (canvas.width - this.width);
            this.y = -this.height;
            this.speed = 2;
            
            // Set color based on type
            switch(type) {
                case 'shield':
                    this.color = '#00f3ff';
                    this.icon = '🛡️';
                    break;
                case 'rapid_fire':
                    this.color = '#ffaa00';
                    this.icon = '🔥';
                    break;
                case 'bomb':
                    this.color = '#ff0000';
                    this.icon = '💣';
                    break;
                case 'life':
                    this.color = '#00ff00';
                    this.icon = '❤️';
                    break;
            }
        }
        
        draw() {
            // Draw power-up container
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 5);
            ctx.fill();
            
            // Draw icon
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, this.x + this.width / 2, this.y + this.height / 2);
        }
        
        update() {
            this.y += this.speed;
            return this.y > canvas.height; // Return true if off screen
        }
    }
    
    // Particle class for explosions
    class Particle {
        constructor(x, y, color = '#ff5500') {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 5 + 2;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * 6 - 3;
            this.color = color;
            this.life = 30;
            this.gravity = 0.1;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedY += this.gravity;
            this.life--;
            this.size *= 0.95;
            return this.life > 0;
        }
    }
    
    // Initialize game
    function initGame() {
        game.player = new Player();
        game.bullets = [];
        game.aliens = [];
        game.explosions = [];
        game.powerUps = [];
        game.particles = [];
        game.score = 0;
        game.lives = 3;
        game.level = 1;
        game.aliensDestroyed = 0;
        updateUI();
    }
    
    // Input handling
    const keys = {};
    game.mobileLeft = false;
    game.mobileRight = false;
    
    // Keyboard input
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Prevent spacebar from scrolling
        if (e.key === ' ') {
            e.preventDefault();
            if (game.running && !game.paused) {
                game.player.shoot();
            }
        }
        
        // Pause with P key
        if (e.key === 'p' || e.key === 'P') {
            togglePause();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Mobile controls
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.mobileLeft = true;
    });
    
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        game.mobileLeft = false;
    });
    
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.mobileRight = true;
    });
    
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        game.mobileRight = false;
    });
    
    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (game.running && !game.paused) {
            game.player.shoot();
        }
    });
    
    // Button event listeners
    startBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);
    nextLevelBtn.addEventListener('click', nextLevel);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', () => {
        initGame();
        startGame();
    });
    
    soundBtn.addEventListener('click', () => {
        game.soundEnabled = !game.soundEnabled;
        soundBtn.textContent = game.soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF';
    });
    
    fullscreenBtn.addEventListener('click', () => {
        const container = canvas.parentElement;
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.log(`Fullscreen failed: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
    
    // Game functions
    function startGame() {
        initGame();
        game.running = true;
        game.paused = false;
        startScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        levelCompleteScreen.classList.remove('active');
        pauseBtn.textContent = '⏸ PAUSE';
        game.lastTime = performance.now();
        gameLoop(game.lastTime);
    }
    
    function togglePause() {
        if (!game.running) return;
        
        game.paused = !game.paused;
        pauseBtn.textContent = game.paused ? '▶ RESUME' : '⏸ PAUSE';
        
        if (!game.paused) {
            game.lastTime = performance.now();
            gameLoop(game.lastTime);
        }
    }
    
    function gameOver() {
        game.running = false;
        
        // Update final stats
        finalScoreElement.textContent = game.score.toString().padStart(5, '0');
        finalLevelElement.textContent = game.level.toString().padStart(2, '0');
        aliensDestroyedElement.textContent = game.aliensDestroyed;
        
        // Update high score
        if (game.score > game.highScore) {
            game.highScore = game.score;
            localStorage.setItem('spaceShooterHighScore', game.highScore);
            highScoreElement.textContent = game.highScore.toString().padStart(5, '0');
        }
        
        // Show game over screen
        gameOverScreen.classList.add('active');
    }
    
    function levelComplete() {
        game.paused = true;
        levelCompleteScreen.classList.add('active');
    }
    
    function nextLevel() {
        game.level++;
        levelElement.textContent = game.level.toString().padStart(2, '0');
        levelCompleteScreen.classList.remove('active');
        game.paused = false;
        game.lastTime = performance.now();
        gameLoop(game.lastTime);
    }
    
    // Spawn functions
    function spawnAlien() {
        let type = 'small';
        const rand = Math.random();
        
        if (game.level >= 4 && rand < 0.05) {
            type = 'boss';
        } else if (game.level >= 3 && rand < 0.1) {
            type = 'large';
        } else if (game.level >= 2 && rand < 0.2) {
            type = 'medium';
        }
        
        game.aliens.push(new Alien(type));
    }
    
    function spawnPowerUp() {
        if (Math.random() < 0.01) { // 1% chance each frame
            const types = ['shield', 'rapid_fire', 'bomb', 'life'];
            const type = types[Math.floor(Math.random() * types.length)];
            game.powerUps.push(new PowerUp(type));
        }
    }
    
    // Collision detection
    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // Game loop
    function gameLoop(currentTime) {
        if (!game.running || game.paused) return;
        
        // Calculate delta time
        game.deltaTime = currentTime - game.lastTime;
        game.lastTime = currentTime;
        
        // Update
        update();
        
        // Draw
        draw();
        
        // Continue loop
        requestAnimationFrame(gameLoop);
    }
    
    function update() {
        // Update player
        game.player.update(keys);
        
        // Spawn aliens based on level
        const spawnRate = 0.02 + (game.level * 0.005);
        if (Math.random() < spawnRate) {
            spawnAlien();
        }
        
        // Spawn power-ups
        spawnPowerUp();
        
        // Update bullets
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            if (game.bullets[i].update()) {
                game.bullets.splice(i, 1);
                continue;
            }
        }
        
        // Update aliens
        for (let i = game.aliens.length - 1; i >= 0; i--) {
            const alien = game.aliens[i];
            const status = alien.update();
            
            if (status === 'reached_bottom') {
                game.aliens.splice(i, 1);
                if (!game.player.shield) {
                    game.lives--;
                    updateUI();
                    
                    if (game.lives <= 0) {
                        gameOver();
                        return;
                    }
                }
                continue;
            }
            
            // Check bullet collisions
            for (let j = game.bullets.length - 1; j >= 0; j--) {
                const bullet = game.bullets[j];
                
                if (checkCollision(bullet, alien)) {
                    // Hit alien
                    const destroyed = alien.hit();
                    
                    // Remove bullet
                    game.bullets.splice(j, 1);
                    
                    if (destroyed) {
                        // Add score
                        game.score += alien.points;
                        game.aliensDestroyed++;
                        
                        // Create explosion
                        createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, alien.color);
                        
                        // Remove alien
                        game.aliens.splice(i, 1);
                        
                        // Chance to spawn power-up
                        if (Math.random() < 0.1) {
                            spawnPowerUp();
                        }
                        
                        updateUI();
                    }
                    break;
                }
            }
        }
        
        // Update power-ups
        for (let i = game.powerUps.length - 1; i >= 0; i--) {
            if (game.powerUps[i].update()) {
                game.powerUps.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (checkCollision(game.player, game.powerUps[i])) {
                const powerUp = game.powerUps[i];
                
                // Apply power-up effect
                switch(powerUp.type) {
                    case 'shield':
                        game.player.shield = true;
                        game.player.shieldTimer = Date.now() + 10000; // 10 seconds
                        break;
                    case 'rapid_fire':
                        game.player.rapidFire = true;
                        game.player.rapidFireTimer = Date.now() + 8000; // 8 seconds
                        game.player.shootDelay = 100;
                        break;
                    case 'bomb':
                        // Destroy all aliens
                        game.aliens.forEach(alien => {
                            createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, alien.color);
                            game.score += alien.points;
                            game.aliensDestroyed++;
                        });
                        game.aliens = [];
                        break;
                    case 'life':
                        game.lives = Math.min(game.lives + 1, 5);
                        break;
                }
                
                // Remove power-up
                game.powerUps.splice(i, 1);
                updateUI();
                
                // Play power-up sound
                if (game.soundEnabled) {
                    // playPowerUpSound();
                }
            }
        }
        
        // Update particles
        for (let i = game.particles.length - 1; i >= 0; i--) {
            if (!game.particles[i].update()) {
                game.particles.splice(i, 1);
            }
        }
        
        // Check level completion
        if (game.aliens.length === 0 && game.aliensDestroyed >= game.level * 10) {
            levelComplete();
        }
    }
    
    function draw() {
        // Clear canvas with space background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw stars
        drawStars();
        
        // Draw player
        game.player.draw();
        
        // Draw bullets
        game.bullets.forEach(bullet => bullet.draw());
        
        // Draw aliens
        game.aliens.forEach(alien => alien.draw());
        
        // Draw power-ups
        game.powerUps.forEach(powerUp => powerUp.draw());
        
        // Draw particles
        game.particles.forEach(particle => particle.draw());
        
        // Draw UI
        drawGameUI();
    }
    
    function drawStars() {
        // Create some static stars
        if (!game.stars) {
            game.stars = [];
            for (let i = 0; i < 100; i++) {
                game.stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 1,
                    brightness: Math.random() * 0.5 + 0.5
                });
            }
        }
        
        // Draw stars
        game.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
    
    function drawGameUI() {
        // Draw score in canvas
        ctx.fillStyle = '#fff';
        ctx.font = '20px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${game.score.toString().padStart(5, '0')}`, 20, 30);
        ctx.fillText(`LEVEL: ${game.level.toString().padStart(2, '0')}`, 20, 60);
        
        // Draw lives as hearts
        const heart = '❤️';
        const livesText = heart.repeat(game.lives);
        ctx.font = '24px Arial';
        ctx.fillText(livesText, canvas.width - 100, 30);
    }
    
    function createExplosion(x, y, color) {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            game.particles.push(new Particle(x, y, color));
        }
        
        // Play explosion sound
        if (game.soundEnabled) {
            playExplosionSound();
        }
    }
    
    function updateUI() {
        scoreElement.textContent = game.score.toString().padStart(5, '0');
        levelElement.textContent = game.level.toString().padStart(2, '0');
        
        // Update lives display
        const hearts = '❤️'.repeat(game.lives);
        livesElement.textContent = hearts;
        
        // Update high score if needed
        if (game.score > game.highScore) {
            game.highScore = game.score;
            highScoreElement.textContent = game.highScore.toString().padStart(5, '0');
        }
    }
    
    // Sound functions
    function playShootSound() {
        const audio = document.getElementById('shootSound');
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    function playExplosionSound() {
        const audio = document.getElementById('explosionSound');
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Initialize the game
    initGame();
    console.log('✅ Space Shooter Game Ready!');
});