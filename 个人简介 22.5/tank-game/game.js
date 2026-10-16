/*
 * TANK BATTLE / 坦克大战
 * --------------------------------------------------------------------------
 * 这是一个零依赖 Canvas 游戏。为了方便 solo builder 阅读，代码按以下顺序组织：
 * 1. 配置和状态  2. 输入与界面  3. 关卡  4. 更新逻辑  5. 绘制  6. 主循环
 * 所有数值都集中在 CONFIG 中，想调整手感时优先改这里。
 */

(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  // 原创标识：若需要改成自己的缩写，修改此处与 buildLSHSignatureLayout() 即可。
  const AUTHOR_MARK = "LSH";
  // 校园底图使用相对路径，因此直接双击 index.html 也能加载。
  let campusBackground = null;
  let campusBackgroundReady = false;
  if (typeof Image !== "undefined") {
    campusBackground = new Image();
    campusBackground.onload = () => { campusBackgroundReady = true; };
    campusBackground.src = "assets/wavepeak-campus.jpg";
  }

  // 用户提供的像素坦克原图：启动时自动去灰底，只保留中心连通的坦克主体。
  let defaultTankCutout = null;
  if (typeof Image !== "undefined") {
    const defaultTankSource = new Image();
    defaultTankSource.onload = () => {
      defaultTankCutout = makeTankCutout(defaultTankSource);
      if (game.model === "tank") updateMenuPreview("tank");
    };
    defaultTankSource.src = "assets/default-tank-source.jpg";
  }

  const avatarImages = {};
  const avatarCutouts = {};
  const avatarSources = { avatarHat: "assets/avatar-hat.jpg", avatarSpider: "assets/avatar-spider.jpg" };
  Object.entries(avatarSources).forEach(([name, src]) => {
    const image = new Image();
    image.onload = () => {
      avatarImages[name] = image;
      avatarCutouts[name] = makeCutout(image);
      document.querySelectorAll(`img[src="${src}"]`).forEach((element) => { element.src = avatarCutouts[name].toDataURL("image/png"); });
      if (game.model === name) updateMenuPreview(name);
    };
    image.src = src;
  });

  const MODEL_DEFS = {
    tank: { label: "霓虹坦克", speed: 220, hp: 100 },
    car: { label: "闪电汽车", speed: 260, hp: 86 },
    motorcycle: { label: "脉冲摩托", speed: 300, hp: 72 },
    locomotive: { label: "重装机车", speed: 175, hp: 135 },
    avatarHat: { label: "安全帽头像", speed: 220, hp: 100 },
    avatarSpider: { label: "蜘蛛侠头像", speed: 235, hp: 94 },
    customPhoto: { label: "我的照片战机", speed: 220, hp: 100 },
  };
  const modelLabel = (model) => MODEL_DEFS[model]?.label || MODEL_DEFS.tank.label;

  const CONFIG = {
    playerSpeed: 220,
    playerBulletSpeed: 640,
    enemyBulletSpeed: 265,
    shotCooldown: 0.27,
    invulnerableTime: 1.25,
    enemyContactDamage: 18,
    baseHp: 100,
    dropChance: 0.42,
    comboWindow: 2.8,
  };

  const DIFFICULTY = {
    rookie: { enemyHp: 0.82, enemyFire: 1.25, enemyDamage: 0.75, label: "新兵" },
    normal: { enemyHp: 1, enemyFire: 1, enemyDamage: 1, label: "战士" },
    ace: { enemyHp: 1.25, enemyFire: 0.78, enemyDamage: 1.25, label: "王牌" },
  };

  // 关卡数据：从外围封锁一路推进到终焉裂谷，首页可直接选择任意阶段。
  const LEVELS = [
    {
      name: "外围封锁",
      tier: "简单",
      waves: [
        ["scout", "scout", "grunt", "drone"],
        ["scout", "grunt", "sniper", "grunt"],
      ],
    },
    {
      name: "熔炉走廊",
      tier: "中等",
      waves: [
        ["scout", "scout", "gunner", "drone"],
        ["heavy", "grunt", "sniper", "scout"],
        ["heavy", "gunner", "drone", "grunt", "boss"],
      ],
    },
    {
      name: "霓虹天桥",
      tier: "中等",
      waves: [
        ["gunner", "grunt", "drone", "scout"],
        ["heavy", "heavy", "sniper", "grunt"],
        ["gunner", "drone", "sniper", "heavy"],
      ],
    },
    {
      name: "霜脉工厂",
      tier: "困难",
      waves: [
        ["drone", "scout", "grunt", "gunner", "sniper"],
        ["heavy", "grunt", "gunner", "drone", "scout"],
        ["heavy", "heavy", "sniper", "gunner", "boss"],
      ],
    },
    {
      name: "黑潮港口",
      tier: "专家",
      waves: [
        ["scout", "drone", "drone", "gunner", "grunt"],
        ["heavy", "sniper", "gunner", "heavy", "scout"],
        ["heavy", "sniper", "gunner", "drone", "grunt", "boss"],
      ],
    },
    {
      name: "终焉裂谷",
      tier: "终极",
      waves: [
        ["drone", "scout", "grunt", "gunner", "sniper"],
        ["heavy", "heavy", "sniper", "gunner", "drone"],
        ["boss"],
      ],
    },
  ];

  // 每张地图都有自己的视觉语言：背景、叠层结构和灯光颜色不再只靠障碍物位置区分。
  const ARENA_THEMES = [
    { id: "campus", label: "CAMPUS OUTER RING", top: "#0a1a27", mid: "#06111c", bottom: "#030912", accent: "#55f4ff", grid: "rgba(68,184,211,.055)" },
    { id: "forge", label: "FURNACE CORRIDOR", top: "#29151a", mid: "#17101a", bottom: "#090a12", accent: "#ff9f43", grid: "rgba(255,159,67,.075)" },
    { id: "bridge", label: "NEON SKYBRIDGE", top: "#171331", mid: "#0e1025", bottom: "#050914", accent: "#b879ff", grid: "rgba(184,121,255,.075)" },
    { id: "frost", label: "FROST VEIN FACTORY", top: "#102b3b", mid: "#0b1d2b", bottom: "#061019", accent: "#8be9ff", grid: "rgba(139,233,255,.075)" },
    { id: "harbor", label: "BLACKTIDE HARBOR", top: "#09253a", mid: "#071827", bottom: "#040a14", accent: "#ffb454", grid: "rgba(255,180,84,.065)" },
    { id: "rift", label: "THE END RIFT", top: "#2b101d", mid: "#160d1a", bottom: "#080711", accent: "#ff4d68", grid: "rgba(255,77,104,.07)" },
  ];

  const ENEMY_TYPES = {
    scout: { hp: 26, speed: 118, fire: 1.8, damage: 9, score: 120, color: "#ffb454", size: 31 },
    grunt: { hp: 42, speed: 82, fire: 1.5, damage: 12, score: 180, color: "#ff657d", size: 36 },
    gunner: { hp: 55, speed: 62, fire: 1.05, damage: 10, score: 240, color: "#b879ff", size: 37 },
    heavy: { hp: 105, speed: 46, fire: 1.9, damage: 20, score: 380, color: "#ff405f", size: 44 },
    drone: { hp: 30, speed: 155, fire: 2.4, damage: 8, score: 210, color: "#55f4ff", size: 27 },
    sniper: { hp: 48, speed: 34, fire: 2.9, damage: 26, score: 320, color: "#baff49", size: 35 },
    boss: { hp: 1150, speed: 54, fire: 0.78, damage: 16, score: 5000, color: "#ff3159", size: 104 },
  };

  const ui = {
    menu: document.getElementById("menuScreen"),
    pause: document.getElementById("pauseScreen"),
    result: document.getElementById("resultScreen"),
    help: document.getElementById("helpScreen"),
    bossHud: document.getElementById("bossHud"),
    healthText: document.getElementById("healthText"),
    healthBar: document.getElementById("healthBar"),
    scoreText: document.getElementById("scoreText"),
    levelText: document.getElementById("levelText"),
    selectedLevelLabel: document.getElementById("selectedLevelLabel"),
    enemyText: document.getElementById("enemyText"),
    weaponText: document.getElementById("weaponText"),
    cooldownText: document.getElementById("cooldownText"),
    cooldownBar: document.getElementById("cooldownBar"),
    powerText: document.getElementById("powerText"),
    bossHealthText: document.getElementById("bossHealthText"),
    bossHealthBar: document.getElementById("bossHealthBar"),
    toast: document.getElementById("toast"),
    soundButton: document.getElementById("soundButton"),
    nextButton: document.getElementById("nextButton"),
    playerTwoHud: document.getElementById("playerTwoHud"),
    health2Text: document.getElementById("health2Text"),
    health2Bar: document.getElementById("health2Bar"),
    ranking: document.getElementById("rankingScreen"),
    rankingBody: document.getElementById("rankingBody"),
    rankingEmpty: document.getElementById("rankingEmpty"),
    shop: document.getElementById("shopScreen"),
    medals: document.getElementById("medalScreen"),
    shopCoins: document.getElementById("shopCoins"),
    medalGrid: document.getElementById("medalGrid"),
    garage: document.getElementById("garageScreen"),
    level: document.getElementById("levelScreen"),
    menuModelPreview: document.getElementById("menuModelPreview"),
    menuAvatarPreview: document.getElementById("menuAvatarPreview"),
    menuModelLabel: document.getElementById("menuModelLabel"),
  };

  const game = {
    state: "menu",
    resumeState: "menu",
    level: 0,
    selectedLevel: 0,
    mode: "solo",
    difficulty: "normal",
    score: 0,
    kills: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    elapsed: 0,
    shake: 0,
    flash: 0,
    waveIndex: 0,
    spawnQueue: [],
    spawnTimer: 0,
    waitingNextWave: false,
    totalTargets: 0,
    sound: true,
    linkActive: false,
    model: "tank",
    model2: "car",
    matchRecorded: false,
    coins: 0,
    upgrades: { armor: false, fire: false, shield: false },
    lifetimeKills: 0,
    victories: 0,
  };

  let player = null;
  let playerTwo = null;
  let core = null;
  let enemies = [];
  let bullets = [];
  let obstacles = [];
  let particles = [];
  let pickups = [];
  let stars = [];
  let lastTime = performance.now();
  let toastTimer = 0;
  let audioContext = null;

  function loadMeta() {
    try {
      const saved = JSON.parse(localStorage.getItem("neonArmorMeta") || "{}");
      game.coins = Number(saved.coins || 0);
      game.upgrades = Object.assign(game.upgrades, saved.upgrades || {});
      game.lifetimeKills = Number(saved.lifetimeKills || 0);
      game.victories = Number(saved.victories || 0);
    } catch (error) { /* 本地存储不可用时使用默认数据 */ }
  }
  function saveMeta() {
    try { localStorage.setItem("neonArmorMeta", JSON.stringify({ coins: game.coins, upgrades: game.upgrades, lifetimeKills: game.lifetimeKills, victories: game.victories })); } catch (error) { /* ignore */ }
  }
  loadMeta();

  const keys = Object.create(null);
  const pointer = { firing: false };
  // 触屏移动使用独立状态，不再依赖浏览器将触摸事件模拟成键盘事件。
  // 部分微信内置浏览器会在手指轻微滑动时触发 pointerleave，导致旧版按键立即松开。
  const touchMove = { up: false, down: false, left: false, right: false };
  let garageSelection = "tank";
  let customPhotoCutout = null;

  function makeCutout(image) {
    const output = document.createElement("canvas");
    output.width = image.naturalWidth || image.width;
    output.height = image.naturalHeight || image.height;
    const cutoutCtx = output.getContext("2d");
    cutoutCtx.drawImage(image, 0, 0);
    const pixels = cutoutCtx.getImageData(0, 0, output.width, output.height);
    const { data, width, height } = pixels;
    const candidate = new Uint8Array(width * height);
    const visited = new Uint8Array(width * height);
    const stack = [];
    const isLightBackground = (index) => {
      const r = data[index]; const g = data[index + 1]; const b = data[index + 2];
      const max = Math.max(r, g, b); const min = Math.min(r, g, b);
      return max > 150 && max - min < 38 && (r + g + b) / 3 > 132;
    };
    for (let i = 0; i < width * height; i += 1) if (isLightBackground(i * 4)) candidate[i] = 1;
    const push = (x, y) => { if (x >= 0 && x < width && y >= 0 && y < height) { const p = y * width + x; if (candidate[p] && !visited[p]) { visited[p] = 1; stack.push(p); } } };
    for (let x = 0; x < width; x += 1) { push(x, 0); push(x, height - 1); }
    for (let y = 1; y < height - 1; y += 1) { push(0, y); push(width - 1, y); }
    while (stack.length) {
      const point = stack.pop();
      const x = point % width; const y = Math.floor(point / width);
      push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
    }
    for (let i = 0; i < width * height; i += 1) if (visited[i]) data[i * 4 + 3] = 0;
    cutoutCtx.putImageData(pixels, 0, 0);
    return output;
  }

  function makeTankCutout(image) {
    const source = document.createElement("canvas");
    source.width = image.naturalWidth || image.width;
    source.height = image.naturalHeight || image.height;
    const sourceCtx = source.getContext("2d");
    sourceCtx.drawImage(image, 0, 0);
    const pixels = sourceCtx.getImageData(0, 0, source.width, source.height);
    const { data, width, height } = pixels;
    const indexOf = (x, y) => (y * width + x) * 4;
    const colorful = (x, y) => {
      const i = indexOf(x, y);
      const maxValue = Math.max(data[i], data[i + 1], data[i + 2]);
      const minValue = Math.min(data[i], data[i + 1], data[i + 2]);
      return maxValue - minValue > 22 && maxValue > 95;
    };
    let seed = null;
    let seedScore = -Infinity;
    for (let y = Math.max(0, Math.floor(height / 2) - 42); y < Math.min(height, Math.floor(height / 2) + 42); y += 1) {
      for (let x = Math.max(0, Math.floor(width / 2) - 58); x < Math.min(width, Math.floor(width / 2) + 58); x += 1) {
        if (!colorful(x, y)) continue;
        const score = 1000 - Math.abs(x - width / 2) - Math.abs(y - height / 2);
        if (score > seedScore) { seedScore = score; seed = { x, y }; }
      }
    }
    if (!seed) return null;
    const visited = new Uint8Array(width * height);
    const queue = [seed];
    const points = [];
    let head = 0;
    while (head < queue.length) {
      const point = queue[head++];
      if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) continue;
      const pointIndex = point.y * width + point.x;
      if (visited[pointIndex]) continue;
      visited[pointIndex] = 1;
      if (!colorful(point.x, point.y)) continue;
      points.push(point);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx || dy) queue.push({ x: point.x + dx, y: point.y + dy });
        }
      }
    }
    if (!points.length) return null;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const padding = 3;
    const minX = Math.max(0, Math.min(...xs) - padding);
    const maxX = Math.min(width - 1, Math.max(...xs) + padding);
    const minY = Math.max(0, Math.min(...ys) - padding);
    const maxY = Math.min(height - 1, Math.max(...ys) + padding);
    const output = document.createElement("canvas");
    output.width = maxX - minX + 1;
    output.height = maxY - minY + 1;
    const outputCtx = output.getContext("2d");
    const outputPixels = outputCtx.createImageData(output.width, output.height);
    for (let y = 0; y < output.height; y += 1) {
      for (let x = 0; x < output.width; x += 1) {
        const sourceX = minX + x;
        const sourceY = minY + y;
        const sourceIndex = indexOf(sourceX, sourceY);
        const outputIndex = (y * output.width + x) * 4;
        const saturation = Math.max(data[sourceIndex], data[sourceIndex + 1], data[sourceIndex + 2]) - Math.min(data[sourceIndex], data[sourceIndex + 1], data[sourceIndex + 2]);
        outputPixels.data[outputIndex] = data[sourceIndex];
        outputPixels.data[outputIndex + 1] = data[sourceIndex + 1];
        outputPixels.data[outputIndex + 2] = data[sourceIndex + 2];
        outputPixels.data[outputIndex + 3] = visited[sourceY * width + sourceX] ? clamp((saturation - 12) * 22, 0, 255) : 0;
      }
    }
    outputCtx.putImageData(outputPixels, 0, 0);
    return output;
  }

  // ------------------------------------------------------------------------
  // 通用工具
  // ------------------------------------------------------------------------
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const chance = (value) => Math.random() < value;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function rectOf(entity, pad = 0) {
    return {
      x: entity.x - entity.w / 2 + pad,
      y: entity.y - entity.h / 2 + pad,
      w: entity.w - pad * 2,
      h: entity.h - pad * 2,
    };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(circle, rect) {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
    return (circle.x - closestX) ** 2 + (circle.y - closestY) ** 2 < circle.r ** 2;
  }

  function angleVector(angle) {
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  function createStars() {
    stars = Array.from({ length: 75 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: random(.4, 1.5),
      alpha: random(.1, .55),
      speed: random(3, 13),
    }));
  }

  // ------------------------------------------------------------------------
  // 音效：使用 WebAudio 合成，不需要外部音频文件
  // ------------------------------------------------------------------------
  function ensureAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
  }

  function playSound(type) {
    if (!game.sound) return;
    ensureAudio();
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const settings = {
      shoot: [210, 95, .06, "square", .045],
      enemyShoot: [115, 72, .08, "sawtooth", .025],
      hit: [90, 42, .1, "square", .04],
      explode: [72, 25, .18, "sawtooth", .065],
      pickup: [420, 860, .15, "sine", .05],
      hurt: [160, 48, .24, "sawtooth", .07],
      win: [320, 680, .42, "triangle", .06],
    }[type] || [160, 100, .08, "sine", .03];
    osc.type = settings[3];
    osc.frequency.setValueAtTime(settings[0], now);
    osc.frequency.exponentialRampToValueAtTime(settings[1], now + settings[2]);
    gain.gain.setValueAtTime(settings[4], now);
    gain.gain.exponentialRampToValueAtTime(.001, now + settings[2]);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + settings[2]);
  }

  // ------------------------------------------------------------------------
  // 菜单、输入与屏幕状态
  // ------------------------------------------------------------------------
  function setOverlay(name) {
    [ui.menu, ui.pause, ui.result, ui.help, ui.ranking, ui.garage, ui.level, ui.shop, ui.medals].forEach((item) => item && item.classList.remove("active"));
    if (name && ui[name]) ui[name].classList.add("active");
  }

  function showToast(message, duration = 1.4) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    toastTimer = duration;
  }

  function readRankings() {
    try { return JSON.parse(localStorage.getItem("neonArmorRankings") || "[]"); }
    catch (error) { return []; }
  }

  function saveRanking(won) {
    const rankings = readRankings();
    rankings.push({
      won,
      score: game.score,
      kills: game.kills,
      model: modelLabel(game.model),
      mode: game.mode === "coop" ? "双人" : "单人",
      level: game.level + 1,
      time: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    });
    rankings.sort((a, b) => b.score - a.score);
    try { localStorage.setItem("neonArmorRankings", JSON.stringify(rankings.slice(0, 30))); } catch (error) { /* 本地存储不可用时仍可继续游戏 */ }
  }

  function renderRankings() {
    if (!ui.rankingBody) return;
    const rankings = readRankings();
    ui.rankingBody.innerHTML = rankings.map((entry, index) => `<tr><td>${index + 1}</td><td>${entry.won ? "胜利" : "失败"}</td><td>${entry.model}<br><small>${entry.mode}</small></td><td>${Number(entry.score || 0).toLocaleString("zh-CN")}</td><td>${entry.kills || 0}</td><td>${entry.time || "—"}</td></tr>`).join("");
    ui.rankingEmpty.hidden = rankings.length > 0;
  }

  function openRankings() {
    renderRankings();
    game.resumeState = game.state;
    game.state = "ranking";
    setOverlay("ranking");
  }

  function openShop() {
    if (!ui.shop) return;
    game.resumeState = game.state;
    game.state = "shop";
    if (ui.shopCoins) ui.shopCoins.textContent = game.coins;
    document.querySelectorAll("[data-shop]").forEach((item) => item.classList.toggle("selected", !!game.upgrades[item.dataset.shop]));
    setOverlay("shop");
  }

  function renderMedals() {
    if (!ui.medalGrid) return;
    const medals = [
      ["first-blood", "首战告捷", "完成第一场战役", game.victories >= 1],
      ["ace", "王牌射手", "累计击毁 50 个敌方单位", game.lifetimeKills >= 50],
      ["guardian", "核心守护者", "完成一场战役且基地未被摧毁", readRankings().some((r) => r.won)],
      ["co-op", "并肩作战", "以双人协作完成一场战役", readRankings().some((r) => r.won && r.mode === "双人")],
      ["collector", "火力收藏家", "拥有全部三项商店强化", Object.values(game.upgrades).every(Boolean)],
      ["sixth", "终焉突破", "完成第六阶段", readRankings().some((r) => r.won && Number(r.level || 0) >= 6)],
    ];
    ui.medalGrid.innerHTML = medals.map((m) => `<div class="medal-card ${m[3] ? "unlocked" : ""}"><b>${m[3] ? "◆" : "◇"} ${m[1]}</b><span>${m[2]}<br>${m[3] ? "已解锁" : "未解锁"}</span></div>`).join("");
  }

  function openMedals() {
    if (!ui.medals) return;
    game.resumeState = game.state;
    game.state = "medals";
    renderMedals();
    setOverlay("medals");
  }

  function updateMenuPreview(model) {
    if (!ui.menuModelPreview) return;
    const cutout = model === "customPhoto" ? customPhotoCutout : avatarCutouts[model] || (model === "tank" ? defaultTankCutout : null);
    ui.menuModelPreview.className = `tank-emblem model-preview-selected-${model}${model === "tank" && cutout ? " has-cutout" : ""}`;
    ui.menuModelLabel.textContent = `当前：${modelLabel(model)}`;
    if (cutout) {
      ui.menuAvatarPreview.src = cutout.toDataURL("image/png");
      ui.menuAvatarPreview.alt = model === "tank" ? "默认像素坦克预览" : model === "customPhoto" ? "我的照片战机预览" : "当前头像模型";
      ui.menuAvatarPreview.hidden = false;
    } else {
      ui.menuAvatarPreview.hidden = true;
    }
    ui.menuModelPreview.innerHTML = "<i></i>";
    if (cutout) {
      ui.menuModelPreview.appendChild(ui.menuAvatarPreview);
      ui.menuAvatarPreview.hidden = false;
    }
  }

  function openGarage() {
    garageSelection = game.model;
    document.querySelectorAll("[data-garage-model]").forEach((item) => item.classList.toggle("selected", item.dataset.garageModel === garageSelection));
    game.resumeState = game.state;
    game.state = "garage";
    setOverlay("garage");
  }

  function makePhotoCutout(image) {
    const size = 320;
    const source = document.createElement("canvas");
    source.width = size; source.height = size;
    const sourceCtx = source.getContext("2d");
    const scale = Math.max(size / image.width, size / image.height);
    const drawW = image.width * scale, drawH = image.height * scale;
    sourceCtx.drawImage(image, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
    const extracted = makeCutout(source);
    if (extracted) {
      const pixels = extracted.getContext("2d").getImageData(0, 0, size, size).data;
      let visible = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 18) visible += 1;
      if (visible > size * size * .08) return extracted;
    }
    return source;
  }

  function handlePhotoUpload(file) {
    if (!file || !file.type.startsWith("image/")) { showToast("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        customPhotoCutout = makePhotoCutout(image);
        const preview = document.getElementById("customPhotoPreview");
        const card = document.querySelector("[data-garage-model=customPhoto]");
        if (preview && customPhotoCutout) { preview.src = customPhotoCutout.toDataURL("image/png"); preview.hidden = false; }
        if (card) card.classList.add("has-photo");
        garageSelection = "customPhoto";
        document.querySelectorAll("[data-garage-model]").forEach((item) => item.classList.toggle("selected", item.dataset.garageModel === garageSelection));
        showToast("人物已截取，可应用为照片战机", 1.8);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function openLevelPicker() {
    game.resumeState = game.state;
    game.state = "levelPicker";
    document.querySelectorAll("[data-level]").forEach((item) => item.classList.toggle("selected", Number(item.dataset.level) === game.selectedLevel));
    setOverlay("level");
  }

  function togglePause(force) {
    if (!["playing", "paused"].includes(game.state)) return;
    const shouldPause = typeof force === "boolean" ? force : game.state === "playing";
    game.state = shouldPause ? "paused" : "playing";
    setOverlay(shouldPause ? "pause" : null);
  }

  function openHelp() {
    game.resumeState = game.state;
    if (game.state === "playing") game.state = "paused";
    setOverlay("help");
  }

  function closeHelp() {
    game.state = game.resumeState;
    setOverlay(game.state === "menu" ? "menu" : game.state === "paused" ? "pause" : null);
  }

  function returnToMenu() {
    game.state = "menu";
    ui.bossHud.classList.add("hidden");
    setOverlay("menu");
    playerTwo = null;
    updateHud();
    clearInput();
  }

  function clearInput() {
    Object.keys(keys).forEach((key) => { keys[key] = false; });
    pointer.firing = false;
    Object.keys(touchMove).forEach((direction) => { touchMove[direction] = false; });
    document.querySelectorAll(".pressed").forEach((button) => button.classList.remove("pressed"));
  }

  function normalizeKey(event) {
    if (event.code === "Space") return "Space";
    if (event.code === "Numpad0") return "Numpad0";
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  window.addEventListener("keydown", (event) => {
    const key = normalizeKey(event);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(key)) event.preventDefault();
    keys[key] = true;
    if (!event.repeat && (key === "p" || key === "Escape")) togglePause();
    if (!event.repeat && key === "Enter") {
      if (game.state === "menu") startNewGame();
      else if (game.state === "result") ui.nextButton.click();
    }
  });
  window.addEventListener("keyup", (event) => { keys[normalizeKey(event)] = false; });
  window.addEventListener("blur", () => { if (game.state === "playing") togglePause(true); });

  canvas.addEventListener("pointerdown", (event) => {
    if (game.state !== "playing") return;
    event.preventDefault();
    pointer.firing = true;
    shootPlayer();
  });
  window.addEventListener("pointerup", () => { pointer.firing = false; });

  const TOUCH_DIRECTIONS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  document.querySelectorAll("[data-key]").forEach((button) => {
    const key = button.dataset.key;
    const direction = TOUCH_DIRECTIONS[key];
    const down = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.pointerId !== undefined && button.setPointerCapture) {
        try { button.setPointerCapture(event.pointerId); } catch (error) { /* 某些内置浏览器不支持捕获 */ }
      }
      if (direction) touchMove[direction] = true;
      if (key === "Space") pointer.firing = true;
      button.classList.add("pressed");
      if (key === "Space") shootPlayer();
    };
    const up = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (direction) touchMove[direction] = false;
      if (key === "Space") pointer.firing = false;
      button.classList.remove("pressed");
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("contextmenu", (event) => event.preventDefault());

    // 兼容未完整实现 Pointer Events 的旧版 WebView。
    if (!("PointerEvent" in window)) {
      button.addEventListener("touchstart", down, { passive: false });
      button.addEventListener("touchend", up, { passive: false });
      button.addEventListener("touchcancel", up, { passive: false });
    }
  });

  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      game.difficulty = button.dataset.difficulty;
      document.querySelectorAll("[data-difficulty]").forEach((item) => item.classList.toggle("selected", item === button));
    });
  });

  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => {
      const levelIndex = Number(button.dataset.level);
      if (!LEVELS[levelIndex]) return;
      game.selectedLevel = levelIndex;
      document.querySelectorAll("[data-level]").forEach((item) => item.classList.toggle("selected", item === button));
      if (ui.selectedLevelLabel) ui.selectedLevelLabel.textContent = `${String(levelIndex + 1).padStart(2, "0")} · ${LEVELS[levelIndex].name}`;
      showToast(`${LEVELS[levelIndex].tier}战役已选择 · ${LEVELS[levelIndex].name}`, 1.2);
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      game.mode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("selected", item === button));
      showToast(game.mode === "coop" ? "双人链路已开启 · P2 方向键 + ENTER" : "单人链路已开启", 1.3);
    });
  });

  document.querySelectorAll("[data-model]").forEach((button) => {
    button.addEventListener("click", () => {
      const slot = button.dataset.modelSlot || "player1";
      if (slot === "player2") game.model2 = button.dataset.model;
      else game.model = button.dataset.model;
      const scope = slot === "player2" ? "[data-model-slot=player2]" : "#modelGrid [data-model]";
      document.querySelectorAll(scope).forEach((item) => item.classList.toggle("selected", item === button));
      const name = slot === "player2" ? document.getElementById("modelName2") : document.getElementById("modelName");
      if (name) name.textContent = modelLabel(button.dataset.model);
    });
  });

  document.querySelectorAll("[data-garage-model]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.garageModel === "customPhoto" && !customPhotoCutout) { showToast("请先上传一张人物照片"); return; }
      garageSelection = button.dataset.garageModel;
      document.querySelectorAll("[data-garage-model]").forEach((item) => item.classList.toggle("selected", item === button));
    });
  });

  document.getElementById("startButton").addEventListener("click", startNewGame);
  document.getElementById("helpButton").addEventListener("click", openHelp);
  document.getElementById("closeHelpButton").addEventListener("click", closeHelp);
  document.getElementById("rankButton").addEventListener("click", openRankings);
  document.getElementById("shopButton").addEventListener("click", openShop);
  document.getElementById("medalButton").addEventListener("click", openMedals);
  document.getElementById("openGarageButton").addEventListener("click", openGarage);
  document.getElementById("uploadPhotoButton").addEventListener("click", () => document.getElementById("photoUploadInput").click());
  document.getElementById("photoUploadInput").addEventListener("change", (event) => { handlePhotoUpload(event.target.files[0]); event.target.value = ""; });
  document.getElementById("openLevelButton").addEventListener("click", openLevelPicker);
  document.getElementById("closeLevelButton").addEventListener("click", () => { game.state = game.resumeState || "menu"; setOverlay(game.state === "menu" ? "menu" : null); });
  document.getElementById("confirmLevelButton").addEventListener("click", () => { game.state = game.resumeState || "menu"; setOverlay(game.state === "menu" ? "menu" : null); showToast(`${LEVELS[game.selectedLevel].name} 已选择`, 1.2); });
  document.getElementById("closeGarageButton").addEventListener("click", () => { game.state = game.resumeState || "menu"; setOverlay("menu"); });
  document.getElementById("applyGarageButton").addEventListener("click", () => {
    game.model = garageSelection;
    document.querySelectorAll("#modelGrid [data-model]").forEach((item) => item.classList.toggle("selected", item.dataset.model === game.model));
    const name = document.getElementById("modelName");
    if (name) name.textContent = modelLabel(game.model);
    updateMenuPreview(game.model);
    game.state = game.resumeState || "menu";
    setOverlay("menu");
    showToast(`${modelLabel(game.model)} 已应用到主页`, 1.5);
  });
  document.getElementById("closeRankingButton").addEventListener("click", () => {
    game.state = game.resumeState || "menu";
    setOverlay(game.state === "menu" ? "menu" : null);
  });
  document.getElementById("clearRankingButton").addEventListener("click", () => {
    localStorage.removeItem("neonArmorRankings");
    renderRankings();
  });
  ["closeShopButton", "closeShopButton2"].forEach((id) => document.getElementById(id).addEventListener("click", () => { game.state = game.resumeState || "menu"; setOverlay(game.state === "menu" ? "menu" : null); }));
  ["closeMedalButton", "closeMedalButton2"].forEach((id) => document.getElementById(id).addEventListener("click", () => { game.state = game.resumeState || "menu"; setOverlay(game.state === "menu" ? "menu" : null); }));
  document.querySelectorAll("[data-shop]").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.shop, prices = { armor: 120, fire: 180, shield: 150 }, price = prices[key];
    if (game.upgrades[key]) { showToast("该强化已经拥有"); return; }
    if (game.coins < price) { showToast("金币不足"); return; }
    game.coins -= price; game.upgrades[key] = true; saveMeta(); openShop(); showToast("永久强化已安装");
  }));
  document.getElementById("pauseButton").addEventListener("click", () => togglePause());
  document.getElementById("resumeButton").addEventListener("click", () => togglePause(false));
  document.getElementById("restartPauseButton").addEventListener("click", () => setupLevel(game.level, false));
  document.getElementById("restartResultButton").addEventListener("click", () => setupLevel(game.level, false));
  document.getElementById("menuPauseButton").addEventListener("click", returnToMenu);
  document.getElementById("menuResultButton").addEventListener("click", returnToMenu);
  document.getElementById("nextButton").addEventListener("click", () => {
    if (game.level < LEVELS.length - 1) setupLevel(game.level + 1, true);
    else startNewGame();
  });
  ui.soundButton.addEventListener("click", () => {
    game.sound = !game.sound;
    ui.soundButton.textContent = `音效 ${game.sound ? "ON" : "OFF"}`;
    if (game.sound) playSound("pickup");
  });

  // ------------------------------------------------------------------------
  // 关卡与实体创建
  // ------------------------------------------------------------------------
  function startNewGame() {
    game.score = 0;
    game.kills = 0;
    game.combo = 0;
    game.maxCombo = 0;
    game.matchRecorded = false;
    setupLevel(game.selectedLevel, false);
  }

  function setupLevel(levelIndex, carryPlayer) {
    const oldPlayer = player;
    const oldPlayerTwo = playerTwo;
    game.level = levelIndex;
    game.selectedLevel = levelIndex;
    document.querySelectorAll("[data-level]").forEach((item) => item.classList.toggle("selected", Number(item.dataset.level) === levelIndex));
    if (ui.selectedLevelLabel) ui.selectedLevelLabel.textContent = `${String(levelIndex + 1).padStart(2, "0")} · ${LEVELS[levelIndex].name}`;
    game.state = "playing";
    game.waveIndex = 0;
    game.spawnQueue = [];
    game.spawnTimer = 1.25;
    game.waitingNextWave = true;
    game.elapsed = 0;
    game.shake = 0;
    game.linkActive = false;
    enemies = [];
    bullets = [];
    particles = [];
    pickups = [];
    obstacles = buildMap(levelIndex);
    core = { x: W / 2, y: H - 28, w: 84, h: 42, hp: CONFIG.baseHp, maxHp: CONFIG.baseHp };
    player = createPlayer();
    playerTwo = game.mode === "coop" ? createPlayerTwo() : null;
    if (carryPlayer && oldPlayer) {
      player.weapon = clamp(oldPlayer.weapon, 1, 3);
      player.hp = clamp(oldPlayer.hp + 30, 1, player.maxHp);
      player.shield = oldPlayer.shield;
    }
    if (carryPlayer && oldPlayerTwo && playerTwo) {
      playerTwo.weapon = clamp(oldPlayerTwo.weapon, 1, 3);
      playerTwo.hp = clamp(oldPlayerTwo.hp + 30, 1, playerTwo.maxHp);
      playerTwo.shield = oldPlayerTwo.shield;
    }
    game.totalTargets = LEVELS[levelIndex].waves.flat().length;
    setOverlay(null);
    clearInput();
    updateHud();
    showToast(`阶段 ${String(levelIndex + 1).padStart(2, "0")} · ${LEVELS[levelIndex].name}`, 2.1);
  }

  function createPlayer() {
    const model = MODEL_DEFS[game.model] || MODEL_DEFS.tank;
    return {
      x: W / 2,
      y: H - 90,
      w: 38,
      h: 42,
      dir: { x: 0, y: -1 },
      speed: model.speed,
      hp: model.hp + (game.upgrades.armor ? 10 : 0),
      maxHp: model.hp + (game.upgrades.armor ? 10 : 0),
      cooldown: 0,
      invulnerable: 0,
      weapon: game.upgrades.fire ? 2 : 1,
      shield: game.upgrades.shield ? 1 : 0,
      overdrive: 0,
      downed: false,
      reviveTimer: 0,
      tint: "#55f4ff",
      model: game.model,
      controls: { up: "w", down: "s", left: "a", right: "d", fire: "Space" },
    };
  }

  function createPlayerTwo() {
    const unit = createPlayer();
    const model = MODEL_DEFS[game.model2] || MODEL_DEFS.car;
    unit.x = W / 2 + 58;
    unit.y = H - 90;
    unit.dir = { x: 0, y: -1 };
    unit.tint = "#ffb454";
    unit.model = game.model2;
    unit.speed = model.speed;
    unit.hp = model.hp;
    unit.maxHp = model.hp;
    unit.controls = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", fire: "Numpad0" };
    return unit;
  }

  function buildMap(levelIndex) {
    const map = [];
    const add = (x, y, w, h, type = "brick") => map.push({ x, y, w, h, type, hp: type === "brick" ? 2 : Infinity });
    if (levelIndex === 0) {
      // 第一关的中央砖墙排布为 "LSH"，作为作者原创性签名。
      buildLSHSignatureLayout(add);
      add(90, 170, 125, 30, "steel"); add(745, 170, 125, 30, "steel");
      add(115, 438, 120, 32); add(725, 438, 120, 32);
      add(400, 485, 54, 32); add(506, 485, 54, 32);
      add(330, 438, 64, 24); add(566, 438, 64, 24);
    } else if (levelIndex === 1) {
      add(80, 155, 155, 30, "steel"); add(725, 155, 155, 30, "steel");
      add(300, 180, 30, 175); add(630, 180, 30, 175);
      add(420, 270, 120, 34, "steel");
      add(190, 410, 165, 30); add(605, 410, 165, 30);
      add(400, 500, 54, 30); add(506, 500, 54, 30);
      add(105, 260, 100, 26); add(755, 260, 100, 26);
      add(365, 355, 80, 26); add(515, 355, 80, 26);
    } else if (levelIndex === 2) {
      add(90, 240, 140, 30); add(730, 240, 140, 30);
      add(275, 352, 30, 120, "steel"); add(655, 352, 30, 120, "steel");
      add(390, 420, 180, 28);
      add(400, 510, 54, 28, "steel"); add(506, 510, 54, 28, "steel");
      add(105, 145, 110, 26, "steel"); add(745, 145, 110, 26, "steel");
      add(125, 330, 80, 26); add(755, 330, 80, 26);
      add(370, 330, 70, 24); add(520, 330, 70, 24);
    } else if (levelIndex === 3) {
      add(80, 145, 190, 28, "steel"); add(690, 145, 190, 28, "steel");
      add(235, 220, 28, 170); add(697, 220, 28, 170);
      add(350, 220, 110, 28); add(500, 220, 110, 28);
      add(350, 365, 110, 28); add(500, 365, 110, 28);
      add(410, 485, 140, 28, "steel");
      add(86, 300, 105, 26); add(769, 300, 105, 26);
      add(110, 438, 120, 28, "steel"); add(730, 438, 120, 28, "steel");
      add(315, 120, 70, 24); add(575, 120, 70, 24);
      add(315, 455, 70, 24); add(575, 455, 70, 24);
    } else if (levelIndex === 4) {
      add(75, 170, 175, 28); add(710, 170, 175, 28);
      add(310, 145, 28, 130, "steel"); add(622, 145, 28, 130, "steel");
      add(365, 300, 230, 28);
      add(150, 390, 155, 28, "steel"); add(655, 390, 155, 28, "steel");
      add(365, 455, 90, 28); add(505, 455, 90, 28);
      add(72, 270, 105, 26, "steel"); add(783, 270, 105, 26, "steel");
      add(220, 245, 78, 26); add(662, 245, 78, 26);
      add(220, 490, 110, 26); add(630, 490, 110, 26);
      add(365, 115, 90, 24, "steel"); add(505, 115, 90, 24, "steel");
    } else {
      add(70, 150, 180, 30, "steel"); add(710, 150, 180, 30, "steel");
      add(260, 175, 30, 145); add(670, 175, 30, 145);
      add(345, 265, 90, 30); add(525, 265, 90, 30);
      add(345, 375, 90, 30); add(525, 375, 90, 30);
      add(260, 440, 30, 80, "steel"); add(670, 440, 30, 80, "steel");
      add(405, 485, 150, 28);
      add(72, 245, 112, 28); add(776, 245, 112, 28);
      add(118, 350, 130, 26, "steel"); add(712, 350, 130, 26, "steel");
      add(315, 130, 70, 26); add(575, 130, 70, 26);
      add(315, 445, 70, 26, "steel"); add(575, 445, 70, 26, "steel");
      add(92, 500, 110, 26); add(758, 500, 110, 26);
    }
    return map;
  }

  function buildLSHSignatureLayout(add) {
    const x = 320;
    const y = 178;
    const stroke = 20;
    const height = 144;
    const letterWidth = 86;
    // L
    add(x, y, stroke, height);
    add(x, y + height - stroke, letterWidth, stroke);
    // S
    const s = x + 120;
    add(s, y, letterWidth, stroke);
    add(s, y, stroke, 72);
    add(s, y + 62, letterWidth, stroke);
    add(s + letterWidth - stroke, y + 62, stroke, 82);
    add(s, y + height - stroke, letterWidth, stroke);
    // H
    const h = x + 240;
    add(h, y, stroke, height);
    add(h + letterWidth - stroke, y, stroke, height);
    add(h, y + 62, letterWidth, stroke);
  }

  function beginWave() {
    const level = LEVELS[game.level];
    if (game.waveIndex >= level.waves.length) return;
    const wave = level.waves[game.waveIndex];
    game.spawnQueue = [...wave];
    game.spawnTimer = .25;
    game.waitingNextWave = false;
    showToast(wave.includes("boss") ? "⚠ 泰坦信号锁定" : `敌方波次 ${game.waveIndex + 1} / ${level.waves.length}`);
  }

  function spawnEnemy(typeName) {
    const config = ENEMY_TYPES[typeName];
    const isBoss = typeName === "boss";
    let x = isBoss ? W / 2 : random(70, W - 70);
    for (let tries = 0; tries < 12; tries += 1) {
      x = isBoss ? W / 2 : random(65, W - 65);
      const probe = { x: x - config.size / 2, y: 28, w: config.size, h: config.size };
      if (!enemies.some((enemy) => overlaps(probe, rectOf(enemy)))) break;
    }
    const difficulty = DIFFICULTY[game.difficulty];
    const stageScale = isBoss ? 1 + game.level * 0.14 : 1 + Math.max(0, game.level - 1) * 0.035;
    const stageTempo = 1 + game.level * 0.035;
    const hp = Math.round(config.hp * difficulty.enemyHp * stageScale);
    enemies.push({
      type: typeName,
      x,
      y: isBoss ? 90 : 36,
      w: config.size,
      h: config.size,
      hp,
      maxHp: hp,
      speed: config.speed * stageTempo,
      dir: { x: 0, y: 1 },
      moveTimer: random(.5, 1.6),
      fireTimer: random(.55, 1.45) / stageTempo,
      phaseTimer: 0,
      hitFlash: 0,
      dead: false,
      strafe: chance(.5) ? 1 : -1,
    });
  }

  // ------------------------------------------------------------------------
  // 游戏更新
  // ------------------------------------------------------------------------
  function update(dt) {
    game.elapsed += dt;
    game.shake = Math.max(0, game.shake - dt * 18);
    game.flash = Math.max(0, game.flash - dt * 3);
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) ui.toast.classList.remove("show");
    }

    updatePlayers(dt);
    updateWaves(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateStars(dt);

    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
    updateHud();
  }

  function updatePlayers(dt) {
    updatePlayerUnit(player, dt, false);
    if (playerTwo) updatePlayerUnit(playerTwo, dt, true);
    const activePlayers = [player, playerTwo].filter((unit) => unit && !unit.downed);
    [player, playerTwo].forEach((unit) => {
      if (!unit || !unit.downed) return;
      const rescuer = activePlayers.find((other) => other !== unit && distance(unit, other) < 78);
      if (rescuer) unit.reviveTimer -= dt;
      else unit.reviveTimer = Math.min(5, unit.reviveTimer + dt * .35);
      if (unit.reviveTimer <= 0) {
        unit.downed = false;
        unit.hp = 42;
        unit.invulnerable = 1.4;
        showToast(unit === player ? "一号坦克已救援" : "二号坦克已救援");
        burst(unit.x, unit.y, unit.tint, 26, 180);
      }
    });
    game.linkActive = Boolean(playerTwo && !player.downed && !playerTwo.downed && distance(player, playerTwo) < 150);
  }

  function updatePlayerUnit(unit, dt, isSecond) {
    if (!unit) return;
    unit.cooldown = Math.max(0, unit.cooldown - dt);
    unit.invulnerable = Math.max(0, unit.invulnerable - dt);
    unit.overdrive = Math.max(0, unit.overdrive - dt);
    if (unit.downed) return;

    let dx = 0;
    let dy = 0;
    const controls = unit.controls;
    // PC：单人模式同时支持 WASD 和方向键；双人模式保持 P1=WASD、P2=方向键。
    // 移动端：屏幕方向键始终控制当前主坦克 P1。
    const soloArrowUp = !isSecond && game.mode === "solo" && keys.ArrowUp;
    const soloArrowDown = !isSecond && game.mode === "solo" && keys.ArrowDown;
    const soloArrowLeft = !isSecond && game.mode === "solo" && keys.ArrowLeft;
    const soloArrowRight = !isSecond && game.mode === "solo" && keys.ArrowRight;
    if (keys[controls.up] || soloArrowUp || (!isSecond && touchMove.up)) dy -= 1;
    if (keys[controls.down] || soloArrowDown || (!isSecond && touchMove.down)) dy += 1;
    if (keys[controls.left] || soloArrowLeft || (!isSecond && touchMove.left)) dx -= 1;
    if (keys[controls.right] || soloArrowRight || (!isSecond && touchMove.right)) dx += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      // 炮口对齐主要移动轴，保持经典四方向操作感。
      if (Math.abs(dx) > Math.abs(dy)) unit.dir = { x: Math.sign(dx), y: 0 };
      else unit.dir = { x: 0, y: Math.sign(dy) };
      moveTank(unit, dx * unit.speed * dt, dy * unit.speed * dt, true);
      if (chance(dt * 14)) createTrail(unit.x - unit.dir.x * 15, unit.y - unit.dir.y * 15, unit.tint);
    }

    const firing = isSecond ? (keys[unit.controls.fire] || keys.Enter) : (keys[unit.controls.fire] || keys.j || pointer.firing);
    if (firing) shootPlayer(unit);
  }

  function moveTank(tank, dx, dy, isPlayer = false) {
    const oldX = tank.x;
    const oldY = tank.y;
    tank.x += dx;
    tank.x = clamp(tank.x, tank.w / 2 + 5, W - tank.w / 2 - 5);
    if (blocked(tank, isPlayer)) tank.x = oldX;
    tank.y += dy;
    tank.y = clamp(tank.y, tank.h / 2 + 5, H - tank.h / 2 - 5);
    if (blocked(tank, isPlayer)) tank.y = oldY;
  }

  function blocked(tank, isPlayer) {
    const rect = rectOf(tank, 3);
    if (obstacles.some((wall) => overlaps(rect, wall))) return true;
    if (core && overlaps(rect, rectOf(core, 2))) return true;
    const otherTanks = isPlayer
      ? [...enemies, player, playerTwo].filter((other) => other && other !== tank)
      : [player, playerTwo, ...enemies.filter((enemy) => enemy !== tank)];
    return otherTanks.some((other) => other && !other.dead && overlaps(rect, rectOf(other, 5)));
  }

  function shootPlayer(shooter = player) {
    if (!shooter || shooter.downed || game.state !== "playing" || shooter.cooldown > 0) return;
    const cooldownMultiplier = (shooter.overdrive > 0 ? .48 : 1) * (game.linkActive ? .82 : 1);
    shooter.cooldown = CONFIG.shotCooldown * cooldownMultiplier;
    const baseAngle = Math.atan2(shooter.dir.y, shooter.dir.x);
    const pattern = shooter.weapon === 1 ? [0] : shooter.weapon === 2 ? [-.075, .075] : [-.18, 0, .18];
    pattern.forEach((offset, index) => {
      const vector = angleVector(baseAngle + offset);
      const side = pattern.length === 2 ? (index ? 7 : -7) : 0;
      bullets.push({
        x: shooter.x + vector.x * 27 + -vector.y * side,
        y: shooter.y + vector.y * 27 + vector.x * side,
        vx: vector.x * CONFIG.playerBulletSpeed,
        vy: vector.y * CONFIG.playerBulletSpeed,
        r: shooter.weapon === 3 && offset === 0 ? 4.5 : 3.5,
        owner: shooter === playerTwo ? "player2" : "player1",
        damage: shooter.overdrive > 0 ? 22 : 18,
        color: shooter.overdrive > 0 ? "#baff49" : shooter.tint,
        life: 1.8,
      });
    });
    burst(shooter.x + shooter.dir.x * 25, shooter.y + shooter.dir.y * 25, shooter.tint, 4, 80);
    playSound("shoot");
  }

  function updateWaves(dt) {
    if (game.spawnQueue.length) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnEnemy(game.spawnQueue.shift());
        game.spawnTimer = .48;
      }
      return;
    }
    if (enemies.length === 0 && !game.waitingNextWave) {
      if (game.waveIndex < LEVELS[game.level].waves.length - 1 && pickups.length < 4) {
        const rewardSpots = [{ x: W * .25, y: H * .42 }, { x: W * .5, y: H * .36 }, { x: W * .75, y: H * .42 }];
        const reward = rewardSpots[game.waveIndex % rewardSpots.length];
        spawnPickup(reward.x, reward.y);
        showToast("补给已投放 · 前往拾取", 1.5);
      }
      game.waveIndex += 1;
      if (game.waveIndex >= LEVELS[game.level].waves.length) {
        finishLevel(true);
      } else {
        game.waitingNextWave = true;
        game.spawnTimer = 1.8;
      }
    }
    if (game.waitingNextWave) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) beginWave();
    }
  }

  function updateEnemies(dt) {
    enemies.forEach((enemy) => {
      if (enemy.dead) return;
      enemy.fireTimer -= dt;
      enemy.moveTimer -= dt;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 8);
      enemy.phaseTimer += dt;

      if (enemy.type === "boss") updateBoss(enemy, dt);
      else updateNormalEnemy(enemy, dt);
    });
    enemies = enemies.filter((enemy) => !enemy.dead);
  }

  function updateNormalEnemy(enemy, dt) {
    const target = getClosestActivePlayer(enemy) || player;
    const toPlayer = { x: target.x - enemy.x, y: target.y - enemy.y };
    const length = Math.hypot(toPlayer.x, toPlayer.y) || 1;
    const tracking = enemy.type === "gunner" || chance(.35);

    if (enemy.moveTimer <= 0) {
      if (tracking) {
        if (Math.abs(toPlayer.x) > Math.abs(toPlayer.y)) enemy.dir = { x: Math.sign(toPlayer.x), y: 0 };
        else enemy.dir = { x: 0, y: Math.sign(toPlayer.y) };
      } else {
        enemy.dir = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }][Math.floor(Math.random() * 4)];
      }
      enemy.moveTimer = random(.7, 1.8);
    }

    const oldX = enemy.x;
    const oldY = enemy.y;
    moveTank(enemy, enemy.dir.x * enemy.speed * dt, enemy.dir.y * enemy.speed * dt);
    if (Math.abs(enemy.x - oldX) < .1 && Math.abs(enemy.y - oldY) < .1) enemy.moveTimer = 0;
    const contactTarget = [player, playerTwo].find((unit) => unit && !unit.downed && overlaps(rectOf(enemy, 2), rectOf(unit, 4)));
    if (contactTarget) damagePlayer(contactTarget, CONFIG.enemyContactDamage * DIFFICULTY[game.difficulty].enemyDamage * (1 + game.level * .04) * dt * 3);

    if (enemy.fireTimer <= 0) {
      // 炮口在开火瞬间锁定玩家的主要方向。
      if (Math.abs(toPlayer.x) > Math.abs(toPlayer.y)) enemy.dir = { x: Math.sign(toPlayer.x), y: 0 };
      else enemy.dir = { x: 0, y: Math.sign(toPlayer.y) };
      shootEnemy(enemy);
      enemy.fireTimer = ENEMY_TYPES[enemy.type].fire * DIFFICULTY[game.difficulty].enemyFire * random(.8, 1.22) / (1 + game.level * .035);
    }
  }

  function updateBoss(enemy, dt) {
    const hpRatio = enemy.hp / enemy.maxHp;
    const targetY = hpRatio > .5 ? 115 : 145;
    const dx = enemy.strafe * enemy.speed * (hpRatio < .35 ? 1.55 : 1) * dt;
    moveTank(enemy, dx, (targetY - enemy.y) * dt * 1.4);
    const contactTarget = [player, playerTwo].find((unit) => unit && !unit.downed && overlaps(rectOf(enemy, 4), rectOf(unit, 5)));
    if (contactTarget) damagePlayer(contactTarget, 24 * DIFFICULTY[game.difficulty].enemyDamage * (1 + game.level * .05) * dt * 2);
    if (enemy.x < 115 || enemy.x > W - 115) enemy.strafe *= -1;

    if (enemy.fireTimer <= 0) {
      if (hpRatio > .68) bossFan(enemy, 5, .2);
      else if (hpRatio > .32) {
        bossFan(enemy, 7, .24);
        if (Math.floor(enemy.phaseTimer * 2) % 2 === 0) bossRadial(enemy, 10);
      } else {
        bossFan(enemy, 9, .29);
        bossRadial(enemy, 14);
      }
      enemy.fireTimer = ENEMY_TYPES.boss.fire * DIFFICULTY[game.difficulty].enemyFire * (hpRatio < .32 ? .63 : hpRatio < .68 ? .8 : 1) / (1 + game.level * .035);
      playSound("enemyShoot");
    }
  }

  function shootEnemy(enemy) {
    const config = ENEMY_TYPES[enemy.type];
    bullets.push({
      x: enemy.x + enemy.dir.x * (enemy.w / 2 + 8),
      y: enemy.y + enemy.dir.y * (enemy.h / 2 + 8),
      vx: enemy.dir.x * CONFIG.enemyBulletSpeed,
      vy: enemy.dir.y * CONFIG.enemyBulletSpeed,
      r: enemy.type === "heavy" ? 5 : 4,
      owner: "enemy",
      damage: config.damage * DIFFICULTY[game.difficulty].enemyDamage * (1 + game.level * .04),
      color: config.color,
      life: 4.2,
    });
    playSound("enemyShoot");
  }

  function bossFan(enemy, count, spread) {
    const target = getClosestActivePlayer(enemy) || player;
    const aim = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    for (let i = 0; i < count; i += 1) {
      const angle = aim + (i - (count - 1) / 2) * spread;
      createEnemyBullet(enemy.x, enemy.y + 35, angle, CONFIG.enemyBulletSpeed * .9, 13, "#ff4d68", 5);
    }
  }

  function bossRadial(enemy, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + enemy.phaseTimer * .55;
      createEnemyBullet(enemy.x, enemy.y, angle, CONFIG.enemyBulletSpeed * .68, 10, "#ffb454", 4);
    }
  }

  function createEnemyBullet(x, y, angle, speed, damage, color, radius) {
    const vector = angleVector(angle);
    bullets.push({ x, y, vx: vector.x * speed, vy: vector.y * speed, r: radius, owner: "enemy", damage: damage * DIFFICULTY[game.difficulty].enemyDamage * (1 + game.level * .04), color, life: 5 });
  }

  function updateBullets(dt) {
    bullets.forEach((bullet) => {
      if (bullet.dead) return;
      bullet.life -= dt;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.life <= 0 || bullet.x < -20 || bullet.x > W + 20 || bullet.y < -20 || bullet.y > H + 20) {
        bullet.dead = true;
        return;
      }

      // 墙体碰撞
      for (const wall of obstacles) {
        if (!bullet.dead && circleRect(bullet, wall)) {
          bullet.dead = true;
          if (wall.type === "brick") {
            wall.hp -= 1;
            burst(bullet.x, bullet.y, "#f0a35a", 9, 130);
          } else {
            burst(bullet.x, bullet.y, "#8eeaff", 5, 90);
          }
          playSound("hit");
        }
      }

      if (bullet.dead) return;
      if (bullet.owner === "player1" || bullet.owner === "player2") {
        for (const enemy of enemies) {
          if (!enemy.dead && circleRect(bullet, rectOf(enemy, 2))) {
            damageEnemy(enemy, bullet.damage);
            bullet.dead = true;
            break;
          }
        }
      } else {
        const hitPlayer = [player, playerTwo].find((unit) => unit && !unit.downed && circleRect(bullet, rectOf(unit, 3)));
        if (hitPlayer) {
          damagePlayer(hitPlayer, bullet.damage);
          bullet.dead = true;
        } else if (core && circleRect(bullet, rectOf(core))) {
          core.hp -= bullet.damage * .78;
          bullet.dead = true;
          game.shake = Math.max(game.shake, 5);
          burst(bullet.x, bullet.y, "#ff4d68", 12, 150);
          if (core.hp <= 0) finishLevel(false, "量子核心已被摧毁");
        }
      }
    });

    // 玩家与敌方炮弹互相抵消。
    const playerBullets = bullets.filter((bullet) => !bullet.dead && (bullet.owner === "player1" || bullet.owner === "player2"));
    const enemyBullets = bullets.filter((bullet) => !bullet.dead && bullet.owner === "enemy");
    playerBullets.forEach((friendly) => {
      enemyBullets.forEach((hostile) => {
        if (!friendly.dead && !hostile.dead && distance(friendly, hostile) < friendly.r + hostile.r + 2) {
          friendly.dead = true;
          hostile.dead = true;
          burst(friendly.x, friendly.y, "#dffcff", 5, 90);
        }
      });
    });

    bullets = bullets.filter((bullet) => !bullet.dead);
    obstacles = obstacles.filter((wall) => wall.hp > 0);
  }

  function damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    enemy.hitFlash = 1;
    burst(enemy.x, enemy.y, ENEMY_TYPES[enemy.type].color, enemy.type === "boss" ? 7 : 4, 95);
    playSound("hit");
    if (enemy.hp > 0) return;

    enemy.dead = true;
    const config = ENEMY_TYPES[enemy.type];
    game.combo += 1;
    game.comboTimer = CONFIG.comboWindow;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    const multiplier = 1 + Math.min(game.combo - 1, 9) * .1;
    game.score += Math.round(config.score * multiplier);
    game.coins += Math.max(1, Math.round(config.score / 100));
    game.lifetimeKills += 1;
    saveMeta();
    game.kills += 1;
    game.shake = enemy.type === "boss" ? 18 : 7;
    burst(enemy.x, enemy.y, config.color, enemy.type === "boss" ? 80 : 24, enemy.type === "boss" ? 320 : 210);
    playSound("explode");
    if (enemy.type === "boss") spawnPickup(enemy.x, enemy.y);
    else if (chance(CONFIG.dropChance)) spawnPickup(enemy.x, enemy.y);
    if (enemy.type === "boss") {
      game.flash = 1;
      showToast("TITAN UNIT DESTROYED", 2.2);
    }
  }

  function getClosestActivePlayer(source) {
    return [player, playerTwo]
      .filter((unit) => unit && !unit.downed)
      .sort((a, b) => distance(source, a) - distance(source, b))[0] || null;
  }

  function damagePlayer(target, amount) {
    if (!target || target.downed || target.invulnerable > 0) return;
    if (target.shield > 0) {
      target.shield -= 1;
      target.invulnerable = .5;
      showToast("护盾吸收伤害");
      burst(target.x, target.y, target.tint, 18, 180);
      playSound("hit");
      return;
    }
    target.hp -= amount;
    target.invulnerable = CONFIG.invulnerableTime;
    game.shake = 10;
    burst(target.x, target.y, "#ff4d68", 20, 220);
    playSound("hurt");
    if (target.hp <= 0) {
      target.hp = 0;
      target.downed = true;
      target.reviveTimer = 5;
      showToast(target === player ? "一号坦克失去行动能力 · 靠近救援" : "二号坦克失去行动能力 · 靠近救援", 2.2);
      if (![player, playerTwo].some((unit) => unit && !unit.downed)) finishLevel(false, "两台坦克均失去行动能力");
    }
  }

  function spawnPickup(x, y) {
    if (pickups.length >= 5) return;
    const roll = Math.random();
    const type = roll < .34 ? "weapon" : roll < .58 ? "shield" : roll < .8 ? "heal" : "overdrive";
    pickups.push({ x, y, w: 26, h: 26, type, life: 14, pulse: 0 });
  }

  function updatePickups(dt) {
    pickups.forEach((pickup) => {
      pickup.life -= dt;
      pickup.pulse += dt;
      const collector = [player, playerTwo].find((unit) => unit && !unit.downed && overlaps(rectOf(unit, 2), rectOf(pickup)));
      if (collector) {
        pickup.life = 0;
        if (pickup.type === "weapon") collector.weapon = clamp(collector.weapon + 1, 1, 3);
        if (pickup.type === "shield") collector.shield = clamp(collector.shield + (game.upgrades.shield ? 2 : 1), 0, 3);
        if (pickup.type === "heal") collector.hp = clamp(collector.hp + 28, 0, collector.maxHp);
        if (pickup.type === "overdrive") collector.overdrive = 9;
        const names = { weapon: "火力模块升级", shield: "离子护盾 +1", heal: "装甲修复 +28", overdrive: "武器超频 9 秒" };
        showToast(names[pickup.type]);
        playSound("pickup");
      }
    });
    pickups = pickups.filter((pickup) => pickup.life > 0);
  }

  function finishLevel(won, reason = "区域内敌方单位已全部清除") {
    if (game.state !== "playing") return;
    game.state = "result";
    clearInput();
    if (won) { game.victories += 1; game.coins += 25 + game.level * 8; saveMeta(); }
    if ((!won || game.level === LEVELS.length - 1) && !game.matchRecorded) {
      saveRanking(won);
      game.matchRecorded = true;
    }
    document.getElementById("resultEyebrow").textContent = won ? "MISSION COMPLETE" : "MISSION FAILED";
    document.getElementById("resultTitle").textContent = won ? (game.level === LEVELS.length - 1 ? "泰坦已击破" : "区域已净化") : "作战失败";
    document.getElementById("resultMessage").textContent = reason;
    document.getElementById("resultScore").textContent = game.score.toLocaleString("zh-CN");
    document.getElementById("resultKills").textContent = game.kills;
    document.getElementById("resultCombo").textContent = `${game.maxCombo}×`;
    ui.nextButton.style.display = won ? "flex" : "none";
    ui.nextButton.querySelector("span").textContent = game.level === LEVELS.length - 1 ? "重新开始战役" : "进入下一阶段";
    setOverlay("result");
    playSound(won ? "win" : "hurt");
  }

  function updateHud() {
    if (!player) return;
    const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
    ui.healthText.textContent = player.downed ? "DOWNED" : `${Math.ceil(Math.max(0, player.hp))} / ${player.maxHp}`;
    ui.healthBar.style.width = `${hpRatio * 100}%`;
    ui.healthBar.style.background = hpRatio < .3 ? "linear-gradient(90deg,#d52749,#ff667e)" : "";
    if (playerTwo && ui.playerTwoHud) {
      ui.playerTwoHud.style.display = "block";
      const hp2Ratio = clamp(playerTwo.hp / playerTwo.maxHp, 0, 1);
      ui.health2Text.textContent = playerTwo.downed ? `救援 ${Math.ceil(playerTwo.reviveTimer)}s` : `${Math.ceil(Math.max(0, playerTwo.hp))} / ${playerTwo.maxHp}`;
      ui.health2Bar.style.width = `${hp2Ratio * 100}%`;
      ui.health2Bar.style.background = hp2Ratio < .3 ? "linear-gradient(90deg,#d56f27,#ff8c45)" : "";
    } else if (ui.playerTwoHud) {
      ui.playerTwoHud.style.display = "none";
    }
    ui.scoreText.textContent = String(game.score).padStart(6, "0");
    ui.levelText.textContent = String(game.level + 1).padStart(2, "0");
    const pending = game.spawnQueue.length + LEVELS[game.level].waves.slice(game.waveIndex + (game.waitingNextWave ? 0 : 1)).flat().length;
    ui.enemyText.textContent = String(enemies.length + pending).padStart(2, "0");
    const cooldownMax = CONFIG.shotCooldown * (player.overdrive > 0 ? .48 : 1) * (game.linkActive ? .82 : 1);
    const readyRatio = 1 - clamp(player.cooldown / cooldownMax, 0, 1);
    ui.cooldownBar.style.width = `${readyRatio * 100}%`;
    ui.cooldownText.textContent = player.cooldown <= 0 ? "READY" : "CHARGE";
    ui.weaponText.textContent = `${modelLabel(player.model)} · ${["I", "II", "III"][player.weapon - 1]}`;
    const powers = [];
    if (player.weapon > 1) powers.push(`火力 ${["I", "II", "III"][player.weapon - 1]}`);
    if (player.shield) powers.push(`护盾 ${player.shield}`);
    if (player.overdrive > 0) powers.push(`超频 ${Math.ceil(player.overdrive)}s`);
    ui.powerText.textContent = `模块：${powers.length ? powers.join(" · ") : "标准配置"}${playerTwo ? game.linkActive ? " · 阵型加速" : " · 双人链路" : ""}`;

    const boss = enemies.find((enemy) => enemy.type === "boss");
    ui.bossHud.classList.toggle("hidden", !boss);
    if (boss) {
      const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
      ui.bossHealthText.textContent = `${Math.ceil(ratio * 100)}%`;
      ui.bossHealthBar.style.width = `${ratio * 100}%`;
    }
  }

  // ------------------------------------------------------------------------
  // 粒子
  // ------------------------------------------------------------------------
  function burst(x, y, color, count = 12, speed = 150) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = random(speed * .25, speed);
      particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: random(1.5, 4.5),
        life: random(.25, .8),
        maxLife: .8,
        color,
      });
    }
  }

  function createTrail(x, y, color) {
    particles.push({ x: x + random(-5, 5), y: y + random(-5, 5), vx: random(-15, 15), vy: random(-15, 15), size: random(1, 2.5), life: .25, maxLife: .25, color });
  }

  function updateParticles(dt) {
    particles.forEach((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= .96;
      particle.vy *= .96;
    });
    particles = particles.filter((particle) => particle.life > 0);
  }

  function updateStars(dt) {
    stars.forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > H) { star.y = 0; star.x = Math.random() * W; }
    });
  }

  // ------------------------------------------------------------------------
  // 绘制
  // ------------------------------------------------------------------------
  function render() {
    ctx.save();
    const shakeX = game.shake > 0 ? random(-game.shake, game.shake) : 0;
    const shakeY = game.shake > 0 ? random(-game.shake, game.shake) : 0;
    ctx.translate(shakeX, shakeY);
    drawArena();
    drawCore();
    obstacles.forEach(drawWall);
    pickups.forEach(drawPickup);
    enemies.forEach(drawEnemy);
    drawCoopLink();
    if (player) drawPlayer(player, "P1");
    if (playerTwo) drawPlayer(playerTwo, "P2");
    bullets.forEach(drawBullet);
    particles.forEach(drawParticle);
    drawRadarMarks();
    ctx.restore();

    if (game.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${game.flash * .65})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawArena() {
    const theme = ARENA_THEMES[game.level] || ARENA_THEMES[0];
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, theme.top);
    gradient.addColorStop(.58, theme.mid);
    gradient.addColorStop(1, theme.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    if (theme.id === "campus") drawCampusBackground();
    drawArenaTheme(theme);

    stars.forEach((star) => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = theme.accent;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.strokeStyle = "rgba(85,244,255,.12)";
    ctx.setLineDash([5, 12]);
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.setLineDash([]);

    // 直接绘制在游戏画布上的原创署名，与 LSH 障碍物布局相互印证。
    ctx.fillStyle = "rgba(85,244,255,.58)";
    ctx.font = "600 10px Arial Narrow, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`ORIGINAL MAP // ${AUTHOR_MARK}`, 32, 42);
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = .78;
    ctx.textAlign = "right";
    ctx.fillText(theme.label, W - 32, 42);
    ctx.globalAlpha = 1;
  }

  function drawArenaTheme(theme) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    if (theme.id === "campus") {
      ctx.strokeStyle = "rgba(85,244,255,.11)";
      ctx.lineWidth = 2;
      for (let i = -2; i < 8; i += 1) {
        ctx.beginPath(); ctx.moveTo(i * 180, H); ctx.lineTo(i * 180 + 260, 0); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(186,255,73,.14)";
      ctx.beginPath(); ctx.arc(W / 2, H * .56, 185, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H * .56, 245, 0, Math.PI * 2); ctx.stroke();
    } else if (theme.id === "forge") {
      const furnace = ctx.createLinearGradient(0, 0, 0, H);
      furnace.addColorStop(0, "rgba(255,95,44,.24)"); furnace.addColorStop(.5, "rgba(255,159,67,.03)"); furnace.addColorStop(1, "rgba(255,77,104,.15)");
      ctx.fillStyle = furnace; ctx.fillRect(32, 55, W - 64, H - 90);
      ctx.fillStyle = "rgba(255,159,67,.16)";
      for (let x = 54; x < W - 40; x += 96) ctx.fillRect(x, 70, 24, H - 130);
      ctx.strokeStyle = "rgba(255,180,84,.48)"; ctx.lineWidth = 3;
      for (let y = 115; y < H - 100; y += 90) { ctx.beginPath(); ctx.moveTo(38, y); ctx.lineTo(W - 38, y); ctx.stroke(); }
      ctx.fillStyle = "rgba(255,77,104,.75)";
      for (let x = 80; x < W - 60; x += 145) { ctx.beginPath(); ctx.arc(x, 82, 4, 0, Math.PI * 2); ctx.fill(); }
    } else if (theme.id === "bridge") {
      ctx.fillStyle = "rgba(184,121,255,.10)";
      ctx.beginPath(); ctx.moveTo(80, H); ctx.lineTo(250, 0); ctx.lineTo(420, 0); ctx.lineTo(250, H); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(710, H); ctx.lineTo(540, 0); ctx.lineTo(710, 0); ctx.lineTo(880, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(184,121,255,.48)"; ctx.lineWidth = 2;
      for (let y = 78; y < H; y += 56) { ctx.beginPath(); ctx.moveTo(72, y); ctx.lineTo(W - 72, y); ctx.stroke(); }
      ctx.strokeStyle = "rgba(85,244,255,.62)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(120, H); ctx.lineTo(360, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 120, H); ctx.lineTo(W - 360, 0); ctx.stroke();
      ctx.fillStyle = "rgba(85,244,255,.5)";
      for (let x = 125; x < W - 100; x += 104) ctx.fillRect(x, 92 + (x % 3) * 20, 18, 4);
    } else if (theme.id === "frost") {
      ctx.fillStyle = "rgba(139,233,255,.08)";
      for (let x = 42; x < W; x += 148) {
        ctx.beginPath(); ctx.roundRect(x, 62, 88, 520, 16); ctx.fill();
        ctx.strokeStyle = "rgba(139,233,255,.28)"; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.strokeStyle = "rgba(224,255,255,.42)"; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i += 1) {
        ctx.beginPath(); ctx.moveTo(50 + i * 125, 0); ctx.lineTo(130 + i * 125, H); ctx.stroke();
      }
      ctx.fillStyle = "rgba(224,255,255,.28)";
      for (let i = 0; i < 18; i += 1) { const x = (i * 137) % W; const y = 80 + ((i * 83) % 450); ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    } else if (theme.id === "harbor") {
      ctx.fillStyle = "rgba(18,90,120,.25)";
      for (let y = 82; y < H; y += 54) { ctx.fillRect(0, y, W, 22); }
      ctx.strokeStyle = "rgba(85,244,255,.28)"; ctx.lineWidth = 2;
      for (let y = 94; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(230, y - 15, 420, y + 15, W, y); ctx.stroke(); }
      ctx.fillStyle = "rgba(255,180,84,.2)";
      [[70,110,150,64],[740,120,150,58],[110,468,180,52],[670,490,180,50]].forEach(([x,y,w,h]) => { ctx.fillRect(x,y,w,h); ctx.strokeStyle = "rgba(255,180,84,.48)"; ctx.strokeRect(x,y,w,h); });
      ctx.strokeStyle = "rgba(255,180,84,.58)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(82, 92); ctx.lineTo(82, 390); ctx.lineTo(270, 390); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(878, 92); ctx.lineTo(878, 390); ctx.lineTo(690, 390); ctx.stroke();
    } else if (theme.id === "rift") {
      const rift = ctx.createRadialGradient(W / 2, H * .52, 20, W / 2, H * .52, 440);
      rift.addColorStop(0, "rgba(255,77,104,.26)"); rift.addColorStop(.34, "rgba(255,77,104,.08)"); rift.addColorStop(1, "rgba(255,77,104,0)");
      ctx.fillStyle = rift; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,77,104,.55)"; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i += 1) { ctx.beginPath(); ctx.ellipse(W / 2, H * .55, 100 + i * 72, 42 + i * 25, -.16, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = "rgba(255,180,84,.58)"; ctx.lineWidth = 2;
      [[90,210,260,100],[700,190,190,130],[230,500,220,78],[600,460,260,100]].forEach(([x,y,w,h]) => { ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w*.25,y+h*.35); ctx.lineTo(x+w*.52,y+h*.08); ctx.lineTo(x+w*.78,y+h*.7); ctx.lineTo(x+w,y+h*.4); ctx.stroke(); });
      ctx.fillStyle = "rgba(255,77,104,.75)";
      for (let i = 0; i < 22; i += 1) { const x = (i * 91) % W; const y = 72 + ((i * 47) % 500); ctx.fillRect(x, y, 3 + (i % 3), 3 + (i % 2)); }
    }
    ctx.restore();
  }

  function drawCampusBackground() {
    if (!campusBackgroundReady || !campusBackground) return;
    // cover 裁切：始终铺满 960×640 战场，同时保持图片原始比例。
    const scale = Math.max(W / campusBackground.width, H / campusBackground.height);
    const drawWidth = campusBackground.width * scale;
    const drawHeight = campusBackground.height * scale;
    const offsetX = (W - drawWidth) / 2;
    const offsetY = (H - drawHeight) / 2;
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.filter = "saturate(.82) contrast(1.08)";
    ctx.drawImage(campusBackground, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
    // 深色蒙层保证坦克、炮弹、砖墙和地图签名始终清晰。
    ctx.fillStyle = "rgba(3, 8, 14, .40)";
    ctx.fillRect(0, 0, W, H);
  }

  function directionAngle(dir) { return Math.atan2(dir.y, dir.x) + Math.PI / 2; }

  function drawVehicleBody(entity, color) {
    const model = entity.model;
    const w = entity.w; const h = entity.h;
    if (model === "avatarHat" || model === "avatarSpider" || model === "customPhoto") {
      const image = model === "customPhoto" ? customPhotoCutout : avatarCutouts[model] || avatarImages[model];
      if (image) {
        const scale = Math.min((w * 1.7) / image.width, (h * 1.7) / image.height);
        ctx.save();
        ctx.shadowBlur = 15; ctx.shadowColor = color;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(w, h) * .57, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
        ctx.restore();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = color;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(w, h) * .57, 0, Math.PI * 2); ctx.stroke();
      }
      return;
    }
    ctx.shadowBlur = 14; ctx.shadowColor = color; ctx.fillStyle = "#08141b"; ctx.strokeStyle = color; ctx.lineWidth = 2;
    if (model === "car") {
      ctx.beginPath(); ctx.roundRect(-w * .48, -h * .48, w * .96, h * .78, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(85,244,255,.35)"; ctx.fillRect(-w * .24, -h * .37, w * .48, h * .25);
      ctx.fillStyle = "#ffb454"; ctx.fillRect(-w * .4, h * .27, 8, 4); ctx.fillRect(w * .4 - 8, h * .27, 8, 4);
      ctx.fillStyle = color; ctx.fillRect(-3, -h * .7, 6, h * .35);
    } else if (model === "motorcycle") {
      ctx.fillStyle = "#11151e"; ctx.beginPath(); ctx.arc(0, -h * .29, w * .22, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, h * .31, w * .22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -h * .26); ctx.lineTo(0, h * .28); ctx.stroke();
      ctx.lineWidth = 2; ctx.fillStyle = color; ctx.fillRect(-w * .18, -h * .08, w * .36, h * .25);
    } else {
      ctx.fillStyle = "#27131b"; ctx.fillRect(-w * .46, -h * .46, w * .92, h * .8); ctx.strokeRect(-w * .46, -h * .46, w * .92, h * .8);
      ctx.fillStyle = color; ctx.fillRect(-w * .26, -h * .58, w * .52, h * .25); ctx.fillRect(-w * .48, h * .25, 8, 6); ctx.fillRect(w * .48 - 8, h * .25, 8, 6);
      ctx.fillStyle = "#ffb454"; ctx.fillRect(-w * .24, -h * .34, w * .48, 8);
    }
    ctx.shadowBlur = 0;
  }

  function drawTankBody(entity, color, isBoss = false, playerTank = false) {
    const angle = directionAngle(entity.dir || { x: 0, y: 1 });
    const alpha = entity.invulnerable > 0 && Math.floor(entity.invulnerable * 12) % 2 === 0 ? .28 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(entity.x, entity.y);
    ctx.rotate(angle);
    const w = entity.w;
    const h = entity.h;
    if (playerTank && entity.model === "tank") {
      drawPremiumTank(entity, color);
      ctx.restore();
      return;
    }
    if (playerTank && entity.model && entity.model !== "tank") {
      drawVehicleBody(entity, color);
      ctx.restore();
      return;
    }
    ctx.shadowBlur = isBoss ? 24 : 13;
    ctx.shadowColor = color;
    ctx.fillStyle = "#061018";
    ctx.strokeStyle = color;
    ctx.lineWidth = isBoss ? 3 : 2;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.shadowBlur = 0;

    // 履带
    ctx.fillStyle = playerTank ? "#0c3844" : "#2a1520";
    ctx.fillRect(-w / 2 - 4, -h / 2 + 2, 6, h - 4);
    ctx.fillRect(w / 2 - 2, -h / 2 + 2, 6, h - 4);
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 1;
    for (let y = -h / 2 + 6; y < h / 2; y += isBoss ? 13 : 9) {
      ctx.beginPath(); ctx.moveTo(-w / 2 - 3, y); ctx.lineTo(-w / 2 + 2, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2 - 2, y); ctx.lineTo(w / 2 + 3, y); ctx.stroke();
    }

    // 炮塔与炮管
    ctx.fillStyle = color;
    ctx.fillRect(-w * .24, -h * .24, w * .48, h * .45);
    ctx.fillRect(-3.5, -h * .72, 7, h * .56);
    ctx.fillStyle = playerTank ? "#baff49" : "#fff1f3";
    ctx.fillRect(-3, -h * .05, 6, 6);
    if (isBoss) {
      ctx.strokeStyle = "rgba(255,255,255,.55)";
      ctx.strokeRect(-w * .34, -h * .34, w * .68, h * .65);
      ctx.fillStyle = color;
      ctx.fillRect(-w * .39, -h * .6, 8, h * .45);
      ctx.fillRect(w * .39 - 8, -h * .6, 8, h * .45);
    }
    ctx.restore();
  }

  // 默认座驾：更像互联网产品里的精致小坦克，而不是简单几何块。
  function drawPremiumTank(entity, color) {
    const w = entity.w;
    const h = entity.h;
    if (defaultTankCutout) {
      const scale = Math.min((w * 1.28) / defaultTankCutout.width, (h * 1.28) / defaultTankCutout.height);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      // 原图炮管朝下，旋转 180° 后与游戏默认朝向保持一致。
      ctx.rotate(Math.PI);
      ctx.shadowBlur = 13;
      ctx.shadowColor = color === "#baff49" ? "#baff49" : "#55f4ff";
      ctx.drawImage(defaultTankCutout, -defaultTankCutout.width * scale / 2, -defaultTankCutout.height * scale / 2,
        defaultTankCutout.width * scale, defaultTankCutout.height * scale);
      ctx.restore();
      return;
    }
    const cyan = color === "#baff49" ? "#baff49" : "#55f4ff";
    const bodyGradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    bodyGradient.addColorStop(0, "#1b5262");
    bodyGradient.addColorStop(.48, "#0d2735");
    bodyGradient.addColorStop(1, "#07131e");
    const glassGradient = ctx.createRadialGradient(-3, -7, 1, 2, -3, 14);
    glassGradient.addColorStop(0, "#eaffff");
    glassGradient.addColorStop(.2, "#79f7ff");
    glassGradient.addColorStop(1, "#14576c");

    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = cyan;
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.beginPath();
    ctx.ellipse(0, h * .38, w * .55, h * .18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 两条履带：用高光和分段纹理增加精致度。
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#071018";
    ctx.strokeStyle = "rgba(133,247,255,.58)";
    ctx.lineWidth = 1.5;
    [-1, 1].forEach((side) => {
      const trackX = side * (w * .39);
      ctx.beginPath();
      ctx.roundRect(trackX - 5, -h * .43, 10, h * .86, 5);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(186,255,73,.72)";
      ctx.lineWidth = 1;
      for (let y = -h * .31; y < h * .38; y += 7) {
        ctx.beginPath(); ctx.moveTo(trackX - 3, y); ctx.lineTo(trackX + 3, y + 1); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(133,247,255,.58)";
      ctx.lineWidth = 1.5;
    });

    // 圆角车体与前端装甲切面。
    ctx.shadowBlur = 14;
    ctx.shadowColor = cyan;
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-w * .43, -h * .46, w * .86, h * .86, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(186,255,73,.22)";
    ctx.beginPath();
    ctx.moveTo(-w * .28, -h * .37); ctx.lineTo(w * .28, -h * .37); ctx.lineTo(w * .18, -h * .2); ctx.lineTo(-w * .18, -h * .2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.34)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-w * .32, h * .2); ctx.lineTo(w * .32, h * .2); ctx.stroke();

    // 旋转炮塔、玻璃舱和短炮管。
    ctx.fillStyle = "#123b4a";
    ctx.strokeStyle = "#a8fbff";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -h * .08, w * .3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = glassGradient;
    ctx.strokeStyle = "rgba(224,255,255,.92)";
    ctx.beginPath(); ctx.ellipse(0, -h * .14, w * .18, h * .14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.beginPath(); ctx.ellipse(-w * .07, -h * .2, w * .055, h * .035, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#baff49";
    ctx.shadowBlur = 9; ctx.shadowColor = "#baff49";
    ctx.beginPath(); ctx.roundRect(-3, -h * .64, 6, h * .32, 3); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -h * .68, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // 前灯和尾部状态灯，让移动方向更清晰。
    ctx.fillStyle = "#efffff";
    ctx.shadowBlur = 7; ctx.shadowColor = "#efffff";
    ctx.beginPath(); ctx.arc(-w * .24, -h * .32, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w * .24, -h * .32, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,77,104,.9)";
    ctx.fillRect(-w * .2, h * .26, w * .12, 2);
    ctx.fillRect(w * .08, h * .26, w * .12, 2);
    ctx.restore();
  }

  function drawCoopLink() {
    if (!game.linkActive || !player || !playerTwo) return;
    ctx.save();
    ctx.strokeStyle = "rgba(186,255,73,.38)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(playerTwo.x, playerTwo.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawPlayer(unit, label) {
    const color = unit.downed ? "#ff4d68" : unit.overdrive > 0 ? "#baff49" : unit.tint;
    if (!unit.downed) drawTankBody(unit, color, false, true);
    if (unit.downed) {
      ctx.save();
      ctx.strokeStyle = "#ff4d68";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(unit.x, unit.y, 25, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffb2bc";
      ctx.font = "700 10px Arial Narrow, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DOWNED", unit.x, unit.y + 4);
      ctx.restore();
    }
    if (unit.shield > 0 && !unit.downed) {
      ctx.save();
      ctx.strokeStyle = `${unit.tint}${Math.round((.38 + Math.sin(game.elapsed * 6) * .16) * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = unit.tint;
      ctx.beginPath(); ctx.arc(unit.x, unit.y, 31, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = unit.downed ? "#ff4d68" : unit.tint;
    ctx.font = "700 9px Arial Narrow, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, unit.x, unit.y - unit.h / 2 - 8);
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const config = ENEMY_TYPES[enemy.type];
    const color = enemy.hitFlash > 0 ? "#ffffff" : config.color;
    drawTankBody(enemy, color, enemy.type === "boss");
    if (enemy.type !== "boss" && enemy.hp < enemy.maxHp) {
      const width = enemy.w + 6;
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.h / 2 - 10, width, 3);
      ctx.fillStyle = config.color;
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.h / 2 - 10, width * clamp(enemy.hp / enemy.maxHp, 0, 1), 3);
    }
  }

  function drawBullet(bullet) {
    ctx.save();
    ctx.strokeStyle = bullet.color;
    ctx.globalAlpha = .42;
    ctx.lineWidth = bullet.r * 1.4;
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x - bullet.vx * .035, bullet.y - bullet.vy * .035);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 14;
    ctx.shadowColor = bullet.color;
    ctx.beginPath(); ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawWall(wall) {
    ctx.save();
    if (wall.type === "brick") {
      ctx.fillStyle = wall.hp === 1 ? "#4c302b" : "#724438";
      ctx.strokeStyle = wall.hp === 1 ? "#b96b54" : "#e08a62";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(224,138,98,.25)";
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeRect(wall.x + .5, wall.y + .5, wall.w - 1, wall.h - 1);
      ctx.shadowBlur = 0;
      const brickW = 25;
      for (let y = wall.y + 10; y < wall.y + wall.h; y += 11) {
        ctx.beginPath(); ctx.moveTo(wall.x, y); ctx.lineTo(wall.x + wall.w, y); ctx.stroke();
      }
      for (let x = wall.x + brickW; x < wall.x + wall.w; x += brickW) {
        ctx.beginPath(); ctx.moveTo(x, wall.y); ctx.lineTo(x, wall.y + wall.h); ctx.stroke();
      }
      if (wall.hp === 1) {
        ctx.strokeStyle = "#251a19";
        ctx.beginPath(); ctx.moveTo(wall.x + wall.w * .45, wall.y); ctx.lineTo(wall.x + wall.w * .55, wall.y + wall.h); ctx.stroke();
      }
    } else {
      const gradient = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
      gradient.addColorStop(0, "#66818a"); gradient.addColorStop(.45, "#233741"); gradient.addColorStop(1, "#101d25");
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "#79c7d4";
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeRect(wall.x + .5, wall.y + .5, wall.w - 1, wall.h - 1);
      ctx.fillStyle = "rgba(85,244,255,.32)";
      for (let x = wall.x + 8; x < wall.x + wall.w; x += 28) ctx.fillRect(x, wall.y + 6, 3, wall.h - 12);
    }
    ctx.restore();
  }

  function drawCore() {
    if (!core) return;
    const ratio = clamp(core.hp / core.maxHp, 0, 1);
    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.fillStyle = "#06151d";
    ctx.strokeStyle = ratio < .35 ? "#ff4d68" : "#baff49";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(-42, 20); ctx.lineTo(-34, -18); ctx.lineTo(-15, -18); ctx.lineTo(-8, -30); ctx.lineTo(8, -30); ctx.lineTo(15, -18); ctx.lineTo(34, -18); ctx.lineTo(42, 20); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = ratio < .35 ? "#ff4d68" : "#baff49";
    ctx.fillRect(-5, -20, 10, 28);
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,.7)";
    ctx.fillRect(core.x - 42, core.y + 24, 84, 4);
    ctx.fillStyle = ratio < .35 ? "#ff4d68" : "#baff49";
    ctx.fillRect(core.x - 42, core.y + 24, 84 * ratio, 4);
  }

  function drawPickup(pickup) {
    const colors = { weapon: "#ffb454", shield: "#55f4ff", heal: "#baff49", overdrive: "#b879ff" };
    const labels = { weapon: "W", shield: "S", heal: "+", overdrive: "O" };
    const color = colors[pickup.type];
    const scale = 1 + Math.sin(pickup.pulse * 6) * .08;
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.scale(scale, scale);
    ctx.rotate(pickup.pulse * .7);
    ctx.fillStyle = "rgba(5,16,24,.88)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 14; ctx.shadowColor = color;
    ctx.fillRect(-13, -13, 26, 26); ctx.strokeRect(-13, -13, 26, 26);
    ctx.rotate(-pickup.pulse * .7);
    ctx.fillStyle = color;
    ctx.font = "700 13px Chakra Petch, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(labels[pickup.type], 0, 1);
    ctx.restore();
  }

  function drawParticle(particle) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = particle.color;
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    ctx.restore();
  }

  function drawRadarMarks() {
    if (game.state !== "playing" || game.combo < 2) return;
    ctx.save();
    ctx.fillStyle = "rgba(186,255,73,.85)";
    ctx.font = "700 14px Chakra Petch, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${game.combo}× COMBO`, W - 30, 38);
    ctx.restore();
  }

  // ------------------------------------------------------------------------
  // 主循环：仅 playing 状态更新物理，菜单和暂停仍保持画面渲染
  // ------------------------------------------------------------------------
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, .033);
    lastTime = now;
    if (game.state === "playing") update(dt);
    else updateStars(dt * .35);
    render();
    requestAnimationFrame(loop);
  }

  createStars();
  // 菜单背景也放置一个玩家模型，避免初始画面全空。
  player = createPlayer();
  core = { x: W / 2, y: H - 28, w: 84, h: 42, hp: 100, maxHp: 100 };
  obstacles = buildMap(0);
  updateMenuPreview(game.model);
  updateHud();
  requestAnimationFrame(loop);
})();
