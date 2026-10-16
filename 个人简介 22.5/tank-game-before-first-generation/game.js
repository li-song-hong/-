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

  const CONFIG = {
    playerSpeed: 220,
    playerBulletSpeed: 640,
    enemyBulletSpeed: 265,
    shotCooldown: 0.27,
    invulnerableTime: 1.25,
    enemyContactDamage: 18,
    baseHp: 100,
    dropChance: 0.25,
    comboWindow: 2.8,
  };

  const DIFFICULTY = {
    rookie: { enemyHp: 0.82, enemyFire: 1.25, enemyDamage: 0.75, label: "新兵" },
    normal: { enemyHp: 1, enemyFire: 1, enemyDamage: 1, label: "战士" },
    ace: { enemyHp: 1.25, enemyFire: 0.78, enemyDamage: 1.25, label: "王牌" },
  };

  // 关卡数据：普通波次结束后，第三关会投放 Boss。
  const LEVELS = [
    {
      name: "外围封锁",
      waves: [
        ["scout", "scout", "grunt", "drone"],
        ["scout", "grunt", "sniper", "grunt"],
      ],
    },
    {
      name: "熔炉走廊",
      waves: [
        ["scout", "scout", "gunner", "drone"],
        ["heavy", "grunt", "sniper", "scout"],
        ["heavy", "gunner", "drone", "grunt"],
      ],
    },
    {
      name: "泰坦核心",
      waves: [
        ["gunner", "grunt", "drone", "scout"],
        ["heavy", "heavy", "sniper", "grunt"],
        ["boss"],
      ],
    },
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
  };

  const game = {
    state: "menu",
    resumeState: "menu",
    level: 0,
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

  const keys = Object.create(null);
  const pointer = { firing: false };

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
    [ui.menu, ui.pause, ui.result, ui.help].forEach((item) => item.classList.remove("active"));
    if (name && ui[name]) ui[name].classList.add("active");
  }

  function showToast(message, duration = 1.4) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    toastTimer = duration;
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

  document.querySelectorAll("[data-key]").forEach((button) => {
    const key = button.dataset.key;
    const down = (event) => {
      event.preventDefault();
      keys[key] = true;
      button.classList.add("pressed");
      if (key === "Space") shootPlayer();
    };
    const up = (event) => {
      event.preventDefault();
      keys[key] = false;
      button.classList.remove("pressed");
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  });

  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      game.difficulty = button.dataset.difficulty;
      document.querySelectorAll("[data-difficulty]").forEach((item) => item.classList.toggle("selected", item === button));
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      game.mode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("selected", item === button));
      showToast(game.mode === "coop" ? "双人链路已开启 · P2 方向键 + ENTER" : "单人链路已开启", 1.3);
    });
  });

  document.getElementById("startButton").addEventListener("click", startNewGame);
  document.getElementById("helpButton").addEventListener("click", openHelp);
  document.getElementById("closeHelpButton").addEventListener("click", closeHelp);
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
    setupLevel(0, false);
  }

  function setupLevel(levelIndex, carryPlayer) {
    const oldPlayer = player;
    const oldPlayerTwo = playerTwo;
    game.level = levelIndex;
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
    return {
      x: W / 2,
      y: H - 90,
      w: 38,
      h: 42,
      dir: { x: 0, y: -1 },
      speed: CONFIG.playerSpeed,
      hp: 100,
      maxHp: 100,
      cooldown: 0,
      invulnerable: 0,
      weapon: 1,
      shield: 0,
      overdrive: 0,
      downed: false,
      reviveTimer: 0,
      tint: "#55f4ff",
      controls: { up: "w", down: "s", left: "a", right: "d", fire: "Space" },
    };
  }

  function createPlayerTwo() {
    const unit = createPlayer();
    unit.x = W / 2 + 58;
    unit.y = H - 90;
    unit.dir = { x: 0, y: -1 };
    unit.tint = "#ffb454";
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
    } else if (levelIndex === 1) {
      add(80, 155, 155, 30, "steel"); add(725, 155, 155, 30, "steel");
      add(300, 180, 30, 175); add(630, 180, 30, 175);
      add(420, 270, 120, 34, "steel");
      add(190, 410, 165, 30); add(605, 410, 165, 30);
      add(400, 500, 54, 30); add(506, 500, 54, 30);
    } else {
      add(90, 240, 140, 30); add(730, 240, 140, 30);
      add(275, 352, 30, 120, "steel"); add(655, 352, 30, 120, "steel");
      add(390, 420, 180, 28);
      add(400, 510, 54, 28, "steel"); add(506, 510, 54, 28, "steel");
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
    const hp = Math.round(config.hp * difficulty.enemyHp);
    enemies.push({
      type: typeName,
      x,
      y: isBoss ? 90 : 36,
      w: config.size,
      h: config.size,
      hp,
      maxHp: hp,
      speed: config.speed,
      dir: { x: 0, y: 1 },
      moveTimer: random(.5, 1.6),
      fireTimer: random(.55, 1.45),
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
    if (keys[controls.up]) dy -= 1;
    if (keys[controls.down]) dy += 1;
    if (keys[controls.left]) dx -= 1;
    if (keys[controls.right]) dx += 1;
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
    if (contactTarget) damagePlayer(contactTarget, CONFIG.enemyContactDamage * DIFFICULTY[game.difficulty].enemyDamage * dt * 3);

    if (enemy.fireTimer <= 0) {
      // 炮口在开火瞬间锁定玩家的主要方向。
      if (Math.abs(toPlayer.x) > Math.abs(toPlayer.y)) enemy.dir = { x: Math.sign(toPlayer.x), y: 0 };
      else enemy.dir = { x: 0, y: Math.sign(toPlayer.y) };
      shootEnemy(enemy);
      enemy.fireTimer = ENEMY_TYPES[enemy.type].fire * DIFFICULTY[game.difficulty].enemyFire * random(.8, 1.22);
    }
  }

  function updateBoss(enemy, dt) {
    const hpRatio = enemy.hp / enemy.maxHp;
    const targetY = hpRatio > .5 ? 115 : 145;
    const dx = enemy.strafe * enemy.speed * (hpRatio < .35 ? 1.55 : 1) * dt;
    moveTank(enemy, dx, (targetY - enemy.y) * dt * 1.4);
    const contactTarget = [player, playerTwo].find((unit) => unit && !unit.downed && overlaps(rectOf(enemy, 4), rectOf(unit, 5)));
    if (contactTarget) damagePlayer(contactTarget, 24 * DIFFICULTY[game.difficulty].enemyDamage * dt * 2);
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
      enemy.fireTimer = ENEMY_TYPES.boss.fire * DIFFICULTY[game.difficulty].enemyFire * (hpRatio < .32 ? .63 : hpRatio < .68 ? .8 : 1);
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
      damage: config.damage * DIFFICULTY[game.difficulty].enemyDamage,
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
    bullets.push({ x, y, vx: vector.x * speed, vy: vector.y * speed, r: radius, owner: "enemy", damage: damage * DIFFICULTY[game.difficulty].enemyDamage, color, life: 5 });
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
    game.kills += 1;
    game.shake = enemy.type === "boss" ? 18 : 7;
    burst(enemy.x, enemy.y, config.color, enemy.type === "boss" ? 80 : 24, enemy.type === "boss" ? 320 : 210);
    playSound("explode");
    if (enemy.type !== "boss" && chance(CONFIG.dropChance)) spawnPickup(enemy.x, enemy.y);
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
    const roll = Math.random();
    const type = roll < .34 ? "weapon" : roll < .58 ? "shield" : roll < .8 ? "heal" : "overdrive";
    pickups.push({ x, y, w: 26, h: 26, type, life: 9, pulse: 0 });
  }

  function updatePickups(dt) {
    pickups.forEach((pickup) => {
      pickup.life -= dt;
      pickup.pulse += dt;
      const collector = [player, playerTwo].find((unit) => unit && !unit.downed && overlaps(rectOf(unit, 2), rectOf(pickup)));
      if (collector) {
        pickup.life = 0;
        if (pickup.type === "weapon") collector.weapon = clamp(collector.weapon + 1, 1, 3);
        if (pickup.type === "shield") collector.shield = clamp(collector.shield + 1, 0, 3);
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
    ui.weaponText.textContent = `脉冲炮 · ${["I", "II", "III"][player.weapon - 1]}`;
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
    const gradient = ctx.createRadialGradient(W / 2, H * .56, 10, W / 2, H * .56, 610);
    gradient.addColorStop(0, "#0a1a27");
    gradient.addColorStop(.68, "#06111c");
    gradient.addColorStop(1, "#030912");
    ctx.fillStyle = gradient;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    drawCampusBackground();

    stars.forEach((star) => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = "#7defff";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(68, 184, 211, .055)";
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

  function drawTankBody(entity, color, isBoss = false, playerTank = false) {
    const angle = directionAngle(entity.dir || { x: 0, y: 1 });
    const alpha = entity.invulnerable > 0 && Math.floor(entity.invulnerable * 12) % 2 === 0 ? .28 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(entity.x, entity.y);
    ctx.rotate(angle);
    const w = entity.w;
    const h = entity.h;
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
  updateHud();
  requestAnimationFrame(loop);
})();
