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

const colors = ["#F26B3A", "#FFC95A", "#7D5947", "#E99C8C", "#6F8C53", "#E6A55C", "#B8785E", "#E4C876"];
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const restaurantList = document.getElementById("restaurantList");
const categoryFilters = document.getElementById("categoryFilters");
const activeCount = document.getElementById("activeCount");
const resultBox = document.getElementById("resultBox");
const resultName = document.getElementById("resultName");
const resultCategory = document.getElementById("resultCategory");
const moleWrap = document.getElementById("moleWrap");
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
  return restaurants.filter((item) => item.active);
}

function renderFilters() {
  const categories = ["전체", ...new Set(restaurants.map((item) => item.category))];
  categoryFilters.innerHTML = categories.map((category) => `
    <button class="filter-chip ${category === currentFilter ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join("");
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
    ctx.fillStyle = [1, 3, 5, 7].includes(index % colors.length) ? "#3B302A" : "#FFFDF8";
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

function spin() {
  const items = selectedRestaurants();
  if (spinning) return;
  if (items.length < 2) {
    showToast("맛집을 2개 이상 선택해 주세요!");
    return;
  }

  spinning = true;
  spinButton.disabled = true;
  resultBox.classList.remove("revealed");
  resultName.textContent = "두더지가 고르는 중…";
  resultCategory.textContent = "땅굴을 열심히 파고 있어요";
  moleWrap.classList.remove("show");

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
      resultBox.classList.add("revealed");
      moleWrap.classList.add("show");
      playTick(720, .15);
    }
  }
  requestAnimationFrame(animate);
}

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  currentFilter = button.dataset.category;
  renderFilters();
  renderList();
});

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
window.addEventListener("resize", drawWheel);
document.fonts?.ready.then(drawWheel);

renderFilters();
renderList();
