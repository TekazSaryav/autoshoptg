const screens = [...document.querySelectorAll('.screen')];
const navButtons = [...document.querySelectorAll('[data-nav]')];
const outsideTelegram = document.getElementById('outside-telegram');
const app = document.getElementById('app');

function detectTelegramContext() {
  if (window.Telegram?.WebApp?.initData?.length) return true;
  const ua = navigator.userAgent || '';
  return /Telegram/i.test(ua);
}

function mountData() {
  const products = [
    ['CLASSIC', 45, 755], ['STANDARD', 24, 406], ['GOLD', 14, 229], ['WORLD', 4, 64],
    ['BUSINESS', 3, 54], ['PLATINUM', 3, 51], ['INFINITE', 2, 31], ['PERSONAL', 1, 16],
    ['MIXED PRODUCT', 1, 15], ['WORLD ELITE', 1, 15], ['ELECTRON', 1, 10], ['PREFERRED BUSINESS', 1, 9],
    ['CORPORATE', 1, 9], ['UNKNOWN', 0, 8], ['PREPAID', 0, 1]
  ];
  const tags = document.getElementById('products-tags');
  tags.innerHTML = products.map(([name, pct, count]) => `<span>● ${name} ${pct}% (${count})</span>`).join('');

  const starsOffers = [[250, 5], [500, 10], [1000, 20], [2500, 50], [5000, 100], [10000, 200]];
  const stars = document.getElementById('stars-grid');
  stars.innerHTML = starsOffers.map(([s, e]) => `
    <button class="star-option"><strong>${s}★</strong><span>${e} EUR</span></button>
  `).join('');
}

function openScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle('active', screen.dataset.screen === name);
  });
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.nav === name);
  });
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => openScreen(button.dataset.nav));
});

(function init() {
  const inTelegram = detectTelegramContext();
  if (!inTelegram) {
    outsideTelegram.classList.remove('hidden');
    return;
  }

  app.classList.remove('hidden');
  mountData();

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.ready();
  }
})();
