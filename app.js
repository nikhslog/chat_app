const items = document.querySelectorAll('.slider .item');
const next = document.getElementById('next');
const prev = document.getElementById('prev');
let active = 0;

function updateSlider() {
    items.forEach((item, index) => {
        const offset = index - active;
        item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        item.style.zIndex = -Math.abs(offset);

        if (offset === 0) {
            item.style.transform = 'translateX(0) scale(1) rotateY(0)';
            item.style.zIndex = 1;
            item.style.filter = 'none';
            item.style.opacity = 1;
            item.classList.add('active');
        } else {
            const blur = offset > 2 || offset < -2 ? 0 : 3;
            const scale = 1 - Math.abs(offset) * 0.15;
            const translateX = 150 * offset;
            const rotateY = offset > 0 ? -15 : 15;
            
            item.style.transform = `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`;
            item.style.filter = `blur(${blur}px)`;
            item.style.opacity = blur === 0 ? 0 : 0.7;
            item.classList.remove('active');
        }
    });
}

function goToNext() {
    if (active < items.length - 1) {
        active++;
        updateSlider();
    } else {
        // Add smooth transition to first slide
        active = 0;
        updateSlider();
    }
}

function goToPrev() {
    if (active > 0) {
        active--;
        updateSlider();
    } else {
        // Add smooth transition to last slide
        active = items.length - 1;
        updateSlider();
    }
}

// Initialize slider
updateSlider();

// Event listeners
next.addEventListener('click', goToNext);
prev.addEventListener('click', goToPrev);

// Keyboard navigation
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') goToNext();
    if (event.key === 'ArrowLeft') goToPrev();
});

// Add touch support
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const difference = touchStartX - touchEndX;
    
    if (Math.abs(difference) > swipeThreshold) {
        if (difference > 0) {
            goToNext();
        } else {
            goToPrev();
        }
    }
}