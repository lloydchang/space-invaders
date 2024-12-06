const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// Canvas setup
canvas.width = 800;
canvas.height = 600;

// Game state
let score = 0;
let lives = 3;
let gameLoop;
let lastTime = 0;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    width: 50,
    height: 30,
    speed: 5,
    color: '#00ff00',
    bullets: [],
    canShoot: true,
    shootCooldown: 250 // ms
};

// Enemies
const enemyRows = 5;
const enemyCols = 10;
const enemies = [];
const enemyWidth = 40;
const enemyHeight = 30;
const enemyPadding = 10;
let enemyDirection = 1;
let enemyStepDown = false;
let enemyMoveSpeed = 1;

// Game objects
class Bullet {
    constructor(x, y, speed, isPlayerBullet = true) {
        this.x = x;
        this.y = y;
        this.width = 3;
        this.height = 15;
        this.speed = speed;
        this.isPlayerBullet = isPlayerBullet;
    }

    update() {
        this.y += this.isPlayerBullet ? -this.speed : this.speed;
    }

    draw() {
        ctx.fillStyle = this.isPlayerBullet ? '#fff' : '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Initialize enemies
function initEnemies() {
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: col * (enemyWidth + enemyPadding) + enemyPadding,
                y: row * (enemyHeight + enemyPadding) + enemyPadding + 50,
                width: enemyWidth,
                height: enemyHeight,
                alive: true
            });
        }
    }
}

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

window.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

// Game functions
function updatePlayer() {
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys.Space && player.canShoot) {
        player.bullets.push(new Bullet(
            player.x + player.width / 2 - 1.5,
            player.y,
            10
        ));
        player.canShoot = false;
        setTimeout(() => {
            player.canShoot = true;
        }, player.shootCooldown);
    }
}

function updateBullets() {
    player.bullets = player.bullets.filter(bullet => {
        bullet.update();
        return bullet.y > 0;
    });
}

function updateEnemies() {
    let touchedWall = false;
    let allDead = true;

    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        allDead = false;

        if (enemyStepDown) {
            enemy.y += enemyHeight;
        } else {
            enemy.x += enemyDirection * enemyMoveSpeed;
            
            if (enemy.x <= 0 || enemy.x + enemyWidth >= canvas.width) {
                touchedWall = true;
            }
        }
    });

    if (allDead) {
        enemyMoveSpeed += 0.5;
        initEnemies();
        return;
    }

    if (touchedWall && !enemyStepDown) {
        enemyDirection *= -1;
        enemyStepDown = true;
    } else {
        enemyStepDown = false;
    }
}

function checkCollisions() {
    // Player bullets hitting enemies
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach(enemy => {
            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemy.alive = false;
                player.bullets.splice(bulletIndex, 1);
                score += 10;
                scoreElement.textContent = score;
            }
        });
    });

    // Enemies reaching bottom
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemy.height >= player.y) {
            gameOver();
        }
    });
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

function drawBullets() {
    player.bullets.forEach(bullet => bullet.draw());
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
}

function resetGame() {
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    player.x = canvas.width / 2;
    player.bullets = [];
    enemies.length = 0;
    initEnemies();
    requestAnimationFrame(update);
}

// Main game loop
function update(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();

    drawPlayer();
    drawEnemies();
    drawBullets();

    gameLoop = requestAnimationFrame(update);
}

// Start game
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') {
        resetGame();
    }
});

initEnemies();
resetGame();
