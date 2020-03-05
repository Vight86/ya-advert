const headerTop = document.querySelector('.header__top');
const logo = document.querySelector('.logo');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 0) {
    headerTop.classList.add('header__top_visible');
    logo.classList.add('header__logo_no-text');
  } else {
    headerTop.classList.remove('header__top_visible');
    logo.classList.remove('header__logo_no-text');
  }
});

const nav = document.querySelector('.header__nav');
const navToggle = document.querySelector('.header__toggle');
navToggle.addEventListener('click', () => {
  nav.classList.toggle('header__nav_visible');
});

const slickSlider = document.querySelectorAll('.slick');

slickSlider.forEach((item) => {
  if (document.documentElement.clientWidth >= 769) {
    item.classList.remove('slick');
  } else {
    item.classList.add('slick');
  }
});
