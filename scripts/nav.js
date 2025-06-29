
const navSide = document.querySelector(".nav-side");
const iconOpenMenu = document.querySelector(".nav-top .icon-menu");
const iconCloseMenu = document.querySelector(".nav-side .icon-close");

iconOpenMenu.onclick = () => {
  navSide.style.display = 'flex';
};
iconCloseMenu.onclick = () => {
  navSide.style.display = 'none';
};
