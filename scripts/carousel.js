class DragController {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      sensitivity: 0.5,
      friction: 0.95,
      baseRotateX: -16,
      perspective: 1000,
      velocityThreshold: 0.1,
      snapStep: 72,
      ...options
    };
    
    this.state = {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentRotateX: 0,
      currentRotateY: 0,
      velocityX: 0,
      velocityY: 0
    };
    
    this.init();
  }
  
  init() {
    this.addEventListeners();
    this.updateTransform();
  }
  
  addEventListeners() {
    // Mouse events
    this.element.addEventListener('mousedown', this.handleStart.bind(this));
    document.addEventListener('mousemove', this.handleMove.bind(this));
    document.addEventListener('mouseup', this.handleEnd.bind(this));
    
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleEnd.bind(this));

    // Remove the transition after snapping to allow free rotation again
    this.element.addEventListener('transitionend', this.handleTransitionEnd.bind(this));
  }
  
  getEventCoords(e) {
    return e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY };
  }
  
  handleStart(e) {
    this.state.isDragging = true;
    const coords = this.getEventCoords(e);
    this.state.startX = coords.x;
    this.state.startY = coords.y;
  }
  
  handleTouchStart(e) {
    this.handleStart(e);
  }
  
  handleMove(e) {
    if (!this.state.isDragging) return;
    
    const coords = this.getEventCoords(e);
    const deltaX = coords.x - this.state.startX;
    const deltaY = coords.y - this.state.startY;
    
    this.updateRotation(deltaX, deltaY);
    this.updateVelocity(deltaX, deltaY);
    this.updateTransform();
    
    this.state.startX = coords.x;
    this.state.startY = coords.y;
  }
  
  handleTouchMove(e) {
    this.handleMove(e);
  }
  
  handleEnd() {
    this.state.isDragging = false;
    this.startDeceleration();
  }

  handleTransitionEnd() {
    this.element.style.transition = '';
  }
  
  updateRotation(deltaX, deltaY) {
    this.state.currentRotateY += deltaX * this.options.sensitivity;
    this.state.currentRotateX += deltaY * this.options.sensitivity;
  }
  
  updateVelocity(deltaX, deltaY) {
    this.state.velocityX = deltaX;
    this.state.velocityY = deltaY;
  }
  
  updateTransform() {
    const { perspective, baseRotateX } = this.options;
    const { currentRotateX, currentRotateY } = this.state;
    
    this.element.style.transform = 
      `perspective(${perspective}px) rotateX(${baseRotateX}deg) rotateY(${currentRotateY}deg)`;
  }
  
  startDeceleration() {
    const animate = () => {
      // Apply friction
      this.state.velocityX *= this.options.friction;
      this.state.velocityY *= this.options.friction;
      
      // Update rotation based on velocity
      this.state.currentRotateY += this.state.velocityX;
      this.state.currentRotateX += this.state.velocityY;
      this.updateTransform();
      
      // Continue animation if velocity is above threshold
      const hasVelocity = Math.abs(this.state.velocityX) > this.options.velocityThreshold || 
                         Math.abs(this.state.velocityY) > this.options.velocityThreshold;
      
      if (hasVelocity) {
        requestAnimationFrame(animate);
      } else {
        let snappedRotateY = this.snapToNearest(this.state.currentRotateY);
        this.element.style.transition = 'transform 0.4s cubic-bezier(.25,.8,.25,1)';
        this.element.style.transform = `perspective(1000px) rotateX(-16deg) rotateY(${snappedRotateY}deg)`;
      }
    };
    
    animate();
  }
  
  // Public methods for external control
  setRotation(x, y) {
    this.state.currentRotateX = x;
    this.state.currentRotateY = y;
    this.updateTransform();
  }

  snapToNearest(angle) {
    return Math.round(angle / this.options.snapStep) * this.options.snapStep;
  }
  
  reset() {
    this.setRotation(0, 0);
    this.state.velocityX = 0;
    this.state.velocityY = 0;
  }
  
  destroy() {
    this.element.removeEventListener('mousedown', this.handleStart);
    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('mouseup', this.handleEnd);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleEnd);
    this.element.removeEventListener('transitionend', this.handleTransitionEnd);
  }
}

// Usage
const sliderElement = document.getElementsByClassName('slider')[0];
const dragController = new DragController(sliderElement, {
  sensitivity: 0.5,
  friction: 0.95,
  baseRotateX: -16
});

// Optional: expose controller for external access
// dragController.reset();
// dragController.setRotation(45, 90);
