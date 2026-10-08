const player = document.getElementById('player');
const tagger = document.getElementById('tagger');

document.addEventListener('keydown', (event) => {
    const step = 10; // Movement step
    switch (event.key) {
        case 'ArrowUp':
            player.style.top = `${player.offsetTop - step}px`;
            break;
        case 'ArrowDown':
            player.style.top = `${player.offsetTop + step}px`;
            break;
        case 'ArrowLeft':
            player.style.left = `${player.offsetLeft - step}px`;
            break;
        case 'ArrowRight':
            player.style.left = `${player.offsetLeft + step}px`;
            break;
    }
});

// Simple collision detection
setInterval(() => {
    if (isColliding(player, tagger)) {
        alert('You are tagged!');
    }
}, 100);

function isColliding(rect1, rect2) {
    const r1 = rect1.getBoundingClientRect();
    const r2 = rect2.getBoundingClientRect();
    return !(r1.right < r2.left || 
             r1.left > r2.right || 
             r1.bottom < r2.top || 
             r1.top > r2.bottom);
}
