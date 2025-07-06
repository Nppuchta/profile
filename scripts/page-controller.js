class PageController {
  constructor(pages, options = {}) {
    this.pages = Array.from(pages);
    this.options = {
      urlHashToSelectorMap: {},
      ...options
    };
    
    this.state = {
    };
    
    this.init();
  }
  
  init() {
    console.log('init page controller');
    this.addEventListeners();
    this.setupUrlHashToPageMap();
  }

  addEventListeners() {
    this.pages.forEach((page) => {
      let pageName = [...page.classList].find((value) => /page-\d/g.test(value));
      if (!pageName) {
        throw `Page element with class name not found: ${pageName}`;
      }
      let pageHash = [...page.classList].find((value) => !/page-\d/g.test(value));
      let pageSelector = `.${pageName}`;
      if (!(pageSelector in this.options.nameToPageMap)) {
        throw `No page selector to button mapping found: ${pageSelector}`;
      }
      let btnSelector = `.${this.options.nameToPageMap[pageSelector]}`;
      document.querySelectorAll(btnSelector).forEach(btn => {
        // btn.style.cursor = 'pointer';
        btn.addEventListener('click', (e) => {
          this.switchToPage(e, pageSelector, pageHash);
        });
      });
    });

    window.addEventListener('load', () => {
      const pageHash = window.location.hash.toLowerCase().slice(1);
      const pageInfo = this.options.urlHashToSelectorMap[pageHash]
       || this.options.urlHashToSelectorMap['home'];
      const pageClassName = pageInfo['pageKey'];
      this.switchToPage(null, pageClassName, pageHash);
    });
    window.addEventListener('scroll', () => {
      const container = document.querySelector('.main-container');
      const scrollPosition = window.scrollY;
      // Adjust background-position-y: slower movement (e.g., 0.2x scroll speed)
      // The psudo element has access to the parents style attributes
      // and uses background-position-y: var(--bg-position-y, 0);
      container.style.setProperty('--bg-position-y', `${scrollPosition * 0.2}px`);
    });
  }

  setupUrlHashToPageMap() {
    document.querySelectorAll('page').forEach((page) => {
      // let pageClass = [...page.classList].find((value) => !/page-\d/g.test(value));
      let pageInfo = Object.fromEntries(
        [...page.classList].map(cls => 
          cls.startsWith('page-') ? ['pageKey', cls] : ['pageHash', cls]
        )
      )
      console.log('Adding to url hash reverse lookup ', pageInfo['pageHash'], ' = ', pageInfo);
      this.options.urlHashToSelectorMap[pageInfo['pageHash']] = pageInfo;
    });
    if ('home' in this.options.urlHashToSelectorMap) {
      this.options.urlHashToSelectorMap[''] = this.options.urlHashToSelectorMap['home'];
    }
  }
  
  switchToPage(e, pageSelector, pageHash) {
    const selectorToUse = this.normalizePageSelector(pageSelector);
    console.log('Switch to page hash ', pageHash);
    document.querySelectorAll('page').forEach((p) => p.classList.remove('active'));
    document.querySelector(selectorToUse).classList.add('active');
    this.updateUrlHash(pageHash);
  }

  normalizePageSelector(selector) {
    let fragments = selector.split('.');
    if (fragments.indexOf('page') == 1) {
      return selector; // 'page.foo'
    }
    fragments = fragments[0] == ''
      ? fragments = ['page', ...fragments.slice(1)] // '.foo'
      : fragments = ['page', ...fragments]; // 'foo'

    return fragments.join('.');
  }

  updateUrlHash(hashToUse) {
    window.location.hash = hashToUse;
    console.log('New url is ', window.location.href);
  }
}


console.log('load page controller');
const pageElements = document.querySelectorAll('page');
const pageController = new PageController(pageElements, {
  menuController, menuController,
  nameToPageMap: {
    '.page-1': 'btn-home',
    '.page-2': 'btn-city-rain',
    '.page-3': 'btn-volcano',
    '.page-4': 'btn-classroom',
    '.page-5': 'btn-bio',
    '.page-6': 'btn-octopus-lady',
  }
});
