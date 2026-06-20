class Carousel3dController {
  constructor(element, options = {}) {
    this.element = element;
    this.quantity = document.querySelectorAll('.slider > *').length;
    this.options = {
      sensitivity: 5,
      friction: 10,
      baseRotateX: -16,
      perspective: 1000,
      velocityThreshold: 0.1,
      snapStep: 360 / this.quantity,
      autoRotateSpeed: 4,
      autoRotateIdleDelay: 7000,
      ...options
    };
    
    this.state = {
      isDragging: false,
      hasDragged: false,
      startX: 0,
      startY: 0,
      currentRotateX: 0,
      currentRotateY: 0,
      velocityX: 0,
      velocityY: 0
    };

    this.decelerationFrameId = null;
    this.autoRotateFrameId = null;
    this.autoRotateLastTimestamp = null;
    this.lastManualInteraction = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.home = document.querySelector('page.home');
    this.leftArrow = this.home?.querySelector('.carousel-3d-arrow.left-arrow');
    this.rightArrow = this.home?.querySelector('.carousel-3d-arrow.right-arrow');
    this.projectSlots = this.buildProjectSlots();
    
    this.init();
  }
  
  init() {
    this.setCssQuantityProperty();
    this.addEventListeners();
    this.addArrowListeners();
    this.updateArrowLabels();
    this.updateTransform();
    this.startAutoRotateLoop();
  }

  buildProjectSlots() {
    return Array.from(this.element.querySelectorAll('.item'))
      .map((element) => [...element.classList].find((cls) => cls.startsWith('btn-'))?.slice(4))
      .filter(Boolean);
  }

  setCssQuantityProperty() {
    // these properties are used in the CSS for the 3D carousel
    document.querySelector('.slider').style.setProperty('--quantity', this.quantity);
    Array.from(document.querySelectorAll('.slider > *')).forEach((element, index) => {
      element.style.setProperty('--position', index + 1);
    });
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

    // Adjust transform height on load and resize
    // Not sure what I was trying to achieve with this, but is
    // messes with the carousel top position and hides part of the carousel
    //
    // window.addEventListener('load', this.adjustTransformHeight.bind(this));
    // window.addEventListener('resize', this.adjustTransformHeight.bind(this));
  }

  addArrowListeners() {
    this.leftArrow?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigateProject(-1);
    });
    this.rightArrow?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigateProject(1);
    });
  }

  getProjectTitle(pageClass) {
    const title = document.querySelector(`page.${pageClass} production > h3`);
    return title?.textContent.trim() ?? pageClass;
  }

  updateArrowLabels() {
    const currentProject = this.getFrontProject();
    if (!currentProject || !window.appController) return;

    const prevProject = window.appController.getAdjacentProject(currentProject, -1);
    const nextProject = window.appController.getAdjacentProject(currentProject, 1);

    if (this.leftArrow && prevProject) {
      this.leftArrow.setAttribute('aria-label', `Previous project: ${this.getProjectTitle(prevProject)}`);
    }

    if (this.rightArrow && nextProject) {
      this.rightArrow.setAttribute('aria-label', `Next project: ${this.getProjectTitle(nextProject)}`);
    }
  }

  getFrontProject() {
    const slotCount = this.projectSlots.length;
    if (slotCount === 0) return null;

    const slotIndex = ((Math.round(this.state.currentRotateY / this.options.snapStep) % slotCount) + slotCount) % slotCount;
    return this.projectSlots[slotIndex];
  }

  navigateProject(step) {
    if (!window.appController || this.projectSlots.length < 2) {
      this.rotateByStep(step);
      return;
    }

    this.syncCurrentRotationFromVisual();
    const currentProject = this.getFrontProject();
    const targetProject = window.appController.getAdjacentProject(currentProject, step);
    if (!targetProject) return;

    this.rotateToProject(targetProject, step);
    this.updateArrowLabels();
  }

  rotateToProject(pageClass, step) {
    const slotIndex = this.projectSlots.indexOf(pageClass);
    if (slotIndex === -1) {
      this.rotateByStep(step);
      return;
    }

    this.syncCurrentRotationFromVisual();

    const { snapStep } = this.options;
    const currentY = this.state.currentRotateY;
    const targetBase = slotIndex * snapStep;
    let targetRotateY = targetBase;

    if (step > 0) {
      while (targetRotateY <= currentY + 0.5) targetRotateY += 360;
    } else {
      while (targetRotateY >= currentY - 0.5) targetRotateY -= 360;
    }

    this.animateToRotateY(targetRotateY);
  }

  animateToRotateY(targetRotateY) {
    this.cancelDeceleration();
    this.state.isDragging = false;
    this.markManualInteraction();

    const { perspective, baseRotateX } = this.options;
    this.state.currentRotateY = targetRotateY;
    this.element.style.transition = 'transform 0.4s cubic-bezier(.25,.8,.25,1)';
    this.element.style.transform =
      `perspective(${perspective}px) rotateX(${baseRotateX}deg) rotateY(${targetRotateY}deg)`;
  }

  isHomeVisible() {
    return this.home?.classList.contains('active') ?? false;
  }

  isTransitioning() {
    return Boolean(this.element.style.transition);
  }

  canAutoRotate() {
    if (this.prefersReducedMotion) return false;
    if (!this.isHomeVisible()) return false;
    if (this.state.isDragging) return false;
    if (this.decelerationFrameId !== null) return false;
    if (this.isTransitioning()) return false;
    if (this.lastManualInteraction === null) return true;
    return Date.now() - this.lastManualInteraction >= this.options.autoRotateIdleDelay;
  }

  markManualInteraction() {
    this.lastManualInteraction = Date.now();
    this.autoRotateLastTimestamp = null;
  }

  resetAutoRotateIdle() {
    this.lastManualInteraction = null;
    this.autoRotateLastTimestamp = null;
  }

  startAutoRotateLoop() {
    if (this.autoRotateFrameId !== null) return;
    const tick = (timestamp) => {
      this.tickAutoRotate(timestamp);
      this.autoRotateFrameId = requestAnimationFrame(tick);
    };
    this.autoRotateFrameId = requestAnimationFrame(tick);
  }

  stopAutoRotateLoop() {
    if (this.autoRotateFrameId !== null) {
      cancelAnimationFrame(this.autoRotateFrameId);
      this.autoRotateFrameId = null;
    }
    this.autoRotateLastTimestamp = null;
  }

  tickAutoRotate(timestamp) {
    if (!this.canAutoRotate()) {
      this.autoRotateLastTimestamp = null;
      return;
    }

    if (this.autoRotateLastTimestamp === null) {
      this.autoRotateLastTimestamp = timestamp;
      return;
    }

    const deltaMs = timestamp - this.autoRotateLastTimestamp;
    this.autoRotateLastTimestamp = timestamp;
    const deltaDeg = (deltaMs / 1000) * this.options.autoRotateSpeed;

    this.state.currentRotateY += deltaDeg;
    this.element.style.transition = '';
    this.updateTransform();
  }

  cancelDeceleration() {
    if (this.decelerationFrameId !== null) {
      cancelAnimationFrame(this.decelerationFrameId);
      this.decelerationFrameId = null;
    }
    this.state.velocityX = 0;
    this.state.velocityY = 0;
  }

  isOnSnapAngle(angle) {
    const snapped = this.snapToNearest(angle);
    return Math.abs(angle - snapped) < 0.5;
  }

  getStepTargetRotateY(currentY, step) {
    const { snapStep } = this.options;
    const nearestIndex = Math.round(currentY / snapStep);
    const onSnap = this.isOnSnapAngle(currentY);

    if (step > 0) {
      return onSnap
        ? (nearestIndex + 1) * snapStep
        : Math.ceil(currentY / snapStep) * snapStep;
    }

    return onSnap
      ? (nearestIndex - 1) * snapStep
      : Math.floor(currentY / snapStep) * snapStep;
  }

  rotateByStep(step) {
    this.syncCurrentRotationFromVisual();
    const currentY = this.state.currentRotateY;
    const targetRotateY = this.getStepTargetRotateY(currentY, step);
    this.animateToRotateY(targetRotateY);
  }

  syncCurrentRotationFromVisual() {
    this.element.getAnimations().forEach((animation) => animation.cancel());
    this.element.style.transition = '';

    const visualRotateY = this.getRotationYFromElement();
    if (visualRotateY !== null) {
      this.state.currentRotateY = visualRotateY;
    }
  }

  getRotationYFromElement() {
    const transform = window.getComputedStyle(this.element).transform;
    if (!transform || transform === 'none') {
      return this.state.currentRotateY;
    }

    const values = transform
      .match(/matrix3d?\(([^)]+)\)/)?.[1]
      .split(',')
      .map((value) => Number.parseFloat(value.trim()));

    if (!values?.length) {
      return this.state.currentRotateY;
    }

    if (values.length === 16) {
      const rotateY = Math.atan2(values[2], values[10]) * (180 / Math.PI);
      const rotateX = Math.asin(-values[6]) * (180 / Math.PI);
      const baseRotateX = this.options.baseRotateX;

      if (Math.abs(rotateX - baseRotateX) < 2) {
        return rotateY;
      }
    }

    return this.state.currentRotateY;
  }
  
  getEventCoords(e) {
    return e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY };
  }
  
  handleStart(e) {
    this.cancelDeceleration();
    this.element.style.transition = '';
    this.state.isDragging = true;
    this.state.hasDragged = false;
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

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.state.hasDragged = true;
    }
    
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
    if (this.state.hasDragged) {
      this.markManualInteraction();
      this.startDeceleration();
    }
    this.state.hasDragged = false;
  }

  handleTransitionEnd() {
    this.element.style.transition = '';
    this.updateArrowLabels();
  }

  // adjustTransformHeight() {
  //   const rect = this.element.children[0].getBoundingClientRect();
  //   console.log('rect: %o', rect);
  //   this.element.parentElement.style.height = `${rect.height}px`;
  // }
  
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
      `perspective(${perspective}px) rotateX(${baseRotateX}deg) rotateY(${currentRotateY}deg)`; // translateZ(-${perspective}px)
  }
  
  startDeceleration() {
    this.cancelDeceleration();

    const animate = () => {
      const { perspective, baseRotateX } = this.options;

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
        this.decelerationFrameId = requestAnimationFrame(animate);
      } else {
        this.decelerationFrameId = null;
        const snappedRotateY = this.snapToNearest(this.state.currentRotateY);
        this.state.currentRotateY = snappedRotateY;
        this.element.style.transition = 'transform 0.4s cubic-bezier(.25,.8,.25,1)';
        this.element.style.transform = 
          `perspective(${perspective}px) rotateX(${baseRotateX}deg) rotateY(${snappedRotateY}deg)`;
      }
    };
    
    this.decelerationFrameId = requestAnimationFrame(animate);
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
    this.cancelDeceleration();
    this.stopAutoRotateLoop();
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
const sliderElement = document.querySelector('.slider');
const carousel3dController = new Carousel3dController(sliderElement, {
  sensitivity: 0.5,
  friction: 0.95,
  baseRotateX: -16
});

window.carousel3dController = carousel3dController;