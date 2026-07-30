const initialRestaurants = [
  { name: "정담 김치찌개", category: "한식", active: true },
  { name: "골목 순대국", category: "한식", active: true },
  { name: "마라공방", category: "중식", active: true },
  { name: "소소한 스시", category: "일식", active: true },
  { name: "오후의 파스타", category: "양식", active: true },
  { name: "할머니 떡볶이", category: "분식", active: true },
  { name: "바삭 돈카츠", category: "일식", active: true },
  { name: "연탄 불고기", category: "한식", active: true }
];

const colors = ["#5B3E2E", "#8A6248", "#B88C64", "#6C503D", "#9C795A", "#76634B", "#C29D75", "#4C382D"];
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const restaurantList = document.getElementById("restaurantList");
const categoryFilters = document.getElementById("categoryFilters");
const categoryPrev = document.getElementById("categoryPrev");
const categoryNext = document.getElementById("categoryNext");
const categoryMode = document.getElementById("categoryMode");
const activeCount = document.getElementById("activeCount");
const resultBox = document.getElementById("resultBox");
const resultName = document.getElementById("resultName");
const resultCategory = document.getElementById("resultCategory");
const resultPending = document.getElementById("resultPending");
const roulettePanel = document.querySelector(".roulette-panel");
const moleRain = document.getElementById("moleRain");
const addForm = document.getElementById("addForm");
const newRestaurant = document.getElementById("newRestaurant");
const newCategory = document.getElementById("newCategory");
const toast = document.getElementById("toast");
const soundButton = document.getElementById("soundButton");

let restaurants = loadRestaurants();
let currentFilter = "전체";
let rotation = 0;
let spinning = false;
let soundOn = false;
let toastTimer;
let rainCleanupTimer;

function loadRestaurants() {
  try {
    const saved = JSON.parse(localStorage.getItem("mole-restaurants"));
    return Array.isArray(saved) && saved.length ? saved : initialRestaurants;
  } catch {
    return initialRestaurants;
  }
}

function saveRestaurants() {
  localStorage.setItem("mole-restaurants", JSON.stringify(restaurants));
}

function selectedRestaurants() {
  return restaurants.filter((item) => (
    item.active && (currentFilter === "전체" || item.category === currentFilter)
  ));
}

function renderFilters() {
  const scrollPosition = categoryFilters.scrollLeft;
  const categories = ["전체", ...new Set(restaurants.map((item) => item.category))];
  categoryFilters.innerHTML = categories.map((category) => `
    <button class="filter-chip ${category === currentFilter ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join("");
  categoryMode.textContent = currentFilter;
  requestAnimationFrame(() => {
    categoryFilters.scrollLeft = scrollPosition;
    updateCategoryArrows();
  });
}

function updateCategoryArrows() {
  const maxScroll = categoryFilters.scrollWidth - categoryFilters.clientWidth;
  categoryPrev.disabled = categoryFilters.scrollLeft <= 2;
  categoryNext.disabled = maxScroll <= 2 || categoryFilters.scrollLeft >= maxScroll - 2;
}

function scrollCategories(direction) {
  const distance = Math.max(categoryFilters.clientWidth * .72, 120);
  categoryFilters.scrollBy({ left: distance * direction, behavior: "smooth" });
}

function renderList() {
  const visible = restaurants
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter((item) => currentFilter === "전체" || item.category === currentFilter);

  restaurantList.innerHTML = visible.length ? visible.map((item) => `
    <div class="restaurant-item ${item.active ? "" : "is-off"}">
      <input id="restaurant-${item.originalIndex}" type="checkbox" data-index="${item.originalIndex}" ${item.active ? "checked" : ""}>
      <label class="check-ui" for="restaurant-${item.originalIndex}" aria-label="${escapeHtml(item.name)} 선택">${item.active ? "✓" : ""}</label>
      <label class="restaurant-name" for="restaurant-${item.originalIndex}">${escapeHtml(item.name)}</label>
      <span class="category-tag">${escapeHtml(item.category)}</span>
      <button class="delete-button" type="button" data-delete="${item.originalIndex}" aria-label="${escapeHtml(item.name)} 삭제">×</button>
    </div>
  `).join("") : `<p class="hint">이 카테고리에는 아직 맛집이 없어요.</p>`;

  activeCount.textContent = selectedRestaurants().length;
  drawWheel();
}

function escapeHtml(text) {
  const element = document.createElement("span");
  element.textContent = text;
  return element.innerHTML;
}

function fitWheelText(text, maxLength = 8) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function drawWheel() {
  const items = selectedRestaurants();
  const width = canvas.width;
  const center = width / 2;
  const radius = center - 8;
  ctx.clearRect(0, 0, width, width);

  if (items.length === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#E9DFD1";
    ctx.fill();
    ctx.fillStyle = "#857B71";
    ctx.font = "700 28px 'Noto Sans KR'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("맛집을 선택해 주세요", center, center - 85);
    return;
  }

  const slice = (Math.PI * 2) / items.length;
  items.forEach((item, index) => {
    const start = rotation + index * slice - Math.PI / 2;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#FFFDF8";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = [2, 4, 6].includes(index % colors.length) ? "#36271F" : "#F6E5CD";
    const size = items.length > 10 ? 20 : items.length > 7 ? 24 : 28;
    ctx.font = `700 ${size}px 'Noto Sans KR'`;
    ctx.fillText(fitWheelText(item.name, items.length > 9 ? 6 : 8), radius - 30, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#FFFDF8";
  ctx.lineWidth = 10;
  ctx.stroke();
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function playTick(frequency = 450, duration = 0.04) {
  if (!soundOn) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = playTick.audio || (playTick.audio = new AudioContext());
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.045, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function startMoleRain() {
  clearTimeout(rainCleanupTimer);
  moleRain.replaceChildren();
  const styles = ["mascot", "sketch", "pixel", "pop"];
  const count = window.innerWidth < 600 ? 13 : 22;
  const guestSize = window.innerWidth < 600 ? 58 : 72;
  const guestSources = [
    "assets/falling-guest.png",
    "assets/falling-guest-2.png"
  ];

  guestSources.forEach((source, guestIndex) => {
    const guest = document.createElement("img");
    const size = guestIndex === 1 ? Math.round(guestSize * 1.2) : guestSize;
    guest.src = source;
    guest.alt = "";
    guest.decoding = "async";
    guest.setAttribute("aria-hidden", "true");
    guest.setAttribute("class", "rain-mole rain-guest");
    guest.style.setProperty("--x", `${12 + Math.round(Math.random() * 76)}%`);
    guest.style.setProperty("--size", `${size}px`);
    guest.style.setProperty("--duration", `${2.8 + Math.random() * .8}s`);
    guest.style.setProperty("--delay", `${.15 + Math.random() * .35 + guestIndex * .12}s`);
    guest.style.setProperty("--drift", `${-40 + Math.round(Math.random() * 80)}px`);
    guest.style.setProperty("--spin", `${-70 + Math.round(Math.random() * 140)}deg`);
    moleRain.appendChild(guest);
  });

  for (let index = 0; index < count; index += 1) {
    const mole = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    const artStyle = styles[index % styles.length];
    mole.setAttribute("viewBox", "0 0 100 100");
    mole.setAttribute("class", `rain-mole rain-mole-${artStyle}`);
    mole.setAttribute("aria-hidden", "true");
    mole.style.setProperty("--x", `${Math.round(Math.random() * 94)}%`);
    mole.style.setProperty("--size", `${42 + Math.round(Math.random() * 48)}px`);
    mole.style.setProperty("--duration", `${2.2 + Math.random() * 2}s`);
    mole.style.setProperty("--delay", `${-Math.random() * 1.8 + index * .08}s`);
    mole.style.setProperty("--drift", `${-55 + Math.round(Math.random() * 110)}px`);
    mole.style.setProperty("--spin", `${-280 + Math.round(Math.random() * 560)}deg`);
    use.setAttribute("href", `#rain-mole-${artStyle}`);
    mole.appendChild(use);
    moleRain.appendChild(mole);
  }
}

function stopMoleRain() {
  rainCleanupTimer = setTimeout(() => moleRain.replaceChildren(), 900);
}

function spin() {
  const items = selectedRestaurants();
  if (spinning) return;
  if (items.length === 0) {
    showToast("이 분야에서 맛집을 1개 이상 선택해 주세요!");
    return;
  }

  spinning = true;
  spinButton.disabled = true;
  resultBox.classList.remove("revealed");
  resultPending.innerHTML = "두더지가 고르는 중…<small>앞발로 열심히 땅굴을 파고 있어요</small>";
  roulettePanel.classList.add("is-spinning");
  startMoleRain();

  const winnerIndex = Math.floor(Math.random() * items.length);
  const slice = (Math.PI * 2) / items.length;
  const normalizedCurrent = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const targetNormalized = -(winnerIndex * slice + slice / 2);
  let delta = targetNormalized - normalizedCurrent;
  delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const totalRotation = delta + Math.PI * 2 * (5 + Math.floor(Math.random() * 3));
  const startRotation = rotation;
  const startTime = performance.now();
  const duration = 4300;
  let lastTick = -1;

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + totalRotation * eased;
    drawWheel();

    const tickNow = Math.floor(rotation / slice);
    if (tickNow !== lastTick) {
      playTick(360 + progress * 250, .035);
      lastTick = tickNow;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      spinButton.disabled = false;
      rotation = targetNormalized;
      drawWheel();
      const winner = items[winnerIndex];
      resultName.textContent = winner.name;
      resultCategory.textContent = `${winner.category} · 맛있는 선택 완료!`;
      roulettePanel.classList.remove("is-spinning");
      resultBox.classList.add("revealed");
      stopMoleRain();
      playTick(720, .15);
    }
  }
  requestAnimationFrame(animate);
}

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  if (spinning) {
    showToast("룰렛이 멈춘 후 카테고리를 바꿔주세요.");
    return;
  }
  currentFilter = button.dataset.category;
  rotation = 0;
  resultBox.classList.remove("revealed");
  resultPending.innerHTML = `${escapeHtml(currentFilter)} 룰렛을 돌려주세요!<small>선택한 분야의 맛집만 룰렛에 들어가요.</small>`;
  renderFilters();
  renderList();
});

categoryPrev.addEventListener("click", () => scrollCategories(-1));
categoryNext.addEventListener("click", () => scrollCategories(1));
categoryFilters.addEventListener("scroll", updateCategoryArrows, { passive: true });

restaurantList.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-index]");
  if (!input) return;
  restaurants[Number(input.dataset.index)].active = input.checked;
  saveRestaurants();
  renderList();
});

restaurantList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  restaurants.splice(Number(button.dataset.delete), 1);
  if (currentFilter !== "전체" && !restaurants.some((item) => item.category === currentFilter)) currentFilter = "전체";
  saveRestaurants();
  renderFilters();
  renderList();
});

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newRestaurant.value.trim();
  if (!name) {
    newRestaurant.focus();
    showToast("맛집 이름을 입력해 주세요.");
    return;
  }
  if (restaurants.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    showToast("이미 등록된 맛집이에요.");
    return;
  }
  restaurants.push({ name, category: newCategory.value, active: true });
  currentFilter = "전체";
  saveRestaurants();
  newRestaurant.value = "";
  renderFilters();
  renderList();
  showToast(`${name}을(를) 추가했어요!`);
});

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.setAttribute("aria-pressed", String(soundOn));
  soundButton.setAttribute("aria-label", soundOn ? "효과음 끄기" : "효과음 켜기");
  if (soundOn) playTick(620, .08);
});

spinButton.addEventListener("click", spin);
window.addEventListener("resize", () => {
  drawWheel();
  updateCategoryArrows();
});
document.fonts?.ready.then(drawWheel);

renderFilters();
renderList();
