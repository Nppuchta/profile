class MenuController {
  constructor(menuLiElements, options = {}) {
    this.menuLiElements = Array.from(menuLiElements);
    this.options = {
      ...options
    };
    
    this.state = {
    };
    
    this.init();
  }
  
  init() {
    console.log('init menu controller');
    this.addEventListeners();
  }

  addEventListeners() {
    this.mobileNav = document.querySelector('.menu-mobile');
    if (!this.mobileNav) throw 'Mobile selector not found!';
    this.openBtn = document.querySelector('.btn-mobile-menu-open');
    this.closeBtn = document.querySelector('.btn-mobile-menu-close');
    
    this.openBtn.addEventListener('click', this.openMobileMenu.bind(this));
    this.closeBtn.addEventListener('click', this.closeMobileMenu.bind(this));
    this.mobileNav.addEventListener('wheel', this.preventPropagation.bind(this));
    this.menuLiElements.forEach(li => {
      li.addEventListener('click', this.closeMobileMenu.bind(this))
    });
    document.addEventListener('click', this.closeOnClickOutside.bind(this));
    window.addEventListener('orientationchange', this.closeMobileMenu.bind(this));
  }

  closeOnClickOutside(e) {
    if (this.mobileNav.classList.contains('open') && 
        !this.mobileNav.contains(e.target) && 
        !this.openBtn.contains(e.target)) {
      this.mobileNav.classList.remove('open');
    }
  }

  closeMobileMenu() {
    this.mobileNav.classList.remove('open');
  }

  openMobileMenu() {
    this.mobileNav.classList.add('open');
  }

  preventPropagation(e) {
    e.stopPropagation(); /* Prevent event from bubbling to body */
  }

  destroy() {
    this.openBtn.removeEventListener('click', this.openMobileMenu);
    this.closeBtn.removeEventListener('click', this.closeMobileMenu);
    this.menuLiElements.forEach(li => li.removeEventListener('click', this.closeMobileMenu));
    this.scrollElement.removeEventListener('scroll', this.deleteMe);
    document.removeEventListener('click', this.closeOnClickOutside);
    window.removeEventListener('orientationchange', this.closeMobileMenu);
  }
}

console.log('load menu controller');
const menuLiElements = [...document.querySelectorAll('.menu-desktop li.page-nav'),
  ...document.querySelectorAll('.menu-mobile li.page-nav')];
const menuController = new MenuController(menuLiElements, {});
