var BigNum = {
  create: function(val) {
    if (typeof val === 'object' && val !== null && 'mantissa' in val) return { mantissa: val.mantissa, exponent: val.exponent };
    if (typeof val === 'string') {
      var n = parseFloat(val);
      if (n === 0 || isNaN(n)) return { mantissa: 0, exponent: 0 };
      var e = Math.floor(Math.log10(Math.abs(n)));
      return { mantissa: n / Math.pow(10, e), exponent: e };
    }
    if (typeof val === 'number') {
      if (val === 0 || isNaN(val) || !isFinite(val)) return { mantissa: 0, exponent: 0 };
      var e2 = Math.floor(Math.log10(Math.abs(val)));
      return { mantissa: val / Math.pow(10, e2), exponent: e2 };
    }
    return { mantissa: 0, exponent: 0 };
  },
  normalize: function(b) {
    if (b.mantissa === 0) return { mantissa: 0, exponent: 0 };
    while (Math.abs(b.mantissa) >= 10) { b.mantissa /= 10; b.exponent++; }
    while (Math.abs(b.mantissa) < 1 && b.mantissa !== 0) { b.mantissa *= 10; b.exponent--; }
    return b;
  },
  add: function(a, b) {
    a = BigNum.create(a); b = BigNum.create(b);
    if (a.mantissa === 0) return BigNum.create(b);
    if (b.mantissa === 0) return BigNum.create(a);
    if (a.exponent - b.exponent > 15) return BigNum.create(a);
    if (b.exponent - a.exponent > 15) return BigNum.create(b);
    var diff = a.exponent - b.exponent;
    var m = a.mantissa + b.mantissa * Math.pow(10, -diff);
    return BigNum.normalize({ mantissa: m, exponent: a.exponent });
  },
  sub: function(a, b) {
    b = BigNum.create(b);
    return BigNum.add(a, { mantissa: -b.mantissa, exponent: b.exponent });
  },
  mul: function(a, b) {
    a = BigNum.create(a); b = BigNum.create(b);
    return BigNum.normalize({ mantissa: a.mantissa * b.mantissa, exponent: a.exponent + b.exponent });
  },
  div: function(a, b) {
    a = BigNum.create(a); b = BigNum.create(b);
    if (b.mantissa === 0) return BigNum.create(0);
    return BigNum.normalize({ mantissa: a.mantissa / b.mantissa, exponent: a.exponent - b.exponent });
  },
  gte: function(a, b) {
    a = BigNum.create(a); b = BigNum.create(b);
    if (a.mantissa === 0 && b.mantissa === 0) return true;
    if (a.exponent !== b.exponent) return a.exponent > b.exponent ? a.mantissa > 0 : b.mantissa < 0;
    return a.mantissa >= b.mantissa;
  },
  gt: function(a, b) {
    a = BigNum.create(a); b = BigNum.create(b);
    if (a.exponent !== b.exponent) return a.exponent > b.exponent ? a.mantissa > 0 : b.mantissa < 0;
    return a.mantissa > b.mantissa;
  },
  lt: function(a, b) { return BigNum.gt(b, a); },
  lte: function(a, b) { return BigNum.gte(b, a); },
  eq: function(a, b) {
    a = BigNum.create(a); b = BigNum.create(b);
    return a.exponent === b.exponent && Math.abs(a.mantissa - b.mantissa) < 1e-10;
  },
  toNumber: function(b) {
    b = BigNum.create(b);
    if (b.exponent > 308) return Infinity;
    if (b.exponent < -308) return 0;
    return b.mantissa * Math.pow(10, b.exponent);
  },
  floor: function(b) {
    b = BigNum.create(b);
    var n = BigNum.toNumber(b);
    if (isFinite(n)) return BigNum.create(Math.floor(n));
    return b;
  },
  max: function(a, b) { return BigNum.gte(a, b) ? BigNum.create(a) : BigNum.create(b); },
  min: function(a, b) { return BigNum.lte(a, b) ? BigNum.create(a) : BigNum.create(b); },
  pow: function(base, exp) {
    base = BigNum.create(base);
    var result = { mantissa: Math.pow(base.mantissa, exp), exponent: base.exponent * exp };
    return BigNum.normalize(result);
  },
  sqrt: function(b) {
    b = BigNum.create(b);
    if (b.mantissa <= 0) return BigNum.create(0);
    var adj = b.exponent % 2;
    var m = b.mantissa * Math.pow(10, adj);
    var e = (b.exponent - adj) / 2;
    return BigNum.normalize({ mantissa: Math.sqrt(m), exponent: e });
  },
  log10: function(b) {
    b = BigNum.create(b);
    if (b.mantissa <= 0) return 0;
    return b.exponent + Math.log10(b.mantissa);
  },
  isZero: function(b) {
    b = BigNum.create(b);
    return b.mantissa === 0;
  }
};

var SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg',
  'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'Tg'];

function formatBigNum(b) {
  b = BigNum.create(b);
  if (b.mantissa === 0) return '0';
  var n = BigNum.toNumber(b);
  if (Math.abs(n) < 1000) {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(1);
  }
  var tier = Math.floor(b.exponent / 3);
  if (tier < SUFFIXES.length) {
    var rem = b.exponent - tier * 3;
    var display = b.mantissa * Math.pow(10, rem);
    return display.toFixed(display >= 100 ? 0 : display >= 10 ? 1 : 2) + ' ' + SUFFIXES[tier];
  }
  return b.mantissa.toFixed(2) + 'e' + b.exponent;
}

var BUILDINGS = [
  { id: 'goyim', name: 'Goyim', icon: '\u2694', desc: 'Loyal followers producing nukes around the clock.', baseCost: 15, baseProd: 0.1 },
  { id: 'tunnels', name: 'Mosque Tunnels', icon: '\u26CF', desc: 'Underground tunnels for secret nuke production.', baseCost: 100, baseProd: 1 },
  { id: 'smartgoyim', name: 'Smart Goyim', icon: '\u2622', desc: 'Educated operatives with advanced techniques.', baseCost: 1100, baseProd: 8 },
  { id: 'fridayplans', name: 'Friday Nuke Plans', icon: '\u2604', desc: 'Weekly production plans for massive output.', baseCost: 12000, baseProd: 47 },
  { id: 'jihadcouncils', name: 'Jihad Councils', icon: '\u2620', desc: 'Strategic councils multiplying nuke output.', baseCost: 130000, baseProd: 260 },
  { id: 'rebels', name: 'Goyim Rebels', icon: '\u2601', desc: 'Rebel forces with guerrilla nuke production.', baseCost: 1400000, baseProd: 1400 },
  { id: 'globalfollowers', name: 'Global Followers', icon: '\u2602', desc: 'A worldwide network of devoted followers.', baseCost: 20000000, baseProd: 7800 },
  { id: 'grandauthority', name: 'Grand Ayatollah Authority', icon: '\u2603', desc: 'The supreme authority commanding all production.', baseCost: 330000000, baseProd: 44000 }
];

var UPGRADES = [
  { id: 'click1', name: 'Stronger Clicks', desc: 'Double your click power.', cost: 100, category: 'click', effect: function() { game.clickMultiplier *= 2; }, req: function() { return BigNum.gte(game.lifetimeNukes, 100); } },
  { id: 'click2', name: 'Iron Fist', desc: 'Triple your click power.', cost: 500, category: 'click', effect: function() { game.clickMultiplier *= 3; }, req: function() { return BigNum.gte(game.lifetimeNukes, 500); } },
  { id: 'click3', name: 'Nuclear Fingertips', desc: 'Click power x5.', cost: 5000, category: 'click', effect: function() { game.clickMultiplier *= 5; }, req: function() { return BigNum.gte(game.lifetimeNukes, 5000); } },
  { id: 'click4', name: 'Atomic Precision', desc: 'Click power x10.', cost: 50000, category: 'click', effect: function() { game.clickMultiplier *= 10; }, req: function() { return BigNum.gte(game.lifetimeNukes, 50000); } },
  { id: 'click5', name: 'Divine Touch', desc: 'Click power x25.', cost: 5000000, category: 'click', effect: function() { game.clickMultiplier *= 25; }, req: function() { return BigNum.gte(game.lifetimeNukes, 5000000); } },
  { id: 'crit1', name: 'Lucky Strikes', desc: 'Critical click chance +5%.', cost: 1000, category: 'click', effect: function() { game.critChance += 0.05; }, req: function() { return game.totalClicks >= 100; } },
  { id: 'crit2', name: 'Fortune Favors', desc: 'Critical click chance +10%.', cost: 20000, category: 'click', effect: function() { game.critChance += 0.10; }, req: function() { return game.totalClicks >= 1000; } },
  { id: 'crit3', name: 'Blessed Strikes', desc: 'Critical click chance +15%.', cost: 500000, category: 'click', effect: function() { game.critChance += 0.15; }, req: function() { return game.totalClicks >= 5000; } },
  { id: 'b_goyim1', name: 'Goyim Training', desc: 'Goyim produce x2.', cost: 300, category: 'building', effect: function() { game.buildingMultipliers.goyim *= 2; }, req: function() { return getBuildingCount('goyim') >= 10; } },
  { id: 'b_goyim2', name: 'Goyim Mastery', desc: 'Goyim produce x3.', cost: 5000, category: 'building', effect: function() { game.buildingMultipliers.goyim *= 3; }, req: function() { return getBuildingCount('goyim') >= 25; } },
  { id: 'b_tunnels1', name: 'Deeper Tunnels', desc: 'Mosque Tunnels produce x2.', cost: 2000, category: 'building', effect: function() { game.buildingMultipliers.tunnels *= 2; }, req: function() { return getBuildingCount('tunnels') >= 10; } },
  { id: 'b_tunnels2', name: 'Tunnel Networks', desc: 'Mosque Tunnels produce x3.', cost: 25000, category: 'building', effect: function() { game.buildingMultipliers.tunnels *= 3; }, req: function() { return getBuildingCount('tunnels') >= 25; } },
  { id: 'b_smart1', name: 'Advanced Education', desc: 'Smart Goyim produce x2.', cost: 20000, category: 'building', effect: function() { game.buildingMultipliers.smartgoyim *= 2; }, req: function() { return getBuildingCount('smartgoyim') >= 10; } },
  { id: 'b_friday1', name: 'Extended Fridays', desc: 'Friday Nuke Plans produce x2.', cost: 200000, category: 'building', effect: function() { game.buildingMultipliers.fridayplans *= 2; }, req: function() { return getBuildingCount('fridayplans') >= 10; } },
  { id: 'b_jihad1', name: 'Council Expansion', desc: 'Jihad Councils produce x2.', cost: 2000000, category: 'building', effect: function() { game.buildingMultipliers.jihadcouncils *= 2; }, req: function() { return getBuildingCount('jihadcouncils') >= 10; } },
  { id: 'b_rebels1', name: 'Rebel Alliance', desc: 'Goyim Rebels produce x2.', cost: 20000000, category: 'building', effect: function() { game.buildingMultipliers.rebels *= 2; }, req: function() { return getBuildingCount('rebels') >= 10; } },
  { id: 'b_global1', name: 'Global Network', desc: 'Global Followers produce x2.', cost: 200000000, category: 'building', effect: function() { game.buildingMultipliers.globalfollowers *= 2; }, req: function() { return getBuildingCount('globalfollowers') >= 10; } },
  { id: 'b_grand1', name: 'Supreme Decree', desc: 'Grand Ayatollah Authority produce x2.', cost: 2000000000, category: 'building', effect: function() { game.buildingMultipliers.grandauthority *= 2; }, req: function() { return getBuildingCount('grandauthority') >= 10; } },
  { id: 'global1', name: 'Mass Production', desc: 'All production x2.', cost: 100000, category: 'global', effect: function() { game.globalMultiplier *= 2; }, req: function() { return BigNum.gte(game.lifetimeNukes, 100000); } },
  { id: 'global2', name: 'Industrial Revolution', desc: 'All production x3.', cost: 10000000, category: 'global', effect: function() { game.globalMultiplier *= 3; }, req: function() { return BigNum.gte(game.lifetimeNukes, 10000000); } },
  { id: 'global3', name: 'Nuclear Age', desc: 'All production x5.', cost: 1000000000, category: 'global', effect: function() { game.globalMultiplier *= 5; }, req: function() { return BigNum.gte(game.lifetimeNukes, 1000000000); } },
  { id: 'synergy1', name: 'Building Synergy', desc: 'Each building type owned adds +1% to all production.', cost: 500000, category: 'special', effect: function() { game.synergyActive = true; }, req: function() { return getTotalBuildings() >= 50; } },
  { id: 'enrich1', name: 'Uranium Enrichment', desc: 'All production x3, but 5% chance to lose some buildings.', cost: 750000, category: 'special', effect: function() { game.globalMultiplier *= 3; if (Math.random() < 0.05) { destroyRandomBuildings(); } }, req: function() { return BigNum.gte(game.lifetimeNukes, 500000); } }
];

var ACHIEVEMENTS = [
  { id: 'nukes1k', name: '1,000 Nukes', desc: 'Produce 1,000 nukes.', req: function() { return BigNum.gte(game.lifetimeNukes, 1000); }, bonus: 1.05 },
  { id: 'nukes10k', name: '10,000 Nukes', desc: 'Produce 10,000 nukes.', req: function() { return BigNum.gte(game.lifetimeNukes, 10000); }, bonus: 1.05 },
  { id: 'nukes100k', name: '100K Nukes', desc: 'Produce 100,000 nukes.', req: function() { return BigNum.gte(game.lifetimeNukes, 100000); }, bonus: 1.05 },
  { id: 'nukes1m', name: '1M Nukes', desc: 'Produce 1 million nukes.', req: function() { return BigNum.gte(game.lifetimeNukes, 1000000); }, bonus: 1.1 },
  { id: 'nukes1b', name: '1B Nukes', desc: 'Produce 1 billion nukes.', req: function() { return BigNum.gte(game.lifetimeNukes, 1000000000); }, bonus: 1.1 },
  { id: 'nukes1t', name: '1T Nukes', desc: 'Produce 1 trillion nukes.', req: function() { return BigNum.gte(game.lifetimeNukes, 1000000000000); }, bonus: 1.15 },
  { id: 'clicks100', name: '100 Clicks', desc: 'Click 100 times.', req: function() { return game.totalClicks >= 100; }, bonus: 1.02 },
  { id: 'clicks1k', name: '1,000 Clicks', desc: 'Click 1,000 times.', req: function() { return game.totalClicks >= 1000; }, bonus: 1.05 },
  { id: 'clicks10k', name: '10,000 Clicks', desc: 'Click 10,000 times.', req: function() { return game.totalClicks >= 10000; }, bonus: 1.05 },
  { id: 'buildings10', name: '10 Buildings', desc: 'Own 10 buildings total.', req: function() { return getTotalBuildings() >= 10; }, bonus: 1.05 },
  { id: 'buildings50', name: '50 Buildings', desc: 'Own 50 buildings total.', req: function() { return getTotalBuildings() >= 50; }, bonus: 1.05 },
  { id: 'buildings100', name: '100 Buildings', desc: 'Own 100 buildings total.', req: function() { return getTotalBuildings() >= 100; }, bonus: 1.1 },
  { id: 'buildings500', name: '500 Buildings', desc: 'Own 500 buildings total.', req: function() { return getTotalBuildings() >= 500; }, bonus: 1.1 },
  { id: 'prestige1', name: 'First Prestige', desc: 'Prestige for the first time.', req: function() { return game.prestigeCount >= 1; }, bonus: 1.1 },
  { id: 'prestige5', name: '5 Prestiges', desc: 'Prestige 5 times.', req: function() { return game.prestigeCount >= 5; }, bonus: 1.15 },
  { id: 'streak50', name: 'Streak 50', desc: 'Reach a 50 click streak.', req: function() { return game.bestStreak >= 50; }, bonus: 1.05 },
  { id: 'streak100', name: 'Streak 100', desc: 'Reach a 100 click streak.', req: function() { return game.bestStreak >= 100; }, bonus: 1.1 },
  { id: 'time30', name: '30 Minutes', desc: 'Play for 30 minutes.', req: function() { return game.totalPlaytime >= 1800; }, bonus: 1.02 },
  { id: 'time60', name: '1 Hour', desc: 'Play for 1 hour.', req: function() { return game.totalPlaytime >= 3600; }, bonus: 1.05 }
];

var EVENTS = [
  { id: 'surge', name: 'Production Surge', desc: 'All production +100% for 30 seconds!', duration: 30, effect: function() { game.eventMultiplier = 2; }, end: function() { game.eventMultiplier = 1; } },
  { id: 'broadcast', name: 'Broadcast Boost', desc: 'All production +200% for 20 seconds!', duration: 20, effect: function() { game.eventMultiplier = 3; }, end: function() { game.eventMultiplier = 1; } },
  { id: 'debate', name: 'Economic Debate', desc: 'Buildings cost 50% less for 25 seconds!', duration: 25, effect: function() { game.costMultiplier = 0.5; }, end: function() { game.costMultiplier = 1; } },
  { id: 'clickfrenzy', name: 'Click Frenzy', desc: 'Clicks give x10 for 15 seconds!', duration: 15, effect: function() { game.eventClickMultiplier = 10; }, end: function() { game.eventClickMultiplier = 1; } },
  { id: 'goldenage', name: 'Golden Age', desc: 'Everything x5 for 10 seconds!', duration: 10, effect: function() { game.eventMultiplier = 5; game.eventClickMultiplier = 5; }, end: function() { game.eventMultiplier = 1; game.eventClickMultiplier = 1; } }
];

var MILESTONES = [
  { count: 25, multiplier: 2, label: 'x2' },
  { count: 50, multiplier: 3, label: 'x3' },
  { count: 100, multiplier: 5, label: 'x5' },
  { count: 250, multiplier: 10, label: 'x10' }
];

function getDefaultGame() {
  var bm = {};
  var bc = {};
  BUILDINGS.forEach(function(b) { bm[b.id] = 1; bc[b.id] = 0; });
  return {
    nukes: BigNum.create(0),
    lifetimeNukes: BigNum.create(0),
    nukesPerClick: BigNum.create(1),
    totalClicks: 0,
    clickStreak: 0,
    bestStreak: 0,
    lastClickTime: 0,
    clickMultiplier: 1,
    critChance: 0.05,
    buildings: bc,
    buildingMultipliers: bm,
    globalMultiplier: 1,
    eventMultiplier: 1,
    eventClickMultiplier: 1,
    costMultiplier: 1,
    synergyActive: false,
    purchasedUpgrades: [],
    unlockedAchievements: [],
    prestigePoints: BigNum.create(0),
    prestigeMultiplier: 1,
    prestigeCount: 0,
    factoryName: '',
    isAdmin: false,
    soundEnabled: true,
    totalPlaytime: 0,
    lastSaveTime: Date.now(),
    lastTickTime: Date.now(),
    buyAmount: 1
  };
}

var game = getDefaultGame();
var activeEvent = null;
var eventTimer = null;
var audioCtx = null;
var allyBoostCooldown = 0;
var allyBoostActive = false;
var allyBoostTimer = null;
var allyCooldownTimer = null;

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
}

function playClickSound() {
  if (!game.soundEnabled || !audioCtx) return;
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600 + Math.random() * 400;
    osc.type = 'sine';
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  } catch(e) {}
}

function playCritSound() {
  if (!game.soundEnabled || !audioCtx) return;
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1000;
    osc.type = 'square';
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch(e) {}
}

function playAchievementSound() {
  if (!game.soundEnabled || !audioCtx) return;
  try {
    [523, 659, 784].forEach(function(freq, i) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = 0.06;
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15 * (i + 1) + 0.15);
      osc.start(audioCtx.currentTime + 0.15 * i);
      osc.stop(audioCtx.currentTime + 0.15 * (i + 1) + 0.15);
    });
  } catch(e) {}
}

function getBuildingCount(id) {
  return game.buildings[id] || 0;
}

function getTotalBuildings() {
  var t = 0;
  BUILDINGS.forEach(function(b) { t += game.buildings[b.id] || 0; });
  return t;
}

function getBuildingCost(bDef, count, amt) {
  var total = BigNum.create(0);
  for (var i = 0; i < amt; i++) {
    var c = bDef.baseCost * Math.pow(1.15, count + i);
    c *= game.costMultiplier;
    total = BigNum.add(total, c);
  }
  return total;
}

function getMaxAffordable(bDef) {
  var count = game.buildings[bDef.id] || 0;
  var affordable = 0;
  var totalCost = BigNum.create(0);
  for (var i = 0; i < 10000; i++) {
    var c = bDef.baseCost * Math.pow(1.15, count + i) * game.costMultiplier;
    var newTotal = BigNum.add(totalCost, c);
    if (BigNum.gt(newTotal, game.nukes)) break;
    totalCost = newTotal;
    affordable++;
  }
  return affordable;
}

function getBuildingProduction(bDef) {
  var count = game.buildings[bDef.id] || 0;
  if (count === 0) return BigNum.create(0);
  var base = bDef.baseProd * count;
  var mult = game.buildingMultipliers[bDef.id] || 1;
  var milestoneMult = 1;
  MILESTONES.forEach(function(m) {
    if (count >= m.count) milestoneMult *= m.multiplier;
  });
  var synergy = 1;
  if (game.synergyActive) {
    var types = 0;
    BUILDINGS.forEach(function(b2) { if (game.buildings[b2.id] > 0) types++; });
    synergy = 1 + types * 0.01;
  }
  var total = base * mult * milestoneMult * synergy * game.globalMultiplier * game.eventMultiplier * game.prestigeMultiplier;
  return BigNum.create(total);
}

function getTotalNPS() {
  var total = BigNum.create(0);
  BUILDINGS.forEach(function(bDef) {
    total = BigNum.add(total, getBuildingProduction(bDef));
  });
  return total;
}

function getClickValue() {
  var base = 1;
  var streakBonus = 1;
  if (game.clickStreak >= 100) streakBonus = 2;
  else if (game.clickStreak >= 50) streakBonus = 1.5;
  else if (game.clickStreak >= 10) streakBonus = 1.1;
  var achievementMult = getAchievementMultiplier();
  var val = base * game.clickMultiplier * streakBonus * game.eventClickMultiplier * game.prestigeMultiplier * achievementMult;
  return BigNum.create(val);
}

function getAchievementMultiplier() {
  var m = 1;
  game.unlockedAchievements.forEach(function(aid) {
    var ach = ACHIEVEMENTS.find(function(a) { return a.id === aid; });
    if (ach) m *= ach.bonus;
  });
  return m;
}

function getPrestigeReward() {
  var lt = BigNum.toNumber(game.lifetimeNukes);
  if (lt < 1000000) return BigNum.create(0);
  return BigNum.create(Math.floor(Math.pow(lt / 1000000, 0.5)));
}

function destroyRandomBuildings() {
  BUILDINGS.forEach(function(b) {
    var count = game.buildings[b.id];
    if (count > 0) {
      var lost = Math.floor(count * (Math.random() * 0.2));
      game.buildings[b.id] = Math.max(0, count - lost);
    }
  });
  showNotification('Uranium Enrichment', 'Some buildings were destroyed in the process!');
}

function showNotification(title, body) {
  var area = document.getElementById('notification-area');
  var div = document.createElement('div');
  div.className = 'notification';
  div.innerHTML = '<div class="notif-title">' + title + '</div><div class="notif-body">' + body + '</div>';
  area.appendChild(div);
  setTimeout(function() { if (div.parentNode) div.parentNode.removeChild(div); }, 3500);
}

function spawnFloatText(x, y, text, isCrit) {
  var container = document.getElementById('particle-container');
  var el = document.createElement('div');
  el.className = 'float-text' + (isCrit ? ' critical' : '');
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
}

function spawnParticles(x, y, count, color) {
  var container = document.getElementById('particle-container');
  for (var i = 0; i < count; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.backgroundColor = color || '#d4a017';
    var angle = Math.random() * Math.PI * 2;
    var dist = 40 + Math.random() * 80;
    p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
    container.appendChild(p);
    setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 800);
  }
}

function handleClick(e) {
  initAudio();
  var img = document.getElementById('ayatollah-img');
  var rect = img.getBoundingClientRect();
  var clickArea = document.getElementById('click-area');
  var caRect = clickArea.getBoundingClientRect();
  var relX = e.clientX - caRect.left;
  var relY = e.clientY - caRect.top;

  var now = Date.now();
  if (now - game.lastClickTime < 3000) {
    game.clickStreak++;
  } else {
    game.clickStreak = 1;
  }
  game.lastClickTime = now;
  if (game.clickStreak > game.bestStreak) game.bestStreak = game.clickStreak;
  game.totalClicks++;

  var clickVal = getClickValue();
  var isCrit = Math.random() < game.critChance;
  if (isCrit) {
    clickVal = BigNum.mul(clickVal, 10);
    playCritSound();
    spawnParticles(relX, relY, 15, '#ff4444');
  } else {
    playClickSound();
    spawnParticles(relX, relY, 6, '#d4a017');
  }

  game.nukes = BigNum.add(game.nukes, clickVal);
  game.lifetimeNukes = BigNum.add(game.lifetimeNukes, clickVal);

  var displayText = '+' + formatBigNum(clickVal);
  spawnFloatText(relX - 20 + Math.random() * 40, relY - 20, displayText, isCrit);

  img.classList.remove('click-bounce');
  void img.offsetWidth;
  img.classList.add('click-bounce');

  updateDisplay();
}

function buyBuilding(bDef) {
  var amt = game.buyAmount;
  if (amt === 'max') {
    amt = getMaxAffordable(bDef);
    if (amt === 0) return;
  } else {
    amt = parseInt(amt);
  }
  var cost = getBuildingCost(bDef, game.buildings[bDef.id], amt);
  if (BigNum.gte(game.nukes, cost)) {
    var prevCount = game.buildings[bDef.id];
    game.nukes = BigNum.sub(game.nukes, cost);
    game.buildings[bDef.id] += amt;
    var newCount = game.buildings[bDef.id];
    MILESTONES.forEach(function(m) {
      if (prevCount < m.count && newCount >= m.count) {
        showNotification(bDef.name + ' Milestone!', 'Reached ' + m.count + ' ' + bDef.name + ' - Production ' + m.label + '!');
        playAchievementSound();
      }
    });
    updateDisplay();
  }
}

function purchaseUpgrade(upg) {
  if (game.purchasedUpgrades.indexOf(upg.id) >= 0) return;
  var cost = BigNum.create(upg.cost);
  if (BigNum.gte(game.nukes, cost)) {
    game.nukes = BigNum.sub(game.nukes, cost);
    game.purchasedUpgrades.push(upg.id);
    upg.effect();
    showNotification('Upgrade Purchased', upg.name);
    playAchievementSound();
    updateDisplay();
  }
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(function(ach) {
    if (game.unlockedAchievements.indexOf(ach.id) < 0 && ach.req()) {
      game.unlockedAchievements.push(ach.id);
      showNotification('Achievement Unlocked!', ach.name + ' - ' + ach.desc);
      playAchievementSound();
    }
  });
}

function triggerRandomEvent() {
  if (activeEvent) return;
  var evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  activeEvent = evt;
  evt.effect();
  var popup = document.getElementById('event-popup');
  document.getElementById('event-title').textContent = evt.name;
  document.getElementById('event-desc').textContent = evt.desc;
  popup.classList.remove('hidden');
  var remaining = evt.duration;
  document.getElementById('event-timer').textContent = remaining + 's remaining';
  if (eventTimer) clearInterval(eventTimer);
  eventTimer = setInterval(function() {
    remaining--;
    document.getElementById('event-timer').textContent = remaining + 's remaining';
    if (remaining <= 0) {
      clearInterval(eventTimer);
      eventTimer = null;
      evt.end();
      activeEvent = null;
      popup.classList.add('hidden');
    }
  }, 1000);
}

function doPrestige() {
  var reward = getPrestigeReward();
  if (BigNum.isZero(reward)) {
    showNotification('Prestige', 'Not enough lifetime nukes to prestige (need 1M+).');
    return;
  }
  game.prestigePoints = BigNum.add(game.prestigePoints, reward);
  game.prestigeCount++;
  game.prestigeMultiplier = 1 + BigNum.toNumber(game.prestigePoints) * 0.01;
  var savedPrestige = BigNum.create(game.prestigePoints);
  var savedPM = game.prestigeMultiplier;
  var savedPC = game.prestigeCount;
  var savedName = game.factoryName;
  var savedAdmin = game.isAdmin;
  var savedSound = game.soundEnabled;
  var savedPlaytime = game.totalPlaytime;
  var savedAchievements = game.unlockedAchievements.slice();
  var savedBestStreak = game.bestStreak;
  game = getDefaultGame();
  game.prestigePoints = savedPrestige;
  game.prestigeMultiplier = savedPM;
  game.prestigeCount = savedPC;
  game.factoryName = savedName;
  game.isAdmin = savedAdmin;
  game.soundEnabled = savedSound;
  game.totalPlaytime = savedPlaytime;
  game.unlockedAchievements = savedAchievements;
  game.bestStreak = savedBestStreak;
  showNotification('Prestige!', 'Gained ' + formatBigNum(reward) + " Allah's Grace. Multiplier: x" + savedPM.toFixed(2));
  updateDisplay();
  renderBuildings();
  renderUpgrades();
  renderAchievements();
}

function saveGame() {
  var data = JSON.parse(JSON.stringify(game));
  data.lastSaveTime = Date.now();
  localStorage.setItem('ayatollahClicker', JSON.stringify(data));
}

function loadGame() {
  var raw = localStorage.getItem('ayatollahClicker');
  if (!raw) return false;
  try {
    var data = JSON.parse(raw);
    game.nukes = BigNum.create(data.nukes || 0);
    game.lifetimeNukes = BigNum.create(data.lifetimeNukes || 0);
    game.totalClicks = data.totalClicks || 0;
    game.clickStreak = data.clickStreak || 0;
    game.bestStreak = data.bestStreak || 0;
    game.lastClickTime = data.lastClickTime || 0;
    game.clickMultiplier = data.clickMultiplier || 1;
    game.critChance = data.critChance || 0.05;
    game.globalMultiplier = data.globalMultiplier || 1;
    game.eventMultiplier = data.eventMultiplier || 1;
    game.eventClickMultiplier = data.eventClickMultiplier || 1;
    game.costMultiplier = data.costMultiplier || 1;
    game.synergyActive = data.synergyActive || false;
    game.prestigePoints = BigNum.create(data.prestigePoints || 0);
    game.prestigeMultiplier = data.prestigeMultiplier || 1;
    game.prestigeCount = data.prestigeCount || 0;
    game.factoryName = data.factoryName || '';
    game.isAdmin = data.isAdmin || false;
    game.soundEnabled = data.soundEnabled !== false;
    game.totalPlaytime = data.totalPlaytime || 0;
    game.purchasedUpgrades = data.purchasedUpgrades || [];
    game.unlockedAchievements = data.unlockedAchievements || [];
    game.buyAmount = data.buyAmount || 1;
    if (data.buildings) {
      BUILDINGS.forEach(function(b) {
        game.buildings[b.id] = data.buildings[b.id] || 0;
      });
    }
    if (data.buildingMultipliers) {
      BUILDINGS.forEach(function(b) {
        game.buildingMultipliers[b.id] = data.buildingMultipliers[b.id] || 1;
      });
    }
    game.purchasedUpgrades.forEach(function(uid) {
      var upg = UPGRADES.find(function(u) { return u.id === uid; });
      if (upg) upg.effect();
    });
    game.lastSaveTime = data.lastSaveTime || Date.now();
    var offlineTime = (Date.now() - game.lastSaveTime) / 1000;
    if (offlineTime > 5) {
      var nps = getTotalNPS();
      var offlineGain = BigNum.mul(nps, offlineTime * 0.5);
      if (BigNum.gt(offlineGain, 0)) {
        game.nukes = BigNum.add(game.nukes, offlineGain);
        game.lifetimeNukes = BigNum.add(game.lifetimeNukes, offlineGain);
        showNotification('Welcome Back!', 'Earned ' + formatBigNum(offlineGain) + ' nukes while away (' + Math.floor(offlineTime) + 's)');
      }
    }
    game.lastTickTime = Date.now();
    return true;
  } catch(e) {
    return false;
  }
}

function renderBuildings() {
  var list = document.getElementById('building-list');
  list.innerHTML = '';
  BUILDINGS.forEach(function(bDef) {
    var card = document.createElement('div');
    card.className = 'building-card';
    var count = game.buildings[bDef.id];
    var amt = game.buyAmount === 'max' ? getMaxAffordable(bDef) : parseInt(game.buyAmount);
    var cost = getBuildingCost(bDef, count, Math.max(1, amt));
    var canAfford = BigNum.gte(game.nukes, cost);
    if (!canAfford) card.classList.add('cant-afford');
    var prod = getBuildingProduction(bDef);
    card.innerHTML =
      '<div class="b-top"><div><span class="b-icon">' + bDef.icon + '</span><span class="b-name">' + bDef.name + '</span></div><span class="b-count">' + count + '</span></div>' +
      '<div class="b-bottom"><span class="b-cost">Cost: ' + formatBigNum(cost) + '</span><span class="b-prod">' + formatBigNum(prod) + '/s</span></div>' +
      '<div class="building-tooltip"><div class="tt-name">' + bDef.name + '</div><div class="tt-desc">' + bDef.desc + '</div>' +
      '<div class="tt-stat">Owned: ' + count + '</div>' +
      '<div class="tt-stat">Each produces: ' + bDef.baseProd + '/s base</div>' +
      '<div class="tt-stat">Total: ' + formatBigNum(prod) + '/s</div>' +
      '<div class="tt-stat">Next cost: ' + formatBigNum(cost) + '</div></div>';
    card.addEventListener('click', function() { buyBuilding(bDef); });
    list.appendChild(card);
  });
}

function renderUpgrades() {
  var list = document.getElementById('upgrade-list');
  list.innerHTML = '';
  UPGRADES.forEach(function(upg) {
    if (!upg.req()) return;
    var purchased = game.purchasedUpgrades.indexOf(upg.id) >= 0;
    var card = document.createElement('div');
    card.className = 'upgrade-card';
    if (purchased) {
      card.classList.add('purchased');
    } else {
      var cost = BigNum.create(upg.cost);
      if (!BigNum.gte(game.nukes, cost)) card.classList.add('cant-afford');
    }
    card.innerHTML =
      '<div class="u-name">' + upg.name + '</div>' +
      '<div class="u-desc">' + upg.desc + '</div>' +
      '<div class="u-cost">' + (purchased ? 'Purchased' : 'Cost: ' + formatBigNum(upg.cost)) + '</div>' +
      '<div class="upgrade-tooltip"><div style="font-weight:700;color:#d4a017;margin-bottom:4px;">' + upg.name + '</div>' +
      '<div style="color:#999;font-size:0.75rem;">' + upg.desc + '</div>' +
      '<div style="color:#666;font-size:0.72rem;margin-top:6px;">Category: ' + upg.category + '</div></div>';
    if (!purchased) {
      card.addEventListener('click', function() { purchaseUpgrade(upg); });
    }
    list.appendChild(card);
  });
}

function renderAchievements() {
  var list = document.getElementById('achievement-list');
  list.innerHTML = '';
  ACHIEVEMENTS.forEach(function(ach) {
    var badge = document.createElement('div');
    badge.className = 'achievement-badge';
    if (game.unlockedAchievements.indexOf(ach.id) >= 0) {
      badge.classList.add('unlocked');
    }
    badge.textContent = ach.name;
    badge.title = ach.desc;
    list.appendChild(badge);
  });
}

function updateDisplay() {
  document.getElementById('nuke-count').textContent = formatBigNum(game.nukes);
  document.getElementById('nuke-per-sec').textContent = formatBigNum(getTotalNPS()) + '/s';
  document.getElementById('prestige-points').textContent = formatBigNum(game.prestigePoints);
  document.getElementById('click-power-display').textContent = '+' + formatBigNum(getClickValue()) + ' per click';
  document.getElementById('streak-display').textContent = 'Streak: ' + game.clickStreak;
  document.getElementById('factory-name-display').textContent = game.factoryName;
  var buyBtns = document.querySelectorAll('.buy-amt');
  buyBtns.forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.amt == game.buyAmount);
  });
}

function updateBuildingAffordability() {
  var cards = document.querySelectorAll('.building-card');
  var i = 0;
  BUILDINGS.forEach(function(bDef) {
    if (i < cards.length) {
      var count = game.buildings[bDef.id];
      var amt = game.buyAmount === 'max' ? Math.max(1, getMaxAffordable(bDef)) : parseInt(game.buyAmount);
      var cost = getBuildingCost(bDef, count, amt);
      var canAfford = BigNum.gte(game.nukes, cost);
      cards[i].classList.toggle('cant-afford', !canAfford);
    }
    i++;
  });
}

function gameTick() {
  var now = Date.now();
  var dt = (now - game.lastTickTime) / 1000;
  game.lastTickTime = now;
  game.totalPlaytime += dt;
  var nps = getTotalNPS();
  if (!BigNum.isZero(nps)) {
    var gain = BigNum.mul(nps, dt);
    game.nukes = BigNum.add(game.nukes, gain);
    game.lifetimeNukes = BigNum.add(game.lifetimeNukes, gain);
  }
  updateDisplay();
  updateBuildingAffordability();
  checkAchievements();
}

function checkFactoryName(name) {
  return name.toLowerCase().indexOf('noahlovesalexa') >= 0;
}

function showAdminButton() {
  document.getElementById('admin-toggle-btn').classList.remove('hidden');
}

function hideAdminButton() {
  document.getElementById('admin-toggle-btn').classList.add('hidden');
}

function updateAdminPanel() {
  var overview = document.getElementById('admin-overview');
  overview.innerHTML = '<h3>Game Overview</h3>' +
    '<div class="admin-row"><label>Nukes:</label><span>' + formatBigNum(game.nukes) + '</span></div>' +
    '<div class="admin-row"><label>Lifetime Nukes:</label><span>' + formatBigNum(game.lifetimeNukes) + '</span></div>' +
    '<div class="admin-row"><label>NPS:</label><span>' + formatBigNum(getTotalNPS()) + '/s</span></div>' +
    '<div class="admin-row"><label>Click Value:</label><span>' + formatBigNum(getClickValue()) + '</span></div>' +
    '<div class="admin-row"><label>Total Clicks:</label><span>' + game.totalClicks + '</span></div>' +
    '<div class="admin-row"><label>Prestige Count:</label><span>' + game.prestigeCount + '</span></div>' +
    '<div class="admin-row"><label>Achievement Mult:</label><span>x' + getAchievementMultiplier().toFixed(4) + '</span></div>' +
    '<div class="admin-row"><label>Global Mult:</label><span>x' + game.globalMultiplier + '</span></div>' +
    '<div class="admin-row"><label>Prestige Mult:</label><span>x' + game.prestigeMultiplier.toFixed(2) + '</span></div>' +
    '<div class="admin-row"><label>Event Mult:</label><span>x' + game.eventMultiplier + '</span></div>' +
    '<div class="admin-row"><label>Play Time:</label><span>' + Math.floor(game.totalPlaytime) + 's</span></div>';

  var resources = document.getElementById('admin-resources');
  resources.innerHTML = '<h3>Resources</h3>' +
    '<div class="admin-row"><label>Set Nukes:</label><input type="number" id="admin-set-nukes" value="0"><button class="btn-gold" onclick="game.nukes=BigNum.create(parseFloat(document.getElementById(\'admin-set-nukes\').value));updateDisplay();">Set</button></div>' +
    '<div class="admin-row"><label>Add Nukes:</label><input type="number" id="admin-add-nukes" value="1000"><button class="btn-gold" onclick="var v=parseFloat(document.getElementById(\'admin-add-nukes\').value);game.nukes=BigNum.add(game.nukes,v);game.lifetimeNukes=BigNum.add(game.lifetimeNukes,v);updateDisplay();">Add</button></div>';

  var buildingsHtml = '<h3>Buildings</h3>';
  BUILDINGS.forEach(function(b) {
    buildingsHtml += '<div class="admin-row"><label>' + b.name + ':</label><span>' + game.buildings[b.id] + '</span>' +
      '<button class="btn-gold" onclick="game.buildings[\'' + b.id + '\']+=10;renderBuildings();updateDisplay();">+10</button>' +
      '<button class="btn-gold" onclick="game.buildings[\'' + b.id + '\']+=100;renderBuildings();updateDisplay();">+100</button>' +
      '<button class="btn-gold" onclick="game.buildings[\'' + b.id + '\']=0;renderBuildings();updateDisplay();">Reset</button></div>';
  });
  document.getElementById('admin-buildings').innerHTML = buildingsHtml;

  var upgradesHtml = '<h3>Upgrades</h3>';
  upgradesHtml += '<div class="admin-row"><button class="btn-gold" onclick="UPGRADES.forEach(function(u){if(game.purchasedUpgrades.indexOf(u.id)<0){game.purchasedUpgrades.push(u.id);u.effect();}});renderUpgrades();updateDisplay();">Unlock All</button>' +
    '<button class="btn-gold btn-danger" onclick="game.purchasedUpgrades=[];game.clickMultiplier=1;game.critChance=0.05;game.globalMultiplier=1;game.synergyActive=false;BUILDINGS.forEach(function(b){game.buildingMultipliers[b.id]=1;});renderUpgrades();updateDisplay();">Reset All</button></div>';
  UPGRADES.forEach(function(u) {
    var owned = game.purchasedUpgrades.indexOf(u.id) >= 0;
    upgradesHtml += '<div class="admin-row"><label>' + u.name + ':</label><span>' + (owned ? 'Owned' : 'Locked') + '</span></div>';
  });
  document.getElementById('admin-upgrades').innerHTML = upgradesHtml;

  var eventsHtml = '<h3>Events</h3>';
  eventsHtml += '<div class="admin-row"><label>Active:</label><span>' + (activeEvent ? activeEvent.name : 'None') + '</span></div>';
  EVENTS.forEach(function(evt) {
    eventsHtml += '<div class="admin-row"><label>' + evt.name + ':</label><button class="btn-gold" onclick="triggerEventById(\'' + evt.id + '\')">Trigger</button></div>';
  });
  document.getElementById('admin-events').innerHTML = eventsHtml;

  var multipliersHtml = '<h3>Multipliers</h3>' +
    '<div class="admin-row"><label>Click Mult:</label><input type="number" id="admin-click-mult" value="' + game.clickMultiplier + '"><button class="btn-gold" onclick="game.clickMultiplier=parseFloat(document.getElementById(\'admin-click-mult\').value);updateDisplay();">Set</button></div>' +
    '<div class="admin-row"><label>Global Mult:</label><input type="number" id="admin-global-mult" value="' + game.globalMultiplier + '"><button class="btn-gold" onclick="game.globalMultiplier=parseFloat(document.getElementById(\'admin-global-mult\').value);updateDisplay();">Set</button></div>' +
    '<div class="admin-row"><label>Crit Chance:</label><input type="number" id="admin-crit" value="' + game.critChance + '" step="0.01"><button class="btn-gold" onclick="game.critChance=parseFloat(document.getElementById(\'admin-crit\').value);updateDisplay();">Set</button></div>' +
    '<div class="admin-row"><label>Cost Mult:</label><input type="number" id="admin-cost-mult" value="' + game.costMultiplier + '" step="0.1"><button class="btn-gold" onclick="game.costMultiplier=parseFloat(document.getElementById(\'admin-cost-mult\').value);renderBuildings();">Set</button></div>';
  document.getElementById('admin-multipliers').innerHTML = multipliersHtml;

  var prestigeHtml = '<h3>Prestige</h3>' +
    '<div class="admin-row"><label>Points:</label><span>' + formatBigNum(game.prestigePoints) + '</span></div>' +
    '<div class="admin-row"><label>Multiplier:</label><span>x' + game.prestigeMultiplier.toFixed(2) + '</span></div>' +
    '<div class="admin-row"><label>Count:</label><span>' + game.prestigeCount + '</span></div>' +
    '<div class="admin-row"><label>Set Points:</label><input type="number" id="admin-prestige-pts" value="0"><button class="btn-gold" onclick="game.prestigePoints=BigNum.create(parseFloat(document.getElementById(\'admin-prestige-pts\').value));game.prestigeMultiplier=1+BigNum.toNumber(game.prestigePoints)*0.01;updateDisplay();">Set</button></div>' +
    '<div class="admin-row"><label>Set Count:</label><input type="number" id="admin-prestige-count" value="' + game.prestigeCount + '"><button class="btn-gold" onclick="game.prestigeCount=parseInt(document.getElementById(\'admin-prestige-count\').value);updateDisplay();">Set</button></div>';
  document.getElementById('admin-prestige').innerHTML = prestigeHtml;

  var playerStatsHtml = '<h3>Player Stats</h3>' +
    '<div class="admin-row"><label>Total Clicks:</label><input type="number" id="admin-total-clicks" value="' + game.totalClicks + '"><button class="btn-gold" onclick="game.totalClicks=parseInt(document.getElementById(\'admin-total-clicks\').value);updateDisplay();">Set</button></div>' +
    '<div class="admin-row"><label>Best Streak:</label><input type="number" id="admin-best-streak" value="' + game.bestStreak + '"><button class="btn-gold" onclick="game.bestStreak=parseInt(document.getElementById(\'admin-best-streak\').value);updateDisplay();">Set</button></div>' +
    '<div class="admin-row"><label>Playtime (s):</label><input type="number" id="admin-playtime" value="' + Math.floor(game.totalPlaytime) + '"><button class="btn-gold" onclick="game.totalPlaytime=parseInt(document.getElementById(\'admin-playtime\').value);updateDisplay();">Set</button></div>';
  document.getElementById('admin-playerstats').innerHTML = playerStatsHtml;

  var debugHtml = '<h3>Debug Tools</h3>' +
    '<div class="admin-row"><button class="btn-gold" onclick="game.nukes=BigNum.create(1e15);game.lifetimeNukes=BigNum.add(game.lifetimeNukes,1e15);updateDisplay();">Give 1Qa Nukes</button></div>' +
    '<div class="admin-row"><button class="btn-gold" onclick="BUILDINGS.forEach(function(b){game.buildings[b.id]+=100;});renderBuildings();updateDisplay();">+100 All Buildings</button></div>' +
    '<div class="admin-row"><button class="btn-gold" onclick="game.clickMultiplier*=100;updateDisplay();">x100 Click Power</button></div>' +
    '<div class="admin-row"><button class="btn-gold" onclick="game.globalMultiplier*=100;updateDisplay();">x100 Global Mult</button></div>' +
    '<div class="admin-row"><button class="btn-gold btn-danger" onclick="if(confirm(\'Reset everything?\')){localStorage.removeItem(\'ayatollahClicker\');location.reload();}">Full Game Reset</button></div>';
  document.getElementById('admin-debug').innerHTML = debugHtml;

  var worldHtml = '<h3>World Simulation</h3>' +
    '<div class="admin-row"><label>Total Buildings:</label><span>' + getTotalBuildings() + '</span></div>' +
    '<div class="admin-row"><label>Building Types:</label><span>' + BUILDINGS.filter(function(b) { return game.buildings[b.id] > 0; }).length + '/' + BUILDINGS.length + '</span></div>' +
    '<div class="admin-row"><label>Upgrades:</label><span>' + game.purchasedUpgrades.length + '/' + UPGRADES.length + '</span></div>' +
    '<div class="admin-row"><label>Achievements:</label><span>' + game.unlockedAchievements.length + '/' + ACHIEVEMENTS.length + '</span></div>';
  document.getElementById('admin-world').innerHTML = worldHtml;

  var visualHtml = '<h3>Visual Controls</h3>' +
    '<div class="admin-row"><label>Particles:</label><button class="btn-gold" onclick="spawnParticles(140,140,50,\'#d4a017\');">Spawn 50</button></div>' +
    '<div class="admin-row"><label>Float Text:</label><button class="btn-gold" onclick="spawnFloatText(100,100,\'+999T\',true);">Spawn Crit Text</button></div>' +
    '<div class="admin-row"><label>Notification:</label><button class="btn-gold" onclick="showNotification(\'Test\',\'This is a test notification.\');">Show</button></div>';
  document.getElementById('admin-visual').innerHTML = visualHtml;

  var saveloadHtml = '<h3>Save/Load Tools</h3>' +
    '<div class="admin-row"><button class="btn-gold" onclick="saveGame();showNotification(\'Saved\',\'Game saved.\');">Force Save</button></div>' +
    '<div class="admin-row"><button class="btn-gold" onclick="loadGame();renderBuildings();renderUpgrades();renderAchievements();updateDisplay();showNotification(\'Loaded\',\'Game loaded.\');">Force Load</button></div>' +
    '<div class="admin-row"><label>Export:</label><button class="btn-gold" onclick="var d=localStorage.getItem(\'ayatollahClicker\');if(d){navigator.clipboard.writeText(btoa(d)).then(function(){showNotification(\'Export\',\'Copied to clipboard.\');});}">Copy Save</button></div>' +
    '<div class="admin-row"><label>Import:</label><input type="text" id="admin-import" placeholder="Paste encoded save"><button class="btn-gold" onclick="try{var d=atob(document.getElementById(\'admin-import\').value);localStorage.setItem(\'ayatollahClicker\',d);loadGame();renderBuildings();renderUpgrades();renderAchievements();updateDisplay();showNotification(\'Import\',\'Save imported.\');}catch(e){showNotification(\'Error\',\'Invalid save data.\');}">Import</button></div>' +
    '<div class="admin-row"><label>Safety Mode:</label><button class="btn-gold" onclick="game.costMultiplier=0.001;game.globalMultiplier*=1000;showNotification(\'Safety\',\'Safety mode enabled.\');">Enable</button><button class="btn-gold btn-danger" onclick="game.costMultiplier=1;game.globalMultiplier=1;showNotification(\'Safety\',\'Safety mode disabled.\');">Disable</button></div>';
  document.getElementById('admin-saveload').innerHTML = saveloadHtml;
}

function triggerEventById(id) {
  if (activeEvent) {
    activeEvent.end();
    if (eventTimer) clearInterval(eventTimer);
    activeEvent = null;
  }
  var evt = EVENTS.find(function(e) { return e.id === id; });
  if (evt) {
    activeEvent = evt;
    evt.effect();
    var popup = document.getElementById('event-popup');
    document.getElementById('event-title').textContent = evt.name;
    document.getElementById('event-desc').textContent = evt.desc;
    popup.classList.remove('hidden');
    var remaining = evt.duration;
    document.getElementById('event-timer').textContent = remaining + 's remaining';
    eventTimer = setInterval(function() {
      remaining--;
      document.getElementById('event-timer').textContent = remaining + 's remaining';
      if (remaining <= 0) {
        clearInterval(eventTimer);
        eventTimer = null;
        evt.end();
        activeEvent = null;
        popup.classList.add('hidden');
      }
    }, 1000);
  }
}

function showStatsModal() {
  var content = document.getElementById('stats-content');
  var playtime = game.totalPlaytime;
  var hours = Math.floor(playtime / 3600);
  var mins = Math.floor((playtime % 3600) / 60);
  var secs = Math.floor(playtime % 60);
  var timeStr = hours + 'h ' + mins + 'm ' + secs + 's';
  content.innerHTML =
    '<div class="stat-row"><span class="stat-label">Lifetime Nukes</span><span class="stat-value">' + formatBigNum(game.lifetimeNukes) + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Current Nukes</span><span class="stat-value">' + formatBigNum(game.nukes) + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Nukes/sec</span><span class="stat-value">' + formatBigNum(getTotalNPS()) + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Total Clicks</span><span class="stat-value">' + game.totalClicks + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Click Value</span><span class="stat-value">' + formatBigNum(getClickValue()) + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Best Streak</span><span class="stat-value">' + game.bestStreak + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Critical Chance</span><span class="stat-value">' + (game.critChance * 100).toFixed(1) + '%</span></div>' +
    '<div class="stat-row"><span class="stat-label">Total Buildings</span><span class="stat-value">' + getTotalBuildings() + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Upgrades Purchased</span><span class="stat-value">' + game.purchasedUpgrades.length + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Achievements</span><span class="stat-value">' + game.unlockedAchievements.length + '/' + ACHIEVEMENTS.length + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Prestige Count</span><span class="stat-value">' + game.prestigeCount + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Allah\'s Grace</span><span class="stat-value">' + formatBigNum(game.prestigePoints) + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Prestige Multiplier</span><span class="stat-value">x' + game.prestigeMultiplier.toFixed(2) + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Achievement Multiplier</span><span class="stat-value">x' + getAchievementMultiplier().toFixed(4) + '</span></div>' +
    '<div class="stat-row"><span class="stat-label">Play Time</span><span class="stat-value">' + timeStr + '</span></div>';
  document.getElementById('stats-modal').classList.remove('hidden');
}

function showPrestigeModal() {
  var info = document.getElementById('prestige-info');
  var reward = getPrestigeReward();
  var currentMult = game.prestigeMultiplier;
  var newPoints = BigNum.add(game.prestigePoints, reward);
  var newMult = 1 + BigNum.toNumber(newPoints) * 0.01;
  info.innerHTML =
    '<div class="prestige-row"><span class="p-label">Current Allah\'s Grace</span><span class="p-value">' + formatBigNum(game.prestigePoints) + '</span></div>' +
    '<div class="prestige-row"><span class="p-label">Current Multiplier</span><span class="p-value">x' + currentMult.toFixed(2) + '</span></div>' +
    '<div class="prestige-row"><span class="p-label">Estimated Reward</span><span class="p-value">+' + formatBigNum(reward) + '</span></div>' +
    '<div class="prestige-row"><span class="p-label">New Multiplier</span><span class="p-value">x' + newMult.toFixed(2) + '</span></div>' +
    '<div class="prestige-row"><span class="p-label">Lifetime Nukes</span><span class="p-value">' + formatBigNum(game.lifetimeNukes) + '</span></div>' +
    '<div class="prestige-row"><span class="p-label">Prestige Count</span><span class="p-value">' + game.prestigeCount + '</span></div>' +
    '<p style="margin-top:16px;color:#999;font-size:0.8rem;">Prestiging will reset your nukes, buildings, and upgrades but keep achievements, prestige points, and playtime. Requires 1M+ lifetime nukes.</p>';
  document.getElementById('prestige-modal').classList.remove('hidden');
}

function init() {
  var loaded = loadGame();
  if (!loaded || !game.factoryName) {
    document.getElementById('factory-name-modal').style.display = 'flex';
  } else {
    document.getElementById('factory-name-modal').style.display = 'none';
    if (game.isAdmin) showAdminButton();
  }

  document.getElementById('factory-name-submit').addEventListener('click', function() {
    var name = document.getElementById('factory-name-input').value.trim();
    if (!name) name = 'Nuclear Factory';
    game.factoryName = name;
    if (checkFactoryName(name)) {
      game.isAdmin = true;
      showAdminButton();
      showNotification('Admin Mode', 'Hidden admin mode unlocked!');
    }
    document.getElementById('factory-name-modal').style.display = 'none';
    updateDisplay();
    saveGame();
  });

  document.getElementById('factory-name-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('factory-name-submit').click();
  });

  document.getElementById('click-area').addEventListener('click', handleClick);

  // Clickable factory name to open rename
  document.getElementById('factory-name-display').addEventListener('click', function() {
    document.getElementById('rename-factory-input').value = game.factoryName;
    document.getElementById('sound-toggle').textContent = game.soundEnabled ? 'ON' : 'OFF';
    document.getElementById('settings-modal').classList.remove('hidden');
  });

  // Ally Boost Button
  document.getElementById('ally-boost-btn').addEventListener('click', activateAllyBoost);

  document.querySelectorAll('.buy-amt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      game.buyAmount = btn.dataset.amt === 'max' ? 'max' : parseInt(btn.dataset.amt);
      document.querySelectorAll('.buy-amt').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderBuildings();
    });
  });

  document.getElementById('stats-btn').addEventListener('click', showStatsModal);
  document.getElementById('settings-btn').addEventListener('click', function() {
    document.getElementById('rename-factory-input').value = game.factoryName;
    document.getElementById('sound-toggle').textContent = game.soundEnabled ? 'ON' : 'OFF';
    document.getElementById('settings-modal').classList.remove('hidden');
  });
  document.getElementById('prestige-btn').addEventListener('click', showPrestigeModal);

  document.querySelectorAll('.modal-close').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.getElementById(btn.dataset.close).classList.add('hidden');
    });
  });

  document.getElementById('rename-factory-btn').addEventListener('click', function() {
    var name = document.getElementById('rename-factory-input').value.trim();
    if (name) {
      game.factoryName = name;
      if (checkFactoryName(name)) {
        game.isAdmin = true;
        showAdminButton();
        showNotification('Admin Mode', 'Hidden admin mode unlocked!');
      } else {
        game.isAdmin = false;
        hideAdminButton();
        document.getElementById('admin-panel').classList.add('hidden');
      }
      updateDisplay();
      saveGame();
    }
  });

  document.getElementById('sound-toggle').addEventListener('click', function() {
    game.soundEnabled = !game.soundEnabled;
    this.textContent = game.soundEnabled ? 'ON' : 'OFF';
  });

  document.getElementById('manual-save').addEventListener('click', function() {
    saveGame();
    showNotification('Saved', 'Game saved successfully.');
  });

  document.getElementById('manual-load').addEventListener('click', function() {
    loadGame();
    renderBuildings();
    renderUpgrades();
    renderAchievements();
    updateDisplay();
    showNotification('Loaded', 'Game loaded successfully.');
  });

  document.getElementById('hard-reset').addEventListener('click', function() {
    if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
      localStorage.removeItem('ayatollahClicker');
      location.reload();
    }
  });

  document.getElementById('prestige-confirm').addEventListener('click', function() {
    doPrestige();
    document.getElementById('prestige-modal').classList.add('hidden');
  });

  document.getElementById('admin-toggle-btn').addEventListener('click', function() {
    var panel = document.getElementById('admin-panel');
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      updateAdminPanel();
    } else {
      panel.classList.add('hidden');
    }
  });

  document.getElementById('admin-close').addEventListener('click', function() {
    document.getElementById('admin-panel').classList.add('hidden');
  });

  document.querySelectorAll('.admin-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
      updateAdminPanel();
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      if (game.isAdmin) {
        var panel = document.getElementById('admin-panel');
        if (panel.classList.contains('hidden')) {
          panel.classList.remove('hidden');
          updateAdminPanel();
        } else {
          panel.classList.add('hidden');
        }
      }
    }
  });

  renderBuildings();
  renderUpgrades();
  renderAchievements();
  updateDisplay();

  setInterval(gameTick, 50);

  setInterval(function() {
    renderBuildings();
    renderUpgrades();
    renderAchievements();
  }, 2000);

  setInterval(saveGame, 10000);

  setInterval(function() {
    if (Math.random() < 0.3) {
      triggerRandomEvent();
    }
  }, 120000);

  setTimeout(function() {
    if (Math.random() < 0.5) triggerRandomEvent();
  }, 60000);

  if (game.isAdmin) {
    setInterval(updateAdminPanel, 2000);
  }
}

function activateAllyBoost() {
  if (allyBoostActive || allyBoostCooldown > 0) return;

  allyBoostActive = true;
  var btn = document.getElementById('ally-boost-btn');
  btn.classList.add('boosting');
  btn.classList.remove('on-cooldown');

  // Play boost sound
  playAllyBoostSound();

  // Screen flash
  var flash = document.createElement('div');
  flash.className = 'ally-screen-flash';
  document.body.appendChild(flash);
  setTimeout(function() { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 800);

  // Shockwave from ayatollah
  var clickArea = document.getElementById('click-area');
  var shockwave = document.createElement('div');
  shockwave.className = 'ally-shockwave';
  shockwave.style.left = '50%';
  shockwave.style.top = '50%';
  clickArea.appendChild(shockwave);
  setTimeout(function() { if (shockwave.parentNode) shockwave.parentNode.removeChild(shockwave); }, 1000);

  // Spinning ring around ayatollah
  var ring = document.createElement('div');
  ring.className = 'boost-ring';
  ring.id = 'active-boost-ring';
  clickArea.appendChild(ring);

  // Spawn flag particles
  spawnAllyFlags();

  // Apply boost: x5 all production for 30 seconds
  game.eventMultiplier *= 5;
  showNotification('ALLIES CALLED!', 'Russia & China boost all production x5 for 30 seconds!');

  var remaining = 30;
  document.getElementById('ally-boost-label').textContent = 'BOOST ACTIVE';
  document.getElementById('ally-boost-timer').textContent = remaining + 's';

  allyBoostTimer = setInterval(function() {
    remaining--;
    document.getElementById('ally-boost-timer').textContent = remaining + 's';
    // Spawn particles during boost
    if (remaining % 5 === 0 && remaining > 0) {
      spawnAllyFlags();
    }
    if (remaining <= 0) {
      clearInterval(allyBoostTimer);
      allyBoostTimer = null;
      allyBoostActive = false;
      game.eventMultiplier /= 5;

      // Remove ring
      var existingRing = document.getElementById('active-boost-ring');
      if (existingRing) existingRing.parentNode.removeChild(existingRing);

      btn.classList.remove('boosting');
      showNotification('Boost Ended', 'Russia & China have returned home.');

      // Start 10-minute cooldown
      startAllyCooldown();
    }
  }, 1000);
}

function startAllyCooldown() {
  allyBoostCooldown = 600; // 10 minutes in seconds
  var btn = document.getElementById('ally-boost-btn');
  btn.classList.add('on-cooldown');

  function updateCooldownDisplay() {
    var mins = Math.floor(allyBoostCooldown / 60);
    var secs = allyBoostCooldown % 60;
    document.getElementById('ally-boost-label').textContent = 'Cooldown';
    document.getElementById('ally-boost-timer').textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
  }
  updateCooldownDisplay();

  allyCooldownTimer = setInterval(function() {
    allyBoostCooldown--;
    if (allyBoostCooldown <= 0) {
      clearInterval(allyCooldownTimer);
      allyCooldownTimer = null;
      allyBoostCooldown = 0;
      btn.classList.remove('on-cooldown');
      document.getElementById('ally-boost-label').textContent = 'Call Russia & China';
      document.getElementById('ally-boost-timer').textContent = '';
      showNotification('Allies Ready!', 'Russia & China are ready to be called again!');
    } else {
      updateCooldownDisplay();
    }
  }, 1000);
}

function spawnAllyFlags() {
  var flags = ['🇷🇺', '🇨🇳', '☄️', '🔥', '💥', '☢️'];
  for (var i = 0; i < 12; i++) {
    var flag = document.createElement('div');
    flag.className = 'ally-flag-particle';
    flag.textContent = flags[Math.floor(Math.random() * flags.length)];
    flag.style.left = (Math.random() * 100) + 'vw';
    flag.style.top = (-10 - Math.random() * 20) + 'px';
    flag.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    flag.style.animationDelay = (Math.random() * 0.5) + 's';
    document.body.appendChild(flag);
    setTimeout(function(el) {
      return function() { if (el.parentNode) el.parentNode.removeChild(el); };
    }(flag), 3500);
  }
}

function playAllyBoostSound() {
  if (!game.soundEnabled || !audioCtx) return;
  try {
    // Dramatic rising tone
    var osc1 = audioCtx.createOscillator();
    var gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.5);

    // Impact hit
    var osc2 = audioCtx.createOscillator();
    var gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'square';
    osc2.frequency.value = 150;
    gain2.gain.setValueAtTime(0.12, audioCtx.currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc2.start(audioCtx.currentTime + 0.3);
    osc2.stop(audioCtx.currentTime + 0.6);
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', init);
