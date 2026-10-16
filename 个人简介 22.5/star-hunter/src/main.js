const $ = (selector) => document.querySelector(selector);
const canvas = $('#gameCanvas');
const ctx = canvas.getContext('2d');

const ui = {
  menu: $('#menu'), hud: $('#hud'), bossHud: $('#bossHud'), pause: $('#pauseScreen'), result: $('#resultScreen'),
  hangar: $('#hangarScreen'), help: $('#helpScreen'), announcement: $('#announcement'), toast: $('#toast'),
  hpText: $('#hpText'), hpBar: $('#hpBar'), shieldText: $('#shieldText'), shieldBar: $('#shieldBar'),
  score: $('#scoreText'), combo: $('#combo'), comboValue: $('#combo span'), weapon: $('#weaponText'),
  progress: $('#missionProgress'), missionLabel: $('#missionLabel'), missionTitle: $('#missionTitle'),
  bossBar: $('#bossBar'), bossPhase: $('#bossPhase'), bossName: $('#bossName'), bombText: $('#bombText'), dashText: $('#dashText'),
  bossProgressPanel: $('#bossProgressPanel'), bossProgressText: $('#bossProgressText'), bossProgressBar: $('#bossProgressBar'), bossProgressSegments: $('#bossProgressSegments'),
  finalScore: $('#finalScore'), kills: $('#killsStat'), maxCombo: $('#comboStat'), time: $('#timeStat'), reward: $('#coinStat'),
  resultTitle: $('#resultTitle'), resultEyebrow: $('#resultEyebrow'), menuCoins: $('#menuCoins'), hangarCoins: $('#hangarCoins'),
  damageLevel: $('#damageLevel'), armorLevel: $('#armorLevel'), soundBtn: $('#soundBtn'), stageBrief: $('#stageBrief'),
  player2Hud: $('#player2Hud'), p2HpText: $('#p2HpText'), p2HpBar: $('#p2HpBar'), p2ShieldText: $('#p2ShieldText'), p2ShieldBar: $('#p2ShieldBar'),
  p2Skills: $('#p2SkillCluster'), p2DashText: $('#p2DashText'), p2BombText: $('#p2BombText'), rankingList: $('#rankingList'),
  menuBestScore: $('#menuBestScore'), shop: $('#shopScreen'), shopList: $('#shopList'), shopCoins: $('#shopCoins'),
  badge: $('#badgeScreen'), badgeList: $('#badgeList')
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = (min, max) => min + Math.random() * (max - min);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const TAU = Math.PI * 2;

const defaultSave = {
  coins: 0, bestScore: 0, damageLevel: 1, armorLevel: 1, muted: true, rankings: [], lossStreak: 0,
  shop: { shieldStart: 0, bombReserve: 0, scoreCore: 0 },
  stats: { games: 0, wins: 0, coopWins: 0, totalKills: 0, totalBosses: 0, bestCombo: 0, clearedStages: [] }
};
const SHIPS = {
  sentinel: { id: 'sentinel', name: '哨兵', damage: 1, armor: 1.16, speed: 1, fireRate: 1, bombs: 3, color: '#55e8ff', glow: '#55e8ff' },
  striker: { id: 'striker', name: '突击者', damage: 1.24, armor: .92, speed: 1.04, fireRate: .86, bombs: 2, color: '#ffbb5c', glow: '#ff7d52' },
  wraith: { id: 'wraith', name: '幽灵', damage: .9, armor: .96, speed: 1.2, fireRate: 1.06, bombs: 2, color: '#cf9cff', glow: '#a56bff' }
};
const STAGES = {
  recruit: { id: 'recruit', number: '01', difficulty: '简单', title: '新兵试炼', label: 'SECTOR 01 · OUTER LANE', brief: '3 个首领，建议熟悉移动与技能后挑战，敌方火力较低。', duration: 24, enemyScale: .72, speedScale: .88, bulletScale: .82, spawnInterval: 2.9, bossHp: 1450, bossMin: 3, bossMax: 3, reward: 80 },
  orbit: { id: 'orbit', number: '02', difficulty: '普通', title: '星环突袭', label: 'SECTOR 02 · ORBIT RING', brief: '随机 3–4 个首领，敌群开始混编，注意护盾与冲刺配合。', duration: 27, enemyScale: .94, speedScale: 1, bulletScale: 1, spawnInterval: 2.55, bossHp: 1750, bossMin: 3, bossMax: 4, reward: 120 },
  abyss: { id: 'abyss', number: '03', difficulty: '困难', title: '深空围剿', label: 'SECTOR 03 · DARK MATTER', brief: '随机 4–5 个首领，精英单位更早出现，保持连击压制弹幕。', duration: 30, enemyScale: 1.2, speedScale: 1.1, bulletScale: 1.15, spawnInterval: 2.2, bossHp: 2050, bossMin: 4, bossMax: 5, reward: 180 },
  extinction: { id: 'extinction', number: '04', difficulty: '地狱', title: '终焉协议', label: 'SECTOR 04 · COLLAPSE CORE', brief: '随机 5–6 个首领，刷新更快、Boss 更坚韧，炸弹留给关键阶段。', duration: 33, enemyScale: 1.5, speedScale: 1.22, bulletScale: 1.32, spawnInterval: 1.9, bossHp: 2450, bossMin: 5, bossMax: 6, reward: 260 }
};
const BOSS_NAMES = ['阿特拉斯-Ω', '赫利俄斯-β', '涅墨西斯-Σ', '克洛诺斯-γ', '厄瑞玻斯-EX', '终焉母巢-∞'];
const SHOP_ITEMS = [
  { id: 'shieldStart', name: '开局护盾', desc: '每局开始获得 20 点护盾', icon: 'S', costs: [160, 260, 380], max: 3 },
  { id: 'bombReserve', name: '备用炸弹', desc: '每局开始额外获得 1 枚量子炸弹', icon: 'B', costs: [220, 360], max: 2 },
  { id: 'scoreCore', name: '得分核心', desc: '任务结算得分奖励提高 5%', icon: '◆', costs: [300, 480, 700], max: 3 }
];
const BADGES = [
  { id: 'first', icon: '✦', name: '首次出击', desc: '完成 1 次任务', test: stats => stats.games >= 1 },
  { id: 'boss', icon: '◈', name: '猎杀号', desc: '累计击破 3 个首领', test: stats => stats.totalBosses >= 3 },
  { id: 'combo', icon: '⚡', name: '连击航线', desc: '单局最高连击达到 20', test: stats => stats.bestCombo >= 20 },
  { id: 'victory', icon: '♢', name: '深空幸存者', desc: '完成 2 次剧情任务', test: stats => stats.wins >= 2 },
  { id: 'coop', icon: '双', name: '并肩作战', desc: '双人合作完成任务', test: stats => stats.coopWins >= 1 },
  { id: 'hell', icon: 'Ω', name: '终焉突破', desc: '完成地狱关卡', test: stats => stats.clearedStages.includes('extinction') }
];
let selectedStageId = 'recruit';
let selectedPlayerMode = 'solo';
let selectedShipId = 'sentinel';
let save;
try { save = { ...defaultSave, ...JSON.parse(localStorage.getItem('star-hunter-save-v1') || '{}') }; }
catch { save = { ...defaultSave }; }
// 当前版本按用户要求采用纯文字提示，强制关闭声音与系统 TTS。
save.muted = true;
if (!Array.isArray(save.rankings)) save.rankings = [];
save.shop = { ...defaultSave.shop, ...(save.shop || {}) };
save.stats = { ...defaultSave.stats, ...(save.stats || {}) };
if (!Array.isArray(save.stats.clearedStages)) save.stats.clearedStages = [];
const persist = () => {
  localStorage.setItem('star-hunter-save-v1', JSON.stringify(save));
  refreshMenuData();
};

class SoundEngine {
  constructor() { this.audio = null; this.muted = save.muted; }
  ready() {
    if (!this.audio) this.audio = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audio.state === 'suspended') this.audio.resume();
  }
  tone(freq = 440, duration = .06, type = 'sine', volume = .035, slide = 0) {
    if (this.muted) return;
    this.ready();
    const now = this.audio.currentTime;
    const oscillator = this.audio.createOscillator();
    const gain = this.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(this.audio.destination);
    oscillator.start(now); oscillator.stop(now + duration);
  }
  shoot() { this.tone(620, .035, 'square', .012, -240); }
  hit() { this.tone(130, .045, 'sawtooth', .018, -60); }
  pickup() { this.tone(600, .1, 'sine', .04, 500); }
  explode(big = false) { this.tone(big ? 75 : 110, big ? .36 : .12, 'sawtooth', big ? .09 : .035, -45); }
  warning() { this.tone(190, .26, 'square', .045, 60); }
  bossWarning(urgent = false) {
    if (this.muted) return;
    this.tone(230, .11, 'square', .045, 110);
    this.tone(390, .12, 'square', .04, -80);
    if (urgent) this.tone(620, .16, 'triangle', .05, -120);
  }
}
const sound = new SoundEngine();

class VoiceAnnouncer {
  constructor() { this.lastAt = 0; this.voice = null; this.supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
  chooseVoice() {
    if (!this.supported) return null;
    const voices = speechSynthesis.getVoices();
    // 不依赖外部音频：优先使用系统中文女声，找不到时回退到任意中文声线。
    const chinese = voices.filter(voice => /^(zh|cmn)(-|$)/i.test(voice.lang));
    this.voice = chinese.find(voice => /female|xiaoxiao|xiaoyi|ting|huihui|meijia|yaoyao|女/i.test(voice.name))
      || chinese.find(voice => /zh-CN|cmn-CN/i.test(voice.lang))
      || chinese[0]
      || null;
    return this.voice;
  }
  unlock() {
    if (!this.supported) return;
    this.chooseVoice();
    // 移动端通常要求在用户手势中首次触发 speechSynthesis。
    if (speechSynthesis.paused) speechSynthesis.resume();
  }
  speak(text, important = false, profile = 0) {
    if (save.muted || !this.supported || !String(text).trim()) return;
    const now = performance.now();
    if (!important && now - this.lastAt < 6500) return;
    this.lastAt = now;
    this.unlock();
    if (important) speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const profiles = [
      { pitch: 1.18, rate: 1.02 },
      { pitch: 1.32, rate: .98 },
      { pitch: 1.46, rate: .94 }
    ];
    const style = profiles[clamp(profile, 0, profiles.length - 1)];
    utterance.lang = this.voice?.lang || 'zh-CN'; utterance.pitch = style.pitch; utterance.rate = style.rate; utterance.volume = .78;
    utterance.voice = this.voice || this.chooseVoice();
    speechSynthesis.speak(utterance);
  }
}
const voice = new VoiceAnnouncer();
if (voice.supported) speechSynthesis.addEventListener?.('voiceschanged', () => voice.chooseVoice());
const speakStage = (text, stage = 1, important = false) => voice.speak(text, important, clamp(stage - 1, 0, 2));

let W = innerWidth, H = innerHeight, dpr = 1;
function resize() {
  W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.onResize();
}
addEventListener('resize', resize);

const stars = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random(), z: rand(.2, 1), tw: rand(0, TAU) }));

class Game {
  constructor() {
    this.state = 'menu';
    this.mode = 'story';
    this.playerMode = 'solo';
    this.stage = STAGES.recruit;
    this.keys = new Set();
    this.pointer = { active: false, x: W / 2, y: H * .78, pointerId: null };
    this.pointer2 = { active: false, x: W / 2, y: H * .78, pointerId: null };
    this.cameraShake = 0;
    this.bgTime = 0;
    this.last = performance.now();
    this.reset();
  }

  reset() {
    if (this.finishTimer) { clearTimeout(this.finishTimer); this.finishTimer = null; }
    this.time = 0; this.score = 0; this.kills = 0; this.combo = 0; this.maxCombo = 0; this.comboTimer = 0;
    this.reward = 0; this.enemyTimer = .5; this.fireTimer = 0; this.boss = null; this.bossSpawned = false;
    this.bossesDefeated = 0; this.bossTarget = this.mode === 'story' ? Math.floor(rand(this.stage.bossMin, this.stage.bossMax + 1)) : Infinity;
    this.nextBossAt = this.mode === 'story' ? this.stage.duration : 55; this.bossWarningSecond = Infinity; this.waveBatch = 0; this.waveCount = 0; this.nextHiddenKill = Math.floor(rand(10, 15)); this.nextProgressVoiceKill = 20; this.lowHpVoicePlayed = false;
    this.enemyBullets = []; this.playerBullets = []; this.enemies = []; this.powerups = []; this.particles = [];
    this.texts = []; this.lasers = []; this.flash = 0; this.slowMotion = 0; this.dangerPulse = 0;
    this.players = [this.createPlayer(1, selectedShipId)];
    if (this.playerMode === 'coop') this.players.push(this.createPlayer(2, selectedShipId));
    this.player = this.players[0];
    this.player2 = this.players[1] || null;
    this.pointer.active = false; this.pointer2.active = false;
  }

  createPlayer(index, shipId) {
    const ship = SHIPS[shipId] || SHIPS.sentinel;
    const baseHp = (100 + (save.armorLevel - 1) * 15) * ship.armor;
    const center = W / 2;
    return {
      index, ship: ship.id, shipName: ship.name, color: ship.color, glow: ship.glow,
      x: this.playerMode === 'coop' ? center + (index === 1 ? -48 : 48) : center, y: H * .8, r: 15,
      hp: baseHp, maxHp: baseHp, shield: save.shop.shieldStart * 20, weapon: 1,
      damage: 12 * ship.damage * (1 + (save.damageLevel - 1) * .16), bombs: ship.bombs + save.shop.bombReserve, dashCooldown: 0,
      invulnerable: 0, frenzy: 0, targetX: this.playerMode === 'coop' ? center + (index === 1 ? -48 : 48) : center,
      targetY: H * .8, speed: 350 * ship.speed, baseSpeed: 350 * ship.speed, fireRate: ship.fireRate, fireTimer: 0, dead: false,
      speedBoost: 0, attackBoost: 0, magnet: 0, wingman: 0
    };
  }

  updatePlayerInput(player, dt) {
    if (!player || player.dead) return;
    const isP2 = player.index === 2;
    let dx = 0, dy = 0;
    if (isP2 ? this.keys.has('ArrowLeft') : this.keys.has('KeyA') || (this.playerMode === 'solo' && this.keys.has('ArrowLeft'))) dx--;
    if (isP2 ? this.keys.has('ArrowRight') : this.keys.has('KeyD') || (this.playerMode === 'solo' && this.keys.has('ArrowRight'))) dx++;
    if (isP2 ? this.keys.has('ArrowUp') : this.keys.has('KeyW') || (this.playerMode === 'solo' && this.keys.has('ArrowUp'))) dy--;
    if (isP2 ? this.keys.has('ArrowDown') : this.keys.has('KeyS') || (this.playerMode === 'solo' && this.keys.has('ArrowDown'))) dy++;
    if (dx || dy) {
      const len = Math.hypot(dx, dy), moveSpeed = player.speed * (player.speedBoost > 0 ? 1.28 : 1); player.x += dx / len * moveSpeed * dt; player.y += dy / len * moveSpeed * dt;
      player.targetX = player.x; player.targetY = player.y;
    }
    const pointer = isP2 ? this.pointer2 : this.pointer;
    if (pointer.active) { player.x += (player.targetX - player.x) * Math.min(1, dt * 14); player.y += (player.targetY - player.y) * Math.min(1, dt * 14); }
    player.x = clamp(player.x, 25, W - 25); player.y = clamp(player.y, 75, H - 25);
    player.invulnerable = Math.max(0, player.invulnerable - dt); player.frenzy = Math.max(0, player.frenzy - dt); player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.speedBoost = Math.max(0, player.speedBoost - dt); player.attackBoost = Math.max(0, player.attackBoost - dt); player.magnet = Math.max(0, player.magnet - dt); player.wingman = Math.max(0, player.wingman - dt);
  }

  onResize() {
    if (!this.players) return;
    for (const player of this.players) {
      player.x = clamp(player.x, 25, W - 25);
      player.y = clamp(player.y, 80, H - 25);
    }
  }

  start(mode = 'story') {
    sound.ready();
    voice.unlock();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    this.mode = mode; this.playerMode = selectedPlayerMode;
    if (mode === 'story') this.stage = STAGES[selectedStageId] || STAGES.recruit;
    this.reset(); this.state = 'playing';
    ui.menu.classList.remove('active'); ui.hud.classList.remove('hidden'); ui.result.classList.add('hidden');
    ui.hud.classList.toggle('coop', this.playerMode === 'coop');
    ui.pause.classList.add('hidden'); ui.bossHud.classList.add('hidden');
    ui.bossHud.classList.toggle('coop', this.playerMode === 'coop');
    ui.player2Hud.classList.toggle('hidden', this.playerMode !== 'coop');
    ui.p2Skills.classList.toggle('hidden', this.playerMode !== 'coop');
    ui.bossProgressPanel.classList.toggle('coop', this.playerMode === 'coop');
    ui.bossProgressPanel.classList.toggle('hidden', mode !== 'story');
    this.updateBossProgress();
    ui.missionLabel.textContent = mode === 'story' ? this.stage.label : 'ENDLESS PROTOCOL';
    ui.missionTitle.textContent = mode === 'story' ? this.stage.title : '无尽深空';
    this.announce(mode === 'story' ? `${this.stage.difficulty}关卡启动` : '无尽协议启动', mode === 'story' ? `${this.stage.title} · 击破阿特拉斯-Ω` : '生存并创造最高纪录', false);
    const encouragement = save.lossStreak >= 2 ? '别灰心呀，这次慢一点躲开弹幕，我们一定可以的！' : `任务开始啦，本次需要击破 ${this.bossTarget === Infinity ? '不断出现的' : this.bossTarget + ' 个'} 首领。`;
    speakStage(encouragement, 1, true);
    this.updateHud();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused'; ui.pause.classList.remove('hidden');
  }
  resume() { if (this.state === 'paused') { this.state = 'playing'; ui.pause.classList.add('hidden'); this.last = performance.now(); } }
  quit() {
    this.state = 'menu'; ui.pause.classList.add('hidden'); ui.result.classList.add('hidden'); ui.hud.classList.add('hidden');
    ui.bossHud.classList.add('hidden'); ui.bossProgressPanel.classList.add('hidden'); ui.player2Hud.classList.add('hidden'); ui.p2Skills.classList.add('hidden'); ui.menu.classList.add('active'); refreshMenuData();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  announce(title, subtitle = '', danger = true) {
    ui.announcement.querySelector('small').textContent = danger ? 'WARNING' : 'COMMAND';
    ui.announcement.querySelector('b').textContent = title;
    ui.announcement.querySelector('span').textContent = subtitle;
    ui.announcement.classList.remove('hidden');
    void ui.announcement.offsetWidth;
    setTimeout(() => ui.announcement.classList.add('hidden'), 2200);
    if (danger) sound.warning();
  }

  toast(message) {
    ui.toast.textContent = message; ui.toast.classList.remove('hidden');
    void ui.toast.offsetWidth; clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), 1550);
  }

  updateBossProgress(celebrate = false) {
    if (this.mode !== 'story' || !Number.isFinite(this.bossTarget)) return;
    const ratio = clamp(this.bossesDefeated / this.bossTarget, 0, 1);
    ui.bossProgressText.textContent = `${this.bossesDefeated} / ${this.bossTarget}`;
    ui.bossProgressBar.style.width = `${ratio * 100}%`;
    ui.bossProgressSegments.innerHTML = Array.from({ length: this.bossTarget }, (_, index) => `<i class="${index < this.bossesDefeated ? 'done' : index === this.bossesDefeated ? 'current' : ''}"></i>`).join('');
    if (celebrate) {
      ui.bossProgressPanel.classList.remove('progress-hit'); void ui.bossProgressPanel.offsetWidth; ui.bossProgressPanel.classList.add('progress-hit');
    }
  }

  spawnEnemy(type, x = rand(40, W - 40), y = -40) {
    const stats = {
      scout: { hp: 30, r: 15, speed: 125, score: 100, color: '#55e8ff' },
      swarm: { hp: 24, r: 12, speed: 145, score: 120, color: '#ffd05e' },
      turret: { hp: 100, r: 23, speed: 60, score: 320, color: '#ad6cff' },
      hunter: { hp: 65, r: 18, speed: 92, score: 240, color: '#ff6685' },
      elite: { hp: 260, r: 31, speed: 48, score: 900, color: '#ff9a50' },
      stealth: { hp: 145, r: 21, speed: 108, score: 1200, color: '#65ffcf' }
    }[type];
    const stage = this.mode === 'story' ? this.stage : { enemyScale: 1, speedScale: 1 };
    const scale = (1 + Math.min(this.time / 150, 1.4) + (this.mode === 'endless' ? this.time / 220 : 0)) * stage.enemyScale * (this.playerMode === 'coop' ? 1.35 : 1);
    this.enemies.push({ type, x, y, baseX: x, t: rand(0, 4), shoot: rand(.7, 2.1), ...stats, speed: stats.speed * stage.speedScale, hp: stats.hp * scale, maxHp: stats.hp * scale });
  }

  spawnWave() {
    this.waveCount++;
    if (this.waveCount > 1 && this.waveCount % 4 === 0) this.toast(`敌机批次 ${this.waveCount} · 保持机动，准备迎接更强火力`);
    const duration = this.mode === 'story' ? this.stage.duration : 55;
    const progress = this.time / duration;
    const tier = progress < .27 ? 0 : progress < .58 ? 1 : 2;
    const pick = Math.random();
    if (tier === 0 || pick < .34) {
      const count = 3 + Math.min(3, this.bossesDefeated) + Math.floor(Math.random() * 3);
      const center = rand(90, W - 90);
      for (let i = 0; i < count; i++) this.spawnEnemy(i % 2 ? 'swarm' : 'scout', clamp(center + (i - count / 2) * 44, 30, W - 30), -30 - i * 22);
    } else if (pick < .62) {
      this.spawnEnemy('turret');
      this.spawnEnemy('scout', rand(35, W * .35)); this.spawnEnemy('scout', rand(W * .65, W - 35));
    } else if (pick < .86) {
      this.spawnEnemy('hunter'); this.spawnEnemy('hunter', rand(50, W - 50), -100);
    } else {
      this.spawnEnemy('elite');
    }
    const reinforcements = Math.min(3, this.bossesDefeated);
    for (let i = 0; i < reinforcements; i++) {
      if (Math.random() < .7) this.spawnEnemy(i >= 2 ? 'hunter' : 'scout', rand(35, W - 35), -85 - i * 38);
    }
  }

  spawnBoss() {
    this.enemies.length = 0; this.enemyBullets.length = 0; this.bossSpawned = true;
    this.bossWarningSecond = Infinity;
    const rank = this.bossesDefeated + 1;
    const hp = (this.mode === 'story' ? this.stage.bossHp * (1 + this.bossesDefeated * .28) : 3500 * (1 + this.time / 180)) * (this.playerMode === 'coop' ? 1.55 : 1);
    const bossName = BOSS_NAMES[Math.min(BOSS_NAMES.length - 1, rank - 1)];
    this.boss = { x: W / 2, y: -150, targetY: Math.max(145, H * .21), r: Math.min(88, W * .09), hp, maxHp: hp, phase: 1, rank, name: bossName, attackScale: 1 + (rank - 1) * .09, t: 0, shoot: 1.8, special: 5, core: 0 };
    ui.bossHud.classList.remove('hidden');
    ui.bossName.textContent = bossName;
    ui.missionTitle.textContent = this.mode === 'story' ? `${this.stage.title} · 首领 ${rank}/${this.bossTarget}` : `决战 · ${bossName}`;
    this.announce(`第 ${rank} 批首领接近`, `OMEGA CLASS · ${bossName}`);
  }

  firePlayer(p = this.player) {
    if (!p || p.dead) return;
    const count = p.weapon >= 5 ? 5 : p.weapon >= 3 ? 3 : p.weapon >= 2 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const angle = count === 1 ? 0 : (i - (count - 1) / 2) * .12;
      this.playerBullets.push({ x: p.x + Math.sin(angle) * 16, y: p.y - 20, vx: Math.sin(angle) * 320, vy: -680, r: 3.5, damage: p.damage * (p.attackBoost > 0 ? 1.45 : 1) * (count > 3 ? .72 : 1), life: 2, pierce: p.weapon >= 4 ? 1 : 0, color: p.color });
    }
    if (p.wingman > 0) for (const side of [-1, 1]) this.playerBullets.push({ x: p.x + side * 25, y: p.y - 4, vx: side * 28, vy: -610, r: 3, damage: p.damage * .55, life: 2, pierce: 0, color: '#f4ddff' });
    sound.shoot();
  }

  enemyShot(x, y, angle, speed = 190, r = 5, color = '#ff4f74') {
    const bulletScale = this.mode === 'story' ? this.stage.bulletScale : 1;
    const scaledSpeed = speed * bulletScale * (this.boss ? 1 + (this.boss.rank - 1) * .035 : 1);
    this.enemyBullets.push({ x, y, vx: Math.cos(angle) * scaledSpeed, vy: Math.sin(angle) * scaledSpeed, r, color, life: 8 });
  }
  getAimTarget(x, y) {
    const active = this.players.filter(player => !player.dead);
    return active.sort((a, b) => dist2({ x, y }, a) - dist2({ x, y }, b))[0] || this.player;
  }
  aimedShot(x, y, speed = 190, spread = 0) {
    const target = this.getAimTarget(x, y);
    const angle = Math.atan2(target.y - y, target.x - x) + spread;
    this.enemyShot(x, y, angle, speed);
  }

  explode(x, y, color = '#55e8ff', count = 16, big = false) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, TAU), speed = rand(big ? 70 : 35, big ? 260 : 150);
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: rand(.25, big ? .9 : .55), max: 1, size: rand(1, big ? 7 : 4), color, drag: .96 });
    }
    if (this.particles.length > 500) this.particles.splice(0, this.particles.length - 500);
    this.cameraShake = Math.max(this.cameraShake, big ? 14 : 4);
    sound.explode(big);
  }

  killEnemy(enemy) {
    this.explode(enemy.x, enemy.y, enemy.color, enemy.type === 'elite' ? 32 : 15, enemy.type === 'elite');
    this.score += enemy.score * (1 + Math.floor(this.combo / 10) * .1);
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); this.comboTimer = 2.5; this.kills++;
    this.texts.push({ x: enemy.x, y: enemy.y, text: `+${enemy.score}`, color: enemy.color, life: .8 });
    const isStealth = enemy.type === 'stealth';
    const chance = isStealth ? 1 : enemy.type === 'elite' ? .85 : .13;
    if (Math.random() < chance) {
      const types = isStealth ? ['speed', 'attack', 'core', 'magnet', 'bomb', 'wingman'] : ['power', 'shield', 'repair', 'frenzy', 'coin', 'speed', 'attack'];
      this.powerups.push({ x: enemy.x, y: enemy.y, type: types[Math.floor(Math.random() * types.length)], r: isStealth ? 16 : 13, t: 0, life: 11 });
    }
    if (isStealth) {
      this.announce('隐藏目标击破', '稀有强化模块已掉落', false); speakStage('隐藏敌机被你找到啦！快去拿稀有道具！', Math.min(3, this.bossesDefeated + 1), true);
    } else if (this.kills >= this.nextHiddenKill && !this.boss) {
      this.nextHiddenKill += Math.floor(rand(12, 19));
      this.spawnEnemy('stealth', rand(50, W - 50), -70);
      this.announce('发现隐形敌机', '击破后必定掉落稀有模块'); speakStage('嘘，发现一架隐形敌机，击破它会有好东西哦！', Math.min(3, this.bossesDefeated + 1), true);
    }
  }

  useBomb(player = this.player) {
    if (this.state !== 'playing' || !player || player.dead || player.bombs <= 0) return;
    player.bombs--; this.enemyBullets.length = 0; this.flash = .65; this.cameraShake = 18;
    for (const e of this.enemies) e.hp -= 280;
    if (this.boss) this.boss.hp -= Math.min(180, this.boss.maxHp * .04);
    for (let i = 0; i < 70; i++) {
      const a = rand(0, TAU), s = rand(100, 650);
      this.particles.push({ x: player.x, y: player.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.4, .9), max: 1, size: rand(2, 7), color: i % 2 ? '#d681ff' : player.color, drag: .95 });
    }
    sound.tone(90, .7, 'sawtooth', .1, 800); this.toast(`玩家 ${player.index} · 量子炸弹 · 全域净化`); this.updateHud();
  }

  dash(player = this.player) {
    if (this.state !== 'playing' || !player || player.dead || player.dashCooldown > 0) return;
    const p = player; p.invulnerable = .85; p.dashCooldown = 8; p.y = clamp(p.y - Math.min(85, H * .12), 70, H - 30);
    for (let i = 0; i < 35; i++) this.particles.push({ x: p.x + rand(-15, 15), y: p.y + rand(10, 100), vx: rand(-45, 45), vy: rand(100, 300), life: rand(.3, .7), max: 1, size: rand(2, 5), color: p.color, drag: .94 });
    sound.tone(240, .38, 'sawtooth', .055, 900); this.toast('相位冲刺 · 无敌');
  }

  damagePlayer(amount, target = this.player) {
    const p = target;
    if (!p || p.dead || p.invulnerable > 0 || this.state !== 'playing') return;
    if (p.shield > 0) { const absorbed = Math.min(p.shield, amount); p.shield -= absorbed; amount -= absorbed; }
    p.hp -= amount; p.invulnerable = .75; this.cameraShake = 9; this.flash = .16; this.combo = 0;
    sound.hit(); this.updateHud();
    if (p.hp <= 0) {
      p.hp = 0; p.dead = true; this.explode(p.x, p.y, p.color, 60, true);
      const remaining = this.players.some(player => !player.dead);
      if (remaining) this.announce(`玩家 ${p.index} 已撤离`, '幸存玩家继续守住战线', false);
      else this.finishTimer = setTimeout(() => this.finish(false), 700);
    }
  }

  collect(item, player = this.player) {
    const p = player;
    if (item.type === 'power') { p.weapon = Math.min(5, p.weapon + 1); this.toast(p.weapon < 5 ? `主炮强化 · LV.${p.weapon}` : '主炮已达到最高等级'); }
    if (item.type === 'shield') { p.shield = Math.min(80, p.shield + 35); this.toast('能量护盾 +35'); }
    if (item.type === 'repair') { p.hp = Math.min(p.maxHp, p.hp + 25); this.toast('机体修复 +25'); }
    if (item.type === 'frenzy') { p.frenzy = 6; this.toast('火力超载 · 6秒'); }
    if (item.type === 'coin') { this.reward += 15; this.toast('晶体资源 +15'); }
    if (item.type === 'speed') { p.speedBoost = 9; this.toast(`玩家 ${p.index} · 引擎超频 · 移速提升`); }
    if (item.type === 'attack') { p.attackBoost = 9; this.toast(`玩家 ${p.index} · 穿甲弹芯 · 伤害提升`); }
    if (item.type === 'core') { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 35); this.toast(`玩家 ${p.index} · 生命核心 +20上限`); }
    if (item.type === 'magnet') { p.magnet = 12; this.toast(`玩家 ${p.index} · 资源牵引 · 12秒`); }
    if (item.type === 'bomb') { p.bombs = Math.min(5, p.bombs + 1); this.toast(`玩家 ${p.index} · 量子炸弹 +1`); }
    if (item.type === 'wingman') { p.wingman = 12; this.toast(`玩家 ${p.index} · 僚机支援 · 12秒`); }
    sound.pickup(); this.updateHud();
  }

  update(dt) {
    if (this.state !== 'playing') return;
    if (this.slowMotion > 0) { this.slowMotion -= dt; dt *= .35; }
    this.time += dt; this.flash = Math.max(0, this.flash - dt); this.cameraShake *= .89; this.dangerPulse += dt;
    for (const player of this.players) {
      this.updatePlayerInput(player, dt);
      player.fireTimer -= dt;
      const fireRate = (player.frenzy > 0 ? .075 : .145) * player.fireRate * (1 - (save.damageLevel - 1) * .025);
      if (player.fireTimer <= 0) { this.firePlayer(player); player.fireTimer = fireRate; }
    }

    const bossScheduled = !this.bossSpawned && (this.mode === 'story' || this.mode === 'endless');
    if (bossScheduled) {
      const remaining = Math.ceil(this.nextBossAt - this.time);
      if (remaining > 0 && remaining <= 5 && remaining !== this.bossWarningSecond) {
        this.bossWarningSecond = remaining;
        this.announce(remaining <= 2 ? '首领即将现身' : `首领预警 · ${remaining}`, remaining <= 2 ? '请准备冲刺或量子炸弹' : '巨型敌对信号正在接近', false);
        sound.bossWarning(remaining <= 2);
      }
      if (remaining <= 0) this.spawnBoss();
    }
    if (!this.boss) {
      this.enemyTimer -= dt;
      if (this.enemyTimer <= 0) {
        this.spawnWave();
        const interval = this.mode === 'story' ? this.stage.spawnInterval : 2.6;
        this.enemyTimer = Math.max(.72, interval - this.time * .012 - this.bossesDefeated * .18);
      }
    }

    this.updateEnemies(dt); this.updateBoss(dt); this.updateObjects(dt); this.collisions();
    const weakest = this.players.filter(player => !player.dead).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (weakest && weakest.hp / weakest.maxHp < .28 && !this.lowHpVoicePlayed) {
      this.lowHpVoicePlayed = true; speakStage('别慌别慌，先拉开距离找修复道具，你已经做得很好啦！', Math.min(3, this.bossesDefeated + 1), true);
    }
    if (this.kills >= this.nextProgressVoiceKill) {
      this.nextProgressVoiceKill += 20; speakStage(`已经击落 ${this.kills} 架敌机，首领进度 ${this.bossesDefeated} 比 ${Number.isFinite(this.bossTarget) ? this.bossTarget : '持续'}，继续加油呀！`, Math.min(3, this.bossesDefeated + 1));
    }
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    this.updateHud();
  }

  updateEnemies(dt) {
    for (const e of this.enemies) {
      e.t += dt; e.y += e.speed * dt;
      if (e.type === 'swarm') e.x = e.baseX + Math.sin(e.t * 3.3) * 48;
      if (e.type === 'hunter') { const target = this.getAimTarget(e.x, e.y); e.x += clamp(target.x - e.x, -1, 1) * 55 * dt; }
      if (e.type === 'elite') e.x = e.baseX + Math.sin(e.t * 1.35) * Math.min(120, W * .2);
      if (e.type === 'stealth') e.x = e.baseX + Math.sin(e.t * 2.1) * Math.min(145, W * .24);
      e.shoot -= dt;
      if (e.shoot <= 0 && e.y > 30 && e.y < H * .7) {
        if (e.type === 'turret') for (const s of [-.25, 0, .25]) this.aimedShot(e.x, e.y, 185, s);
        if (e.type === 'hunter') this.aimedShot(e.x, e.y, 265);
        if (e.type === 'elite') for (let i = 0; i < 7; i++) this.enemyShot(e.x, e.y, Math.PI / 2 + (i - 3) * .19, 185, 5, '#ff9a50');
        if (e.type === 'stealth') for (const spread of [-.1, .1]) this.aimedShot(e.x, e.y, 245, spread);
        e.shoot = e.type === 'elite' ? 1.15 : e.type === 'stealth' ? 1.45 : rand(1.6, 2.5);
      }
      if (e.y > H + 80) e.dead = true;
    }
  }

  updateBoss(dt) {
    const b = this.boss; if (!b) return;
    b.t += dt; b.core += dt;
    if (b.y < b.targetY) { b.y += 80 * dt; return; }
    b.x = W / 2 + Math.sin(b.t * (b.phase === 3 ? .85 : .55)) * Math.min(W * .3, 300);
    const ratio = b.hp / b.maxHp;
    const nextPhase = ratio <= .35 ? 3 : ratio <= .7 ? 2 : 1;
    if (b.hp > 0 && nextPhase !== b.phase) {
      b.phase = nextPhase; b.shoot = 1 / b.attackScale; b.special = 2.2 / b.attackScale; this.enemyBullets.length = 0; this.slowMotion = .7; this.flash = .35;
      this.announce(`核心阶段 ${b.phase}`, b.phase === 2 ? '无人机弹幕展开' : '过载坍缩 · 极限火力');
    }
    b.shoot -= dt; b.special -= dt;
    if (b.shoot <= 0) {
      if (b.phase === 1) {
        for (let i = -3; i <= 3; i++) this.enemyShot(b.x, b.y + b.r * .45, Math.PI / 2 + i * .16, 180);
        b.shoot = 1.15 / b.attackScale;
      } else if (b.phase === 2) {
        for (let i = 0; i < 12; i++) this.enemyShot(b.x, b.y, i / 12 * TAU + b.t, 155, 5, '#b675ff');
        b.shoot = 1.05 / b.attackScale;
      } else {
        for (let i = 0; i < 18; i++) this.enemyShot(b.x, b.y, i / 18 * TAU - b.t * .55, 195, 5.5, i % 2 ? '#ff4268' : '#f7deff');
        this.aimedShot(b.x - b.r * .65, b.y, 285); this.aimedShot(b.x + b.r * .65, b.y, 285);
        b.shoot = .78 / b.attackScale;
      }
    }
    if (b.special <= 0) {
      if (b.phase === 1) {
        for (const s of [-.18, 0, .18]) this.aimedShot(b.x, b.y, 235, s);
        b.special = 3.5 / b.attackScale;
      } else {
        const target = this.getAimTarget(b.x, b.y);
        const x = b.phase === 2 ? clamp(target.x + rand(-80, 80), 40, W - 40) : rand(W * .18, W * .82);
        this.lasers.push({ x, width: b.phase === 3 ? Math.min(100, W * .18) : 62, t: 1.25, life: 1.7, hit: false });
        sound.warning(); b.special = (b.phase === 3 ? 2.8 : 4.2) / b.attackScale;
      }
    }
    ui.bossBar.style.width = `${clamp(ratio, 0, 1) * 100}%`;
    ui.bossPhase.textContent = `PHASE ${b.phase}`;
    if (b.hp <= 0) {
      const defeatedName = b.name;
      this.score += this.mode === 'story' ? 7000 + b.rank * 2200 : 15000; this.reward += this.mode === 'story' ? Math.ceil(this.stage.reward / this.bossTarget) : 250;
      this.explode(b.x, b.y, '#ff567a', 120, true); this.flash = 1; this.boss = null; ui.bossHud.classList.add('hidden');
      this.bossesDefeated++;
      if (this.mode === 'story') {
        this.updateBossProgress(true);
        speakStage(`太棒啦！${defeatedName} 已经被击破，当前进度 ${this.bossesDefeated} 比 ${this.bossTarget}。`, this.bossesDefeated >= this.bossTarget ? 3 : 2, true);
        if (this.bossesDefeated >= this.bossTarget) this.finishTimer = setTimeout(() => this.finish(true), 1300);
        else {
          this.bossSpawned = false; this.waveBatch++; this.nextBossAt = this.time + rand(7, 10); this.bossWarningSecond = Infinity;
          ui.missionTitle.textContent = `增援批次 ${this.bossesDefeated + 1} · 清理航道`;
          this.announce('首领击破 · 增援接近', `下一目标 ${this.bossesDefeated + 1}/${this.bossTarget}`, false);
        }
      } else {
        this.bossSpawned = false; this.time = Math.max(0, this.time - 22); this.announce('母舰击破', '无尽协议继续运行', false);
      }
      return;
    }
  }

  updateObjects(dt) {
    for (const bullet of this.playerBullets) { bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt; }
    for (const bullet of this.enemyBullets) { bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt; }
    for (const item of this.powerups) {
      item.t += dt; item.life -= dt; item.y += 55 * dt;
      const target = this.getAimTarget(item.x, item.y);
      const d = Math.hypot(item.x - target.x, item.y - target.y);
      const attractRadius = target.magnet > 0 ? 260 : 95;
      if (d < attractRadius) { item.x += (target.x - item.x) * dt * (target.magnet > 0 ? 8 : 5); item.y += (target.y - item.y) * dt * (target.magnet > 0 ? 8 : 5); }
    }
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= p.drag; p.vy *= p.drag; p.life -= dt; }
    for (const t of this.texts) { t.y -= 38 * dt; t.life -= dt; }
    for (const laser of this.lasers) {
      laser.t -= dt; laser.life -= dt;
      if (laser.t <= 0 && laser.t > -.35) {
        for (const player of this.players) {
          if (!player.dead && !laser[`hit${player.index}`] && Math.abs(player.x - laser.x) < laser.width / 2 + player.r) { laser[`hit${player.index}`] = true; this.damagePlayer(42, player); }
        }
      }
    }
    this.playerBullets = this.playerBullets.filter(b => b.life > 0 && b.y > -40 && b.x > -30 && b.x < W + 30);
    this.enemyBullets = this.enemyBullets.filter(b => b.life > 0 && b.y < H + 40 && b.y > -50 && b.x > -50 && b.x < W + 50).slice(-240);
    this.powerups = this.powerups.filter(p => p.life > 0 && p.y < H + 30);
    this.particles = this.particles.filter(p => p.life > 0);
    this.texts = this.texts.filter(t => t.life > 0); this.lasers = this.lasers.filter(l => l.life > 0);
  }

  collisions() {
    for (const bullet of this.playerBullets) {
      if (bullet.dead) continue;
      for (const e of this.enemies) {
        if (!e.dead && dist2(bullet, e) < (bullet.r + e.r) ** 2) {
          e.hp -= bullet.damage; if (bullet.pierce > 0) bullet.pierce--; else bullet.dead = true;
          this.particles.push({ x: bullet.x, y: bullet.y, vx: rand(-30, 30), vy: rand(-30, 30), life: .16, max: 1, size: 3, color: '#baf8ff', drag: .9 });
          if (e.hp <= 0) { e.dead = true; this.killEnemy(e); }
          break;
        }
      }
      if (!bullet.dead && this.boss && dist2(bullet, this.boss) < (bullet.r + this.boss.r * .86) ** 2) {
        const coreOpen = Math.sin(this.boss.core * 1.7) > -.25;
        this.boss.hp -= bullet.damage * (coreOpen ? 1.35 : .78); bullet.dead = true;
        if (Math.random() < .25) this.particles.push({ x: bullet.x, y: bullet.y, vx: rand(-45, 45), vy: rand(0, 45), life: .22, max: 1, size: 3, color: coreOpen ? '#ffb057' : '#9b74ff', drag: .91 });
      }
    }
    this.playerBullets = this.playerBullets.filter(b => !b.dead);
    this.enemies = this.enemies.filter(e => !e.dead);

    for (const bullet of this.enemyBullets) {
      for (const player of this.players) {
        if (!player.dead && dist2(bullet, player) < (bullet.r + player.r * .6) ** 2) { bullet.dead = true; this.damagePlayer(12, player); break; }
      }
    }
    this.enemyBullets = this.enemyBullets.filter(b => !b.dead);
    for (const e of this.enemies) {
      for (const player of this.players) {
        if (!player.dead && dist2(e, player) < (e.r + player.r) ** 2) { e.dead = true; this.killEnemy(e); this.damagePlayer(e.type === 'elite' ? 45 : 25, player); break; }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    for (const item of this.powerups) {
      for (const player of this.players) {
        if (!player.dead && dist2(item, player) < (item.r + player.r + 5) ** 2) { item.dead = true; this.collect(item, player); break; }
      }
    }
    this.powerups = this.powerups.filter(i => !i.dead);
  }

  updateHud() {
    const p = this.player;
    ui.hpText.textContent = p.dead ? 'DOWN' : Math.ceil(Math.max(0, p.hp)); ui.hpBar.style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
    ui.shieldText.textContent = Math.ceil(p.shield); ui.shieldBar.style.width = `${Math.min(1, p.shield / 80) * 100}%`;
    ui.score.textContent = String(Math.floor(this.score)).padStart(6, '0'); ui.comboValue.textContent = this.combo;
    ui.combo.classList.toggle('active', this.combo >= 2);
    const buff = p.attackBoost > 0 ? ' · 穿甲' : p.wingman > 0 ? ' · 僚机' : p.speedBoost > 0 ? ' · 超频' : '';
    ui.weapon.textContent = `脉冲阵列 · LV.${p.weapon}${buff}`;
    ui.bombText.textContent = `× ${p.bombs}`; ui.dashText.textContent = p.dashCooldown > 0 ? `${p.dashCooldown.toFixed(1)}s` : 'READY';
    $('#dashBtn').disabled = p.dead || p.dashCooldown > 0; $('#bombBtn').disabled = p.dead || p.bombs <= 0;
    if (this.player2) {
      const p2 = this.player2;
      ui.p2HpText.textContent = p2.dead ? 'DOWN' : Math.ceil(Math.max(0, p2.hp)); ui.p2HpBar.style.width = `${Math.max(0, p2.hp / p2.maxHp) * 100}%`;
      ui.p2ShieldText.textContent = Math.ceil(p2.shield); ui.p2ShieldBar.style.width = `${Math.min(1, p2.shield / 80) * 100}%`;
      ui.p2BombText.textContent = `× ${p2.bombs}`; ui.p2DashText.textContent = p2.dashCooldown > 0 ? `${p2.dashCooldown.toFixed(1)}s` : 'READY';
      $('#p2DashBtn').disabled = p2.dead || p2.dashCooldown > 0; $('#p2BombBtn').disabled = p2.dead || p2.bombs <= 0;
    }
    const approach = this.mode === 'story' ? (this.boss ? 1 - this.boss.hp / this.boss.maxHp : this.bossesDefeated === 0 ? clamp(this.time / this.stage.duration, 0, .9) : clamp(1 - (this.nextBossAt - this.time) / 10, 0, .9)) : 0;
    const progress = this.mode === 'story' ? clamp((this.bossesDefeated + approach) / this.bossTarget, 0, 1) : (this.time % 55) / 55;
    ui.progress.style.width = `${progress * 100}%`;
  }

  finish(won) {
    if (this.state !== 'playing') return;
    this.finishTimer = null;
    this.state = 'result'; ui.hud.classList.add('hidden'); ui.bossHud.classList.add('hidden'); ui.bossProgressPanel.classList.add('hidden'); ui.result.classList.remove('hidden');
    const survivalBonus = Math.floor(this.time * 20); this.score = Math.floor((this.score + survivalBonus) * (1 + save.shop.scoreCore * .05));
    this.reward += Math.floor(this.score / 1500) + (won ? 50 : 0); save.coins += this.reward; save.bestScore = Math.max(save.bestScore, Math.floor(this.score));
    save.lossStreak = won ? 0 : (save.lossStreak || 0) + 1;
    save.stats.games++; save.stats.totalKills += this.kills; save.stats.totalBosses += this.bossesDefeated; save.stats.bestCombo = Math.max(save.stats.bestCombo, this.maxCombo);
    if (won) {
      save.stats.wins++;
      if (this.playerMode === 'coop') save.stats.coopWins++;
      if (this.mode === 'story' && !save.stats.clearedStages.includes(this.stage.id)) save.stats.clearedStages.push(this.stage.id);
    }
    save.rankings.push({
      score: Math.floor(this.score), stage: this.mode === 'story' ? this.stage.title : '无尽深空',
      mode: this.playerMode, ship: SHIPS[selectedShipId]?.name || '哨兵', won,
      date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    });
    save.rankings = save.rankings.sort((a, b) => b.score - a.score).slice(0, 10); persist();
    ui.resultEyebrow.textContent = won ? 'MISSION COMPLETE' : 'AIRFRAME LOST'; ui.resultTitle.textContent = won ? (this.mode === 'story' ? `${this.stage.title} · 完成` : '任务完成') : '战机损毁';
    ui.finalScore.textContent = String(Math.floor(this.score)).padStart(6, '0'); ui.kills.textContent = this.kills; ui.maxCombo.textContent = this.maxCombo;
    ui.time.textContent = formatTime(this.time); ui.reward.textContent = `◆ ${this.reward}`;
    speakStage(won ? '任务完成！你真的超级厉害，辛苦啦！' : save.lossStreak >= 2 ? '没关系的，失败只是暂时的。下一次先强化战机，我会一直陪你再试一次！' : '差一点点就成功啦，休息一下再出发吧！', won ? 3 : Math.min(3, this.bossesDefeated + 1), true);
  }

  drawBackground(time) {
    const grad = ctx.createRadialGradient(W * .52, H * .3, 0, W * .5, H * .45, Math.max(W, H) * .76);
    const danger = this.boss?.phase === 3;
    grad.addColorStop(0, danger ? '#26091e' : '#101d49'); grad.addColorStop(.45, danger ? '#0c0718' : '#050b20'); grad.addColorStop(1, '#01030a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .22; ctx.strokeStyle = danger ? '#7d294e' : '#244a82'; ctx.lineWidth = 1;
    const gridOffset = (time * 24) % 48;
    for (let y = -48 + gridOffset; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const s of stars) {
      let y = (s.y * H + time * (20 + s.z * 90)) % H;
      const a = .25 + (Math.sin(time * 2 + s.tw) + 1) * .23;
      ctx.fillStyle = `rgba(${s.z > .75 ? '130,230,255' : '160,180,225'},${a})`;
      ctx.fillRect(s.x * W, y, s.z * 1.8, s.z * (this.state === 'playing' ? 9 : 2));
    }
    if (this.state === 'menu') this.drawMenuShip(time);
  }

  drawMenuShip(time) {
    ctx.save(); ctx.translate(W * .5, H * .68 + Math.sin(time) * 5); ctx.scale(Math.min(W, H) / 680, Math.min(W, H) / 680);
    ctx.globalAlpha = .23; ctx.shadowBlur = 45; ctx.shadowColor = '#55e8ff'; ctx.fillStyle = '#9deeff';
    ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(26, -12); ctx.lineTo(92, 45); ctx.lineTo(30, 33); ctx.lineTo(18, 83); ctx.lineTo(-18, 83); ctx.lineTo(-30, 33); ctx.lineTo(-92, 45); ctx.lineTo(-26, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#54eaff'; ctx.globalAlpha = .4; ctx.fillRect(-8, 70, 16, 80); ctx.restore();
  }

  drawShip(p) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.invulnerable > 0 && Math.floor(p.invulnerable * 16) % 2) ctx.globalAlpha = .35;
    ctx.shadowBlur = 18; ctx.shadowColor = p.frenzy > 0 ? '#ff4d6d' : p.glow;
    const flame = 17 + Math.sin(this.bgTime * 24) * 5;
    ctx.fillStyle = p.frenzy > 0 ? '#ff6381' : p.color; ctx.beginPath(); ctx.moveTo(-7, 16); ctx.lineTo(0, 16 + flame); ctx.lineTo(7, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d5f8ff'; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(10, -5); ctx.lineTo(31, 16); ctx.lineTo(10, 12); ctx.lineTo(5, 23); ctx.lineTo(-5, 23); ctx.lineTo(-10, 12); ctx.lineTo(-31, 16); ctx.lineTo(-10, -5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#183959'; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(7, 2); ctx.lineTo(0, 12); ctx.lineTo(-7, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.color; ctx.fillRect(-2, -13, 4, 19);
    ctx.fillStyle = p.color; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(`P${p.index}`, 0, 38);
    if (p.shield > 0) { ctx.strokeStyle = p.color; ctx.globalAlpha = .45 + Math.sin(this.bgTime * 5) * .15; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  drawEnemy(e) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.shadowBlur = 12; ctx.shadowColor = e.color; ctx.strokeStyle = e.color; ctx.fillStyle = '#0b1730'; ctx.lineWidth = 2;
    if (e.type === 'stealth') ctx.globalAlpha = .3 + (Math.sin(this.bgTime * 5 + e.t) + 1) * .22;
    if (e.type === 'scout') { ctx.rotate(Math.PI / 4); ctx.fillRect(-11, -11, 22, 22); ctx.strokeRect(-11, -11, 22, 22); }
    else if (e.type === 'swarm') { ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(-14, -10); ctx.lineTo(0, -5); ctx.lineTo(14, -10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (e.type === 'turret') { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = e.color; ctx.fillRect(-4, 0, 8, 17); }
    else if (e.type === 'hunter') { ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(-18, -12); ctx.lineTo(0, -5); ctx.lineTo(18, -12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(0, 2, 5, 0, TAU); ctx.fill(); }
    else if (e.type === 'stealth') { ctx.rotate(Math.sin(e.t * 2) * .16); ctx.beginPath(); ctx.moveTo(0, 23); ctx.lineTo(-22, -14); ctx.lineTo(-6, -8); ctx.lineTo(0, -19); ctx.lineTo(6, -8); ctx.lineTo(22, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.rotate(this.bgTime * .7); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? 22 : 31; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); }
    if (e.type === 'elite' || e.type === 'turret' || e.type === 'stealth') { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-e.r, -e.r - 10, e.r * 2, 3); ctx.fillStyle = e.color; ctx.fillRect(-e.r, -e.r - 10, e.r * 2 * Math.max(0, e.hp / e.maxHp), 3); }
    ctx.restore();
  }

  drawBoss(b) {
    ctx.save(); ctx.translate(b.x, b.y); const scale = b.r / 85; ctx.scale(scale, scale); ctx.shadowBlur = b.phase === 3 ? 30 : 18; ctx.shadowColor = b.phase === 3 ? '#ff4268' : '#a65cff';
    ctx.fillStyle = '#11132c'; ctx.strokeStyle = b.phase === 3 ? '#ff4268' : '#8968ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(-42, 52); ctx.lineTo(-93, 66); ctx.lineTo(-72, 22); ctx.lineTo(-112, -12); ctx.lineTo(-56, -20); ctx.lineTo(-36, -58); ctx.lineTo(0, -72); ctx.lineTo(36, -58); ctx.lineTo(56, -20); ctx.lineTo(112, -12); ctx.lineTo(72, 22); ctx.lineTo(93, 66); ctx.lineTo(42, 52); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#262451'; for (const x of [-67, 67]) { ctx.beginPath(); ctx.arc(x, 5, 25, 0, TAU); ctx.fill(); ctx.stroke(); }
    const open = Math.sin(b.core * 1.7) > -.25; ctx.shadowBlur = 28; ctx.shadowColor = open ? '#ff9f5a' : '#775cff'; ctx.fillStyle = open ? '#ffb15a' : '#624bb2'; ctx.beginPath(); ctx.arc(0, 0, open ? 19 : 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = open ? '#ffd7aa' : '#9a87e6'; ctx.beginPath(); ctx.arc(0, 0, 28 + Math.sin(b.core * 3) * 4, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  draw() {
    this.bgTime += .016;
    ctx.save();
    if (this.cameraShake > .3) ctx.translate(rand(-this.cameraShake, this.cameraShake), rand(-this.cameraShake, this.cameraShake));
    this.drawBackground(this.bgTime);
    if (this.state !== 'menu') {
      for (const laser of this.lasers) {
        if (laser.t > 0) { ctx.fillStyle = `rgba(255,48,91,${.05 + Math.sin(laser.t * 32) * .035})`; ctx.fillRect(laser.x - laser.width / 2, 0, laser.width, H); ctx.strokeStyle = '#ff4268'; ctx.setLineDash([10, 9]); ctx.strokeRect(laser.x - laser.width / 2, 0, laser.width, H); ctx.setLineDash([]); }
        else { const a = clamp(laser.life / .35, 0, 1); ctx.fillStyle = `rgba(255,80,120,${a * .72})`; ctx.shadowBlur = 28; ctx.shadowColor = '#ff4268'; ctx.fillRect(laser.x - laser.width / 2, 0, laser.width, H); ctx.shadowBlur = 0; }
      }
      for (const item of this.powerups) this.drawPowerup(item);
      for (const e of this.enemies) this.drawEnemy(e);
      if (this.boss) this.drawBoss(this.boss);
      this.drawProjectiles();
      for (const player of this.players) if (!player.dead && player.hp > 0) this.drawShip(player);
      this.drawParticles();
    }
    ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = `rgba(${this.boss?.phase === 3 ? '255,55,90' : '150,230,255'},${Math.min(.55, this.flash)})`; ctx.fillRect(0, 0, W, H); }
  }

  drawPowerup(item) {
    const colors = { power: '#ffd05e', shield: '#55e8ff', repair: '#58ff9c', frenzy: '#ff4d6d', coin: '#bb78ff', speed: '#67f3ff', attack: '#ff865d', core: '#7dff95', magnet: '#8da4ff', bomb: '#d681ff', wingman: '#f4ddff' };
    const labels = { power: 'P', shield: 'S', repair: '+', frenzy: 'F', coin: '◆', speed: 'V', attack: 'A', core: 'H', magnet: 'M', bomb: 'B', wingman: 'W' };
    ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.t); ctx.shadowBlur = 15; ctx.shadowColor = colors[item.type]; ctx.strokeStyle = colors[item.type]; ctx.fillStyle = 'rgba(5,15,35,.88)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.rotate(-item.t); ctx.fillStyle = colors[item.type]; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(labels[item.type], 0, 1); ctx.restore();
  }

  drawProjectiles() {
    ctx.save(); ctx.lineCap = 'round';
    for (const b of this.playerBullets) { ctx.strokeStyle = b.color || '#8cf3ff'; ctx.shadowBlur = 9; ctx.shadowColor = b.color || '#55e8ff'; ctx.lineWidth = b.r * 1.5; ctx.beginPath(); ctx.moveTo(b.x, b.y + 12); ctx.lineTo(b.x, b.y - 8); ctx.stroke(); }
    for (const b of this.enemyBullets) { ctx.fillStyle = b.color; ctx.shadowBlur = 10; ctx.shadowColor = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(b.x - 1, b.y - 1, b.r * .35, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
  }

  drawParticles() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) { ctx.globalAlpha = clamp(p.life / .7, 0, 1); ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
    ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center'; ctx.font = 'bold 13px Orbitron';
    for (const t of this.texts) { ctx.globalAlpha = clamp(t.life * 2, 0, 1); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); }
    ctx.restore();
  }

  loop(now) {
    const dt = Math.min((now - this.last) / 1000, .04); this.last = now;
    this.update(dt); this.draw(); requestAnimationFrame(t => this.loop(t));
  }
}

const game = new Game();
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function refreshMenuData() {
  ui.menuCoins.textContent = save.coins; ui.hangarCoins.textContent = save.coins;
  ui.menuBestScore.textContent = String(save.bestScore || 0).padStart(6, '0');
  if (ui.shopCoins) ui.shopCoins.textContent = save.coins;
  ui.damageLevel.textContent = save.damageLevel; ui.armorLevel.textContent = save.armorLevel;
  const damageCost = 120 * save.damageLevel, armorCost = 120 * save.armorLevel;
  $('#upgradeDamage i').textContent = save.damageLevel >= 5 ? 'MAX' : damageCost;
  $('#upgradeArmor i').textContent = save.armorLevel >= 5 ? 'MAX' : armorCost;
  $('#upgradeDamage').disabled = save.damageLevel >= 5 || save.coins < damageCost;
  $('#upgradeArmor').disabled = save.armorLevel >= 5 || save.coins < armorCost;
  ui.soundBtn.textContent = '声音已关闭';
  ui.soundBtn.disabled = true;
  ui.soundBtn.setAttribute('aria-label', '声音已关闭，仅显示文字提示');
}

function refreshShop() {
  ui.shopList.innerHTML = SHOP_ITEMS.map(item => {
    const level = save.shop[item.id] || 0;
    const full = level >= item.max;
    const cost = full ? 0 : item.costs[level];
    return `<article class="shop-card ${full ? 'maxed' : ''}">
      <span class="shop-icon">${item.icon}</span><div><b>${item.name}</b><small>${item.desc}</small><em>LV.${level} / ${item.max}</em></div>
      <button data-buy="${item.id}" ${full || save.coins < cost ? 'disabled' : ''}>${full ? '已满级' : `◆ ${cost}`}</button>
    </article>`;
  }).join('');
  ui.shopCoins.textContent = save.coins;
  ui.shopList.querySelectorAll('[data-buy]').forEach(button => button.addEventListener('click', () => buyShopItem(button.dataset.buy)));
}

function buyShopItem(id) {
  const item = SHOP_ITEMS.find(entry => entry.id === id);
  if (!item) return;
  const level = save.shop[id] || 0;
  if (level >= item.max) return;
  const cost = item.costs[level];
  if (save.coins < cost) return;
  save.coins -= cost; save.shop[id] = level + 1; sound.pickup(); persist(); refreshShop();
}

function refreshBadges() {
  const unlocked = BADGES.filter(badge => badge.test(save.stats)).length;
  ui.badgeList.innerHTML = `<div class="badge-summary"><b>${unlocked}</b><span>/ ${BADGES.length} 已解锁</span></div>` + BADGES.map(badge => {
    const active = badge.test(save.stats);
    return `<article class="badge-card ${active ? 'unlocked' : 'locked'}"><span>${badge.icon}</span><div><b>${badge.name}</b><small>${badge.desc}</small></div><em>${active ? '已解锁' : '未达成'}</em></article>`;
  }).join('');
}

function refreshRanking() {
  if (!ui.rankingList) return;
  if (!save.rankings.length) {
    ui.rankingList.innerHTML = '<div class="ranking-empty"><b>暂无战绩</b><span>完成一次任务后，成绩会记录在这里。</span></div>';
    return;
  }
  ui.rankingList.innerHTML = save.rankings.map((record, index) => `
    <div class="ranking-row">
      <span class="ranking-place">${String(index + 1).padStart(2, '0')}</span>
      <div><b>${record.stage}</b><small>${record.mode === 'coop' ? '双人合作' : '单人模式'} · ${record.ship} · ${record.date}</small></div>
      <em>${String(record.score).padStart(6, '0')}</em>
    </div>`).join('');
}

function upgrade(type) {
  const key = type === 'damage' ? 'damageLevel' : 'armorLevel';
  const cost = 120 * save[key]; if (save[key] >= 5 || save.coins < cost) return;
  save.coins -= cost; save[key]++; sound.pickup(); persist();
}

function selectStage(stageId) {
  if (!STAGES[stageId]) return;
  selectedStageId = stageId;
  const stage = STAGES[stageId];
  document.querySelectorAll('.stage-card').forEach(card => {
    const selected = card.dataset.stage === stageId;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  if (ui.stageBrief) ui.stageBrief.textContent = stage.brief;
}

function selectPlayerMode(mode) {
  if (!['solo', 'coop'].includes(mode)) return;
  selectedPlayerMode = mode;
  document.querySelectorAll('.mode-card').forEach(card => {
    const selected = card.dataset.mode === mode; card.classList.toggle('selected', selected); card.setAttribute('aria-checked', selected ? 'true' : 'false');
  });
}

function selectShip(shipId) {
  if (!SHIPS[shipId]) return;
  selectedShipId = shipId;
  document.querySelectorAll('.ship-card').forEach(card => {
    const selected = card.dataset.ship === shipId; card.classList.toggle('selected', selected); card.setAttribute('aria-checked', selected ? 'true' : 'false');
  });
}

$('#startBtn').addEventListener('click', () => game.start('story'));
$('#endlessBtn').addEventListener('click', () => game.start('endless'));
$('#pauseBtn').addEventListener('click', () => game.pause());
$('#resumeBtn').addEventListener('click', () => game.resume());
$('#restartBtn').addEventListener('click', () => game.start(game.mode));
$('#quitBtn').addEventListener('click', () => game.quit());
$('#againBtn').addEventListener('click', () => game.start(game.mode));
$('#resultMenuBtn').addEventListener('click', () => game.quit());
$('#bombBtn').addEventListener('click', () => game.useBomb());
$('#dashBtn').addEventListener('click', () => game.dash());
$('#p2BombBtn').addEventListener('click', () => game.useBomb(game.player2));
$('#p2DashBtn').addEventListener('click', () => game.dash(game.player2));
$('#hangarBtn').addEventListener('click', () => { refreshMenuData(); ui.hangar.classList.remove('hidden'); });
$('#shopBtn').addEventListener('click', () => { refreshShop(); ui.shop.classList.remove('hidden'); });
$('#badgeBtn').addEventListener('click', () => { refreshBadges(); ui.badge.classList.remove('hidden'); });
$('#helpBtn').addEventListener('click', () => ui.help.classList.remove('hidden'));
$('#rankingBtn').addEventListener('click', () => { refreshRanking(); $('#rankingScreen').classList.remove('hidden'); });
$('#clearRankingBtn').addEventListener('click', () => { save.rankings = []; persist(); refreshRanking(); });
$('#upgradeDamage').addEventListener('click', () => upgrade('damage'));
$('#upgradeArmor').addEventListener('click', () => upgrade('armor'));
document.querySelectorAll('.stage-card').forEach(card => card.addEventListener('click', () => selectStage(card.dataset.stage)));
document.querySelectorAll('.mode-card').forEach(card => card.addEventListener('click', () => selectPlayerMode(card.dataset.mode)));
document.querySelectorAll('.ship-card').forEach(card => card.addEventListener('click', () => selectShip(card.dataset.ship)));
ui.soundBtn.addEventListener('click', () => {
  save.muted = true; sound.muted = true;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  persist();
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(`#${button.dataset.close}`).classList.add('hidden')));

addEventListener('keydown', event => {
  game.keys.add(event.code);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Numpad0', 'Slash', 'NumpadDecimal'].includes(event.code) && game.state === 'playing') event.preventDefault();
  if (event.code === 'Space' && !event.repeat) game.useBomb();
  if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && !event.repeat) game.dash();
  if ((event.code === 'Enter' || event.code === 'Numpad0') && !event.repeat && game.player2) game.useBomb(game.player2);
  if ((event.code === 'Slash' || event.code === 'NumpadDecimal') && !event.repeat && game.player2) game.dash(game.player2);
  if (event.code === 'KeyP' || event.code === 'Escape') game.state === 'playing' ? game.pause() : game.state === 'paused' && game.resume();
});
addEventListener('keyup', event => game.keys.delete(event.code));

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) / rect.width * W, y: (event.clientY - rect.top) / rect.height * H };
}
canvas.addEventListener('pointerdown', event => {
  if (game.state !== 'playing') return;
  const pos = pointerPosition(event);
  const pointer = !game.pointer.active ? game.pointer : game.player2 && !game.pointer2.active ? game.pointer2 : null;
  if (!pointer) return;
  const player = pointer === game.pointer ? game.player : game.player2;
  pointer.active = true; pointer.pointerId = event.pointerId; player.targetX = pos.x; player.targetY = pos.y; canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (game.state !== 'playing') return;
  const pointer = game.pointer.pointerId === event.pointerId ? game.pointer : game.pointer2.pointerId === event.pointerId ? game.pointer2 : null;
  if (!pointer?.active) return;
  const player = pointer === game.pointer ? game.player : game.player2;
  const pos = pointerPosition(event); player.targetX = pos.x; player.targetY = pos.y;
});
function releasePointer(event) {
  const pointer = game.pointer.pointerId === event.pointerId ? game.pointer : game.pointer2.pointerId === event.pointerId ? game.pointer2 : null;
  if (pointer) { pointer.active = false; pointer.pointerId = null; }
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'playing') game.pause(); });

resize(); refreshMenuData(); selectStage(selectedStageId); selectPlayerMode(selectedPlayerMode); selectShip(selectedShipId); refreshRanking(); requestAnimationFrame(t => { game.last = t; game.loop(t); });
