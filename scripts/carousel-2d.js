const carousel2d = document.querySelector('.carousel-2d-container');
const images = document.querySelectorAll('.carousel-2d-image');
const leftArrow = document.querySelector('.left-arrow');
const rightArrow = document.querySelector('.right-arrow');
let currentIndex = 0;
let startX = 0;
let isDragging = false;

function updateCarousel() {
  carousel2d.style.transform = `translateX(-${currentIndex * 100}%)`;
}

function moveToIndex(index) {
  const count = images.length;
  currentIndex = (index + count) % count;
  updateCarousel();
}

leftArrow.addEventListener('click', () => moveToIndex(currentIndex - 1));
rightArrow.addEventListener('click', () => moveToIndex(currentIndex + 1));

carousel2d.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  isDragging = true;
});

carousel2d.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const currentX = e.touches[0].clientX;
  const diff = startX - currentX;
  if (Math.abs(diff) > 50) {
    moveToIndex(currentIndex + (diff > 0 ? 1 : -1));
    isDragging = false;
  }
});

carousel2d.addEventListener('touchend', () => {
  isDragging = false;
});

updateCarousel();
