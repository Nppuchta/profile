class AppController {
  constructor(pages, options = {}) {
    // dom elements
    this.pages = Array.from(pages);
    this.mobileNav = document.querySelector('.menu-mobile');
    this.openBtn = document.querySelector('.btn-mobile-menu-open');
    this.closeBtn = document.querySelector('.btn-mobile-menu-close');

    this.options = {
      /* see script tag in index.html */
      loadingTimeout: 4000,
      ...options
    };
    
    this.state = {
      pageClassSet: new Set()
    };
    
    this.init();
    console.group('App controller runtime');
  }
  
  init() {
    console.group('App controller initialization');
    this.buildProjectNavigation();
    this.addEventListeners();
    this.addMobileMenuListeners();
    this.addExternalLinkListeners();
    console.groupEnd();
  }

  extractProjectOrderFromIndex(indexPageClass) {
    const indexPage = document.querySelector(`page.${indexPageClass}`);
    if (!indexPage) return [];

    return Array.from(indexPage.querySelectorAll('.illustration-float'))
      .map((element) => [...element.classList].find((cls) => cls.startsWith('btn-')))
      .filter(Boolean)
      .map((cls) => cls.slice(4))
      .filter((pageClass) => document.querySelector(`page.${pageClass}`));
  }

  getProjectTitle(pageClass) {
    const title = document.querySelector(`page.${pageClass} production > h3`);
    return title?.textContent.trim() ?? pageClass;
  }

  createProjectNavLink(pageClass, direction) {
    const link = document.createElement('button');
    link.type = 'button';
    link.className = `btn-${pageClass} project-nav-link project-nav-${direction}`;
    link.textContent = direction === 'prev'
      ? `❮ ${this.getProjectTitle(pageClass)}`
      : `${this.getProjectTitle(pageClass)} ❯`;
    return link;
  }

  buildProjectNavigation() {
    const indexPages = ['wips', 'projects'];
    const projectOrder = indexPages
      .flatMap((indexPageClass) => this.extractProjectOrderFromIndex(indexPageClass))
      .filter((pageClass, index, list) => list.indexOf(pageClass) === index);

    projectOrder.forEach((pageClass, index) => {
      const production = document.querySelector(`page.${pageClass} production`);
      if (!production || production.querySelector('.project-nav')) return;

      const nav = document.createElement('nav');
      nav.className = 'project-nav';
      nav.setAttribute('aria-label', 'Project navigation');

      const count = projectOrder.length;
      if (count < 2) return;

      const prevPageClass = projectOrder[(index - 1 + count) % count];
      const nextPageClass = projectOrder[(index + 1) % count];

      nav.appendChild(this.createProjectNavLink(prevPageClass, 'prev'));
      nav.appendChild(this.createProjectNavLink(nextPageClass, 'next'));
      production.insertBefore(nav, production.firstChild);
    });
  }

  addEventListeners() {
    this.pages.forEach(page => {
      const pageClass = this.extractAndValidatePageClass(page);
      const btnList = Array.from(document.querySelectorAll(`.btn-${pageClass}`));
      btnList.forEach(btn => {
        this.addEventListener(btn, pageClass);
        btn.style.cursor = 'pointer';
      });
    });
    if (!this.state.pageClassSet.has(this.options.defaultPage)) {
      throw `Application is missing default page with class "${this.options.defaultPage}"`;
    }
  }

  addMobileMenuListeners() {
    console.log(`Add mobile specific event listeners`);
    this.openBtn.addEventListener('click', this.openMobileMenu.bind(this));
    this.closeBtn.addEventListener('click', this.closeMobileMenu.bind(this));
    this.mobileNav.addEventListener('wheel', this.preventPropagation.bind(this));
    document.addEventListener('click', this.closeOnClickOutside.bind(this));
    window.addEventListener('orientationchange', this.closeMobileMenu.bind(this));
    window.addEventListener('load', this.switchToUrlHashPage.bind(this));
    window.addEventListener('scroll', this.scrollAppBackground.bind(this));
    window.addEventListener('popstate', this.switchToUrlHashPage.bind(this));
  }

  addExternalLinkListeners() {
    document.querySelectorAll('.btn-external').forEach(btn => {
      btn.addEventListener('click', this.openExtrnalLink.bind(this))
    });
  }

  openExtrnalLink(e) {
    const btn = e.target;
    const externalId = e.target.closest('.btn-external').dataset.externalId;
    console.log(`Open external link "${externalId}"`);
    if (this.options.externalLinks.hasOwnProperty(externalId) == false) {
      throw `No external link with id "${externalId}" registered in app-controller.js configuration option "externalLinks"`;
    }
    const externalData = this.options.externalLinks[externalId];
    window.open(externalData.url, externalData.newTab ? '_blank' : '');
  }

  switchToUrlHashPage() {
    let pageClass = window.location.hash.toLowerCase().slice(1);
    pageClass = this.state.pageClassSet.has(pageClass) ? pageClass : this.options.defaultPage;
    this.switchToPage(pageClass);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollAppBackground() {
    const container = document.querySelector('.main-container');
    const scrollPosition = window.scrollY;
    // Adjust background-position-y: slower movement (e.g., 0.2x scroll speed)
    // The psudo element has access to the parents style attributes
    // and uses background-position-y: var(--bg-position-y, 0);
    container.style.setProperty('--bg-position-y', `${scrollPosition * 0.2}px`);
  }

  extractAndValidatePageClass(page) {
    console.log(`Extract and validate page: `, page);
    if (page.classList.length != 1) throw 'Every page tag must have a single class name!';
    const pageClass = page.className;
    if (pageClass.startsWith('btn-')) throw 'A page tag class name must not start with "btn-"!';
    if (this.state.pageClassSet.has(pageClass)) throw `Page class name ${pageClass} has already been used: ` + this.state.pageClassSet;
    this.state.pageClassSet.add(pageClass);
    return pageClass;
  }

  addEventListener(btn, pageClass) {
    console.log(`Add app event listeners for page ${pageClass}`);
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      this.switchToPage(pageClass);
      if (target.classList.contains('mobile-menu')) {
        this.closeMobileMenu();
      }
      if (target.classList.contains('project-nav-link')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  switchToPage(pageClass) {
    console.log(`Switch to page ${pageClass}`);
    this.pages.forEach((p) => p.classList.remove('active'));
    const page = document.querySelector(`page.${pageClass}`);
    page.classList.add('active');
    if ('redirectTimeout' in page.dataset && 'redirectPage' in page.dataset) {
      console.debug(`Page ${pageClass} has redirect timeout: ${page.dataset.redirectTimeout} and redirect page: ${page.dataset.redirectPage}`);
      setTimeout(() => {
        console.debug(`Switch to default page after loading`);
        this.switchToPage(page.dataset.redirectPage);
      }, page.dataset.redirectTimeout);
    }
    this.updateUrlHash(pageClass);

    if (pageClass === 'home') {
      window.carousel3dController?.resetAutoRotateIdle();
    }
  }

  updateUrlHash(pageClass) {
    window.location.hash = pageClass;
    console.log(`Update url hash to ${pageClass}: `, window.location.href);
  }

  closeOnClickOutside(e) {
    if (this.mobileNav.classList.contains('open') && 
        !this.mobileNav.contains(e.target) && 
        !this.openBtn.contains(e.target)) {
      this.closeMobileMenu();
    }
  }

  closeMobileMenu() {
    console.debug(`Close mobile menu`);
    this.mobileNav.classList.remove('open');
  }

  openMobileMenu() {
    console.debug(`Open mobile menu`);
    this.mobileNav.classList.add('open');
  }

  preventPropagation(e) {
    console.trace(`Stop even propagation`);
    e.stopPropagation();
  }
}

const pages = document.querySelectorAll('page');
const appController = new AppController(pages, {...options});
