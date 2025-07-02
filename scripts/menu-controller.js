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
    const openBtn = document.querySelector('.btn-mobile-menu-open');
    const closeBtn = document.querySelector('.btn-mobile-menu-close');
    
    openBtn.addEventListener('click', () => this.mobileNav.classList.add('open'));
    closeBtn.addEventListener('click', () => this.mobileNav.classList.remove('open'));
    
    document.addEventListener('click', (e) => {
      if (this.mobileNav.classList.contains('open') && 
          !this.mobileNav.contains(e.target) && 
          !openBtn.contains(e.target)) {
        this.mobileNav.classList.remove('open');
      }
    });

    this.menuLiElements.forEach(li => {
      li.addEventListener('click', (e) => this.closeMobileMenu(e))
    });
  }

  closeMobileMenu(e) {
    this.mobileNav.classList.remove('open');
  }

  openMobileMenu() {
    this.mobileNav.classList.add('open');
  }
}

console.log('load menu controller');
const menuLiElements = [...document.querySelectorAll('.menu-desktop li.page-nav'),
  ...document.querySelectorAll('.menu-mobile li.page-nav')];
const menuController = new MenuController(menuLiElements, {});
