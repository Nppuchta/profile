class Carousel2dController {
  constructor(carousel2d, options = {}) {
    this.carousel2d = carousel2d;
    this.carousel2dContainer = this.carousel2d.querySelector('.carousel-2d-container');
    this.images = this.carousel2d.querySelectorAll('.carousel-2d-image');
    this.leftArrow = this.carousel2d.querySelector('.left-arrow');
    this.rightArrow = this.carousel2d.querySelector('.right-arrow');

    this.options = {
      ...options
    };
    
    this.state = {
      currentIndex: 0,
      startX: 0,
      isDragging: false,
    };
    
    this.init();
  }
  
  init() {
    console.log('init carousel 2D controller');
    this.addEventListeners();
    this.updateCarousel();
  }

  addEventListeners() {
    this.leftArrow.addEventListener('click', () => this.moveToIndex(this.state.currentIndex - 1));
    this.rightArrow.addEventListener('click', () => this.moveToIndex(this.state.currentIndex + 1));

    this.carousel2dContainer.addEventListener('touchstart', (e) => {
      this.state.startX = e.touches[0].clientX;
      this.state.isDragging = true;
    });

    this.carousel2dContainer.addEventListener('touchmove', (e) => {
      if (!this.state.isDragging) return;
      const currentX = e.touches[0].clientX;
      const diff = this.state.startX - currentX;
      if (Math.abs(diff) > 50) {
        this.moveToIndex(this.state.currentIndex + (diff > 0 ? 1 : -1));
        this.state.isDragging = false;
      }
    });

    this.carousel2dContainer.addEventListener('touchend', () => {
      this.state.isDragging = false;
    });
  }

  updateCarousel() {
    this.carousel2dContainer.style.transform = `translateX(-${this.state.currentIndex * 100}%)`;
  }

  moveToIndex(index) {
    const count = this.images.length;
    this.state.currentIndex = (index + count) % count;
    this.updateCarousel();
  }
}

const carousel2d = document.querySelector('.carousel-2d');
const carousel2dController = new Carousel2dController(carousel2d);
