function updateActiveMenu() {
  const activeClass = 'active';
  const hash = window.location.hash.toLowerCase();
  const hashValue = hash.startsWith("#") ? hash.substring(1) : hash;
  updateActiveDesktopMenu(hash, hashValue, activeClass);
  updateActiveMobileMenu(hash, hashValue, activeClass);
}

function updateActiveDesktopMenu(hash, hashValue, activeClass) {
  console.info(`Update active desktop menu: ${hashValue}`);
  const wipsMenu = document.getElementById('wips');
  const projectsMenu = document.getElementById('projects');
  const wipsHashes = new Set([
    "octopus-lady",
    "wolf",
    "biography"
  ]);
  const projectsHashes = new Set([
    "city-rain",
    "volcano",
    "classroom"
  ]);

  wipsMenu.classList.remove(activeClass);
  projectsMenu.classList.remove(activeClass);


  if (wipsHashes.has(hashValue)) {
    wipsMenu.classList.add(activeClass);
  } else if (projectsHashes.has(hashValue)) {
    projectsMenu.classList.add(activeClass);
  }
}

function updateActiveMobileMenu(hash, hashValue, activeClass) {
  console.info(`Update active mobile menu: ${hashValue}`);
  const homeMobileMenu = document.getElementsByClassName('mobile-menu btn-home')[0];
  const wipsMobileMenu = document.getElementsByClassName('mobile-menu btn-wips')[0];
  const projectsMobileMenu = document.getElementsByClassName('mobile-menu btn-projects')[0];
  const homeHashes = new Set([
    "home"
  ]);
  const wipsHashes = new Set([
    "wips",
    "octopus-lady",
    "wolf",
    "biography"
  ]);
  const projectsHashes = new Set([
    "projects",
    "city-rain",
    "volcano",
    "classroom"
  ]);

  homeMobileMenu.classList.remove(activeClass);
  wipsMobileMenu.classList.remove(activeClass);
  projectsMobileMenu.classList.remove(activeClass);

  if (homeHashes.has(hashValue)) {
    homeMobileMenu.classList.add(activeClass);
  } else if (wipsHashes.has(hashValue)) {
    wipsMobileMenu.classList.add(activeClass);
  } else if (projectsHashes.has(hashValue)) {
    projectsMobileMenu.classList.add(activeClass);
  }
}

// Run once when the page loads
updateActiveMenu();

// Run every time your code (or user) changes the hash
window.addEventListener('hashchange', updateActiveMenu);
