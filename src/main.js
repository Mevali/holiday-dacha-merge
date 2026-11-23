import { PlatformBridge } from './platform-sdk.js';
import { AudioEngine } from './audio.js';
import { I18n } from './i18n.js';
import {
  BOARD_COLS,
  BOARD_ROWS,
  MAX_ENERGY,
  ENERGY_REGEN_SEC,
  CHAINS,
  ITEMS,
  NEIGHBORS,
  DACHA_UPGRADES,
  PRODUCER_UNLOCK_ORDERS,
  getNextTierItemId,
  buildInitialBoard,
  buildStarterOrders
} from './data.js';
import { SpriteBank } from './sprites.js';
import { DachaSceneRenderer } from './dacha-scene.js';

const DACHA_DAILY_REWARDS = [
  { day: 1, iconId: 'a4_ginger_cookie', coins: 55, energy: 0, stars: 0, itemId: 'a4_ginger_cookie', label: '+55 🪙 • Пряник' },
  { day: 2, iconId: 'a3_mug_tea', coins: 65, energy: 0, stars: 0, itemId: 'a3_mug_tea', label: '+65 🪙 • Чай' },
  { day: 3, iconId: 'b3_glass_icicle', coins: 80, energy: 20, stars: 0, itemId: null, label: '+80 🪙 • +20 ⚡' },
  { day: 4, iconId: 'ui_star_seal', coins: 90, energy: 0, stars: 1, itemId: null, label: '+90 🪙 • ★ 1' },
  { day: 5, iconId: 'a5_berry_tart', coins: 120, energy: 0, stars: 0, itemId: 'a5_berry_tart', label: '+120 🪙 • Тарт' },
  { day: 6, iconId: 'c4_olivier_bowl', coins: 150, energy: 0, stars: 0, itemId: 'c4_olivier_bowl', label: '+150 🪙 • Оливье' },
  { day: 7, iconId: 'a7_royal_samovar', coins: 250, energy: 35, stars: 2, itemId: null, label: '+250 🪙 • ★ 2 • +35 ⚡' }
];

const DACHA_LEAGUES = [
  { idx: 0, nameKey: 'league_0', minScore: 0, rewardCoins: 0, rewardStars: 0 },
  { idx: 1, nameKey: 'league_1', minScore: 1200, rewardCoins: 80, rewardStars: 1 },
  { idx: 2, nameKey: 'league_2', minScore: 3200, rewardCoins: 140, rewardStars: 1 },
  { idx: 3, nameKey: 'league_3', minScore: 6800, rewardCoins: 220, rewardStars: 2 },
  { idx: 4, nameKey: 'league_4', minScore: 12500, rewardCoins: 350, rewardStars: 2 }
];

const DACHA_RIVALS = [
  { name: { ru: 'Валентина И.', en: 'Clara W.', tr: 'Zeynep A.' }, score: 15400 },
  { nameKey: 'neighbor_moroz', score: 11800 },
  { name: { ru: 'Марина З.', en: 'Hannah M.', tr: 'Elif K.' }, score: 9200 },
  { name: { ru: 'Алексей Н.', en: 'Arthur B.', tr: 'Mehmet T.' }, score: 7400 },
  { name: { ru: 'Галина Б.', en: 'Martha S.', tr: 'Ayşe Y.' }, score: 5850 },
  { name: { ru: 'Виктор Р.', en: 'Oliver P.', tr: 'Murat D.' }, score: 4550 },
  { name: { ru: 'Наталья Г.', en: 'Elena V.', tr: 'Fatma S.' }, score: 3520 },
  { name: { ru: 'Елена В.', en: 'Sophie L.', tr: 'Merve Ç.' }, score: 2740 },
  { name: { ru: 'Сергей Д.', en: 'Daniel R.', tr: 'Emre B.' }, score: 2120 },
  { name: { ru: 'Татьяна М.', en: 'Grace H.', tr: 'Selin Ö.' }, score: 1640 },
  { name: { ru: 'Андрей С.', en: 'Henry K.', tr: 'Burak K.' }, score: 1250 },
  { nameKey: 'neighbor_valya', score: 940 },
  { name: { ru: 'Ольга К.', en: 'Nora C.', tr: 'Derya N.' }, score: 710 },
  { nameKey: 'neighbor_mihalych', score: 520 },
  { name: { ru: 'Светлана П.', en: 'Emma T.', tr: 'Esra G.' }, score: 370 },
  { nameKey: 'neighbor_masha', score: 240 },
  { name: { ru: 'Николай Т.', en: 'Leo F.', tr: 'Can E.' }, score: 140 },
  { name: { ru: 'Ирина Л.', en: 'Mia J.', tr: 'Seda P.' }, score: 85 }
];

const PRESTIGE_GIFT_POOL = [
  'a4_ginger_cookie',
  'b4_ruby_bauble',
  'c4_olivier_bowl',
  'd4_wooden_sled',
  'a5_berry_tart',
  'b5_fairy_garland',
  'c5_caviar_tartlet',
  'd5_snowman_cheer'
];

class HolidayDachaGame {
  constructor() {
    this.audio = new AudioEngine();
    this.i18n = new I18n('ru');
    this.platform = new PlatformBridge({
      audio: this.audio,
      i18n: this.i18n,
      onPauseChange: (paused) => {
        this.isPaused = paused;
      },
      saveKey: 'holiday_dacha_merge_v1',
      leaderboardId: 'dacha_stars',
      yaLeaderboardId: 'dachastars',
      enableStickyBanner: true
    });

    this.spriteBank = new SpriteBank((id, url) => this.handleSpriteLoaded(id, url));
    this.dachaRenderer = new DachaSceneRenderer(this.spriteBank);

    this.state = this.createDefaultState();
    this.selectedCell = { r: 2, c: 2 };
    this.activeRenovationId = DACHA_UPGRADES[0].id;
    this.pendingStyleIdx = 0;
    this.activeChainModalId = 'tea';
    this.activeRecipeTargetId = null;
    this.pendingStreakBonusItem = 'a3_mug_tea';
    this.spotlightProducerId = null;
    this.spotlightUntilSec = 0;

    this.drag = null;
    this.particles = [];
    this.flyingArcs = [];
    this.shockwaves = [];
    this.floatingTexts = [];

    this.idleTimer = 0;
    this.hintPair = null;
    this.isPaused = false;
    this.lastFramePerf = performance.now();
    this.toastTimer = null;
    this.adFillUnavailable = false;

    this.cellEls = [];
    this.dom = {};
  }

  createDefaultState() {
    return {
      coins: 60,
      stars: 0,
      totalCoins: 60,
      totalStars: 0,
      completedCount: 0,
      totalEarned: 60,
      energy: MAX_ENERGY,
      energyFracSec: 0,
      lastSavedAt: Date.now(),
      thermosReadyAt: 0,
      firstFreeEnergyClaimed: false,
      energyBuysToday: 0,
      energyBuyDate: '',
      overdrive: false,
      board: buildInitialBoard(),
      bag: [],
      bagSlots: 4,
      orders: buildStarterOrders(),
      ordersCompleted: 0,
      streakCount: 0,
      unlockedUpgrades: {},
      prestigeLevel: 0,
      claimedLeagues: [0],
      notifiedLeagueIdx: 0,
      autoOpenedLeagueIdx: 0,
      bestLocalRank: 19,
      dailyAutoShownDate: '',
      introSeen: false,
      bubbleCoachSeen: false,
      dailyClaimedCount: 0,
      lastDailyDate: '',
      tutorialStep: 0,
      discoveredIds: [
        'gen_samovar_stove',
        'gen_pine_chest',
        'gen_cellar_basket',
        'gen_winter_shed',
        'a1_tea_leaf',
        'b1_pine_twig',
        'b2_silver_tinsel',
        'c1_tangerine',
        'd1_firewood'
      ]
    };
  }

  async boot() {
    this.cacheDom();
    this.buildBoardGridDom();
    this.bindEvents();

    this.spriteBank.preloadAll();
    this.audio.preloadAll();

    // Render initial state synchronously at 0ms so there is never an empty frame while SDK initializes
    this.selectInitialFocus();
    this.applyTranslations();
    this.renderAll();

    await this.platform.init();
    const detectedLang = this.platform.detectInitialLang();
    this.i18n.setLang(detectedLang);

    const loaded = await this.platform.loadState(this.createDefaultState());
    let forceReset = false;
    let qaPrestige = false;
    try {
      const sp = new URLSearchParams(window.location?.search || '');
      forceReset = sp.get('reset') === '1';
      const isLocal = window.location?.hostname === '127.0.0.1' || window.location?.hostname === 'localhost';
      qaPrestige = isLocal && sp.get('qa_prestige') === '1';
    } catch {}
    if (qaPrestige) {
      const st = this.createDefaultState();
      for (const u of DACHA_UPGRADES) st.unlockedUpgrades[u.id] = 0;
      st.stars = 6;
      st.totalStars = 12;
      st.coins = 500;
      st.totalCoins = 900;
      st.ordersCompleted = 10;
      st.introSeen = true;
      st.lastDailyDate = this.getTodayDateKey();
      st.dailyAutoShownDate = this.getTodayDateKey();
      st.tutorialStep = 4;
      this.hydrateState(st);
      this.persist(true);
    } else if (forceReset) {
      this.hydrateState(this.createDefaultState());
      this.persist(true);
    } else {
      this.hydrateState(loaded);
    }

    this.selectInitialFocus();
    this.applyTranslations();
    this.renderAll();

    if (!this.state.introSeen) {
      this.openIntroModal();
    } else if (this.isDailyGiftAvailable() && (Number(this.state.tutorialStep) || 0) >= 4) {
      this.state.dailyAutoShownDate = this.getTodayDateKey();
      this.persist();
      this.openDailyModal();
    }

    this.platform.signalLoadingReady();
    this.platform.setGameplayActive(true);
    this.platform.notifyLevelStarted(1);
    this.platform.showStickyBanner();

    this.lastFramePerf = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  hydrateState(raw) {
    const def = this.createDefaultState();
    this.state = {
      ...def,
      ...raw
    };
    if (!Array.isArray(this.state.board) || this.state.board.length !== BOARD_ROWS) {
      this.state.board = buildInitialBoard();
    } else {
      for (let r = 0; r < BOARD_ROWS; r++) {
        if (!Array.isArray(this.state.board[r]) || this.state.board[r].length !== BOARD_COLS) {
          this.state.board = buildInitialBoard();
          break;
        }
      }
    }
    if (!Array.isArray(this.state.orders) || this.state.orders.length !== 3) {
      this.state.orders = buildStarterOrders();
    }
    if (!Array.isArray(this.state.bag)) this.state.bag = [];
    if (!Array.isArray(this.state.discoveredIds)) this.state.discoveredIds = def.discoveredIds.slice();
    if (!this.state.unlockedUpgrades || typeof this.state.unlockedUpgrades !== 'object') {
      this.state.unlockedUpgrades = {};
    }
    this.state.prestigeLevel = Math.max(0, Math.floor(Number(this.state.prestigeLevel) || 0));
    if (!Array.isArray(this.state.claimedLeagues)) {
      this.state.claimedLeagues = [0];
    } else if (!this.state.claimedLeagues.includes(0)) {
      this.state.claimedLeagues.push(0);
    }
    this.state.notifiedLeagueIdx = Math.max(0, Math.floor(Number(this.state.notifiedLeagueIdx) || 0));
    this.state.autoOpenedLeagueIdx = Math.max(0, Math.floor(Number(this.state.autoOpenedLeagueIdx) || 0));
    this.state.dailyAutoShownDate = String(this.state.dailyAutoShownDate || '');
    if (raw?.bestLocalRank === undefined) {
      const initScore =
        (Number(this.state.totalStars) || 0) * 100 +
        (Number(this.state.totalCoins) || 0) +
        Object.keys(this.state.unlockedUpgrades || {}).length * 120 +
        this.state.prestigeLevel * 400;
      this.state.bestLocalRank = 1 + DACHA_RIVALS.filter((r) => r.score > initScore).length;
    } else {
      this.state.bestLocalRank = Math.max(1, Math.floor(Number(this.state.bestLocalRank) || 19));
    }
    if (raw?.tutorialStep === undefined) {
      const hasProgress = Object.keys(this.state.unlockedUpgrades).length > 0 || (Number(this.state.ordersCompleted) || 0) > 0;
      this.state.tutorialStep = hasProgress ? 4 : 0;
    }

    // Sync progressive producer lock states & ensure orders only request unlocked chains!
    this.syncProducerLocksFromProgress();
    this.sanitizeOrdersToUnlockedChains();

    // Clamp legacy saves from old 100-cap down cleanly if near full
    this.state.energy = Math.min(MAX_ENERGY + 60, Math.max(0, Math.floor(Number(this.state.energy) ?? MAX_ENERGY)));
    // Offline energy regeneration
    const now = Date.now();
    const elapsedSec = Math.max(0, Math.floor((now - (Number(this.state.lastSavedAt) || now)) / 1000));
    if (elapsedSec > 0 && this.state.energy < MAX_ENERGY) {
      const gained = Math.floor((this.state.energyFracSec + elapsedSec) / ENERGY_REGEN_SEC);
      this.state.energy = Math.min(MAX_ENERGY, this.state.energy + gained);
      this.state.energyFracSec = this.state.energy >= MAX_ENERGY ? 0 : (this.state.energyFracSec + elapsedSec) % ENERGY_REGEN_SEC;
    }
    this.syncScoreTotals();
  }

  getLocalRankInfo(scoreVal = null) {
    const sc = scoreVal !== null ? scoreVal : Math.max(0, Math.floor(Number(this.state?.totalEarned) || 0));
    let higherCount = 0;
    let lowestPassedRival = null;
    for (const r of DACHA_RIVALS) {
      if (r.score > sc) {
        higherCount += 1;
      } else if (!lowestPassedRival || r.score > lowestPassedRival.score) {
        lowestPassedRival = r;
      }
    }
    return {
      rank: 1 + higherCount,
      passedRival: lowestPassedRival
    };
  }

  syncScoreTotals() {
    const upgCount = Object.keys(this.state.unlockedUpgrades || {}).length;
    const prestigeLv = Math.max(0, Math.floor(Number(this.state.prestigeLevel) || 0));
    this.state.completedCount = (Number(this.state.ordersCompleted) || 0) + upgCount + prestigeLv;
    this.state.totalEarned =
      (Number(this.state.totalStars) || 0) * 100 +
      (Number(this.state.totalCoins) || 0) +
      upgCount * 120 +
      prestigeLv * 500;

    const { rank, passedRival } = this.getLocalRankInfo(this.state.totalEarned);
    const prevRank = Math.max(1, Number(this.state.bestLocalRank) || 19);
    const curLeague = this.getCurrentLeagueInfo().current;
    const leagueJustRose = curLeague.idx > (Number(this.state.notifiedLeagueIdx) || 0);

    if (leagueJustRose) {
      this.state.notifiedLeagueIdx = curLeague.idx;
      if (this.dom?.toastEl && (Number(this.state.tutorialStep) || 0) >= 4) {
        this.showToast(this.i18n.t('lbLeagueToast', { name: this.i18n.t(curLeague.nameKey) }));
      }
    }

    if (rank < prevRank) {
      this.state.bestLocalRank = rank;
      if (this.dom?.btnLeaderboard) {
        this.dom.btnLeaderboard.classList.remove('rank-up-pop');
        void this.dom.btnLeaderboard.offsetWidth;
        this.dom.btnLeaderboard.classList.add('rank-up-pop');
      }
      if (!leagueJustRose && passedRival && this.dom?.toastEl && (Number(this.state.tutorialStep) || 0) >= 4) {
        const rName = passedRival.nameKey ? this.i18n.t(passedRival.nameKey) : this.i18n.pick(passedRival.name);
        this.showToast(this.i18n.t('lbOvertakeToast', { name: rName, rank }));
      }
    }
  }

  persist(immediate = false) {
    this.state.lastSavedAt = Date.now();
    this.syncScoreTotals();
    this.platform.saveState(this.state, immediate);
  }

  selectInitialFocus() {
    const nextUpg = DACHA_UPGRADES.find((u) => this.state.unlockedUpgrades[u.id] === undefined);
    this.activeRenovationId = nextUpg ? nextUpg.id : DACHA_UPGRADES[DACHA_UPGRADES.length - 1].id;
    this.pendingStyleIdx = this.state.unlockedUpgrades[this.activeRenovationId] ?? 0;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (cell && ITEMS[cell.id]?.isProducer && !cell.lockedProducer) {
          this.selectedCell = { r, c };
          return;
        }
      }
    }
  }

  isProducerUnlockedByProgress(prodId) {
    const req = PRODUCER_UNLOCK_ORDERS[prodId] ?? 0;
    return (Number(this.state.ordersCompleted) || 0) >= req;
  }

  syncProducerLocksFromProgress() {
    const newlyUnlocked = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (cell && ITEMS[cell.id]?.isProducer) {
          const shouldBeLocked = !this.isProducerUnlockedByProgress(cell.id);
          if (cell.lockedProducer && !shouldBeLocked) {
            newlyUnlocked.push({ id: cell.id, r, c });
          }
          cell.lockedProducer = shouldBeLocked;
        }
      }
    }
    return newlyUnlocked;
  }

  getUnlockedChainKeys() {
    const unlocked = [];
    for (const [chKey, ch] of Object.entries(CHAINS)) {
      if (this.isProducerUnlockedByProgress(ch.producerId)) {
        unlocked.push(chKey);
      }
    }
    return unlocked.length > 0 ? unlocked : ['tea'];
  }

  sanitizeOrdersToUnlockedChains() {
    const allowedChains = new Set(this.getUnlockedChainKeys());
    for (let i = 0; i < this.state.orders.length; i++) {
      const ord = this.state.orders[i];
      if (!ord || !Array.isArray(ord.reqs)) continue;
      const hasLockedReq = ord.reqs.some((reqId) => !allowedChains.has(ITEMS[reqId]?.chain));
      if (hasLockedReq) {
        this.state.orders[i] = this.generateNextOrder(i);
      }
    }
  }

  focusProducerOnBoard(prodId) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (cell?.id === prodId) {
          this.selectedCell = { r, c };
          this.pulseCell(r, c);
          this.spotlightProducerId = prodId;
          this.spotlightUntilSec = performance.now() * 0.001 + 4.5;
          this.renderBoard();
          this.renderDock();
          return;
        }
      }
    }
  }

  openProducerShowcaseModal(prodId, isLockedPreview = false) {
    const meta = ITEMS[prodId];
    if (!meta?.producesChain) return;
    const ch = CHAINS[meta.producesChain];
    const reqOrders = PRODUCER_UNLOCK_ORDERS[prodId] ?? 0;
    const left = Math.max(1, reqOrders - (Number(this.state.ordersCompleted) || 0));

    this.spotlightProducerId = prodId;
    this.dom.prodUnlockKicker.textContent = this.i18n.t(isLockedPreview ? 'prodLockedKicker' : 'prodUnlockKicker');
    this.dom.prodUnlockTitle.textContent = this.i18n.pick(meta.name);
    this.setImgSprite(this.dom.prodUnlockHeroImg, prodId);
    this.dom.prodUnlockSub.textContent = isLockedPreview
      ? this.i18n.t('prodLockedSub', { left, name: this.i18n.pick(meta.name) })
      : this.i18n.t('prodUnlockSub');

    this.dom.prodUnlockGrid.innerHTML = '';
    ch.items.forEach((id, idx) => {
      const card = document.createElement('div');
      card.className = 'chain-step-card is-discovered';
      const badge = document.createElement('span');
      badge.className = 'chain-step-num';
      badge.textContent = `${idx + 1}/7`;
      const img = document.createElement('img');
      img.className = 'chain-step-img';
      img.alt = '';
      this.setImgSprite(img, id);
      const name = document.createElement('span');
      name.className = 'chain-step-name';
      name.textContent = this.i18n.pick(ITEMS[id]?.name);
      card.append(badge, img, name);
      this.dom.prodUnlockGrid.appendChild(card);
    });

    this.dom.btnProdUnlockOk.textContent = this.i18n.t(isLockedPreview ? 'closeBtn' : 'prodTryBtn');
    this.dom.btnProdUnlockOk.dataset.locked = isLockedPreview ? '1' : '0';
    this.openModal(this.dom.prodUnlockModal);
  }

  cacheDom() {
    const $ = (id) => document.getElementById(id);
    this.dom = {
      app: $('app'),
      starsPill: $('btn-stars-pill'),
      starsVal: $('stars-value'),
      energyPill: $('btn-energy-pill'),
      energyFill: $('energy-liquid-fill'),
      energyVal: $('energy-value'),
      energyTimer: $('energy-timer'),
      coinsPill: $('coins-pill'),
      coinsVal: $('coins-value'),
      btnDaily: $('btn-daily'),
      dailyDot: $('daily-notify-dot'),
      btnLeaderboard: $('btn-leaderboard'),
      lbRankLabel: $('lb-rank-label'),
      lbDot: $('lb-notify-dot'),
      btnSound: $('btn-sound'),
      soundIcon: $('sound-icon'),
      btnHelp: $('btn-help'),
      btnLang: $('btn-lang'),
      langLabel: $('lang-label'),

      dachaCard: $('dacha-preview-card'),
      dachaStripCanvas: $('dacha-strip-canvas'),
      dachaProgressText: $('dacha-progress-text'),
      dachaNextName: $('dacha-next-name'),
      btnOpenDacha: $('btn-open-dacha'),
      btnOpenDachaText: $('btn-open-dacha-text'),
      dachaNotifyDot: $('dacha-notify-dot'),

      streakTitle: $('streak-title'),
      streakCountText: $('streak-count-text'),
      streakFill: $('streak-bar-fill'),
      ordersGrid: $('orders-grid'),

      boardWrap: $('board-stage-wrap'),
      boardGrid: $('merge-board-grid'),
      fxCanvas: $('fx-canvas'),
      dragGhost: $('drag-ghost'),
      dragGhostImg: $('drag-ghost-img'),
      toastEl: $('game-toast'),

      btnBoost: $('btn-overdrive'),
      boostLabel: $('overdrive-label'),
      infoIconWrap: $('selected-icon-wrap'),
      infoIconImg: $('selected-icon-img'),
      infoTitle: $('selected-item-title'),
      infoSub: $('selected-item-sub'),
      infoOutputs: $('selected-producer-outputs'),
      infoActions: $('selected-item-actions'),
      btnChainInfo: $('btn-chain-info'),
      btnStoreItem: $('btn-store-item'),
      btnSellItem: $('btn-sell-item'),
      btnPopBubbleAd: $('btn-pop-bubble-ad'),
      btnPopBubbleCoin: $('btn-pop-bubble-coin'),
      btnBagOpen: $('btn-bag-open'),
      bagCountText: $('bag-count-text'),
      bagLabelText: $('bag-label-text'),

      // Modals
      dachaModal: $('modal-dacha'),
      dachaModalTitle: $('dacha-modal-title'),
      dachaModalSub: $('dacha-modal-sub'),
      dachaFullCanvas: $('dacha-full-canvas'),
      dachaModalStars: $('dacha-modal-stars'),
      dachaModalCoins: $('dacha-modal-coins'),
      dachaUpgradesStrip: $('dacha-upgrades-strip'),
      dachaStylePanel: $('dacha-style-panel'),
      dachaSelectedUpgTitle: $('dacha-selected-upg-title'),
      dachaStyleSwatches: $('dacha-style-swatches'),
      dachaPrestigeBox: $('dacha-prestige-box'),
      dachaPrestigeTitle: $('dacha-prestige-title'),
      dachaPrestigeSub: $('dacha-prestige-sub'),
      btnUnlockUpgrade: $('btn-unlock-upgrade'),
      btnCloseDacha: $('btn-close-dacha'),

      energyModal: $('modal-energy'),
      energyModalTitle: $('energy-modal-title'),
      energyModalSub: $('energy-modal-sub'),
      btnEnergyWelcome: $('btn-energy-welcome'),
      btnEnergyAd: $('btn-energy-ad'),
      btnEnergyCoin: $('btn-energy-coin'),
      btnEnergyThermos: $('btn-energy-thermos'),
      btnCloseEnergy: $('btn-close-energy'),

      bagModal: $('modal-bag'),
      bagModalTitle: $('bag-modal-title'),
      bagModalSub: $('bag-modal-sub'),
      bagSlotsGrid: $('bag-slots-grid'),
      btnBagExpandCoin: $('btn-bag-expand-coin'),
      btnBagExpandAd: $('btn-bag-expand-ad'),
      btnCloseBag: $('btn-close-bag'),

      chainModal: $('modal-chain'),
      chainModalTitle: $('chain-modal-title'),
      chainProducerBanner: $('chain-producer-banner'),
      chainProducerImg: $('chain-producer-img'),
      chainProducerName: $('chain-producer-name'),
      chainProducerHint: $('chain-producer-hint'),
      chainStepsList: $('chain-steps-list'),
      btnChainPointProducer: $('btn-chain-point-producer'),
      btnCloseChain: $('btn-close-chain'),

      prodUnlockModal: $('modal-producer-unlock'),
      prodUnlockKicker: $('prod-unlock-kicker'),
      prodUnlockTitle: $('prod-unlock-title'),
      prodUnlockHeroImg: $('prod-unlock-hero-img'),
      prodUnlockSub: $('prod-unlock-sub'),
      prodUnlockGrid: $('prod-unlock-chain-grid'),
      btnProdUnlockOk: $('btn-prod-unlock-ok'),

      streakModal: $('modal-streak'),
      streakModalTitle: $('streak-modal-title'),
      streakModalSub: $('streak-modal-sub'),
      streakBonusImg: $('streak-bonus-img'),
      streakBonusName: $('streak-bonus-name'),
      btnStreakClaim: $('btn-streak-claim'),
      btnStreakDouble: $('btn-streak-double'),

      lbModal: $('modal-leaderboard'),
      lbModalTitle: $('lb-modal-title'),
      lbModalSub: $('lb-modal-sub'),
      lbLeagueBadge: $('lb-league-badge'),
      lbScorePill: $('lb-score-pill'),
      lbLeagueBarFill: $('lb-league-bar-fill'),
      lbLeagueNext: $('lb-league-next'),
      lbRivalHint: $('lb-rival-hint'),
      btnLbClaimLeague: $('btn-lb-claim-league'),
      lbList: $('lb-entries-list'),
      lbAuthWrap: $('lb-auth-wrap'),
      lbAuthText: $('lb-auth-text'),
      btnLbAuth: $('btn-lb-auth'),
      btnCloseLb: $('btn-close-lb'),

      introModal: $('modal-intro'),
      introBadge: $('dacha-intro-badge'),
      introTitle: $('dacha-intro-title'),
      introStory: $('dacha-intro-story'),
      introR1T: $('dacha-intro-r1-t'),
      introR1D: $('dacha-intro-r1-d'),
      introR2T: $('dacha-intro-r2-t'),
      introR2D: $('dacha-intro-r2-d'),
      introR3T: $('dacha-intro-r3-t'),
      introR3D: $('dacha-intro-r3-d'),
      btnIntroStart: $('btn-dacha-intro-start'),
      btnIntroReplay: $('btn-dacha-intro-replay'),

      tutBanner: $('dacha-tut-banner'),
      tutAvatar: $('dacha-tut-avatar'),
      tutStep: $('dacha-tut-step'),
      tutText: $('dacha-tut-text'),
      btnTutSkip: $('btn-dacha-tut-skip'),
      tutHand: $('dacha-tut-hand'),

      dailyModal: $('modal-daily'),
      dailyKicker: $('dacha-daily-kicker'),
      dailyTitle: $('dacha-daily-title'),
      dailySub: $('dacha-daily-sub'),
      dailyGrid: $('dacha-daily-grid'),
      dailyActions: $('dacha-daily-actions'),
      btnDailyDouble: $('btn-dacha-daily-double'),
      btnDailyClaim: $('btn-dacha-daily-claim'),
      dailyClaimedBox: $('dacha-daily-claimed'),
      btnCloseDaily: $('btn-close-dacha-daily')
    };
  }

  buildBoardGridDom() {
    this.dom.boardGrid.innerHTML = '';
    this.cellEls = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      const rowArr = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        const el = document.createElement('div');
        el.className = `board-cell ${(r + c) % 2 === 0 ? 'cell-warm' : 'cell-spruce'}`;
        el.dataset.r = String(r);
        el.dataset.c = String(c);

        const img = document.createElement('img');
        img.className = 'cell-item-img hidden';
        img.alt = '';
        img.draggable = false;

        const frostLayer = document.createElement('div');
        frostLayer.className = 'cell-frost-overlay hidden';

        const bubbleLayer = document.createElement('div');
        bubbleLayer.className = 'cell-bubble-overlay hidden';

        const topBadge = document.createElement('span');
        topBadge.className = 'cell-badge-top hidden';

        const botBadge = document.createElement('span');
        botBadge.className = 'cell-badge-bot hidden';

        el.append(img, frostLayer, bubbleLayer, topBadge, botBadge);
        this.dom.boardGrid.appendChild(el);
        rowArr.push({ el, img, frostLayer, bubbleLayer, topBadge, botBadge, lastSig: '' });
      }
      this.cellEls.push(rowArr);
    }
  }

  handleSpriteLoaded(id, url) {
    if (id === 'dacha_scene_base') return;
    const imgs = document.querySelectorAll(`img[data-sprite-id="${id}"]`);
    for (const img of imgs) {
      img.src = url;
    }
  }

  setImgSprite(imgEl, id) {
    if (!imgEl || !id) return;
    imgEl.dataset.spriteId = id;
    const targetSrc = this.spriteBank.getUrl(id);
    if (imgEl.getAttribute('src') !== targetSrc) {
      imgEl.src = targetSrc;
    }
  }

  bindEvents() {
    const unlockAudioOnce = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlockAudioOnce, { passive: true });
    window.addEventListener('resize', () => this.renderDock());

    // Top HUD
    this.dom.starsPill.addEventListener('click', () => {
      this.audio.playClick();
      this.openDachaModal();
    });
    this.dom.energyPill.addEventListener('click', () => {
      this.audio.playClick();
      this.openEnergyModal();
    });
    this.dom.btnLeaderboard.addEventListener('click', () => {
      this.audio.playClick();
      this.openLeaderboardModal();
    });
    this.dom.btnDaily?.addEventListener('click', () => {
      this.audio.playClick();
      this.openDailyModal();
    });
    this.dom.btnCloseDaily?.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal(this.dom.dailyModal);
    });
    this.dom.btnDailyClaim?.addEventListener('click', () => {
      this.audio.unlock();
      this.claimDailyGift(1);
    });
    this.dom.btnDailyDouble?.addEventListener('click', async () => {
      this.audio.unlock();
      this.audio.playClick();
      const res = await this.platform.showRewarded('dacha_daily_x2');
      if (res?.rewarded) {
        this.claimDailyGift(2);
      }
    });
    this.dom.btnSound.addEventListener('click', () => {
      const nextMuted = !this.audio.userMuted;
      this.audio.setUserMuted(nextMuted);
      if (!nextMuted) this.audio.playClick();
      this.renderHud();
    });
    this.dom.btnLang.addEventListener('click', () => {
      this.audio.playClick();
      this.i18n.cycleLang();
      this.applyTranslations();
      this.renderAll();
      if (!this.dom.introModal.classList.contains('hidden')) {
        this.renderIntroModal();
      }
      if (this.dom.dailyModal && !this.dom.dailyModal.classList.contains('hidden')) {
        this.renderDailyModal();
      }
    });

    this.dom.btnHelp?.addEventListener('click', () => {
      this.audio.playClick();
      this.openIntroModal();
    });

    this.dom.btnIntroStart?.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.playClick();
      this.state.introSeen = true;
      this.persist();
      this.closeModal(this.dom.introModal);
    });

    this.dom.btnIntroReplay?.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.playClick();
      this.state.introSeen = true;
      this.state.tutorialStep = 0;
      this.persist();
      this.closeModal(this.dom.introModal);
    });

    this.dom.btnTutSkip?.addEventListener('click', () => {
      this.audio.playClick();
      this.state.tutorialStep = 4;
      this.persist();
      this.dom.tutBanner.classList.add('hidden');
      this.dom.tutHand.classList.add('hidden');
    });

    // Dacha preview strip
    this.dom.dachaCard.addEventListener('click', () => {
      this.audio.playClick();
      this.openDachaModal();
    });

    // Dock controls
    this.dom.btnBoost.addEventListener('click', () => {
      this.state.overdrive = !this.state.overdrive;
      this.audio.playSpawn(this.state.overdrive);
      this.showToast(this.i18n.t(this.state.overdrive ? 'boostHintOn' : 'boostHintOff'));
      this.persist();
      this.renderBoard();
      this.renderDock();
    });

    this.dom.btnBagOpen.addEventListener('click', () => {
      this.audio.playClick();
      this.openBagModal();
    });

    this.dom.btnChainInfo.addEventListener('click', () => {
      const cell = this.getSelectedBoardCell();
      if (!cell) return;
      const meta = ITEMS[cell.id];
      const chainId = meta?.chain || meta?.producesChain || 'tea';
      this.audio.playClick();
      this.openChainModal(chainId);
    });

    this.dom.btnStoreItem.addEventListener('click', () => {
      this.storeSelectedInBag();
    });

    this.dom.btnSellItem.addEventListener('click', () => {
      this.sellSelectedItem();
    });

    this.dom.btnPopBubbleAd.addEventListener('click', () => {
      this.popSelectedBubbleWithAd();
    });

    this.dom.btnPopBubbleCoin.addEventListener('click', () => {
      this.popSelectedBubbleWithCoins();
    });

    // Modal closers & backdrops
    const bindBackdropClose = (modalEl, closeFn) => {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          this.audio.playClick();
          closeFn();
        }
      });
    };

    this.dom.btnCloseDacha.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal(this.dom.dachaModal);
    });
    bindBackdropClose(this.dom.dachaModal, () => this.closeModal(this.dom.dachaModal));
    if (this.dom.dailyModal) {
      bindBackdropClose(this.dom.dailyModal, () => this.closeModal(this.dom.dailyModal));
    }

    this.dom.btnUnlockUpgrade.addEventListener('click', () => this.handleUnlockUpgrade());

    this.dom.btnCloseEnergy.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal(this.dom.energyModal);
    });
    bindBackdropClose(this.dom.energyModal, () => this.closeModal(this.dom.energyModal));

    this.dom.btnEnergyWelcome?.addEventListener('click', () => {
      if (this.state.firstFreeEnergyClaimed) return;
      this.state.firstFreeEnergyClaimed = true;
      this.grantEnergy(55);
      this.closeModal(this.dom.energyModal);
    });

    this.dom.btnEnergyAd.addEventListener('click', async () => {
      const res = await this.platform.showRewarded('energy_refill');
      if (res?.rewarded) {
        this.adFillUnavailable = false;
        this.grantEnergy(50);
        this.closeModal(this.dom.energyModal);
        return;
      }
      if (res?.noFill) {
        // Platform currently has ads disabled (e.g. CrazyGames Basic Launch) — switch to 2-min Kettle so playtime stays high!
        this.adFillUnavailable = true;
        const now = Date.now();
        if (now >= (this.state.thermosReadyAt || 0)) {
          this.state.thermosReadyAt = now + 120 * 1000;
          this.grantEnergy(45);
          this.showToast(this.i18n.t('energyNoAdToast'));
          this.closeModal(this.dom.energyModal);
        } else {
          this.renderEnergyModal();
        }
      }
    });

    this.dom.btnEnergyCoin.addEventListener('click', () => {
      const cost = this.getEnergyCoinCost();
      if (this.state.coins < cost) {
        this.audio.playWrong();
        this.showToast(this.i18n.t('notEnoughCoins'));
        return;
      }
      this.state.coins -= cost;
      const today = this.getTodayDateKey();
      if (this.state.energyBuyDate !== today) {
        this.state.energyBuyDate = today;
        this.state.energyBuysToday = 1;
      } else {
        this.state.energyBuysToday = (Number(this.state.energyBuysToday) || 0) + 1;
      }
      this.grantEnergy(50);
      this.closeModal(this.dom.energyModal);
    });

    this.dom.btnEnergyThermos.addEventListener('click', () => {
      const now = Date.now();
      if (now < (this.state.thermosReadyAt || 0)) {
        this.audio.playWrong();
        return;
      }
      const noAdsMode = !this.platform.isRewardedSupported() || this.adFillUnavailable;
      this.state.thermosReadyAt = now + (noAdsMode ? 120 : 900) * 1000;
      this.grantEnergy(noAdsMode ? 45 : 15);
      this.closeModal(this.dom.energyModal);
    });

    this.dom.btnCloseBag.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal(this.dom.bagModal);
    });
    bindBackdropClose(this.dom.bagModal, () => this.closeModal(this.dom.bagModal));

    this.dom.btnBagExpandCoin.addEventListener('click', () => {
      if (this.state.bagSlots >= 12) return;
      const cost = this.getBagSlotCoinCost();
      if (this.state.coins < cost) {
        this.audio.playWrong();
        this.showToast(this.i18n.t('notEnoughCoins'));
        return;
      }
      this.state.coins -= cost;
      this.state.bagSlots += 1;
      this.audio.playUpgrade();
      this.persist();
      this.renderHud();
      this.renderDock();
      this.renderBagModal();
    });

    this.dom.btnBagExpandAd.addEventListener('click', async () => {
      if (this.state.bagSlots >= 12) return;
      const res = await this.platform.showRewarded('bag_slot');
      if (res?.rewarded) {
        this.state.bagSlots = Math.min(12, this.state.bagSlots + 1);
        this.audio.playUpgrade();
        this.persist();
        this.renderDock();
        this.renderBagModal();
      }
    });

    this.dom.btnCloseChain.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal(this.dom.chainModal);
    });
    bindBackdropClose(this.dom.chainModal, () => this.closeModal(this.dom.chainModal));

    this.dom.btnChainPointProducer?.addEventListener('click', () => {
      this.audio.playClick();
      const ch = CHAINS[this.activeChainModalId] || CHAINS.tea;
      this.closeModal(this.dom.chainModal);
      this.focusProducerOnBoard(ch.producerId);
    });

    this.dom.btnProdUnlockOk?.addEventListener('click', () => {
      this.audio.playClick();
      const isLocked = this.dom.btnProdUnlockOk.dataset.locked === '1';
      const targetProd = this.spotlightProducerId;
      this.closeModal(this.dom.prodUnlockModal);
      if (!isLocked && targetProd) {
        this.focusProducerOnBoard(targetProd);
      } else {
        this.spotlightProducerId = null;
      }
    });
    bindBackdropClose(this.dom.prodUnlockModal, () => this.closeModal(this.dom.prodUnlockModal));

    this.dom.btnStreakClaim.addEventListener('click', () => {
      this.claimStreakChest(1);
    });
    this.dom.btnStreakDouble.addEventListener('click', async () => {
      const res = await this.platform.showRewarded('streak_x2');
      if (res?.rewarded) {
        this.claimStreakChest(2);
      }
    });

    this.dom.btnCloseLb.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal(this.dom.lbModal);
    });
    bindBackdropClose(this.dom.lbModal, () => this.closeModal(this.dom.lbModal));
    bindBackdropClose(this.dom.introModal, () => {
      this.state.introSeen = true;
      this.persist();
      this.closeModal(this.dom.introModal);
    });

    this.dom.btnLbAuth.addEventListener('click', async () => {
      const ok = await this.platform.promptAuth();
      if (ok) {
        await this.platform.submitLeaderboardScore(this.state.totalEarned);
        this.openLeaderboardModal();
      }
    });

    this.dom.btnLbClaimLeague?.addEventListener('click', () => {
      this.audio.unlock();
      this.claimNextLeaguePromo();
    });

    // Board pointer events (Drag & Drop + Smart Tap)
    this.dom.boardGrid.addEventListener('pointerdown', (e) => this.onBoardPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onBoardPointerMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this.onBoardPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onBoardPointerUp(e));
  }

  getCellCoordsFromPoint(clientX, clientY) {
    const rect = this.dom.boardGrid.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const c = Math.min(BOARD_COLS - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * BOARD_COLS)));
    const r = Math.min(BOARD_ROWS - 1, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * BOARD_ROWS)));
    return { r, c };
  }

  getCellCenterInStage(r, c) {
    const stageRect = this.dom.boardWrap.getBoundingClientRect();
    const cellEl = this.cellEls[r]?.[c]?.el;
    if (!cellEl) return { x: stageRect.width / 2, y: stageRect.height / 2 };
    const cr = cellEl.getBoundingClientRect();
    return {
      x: cr.left - stageRect.left + cr.width * 0.5,
      y: cr.top - stageRect.top + cr.height * 0.5,
      size: cr.width
    };
  }

  onBoardPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    this.resetIdleHint();
    const coords = this.getCellCoordsFromPoint(e.clientX, e.clientY);
    if (!coords) return;
    const cell = this.state.board[coords.r][coords.c];
    if (!cell) {
      // Tap on empty cell while regular movable item is selected -> move item
      this.handleCellTap(coords.r, coords.c);
      return;
    }

    const canDrag = !cell.frosted && !cell.isBubble && !cell.lockedProducer;
    this.drag = {
      pointerId: e.pointerId,
      startR: coords.r,
      startC: coords.c,
      startX: e.clientX,
      startY: e.clientY,
      curX: e.clientX,
      curY: e.clientY,
      canDrag,
      isDragging: false,
      hoverR: -1,
      hoverC: -1
    };
  }

  onBoardPointerMove(e) {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const dx = e.clientX - this.drag.startX;
    const dy = e.clientY - this.drag.startY;
    this.drag.curX = e.clientX;
    this.drag.curY = e.clientY;

    if (!this.drag.isDragging && this.drag.canDrag && Math.hypot(dx, dy) > 8) {
      const originCell = this.state.board[this.drag.startR][this.drag.startC];
      if (!originCell) {
        this.drag = null;
        return;
      }
      this.drag.isDragging = true;
      this.selectedCell = { r: this.drag.startR, c: this.drag.startC };
      this.setImgSprite(this.dom.dragGhostImg, originCell.id);
      this.dom.dragGhost.classList.remove('hidden');
      this.cellEls[this.drag.startR][this.drag.startC].el.classList.add('is-drag-source');
      this.highlightMergeTargets(originCell.id, this.drag.startR, this.drag.startC);
      this.renderDock();
    }

    if (this.drag.isDragging) {
      e.preventDefault();
      const stageRect = this.dom.boardWrap.getBoundingClientRect();
      const gx = e.clientX - stageRect.left;
      const gy = e.clientY - stageRect.top;
      this.dom.dragGhost.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -58%) scale(1.14)`;

      const over = this.getCellCoordsFromPoint(e.clientX, e.clientY);
      const nextHR = over ? over.r : -1;
      const nextHC = over ? over.c : -1;
      if (nextHR !== this.drag.hoverR || nextHC !== this.drag.hoverC) {
        if (this.drag.hoverR >= 0 && this.drag.hoverC >= 0) {
          this.cellEls[this.drag.hoverR][this.drag.hoverC].el.classList.remove('is-drop-hover');
        }
        this.drag.hoverR = nextHR;
        this.drag.hoverC = nextHC;
        if (nextHR >= 0 && nextHC >= 0) {
          this.cellEls[nextHR][nextHC].el.classList.add('is-drop-hover');
        }
      }
    }
  }

  onBoardPointerUp(e) {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const d = this.drag;
    this.drag = null;

    this.dom.dragGhost.classList.add('hidden');
    this.clearDragHighlights();

    if (!d.isDragging) {
      this.handleCellTap(d.startR, d.startC);
      return;
    }

    const target = this.getCellCoordsFromPoint(e.clientX, e.clientY);
    if (!target || (target.r === d.startR && target.c === d.startC)) {
      this.renderBoard();
      return;
    }

    this.resolveMoveOrMerge(d.startR, d.startC, target.r, target.c);
  }

  highlightMergeTargets(itemId, excludeR, excludeC) {
    if (!getNextTierItemId(itemId)) return;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (r === excludeR && c === excludeC) continue;
        const cell = this.state.board[r][c];
        if (cell && !cell.isBubble && cell.id === itemId) {
          this.cellEls[r][c].el.classList.add('is-merge-candidate');
        }
      }
    }
  }

  clearDragHighlights() {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        this.cellEls[r][c].el.classList.remove('is-drag-source', 'is-drop-hover', 'is-merge-candidate');
      }
    }
  }

  handleCellTap(r, c) {
    const tapped = this.state.board[r][c];
    const prevSel = this.selectedCell;
    const prevCell = prevSel ? this.state.board[prevSel.r]?.[prevSel.c] : null;

    // 1. Smart Two-Tap Merge: if user already selected an active mergeable item and taps a matching item (active OR frosted!)
    if (
      prevSel &&
      (prevSel.r !== r || prevSel.c !== c) &&
      prevCell &&
      !prevCell.frosted &&
      !prevCell.isBubble &&
      !ITEMS[prevCell.id]?.isProducer &&
      tapped &&
      !tapped.isBubble &&
      tapped.id === prevCell.id &&
      getNextTierItemId(tapped.id)
    ) {
      this.spawnArcVisual(prevSel.r, prevSel.c, r, c, prevCell.id);
      this.resolveMoveOrMerge(prevSel.r, prevSel.c, r, c);
      return;
    }

    // 2. Tap empty cell while a non-producer active item is selected -> quick move
    if (
      !tapped &&
      prevSel &&
      prevCell &&
      !prevCell.frosted &&
      !prevCell.isBubble &&
      !ITEMS[prevCell.id]?.isProducer
    ) {
      this.spawnArcVisual(prevSel.r, prevSel.c, r, c, prevCell.id);
      this.resolveMoveOrMerge(prevSel.r, prevSel.c, r, c);
      return;
    }

    if (!tapped) {
      return;
    }

    this.selectedCell = { r, c };

    // 3. Tapping a Producer: if locked, show friendly preview of what it makes; if unlocked, spawn immediately!
    if (!tapped.frosted && !tapped.isBubble && ITEMS[tapped.id]?.isProducer) {
      if (tapped.lockedProducer) {
        this.audio.playClick();
        this.renderBoard();
        this.renderDock();
        this.openProducerShowcaseModal(tapped.id, true);
        return;
      }
      if (this.spotlightProducerId === tapped.id) {
        this.spotlightUntilSec = 0;
      }
      this.triggerProducerSpawn(r, c);
      return;
    }

    this.audio.playClick();
    this.renderBoard();
    this.renderDock();
  }

  triggerProducerSpawn(r, c) {
    const prod = this.state.board[r][c];
    const meta = ITEMS[prod?.id];
    if (!meta?.isProducer) return;

    const cost = this.state.overdrive ? 2 : 1;
    if (this.state.energy < cost) {
      this.audio.playWrong();
      this.openEnergyModal();
      return;
    }

    const free = this.findNearestFreeCell(r, c);
    if (!free) {
      this.audio.playWrong();
      this.showToast(this.i18n.t('bagModalSub'));
      return;
    }

    this.state.energy -= cost;
    const chain = CHAINS[meta.producesChain];
    const isTutFirstSpawn = this.state.tutorialStep === 0;
    const lucky = isTutFirstSpawn ? false : Math.random() < 0.1;
    const tierIdx = isTutFirstSpawn ? 0 : (this.state.overdrive ? (lucky ? 2 : 1) : (lucky ? 1 : 0));
    const spawnedId = chain.items[Math.min(chain.items.length - 1, tierIdx)];
    if (isTutFirstSpawn) {
      this.state.tutorialStep = 1;
    }

    this.state.board[free.r][free.c] = { id: spawnedId, frosted: false };
    this.checkDiscovery(spawnedId, free.r, free.c);

    this.audio.playSpawn(this.state.overdrive);
    this.pulseCell(r, c);
    this.spawnArcVisual(r, c, free.r, free.c, spawnedId, () => {
      this.pulseCell(free.r, free.c);
    });

    this.persist();
    this.renderHud();
    this.renderOrders();
    this.renderBoard();
    this.renderDock();
  }

  resolveMoveOrMerge(sr, sc, tr, tc) {
    const src = this.state.board[sr][sc];
    if (!src || src.frosted || src.isBubble) {
      this.renderBoard();
      return;
    }
    const dst = this.state.board[tr][tc];

    // Case 1: Empty cell -> move
    if (!dst) {
      this.state.board[tr][tc] = src;
      this.state.board[sr][sc] = null;
      this.selectedCell = { r: tr, c: tc };
      this.audio.playClick();
      this.persist();
      this.renderBoard();
      this.renderDock();
      return;
    }

    // Case 2: Identical mergeable item (active OR frosted!)
    const nextId = !dst.isBubble && dst.id === src.id ? getNextTierItemId(src.id) : null;
    if (nextId) {
      const brokeFrost = Boolean(dst.frosted);
      this.state.board[sr][sc] = null;
      this.state.board[tr][tc] = { id: nextId, frosted: false };
      this.selectedCell = { r: tr, c: tc };

      const nextMeta = ITEMS[nextId];
      const tier = nextMeta?.tier || 2;
      this.audio.playMerge(tier, brokeFrost);
      this.pulseCell(tr, tc);
      this.spawnMergeFx(tr, tc, tier, brokeFrost);

      if (brokeFrost) {
        this.showToast(this.i18n.t('frostShattered'));
      }
      this.checkDiscovery(nextId, tr, tc);

      if (this.state.tutorialStep <= 1) {
        const countsAfter = this.getActiveBoardItemCounts();
        if (this.state.orders.some((o) => this.isOrderReady(o, countsAfter))) {
          this.state.tutorialStep = 2;
        }
      }

      // Occasional Floating Holiday Soap Bubble on Tier 4+ merges (only after 4+ orders so beginners aren't overwhelmed)
      if (tier >= 4 && (Number(this.state.ordersCompleted) || 0) >= 4 && this.countBubblesOnBoard() < 2 && Math.random() < 0.45) {
        const bCell = this.findNearestFreeCell(tr, tc);
        if (bCell) {
          this.state.board[bCell.r][bCell.c] = {
            id: nextId,
            frosted: false,
            isBubble: true,
            secLeft: 45
          };
          this.spawnArcVisual(tr, tc, bCell.r, bCell.c, nextId);
          if (!this.state.bubbleCoachSeen) {
            this.state.bubbleCoachSeen = true;
            this.showToast(this.i18n.t('bubbleFirstToast'));
          }
        }
      }

      // Non-frosted, non-locked target can be swapped below

      this.persist();
      this.renderHud();
      this.renderOrders();
      this.renderBoard();
      this.renderDock();
      return;
    }

    // Case 3: Non-matching target -> swap if target is NOT frosted and NOT a locked producer
    if (!dst.frosted && !dst.lockedProducer) {
      this.state.board[tr][tc] = src;
      this.state.board[sr][sc] = dst;
      this.selectedCell = { r: tr, c: tc };
      this.audio.playClick();
      this.persist();
      this.renderBoard();
      this.renderDock();
      return;
    }

    // Frosted non-matching item cannot be swapped
    this.audio.playWrong();
    this.renderBoard();
  }

  checkDiscovery(itemId, r, c) {
    if (!this.state.discoveredIds.includes(itemId)) {
      this.state.discoveredIds.push(itemId);
      this.addCoins(10);
      const itemName = this.i18n.pick(ITEMS[itemId]?.name);
      this.showToast(this.i18n.t('newDiscovery', { name: itemName }));
      const pt = this.getCellCenterInStage(r, c);
      this.floatingTexts.push({
        x: pt.x,
        y: pt.y - 10,
        text: '+10 🪙',
        color: '#fbbf24',
        life: 1.0
      });
    }
  }

  countBubblesOnBoard() {
    let n = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (this.state.board[r][c]?.isBubble) n++;
      }
    }
    return n;
  }

  findNearestFreeCell(originR, originC) {
    let best = null;
    let bestDist = Infinity;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (!this.state.board[r][c]) {
          const dist = Math.hypot(r - originR, c - originC) + (r * 0.02 + c * 0.01);
          if (dist < bestDist) {
            bestDist = dist;
            best = { r, c };
          }
        }
      }
    }
    return best;
  }

  getSelectedBoardCell() {
    if (!this.selectedCell) return null;
    return this.state.board[this.selectedCell.r]?.[this.selectedCell.c] || null;
  }

  storeSelectedInBag() {
    const sel = this.selectedCell;
    const cell = this.getSelectedBoardCell();
    if (!sel || !cell || cell.frosted || cell.isBubble) return;

    if (ITEMS[cell.id]?.isProducer) {
      // Ensure at least 1 producer stays on board
      let prodCount = 0;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (ITEMS[this.state.board[r][c]?.id]?.isProducer) prodCount++;
        }
      }
      if (prodCount <= 1) {
        this.audio.playWrong();
        this.showToast(this.i18n.t('cannotBagProducer'));
        return;
      }
    }

    if (this.state.bag.length >= this.state.bagSlots) {
      this.audio.playWrong();
      this.showToast(this.i18n.t('bagFull'));
      this.openBagModal();
      return;
    }

    this.state.bag.push({ id: cell.id });
    this.state.board[sel.r][sel.c] = null;
    this.audio.playBag();
    this.persist();
    this.renderOrders();
    this.renderBoard();
    this.renderDock();
  }

  sellSelectedItem() {
    const sel = this.selectedCell;
    const cell = this.getSelectedBoardCell();
    if (!sel || !cell || cell.frosted) return;

    if (cell.isBubble) {
      this.state.board[sel.r][sel.c] = null;
      this.addCoins(15);
      this.audio.playBubblePop();
      const pt = this.getCellCenterInStage(sel.r, sel.c);
      this.floatingTexts.push({ x: pt.x, y: pt.y, text: '+15 🪙', color: '#fbbf24', life: 1.0 });
      this.persist();
      this.renderHud();
      this.renderBoard();
      this.renderDock();
      return;
    }

    const meta = ITEMS[cell.id];
    if (!meta || meta.isProducer) return;

    const val = meta.sellCoins || 2;
    this.state.board[sel.r][sel.c] = null;
    this.addCoins(val);
    this.audio.play('sfx_coins', { volume: 0.65, rate: 1.15 });
    const pt = this.getCellCenterInStage(sel.r, sel.c);
    this.floatingTexts.push({ x: pt.x, y: pt.y, text: `+${val} 🪙`, color: '#fbbf24', life: 1.0 });

    this.persist();
    this.renderHud();
    this.renderOrders();
    this.renderBoard();
    this.renderDock();
  }

  async popSelectedBubbleWithAd() {
    const sel = this.selectedCell;
    const cell = this.getSelectedBoardCell();
    if (!sel || !cell?.isBubble) return;
    const res = await this.platform.showRewarded('soap_bubble');
    if (res?.rewarded) {
      const cur = this.state.board[sel.r]?.[sel.c];
      if (cur?.isBubble) {
        cur.isBubble = false;
        delete cur.secLeft;
        this.audio.playBubblePop();
        this.pulseCell(sel.r, sel.c);
        this.spawnMergeFx(sel.r, sel.c, 4, false);
        this.persist();
        this.renderOrders();
        this.renderBoard();
        this.renderDock();
      }
    }
  }

  popSelectedBubbleWithCoins() {
    const sel = this.selectedCell;
    const cell = this.getSelectedBoardCell();
    if (!sel || !cell?.isBubble) return;
    const cost = ITEMS[cell.id]?.bubbleCoins || 35;
    if (this.state.coins < cost) {
      this.audio.playWrong();
      this.showToast(this.i18n.t('notEnoughCoins'));
      return;
    }
    this.state.coins -= cost;
    cell.isBubble = false;
    delete cell.secLeft;
    this.audio.playBubblePop();
    this.pulseCell(sel.r, sel.c);
    this.spawnMergeFx(sel.r, sel.c, 4, false);
    this.persist();
    this.renderHud();
    this.renderOrders();
    this.renderBoard();
    this.renderDock();
  }

  addCoins(amount) {
    this.state.coins += amount;
    this.state.totalCoins += amount;
  }

  addStars(amount) {
    this.state.stars += amount;
    this.state.totalStars += amount;
  }

  grantEnergy(amount) {
    this.state.energy = Math.min(MAX_ENERGY + 150, this.state.energy + amount);
    if (this.state.energy >= MAX_ENERGY) this.state.energyFracSec = 0;
    this.audio.playUpgrade();
    this.showToast(this.i18n.t('energyRefilled', { amount }));
    this.persist();
    this.renderHud();
  }

  // Neighbor Orders
  getActiveBoardItemCounts() {
    const counts = new Map();
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (cell && !cell.frosted && !cell.isBubble && !ITEMS[cell.id]?.isProducer) {
          counts.set(cell.id, (counts.get(cell.id) || 0) + 1);
        }
      }
    }
    return counts;
  }

  isOrderReady(order, countsMap) {
    const temp = new Map(countsMap);
    for (const reqId of order.reqs) {
      const c = temp.get(reqId) || 0;
      if (c <= 0) return false;
      temp.set(reqId, c - 1);
    }
    return true;
  }

  fulfillOrder(slotIdx, cardEl) {
    const order = this.state.orders[slotIdx];
    if (!order) return;
    const counts = this.getActiveBoardItemCounts();
    if (!this.isOrderReady(order, counts)) {
      this.audio.playWrong();
      return;
    }

    // Consume required items from active board
    for (const reqId of order.reqs) {
      let removed = false;
      for (let r = 0; r < BOARD_ROWS && !removed; r++) {
        for (let c = 0; c < BOARD_COLS && !removed; c++) {
          const cell = this.state.board[r][c];
          if (cell && !cell.frosted && !cell.isBubble && cell.id === reqId) {
            this.state.board[r][c] = null;
            removed = true;
          }
        }
      }
    }

    this.addCoins(order.coins);
    this.addStars(order.stars);
    this.state.ordersCompleted += 1;
    this.state.streakCount += 1;
    if (this.state.tutorialStep <= 2 && this.state.stars >= 1) {
      this.state.tutorialStep = 3;
    }

    this.audio.playOrderDone();
    this.spawnOrderRewardBurst(cardEl, order.coins, order.stars);

    // Check if completing this order unlocked a new Producer (at 2, 5, or 8 orders)!
    const newlyUnlockedProds = this.syncProducerLocksFromProgress();
    let forcedNewChainKey = null;
    if (newlyUnlockedProds.length > 0) {
      const firstNew = newlyUnlockedProds[0];
      forcedNewChainKey = ITEMS[firstNew.id]?.producesChain || null;
      this.spawnMergeFx(firstNew.r, firstNew.c, 5, false);
    }

    // Replace with fresh neighbor order (introducing newly unlocked chain immediately!)
    this.state.orders[slotIdx] = this.generateNextOrder(slotIdx, forcedNewChainKey);

    this.syncScoreTotals();
    this.platform.submitLeaderboardScore(this.state.totalEarned);

    let openedStreak = false;
    if (newlyUnlockedProds.length > 0) {
      openedStreak = true;
      this.openProducerShowcaseModal(newlyUnlockedProds[0].id, false);
    } else if (this.state.streakCount >= 4) {
      this.state.streakCount = 0;
      openedStreak = true;
      this.openStreakModal();
    } else if (this.state.ordersCompleted % 5 === 0) {
      this.platform.showInterstitialIfReady();
    }

    this.persist(openedStreak);
    this.renderHud();
    this.renderDachaStrip();
    this.renderOrders();
    this.renderBoard();
    this.renderDock();
    if (!openedStreak) {
      this.checkPendingEngagementModals();
    }
  }

  generateNextOrder(slotIdx, preferredChainKey = null) {
    const nDone = this.state.ordersCompleted;
    const chainKeys = this.getUnlockedChainKeys();
    const usedNeighbors = new Set(
      this.state.orders
        .filter((_, idx) => idx !== slotIdx)
        .map((o) => o?.neighborId)
        .filter(Boolean)
    );
    const availableNeighbors = NEIGHBORS.filter((n) => !usedNeighbors.has(n.id));
    const pool = availableNeighbors.length > 0 ? availableNeighbors : NEIGHBORS;
    const neighbor = pool[(nDone + slotIdx) % pool.length];

    // Commercial Merge-2 tier curve so energy feels genuinely valuable (~6-8 min first tank)
    const minTierIdx = nDone < 2 ? 1 : nDone < 14 ? 2 : 3;
    const maxTierIdx = nDone < 2 ? 2 : nDone < 6 ? 3 : nDone < 14 ? 4 : nDone < 24 ? 5 : 6;
    const twoItems = nDone >= 3 && (nDone + slotIdx) % 2 === 0;

    const pickItem = (offset, forceKey = null) => {
      const chKey = forceKey && CHAINS[forceKey] ? forceKey : chainKeys[(nDone + slotIdx + offset) % chainKeys.length];
      const ch = CHAINS[chKey];
      // When introducing a brand-new chain, ask for Tier 3 (idx 2 = 4 taps) so player learns the new producer!
      const tIdx = forceKey ? 2 : (minTierIdx + Math.floor(Math.random() * Math.max(1, maxTierIdx - minTierIdx + 1)));
      return ch.items[Math.min(ch.items.length - 1, tIdx)];
    };

    const reqs = [pickItem(0, preferredChainKey)];
    if (twoItems && !preferredChainKey) {
      reqs.push(pickItem(1));
    }

    let coinSum = 0;
    let maxT = 2;
    for (const id of reqs) {
      const t = ITEMS[id]?.tier || 2;
      maxT = Math.max(maxT, t);
      coinSum += Math.round(14 * Math.pow(1.82, t - 1));
    }
    const stars = maxT >= 6 ? 3 : maxT >= 4 || reqs.length === 2 ? 2 : 1;

    return {
      uid: `ord_${Date.now()}_${slotIdx}`,
      neighborId: neighbor.id,
      reqs,
      coins: coinSum,
      stars
    };
  }

  openStreakModal() {
    const chainKeys = this.getUnlockedChainKeys();
    const ch = CHAINS[chainKeys[this.state.ordersCompleted % chainKeys.length]];
    this.pendingStreakBonusItem = ch.items[2]; // Tier 3 holiday treat
    this.setImgSprite(this.dom.streakBonusImg, this.pendingStreakBonusItem);
    this.dom.streakBonusName.textContent = this.i18n.pick(ITEMS[this.pendingStreakBonusItem]?.name);
    this.openModal(this.dom.streakModal);
  }

  claimStreakChest(multiplier = 1) {
    const coins = 75 * multiplier;
    const bonusEnergy = multiplier > 1 ? 25 : 0;
    this.addCoins(coins);
    if (bonusEnergy > 0) {
      this.state.energy = Math.min(MAX_ENERGY + 120, this.state.energy + bonusEnergy);
    }

    for (let i = 0; i < multiplier; i++) {
      const free = this.findNearestFreeCell(3, 3);
      if (free) {
        this.state.board[free.r][free.c] = { id: this.pendingStreakBonusItem, frosted: false };
      } else if (this.state.bag.length < this.state.bagSlots) {
        this.state.bag.push({ id: this.pendingStreakBonusItem });
      }
    }

    this.audio.playUpgrade();
    this.closeModal(this.dom.streakModal);
    this.persist(true);
    this.renderAll();
  }

  // Dacha Renovation Modal
  openDachaModal() {
    const nextLocked = DACHA_UPGRADES.find((u) => this.state.unlockedUpgrades[u.id] === undefined);
    if (nextLocked) {
      this.activeRenovationId = nextLocked.id;
      this.pendingStyleIdx = 0;
    }
    this.renderDachaModal();
    this.openModal(this.dom.dachaModal);
  }

  renderDachaModal() {
    this.dom.dachaModalStars.textContent = `★ ${this.state.stars}`;
    this.dom.dachaModalCoins.innerHTML = `<span class="gold-coin-ic"></span> ${this.state.coins}`;

    this.dom.dachaUpgradesStrip.innerHTML = '';
    for (const upg of DACHA_UPGRADES) {
      const unlocked = this.state.unlockedUpgrades[upg.id] !== undefined;
      const isSelected = this.activeRenovationId === upg.id;
      const affordable = !unlocked && this.state.stars >= upg.stars && this.state.coins >= upg.coins;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `upg-chip ${unlocked ? 'is-unlocked' : ''} ${isSelected ? 'is-active' : ''} ${affordable ? 'is-affordable' : ''}`;
      btn.innerHTML = `
        <span class="upg-chip-icon">${upg.icon}</span>
        <span class="upg-chip-num">${unlocked ? '✓' : upg.order}</span>
      `;
      btn.addEventListener('click', () => {
        this.audio.playClick();
        this.activeRenovationId = upg.id;
        this.pendingStyleIdx = this.state.unlockedUpgrades[upg.id] ?? 0;
        this.renderDachaModal();
      });
      this.dom.dachaUpgradesStrip.appendChild(btn);
    }

    const activeUpg = DACHA_UPGRADES.find((u) => u.id === this.activeRenovationId) || DACHA_UPGRADES[0];
    const isUnlocked = this.state.unlockedUpgrades[activeUpg.id] !== undefined;
    this.dom.dachaSelectedUpgTitle.textContent = `${activeUpg.icon} ${this.i18n.pick(activeUpg.name)}`;

    this.dom.dachaStyleSwatches.innerHTML = '';
    activeUpg.styles.forEach((st, idx) => {
      const chosenIdx = isUnlocked ? this.state.unlockedUpgrades[activeUpg.id] : this.pendingStyleIdx;
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = `style-swatch-btn ${chosenIdx === idx ? 'is-selected' : ''}`;
      sw.innerHTML = `
        <span class="swatch-dot" style="background: linear-gradient(135deg, ${st.primary}, ${st.secondary})"></span>
        <span class="swatch-name">${this.i18n.pick(st.name)}</span>
      `;
      sw.addEventListener('click', () => {
        this.audio.playClick();
        if (isUnlocked) {
          this.state.unlockedUpgrades[activeUpg.id] = idx;
          this.persist();
        } else {
          this.pendingStyleIdx = idx;
        }
        this.renderDachaModal();
      });
      this.dom.dachaStyleSwatches.appendChild(sw);
    });

    const allDone = Object.keys(this.state.unlockedUpgrades).length >= DACHA_UPGRADES.length;
    if (allDone) {
      const p = this.getPrestigeCost();
      const canCelebrate = this.state.stars >= p.stars && this.state.coins >= p.coins;
      if (this.dom.dachaPrestigeBox) {
        this.dom.dachaPrestigeBox.classList.remove('hidden');
        this.dom.dachaPrestigeTitle.textContent = this.i18n.t('prestigeBoxTitle', { lv: p.nextLv });
        this.dom.dachaPrestigeSub.textContent = this.i18n.t('prestigeBoxSub');
      }
      this.dom.btnUnlockUpgrade.disabled = false;
      this.dom.btnUnlockUpgrade.className = `tactile-btn ${canCelebrate ? 'btn-emerald pulse-cta' : 'btn-amber'} btn-unlock-upg`;
      this.dom.btnUnlockUpgrade.textContent = this.i18n.t('prestigeActionBtn', { stars: p.stars, coins: p.coins });
    } else {
      this.dom.dachaPrestigeBox?.classList.add('hidden');
      if (isUnlocked) {
        this.dom.btnUnlockUpgrade.disabled = true;
        this.dom.btnUnlockUpgrade.className = 'tactile-btn btn-emerald btn-unlock-upg is-built';
        this.dom.btnUnlockUpgrade.textContent = this.i18n.t('unlockedTag');
      } else {
        const canBuy = this.state.stars >= activeUpg.stars && this.state.coins >= activeUpg.coins;
        this.dom.btnUnlockUpgrade.disabled = false;
        this.dom.btnUnlockUpgrade.className = `tactile-btn ${canBuy ? 'btn-emerald pulse-cta' : 'btn-amber'} btn-unlock-upg`;
        this.dom.btnUnlockUpgrade.textContent = `${this.i18n.t('unlockUpgradeBtn')} ★${activeUpg.stars} + 🪙${activeUpg.coins}`;
      }
    }
  }

  getPrestigeCost() {
    const curLv = Math.max(0, Math.floor(Number(this.state.prestigeLevel) || 0));
    const nextLv = curLv + 1;
    const stars = Math.min(8, 3 + Math.floor(curLv / 2));
    const coins = 180 + curLv * 45;
    return { curLv, nextLv, stars, coins };
  }

  handlePrestigeCelebration() {
    const p = this.getPrestigeCost();
    if (this.state.stars < p.stars) {
      this.audio.playWrong();
      this.showToast(this.i18n.t('notEnoughStars'));
      return;
    }
    if (this.state.coins < p.coins) {
      this.audio.playWrong();
      this.showToast(this.i18n.t('notEnoughCoins'));
      return;
    }

    this.state.stars -= p.stars;
    this.state.coins -= p.coins;
    this.state.prestigeLevel = p.nextLv;

    const giftId = PRESTIGE_GIFT_POOL[(p.nextLv - 1) % PRESTIGE_GIFT_POOL.length];
    const free = this.findNearestFreeCell(3, 3);
    if (free) {
      this.state.board[free.r][free.c] = { id: giftId, frosted: false };
      this.checkDiscovery(giftId, free.r, free.c);
    } else if (this.state.bag.length < this.state.bagSlots) {
      this.state.bag.push({ id: giftId });
    }

    const finaleId = DACHA_UPGRADES[DACHA_UPGRADES.length - 1].id;
    this.audio.playUpgrade();
    this.dachaRenderer.triggerCelebration(finaleId);
    this.persist(true);
    this.platform.notifyLevelCompleted(DACHA_UPGRADES.length + p.nextLv);
    this.platform.submitLeaderboardScore(this.state.totalEarned);
    this.showToast(this.i18n.t('prestigeToast', { lv: p.nextLv }));

    this.renderAll();
  }

  handleUnlockUpgrade() {
    const allDone = Object.keys(this.state.unlockedUpgrades).length >= DACHA_UPGRADES.length;
    if (allDone) {
      this.handlePrestigeCelebration();
      return;
    }
    const upg = DACHA_UPGRADES.find((u) => u.id === this.activeRenovationId);
    if (!upg || this.state.unlockedUpgrades[upg.id] !== undefined) return;

    if (this.state.stars < upg.stars) {
      this.audio.playWrong();
      this.showToast(this.i18n.t('notEnoughStars'));
      return;
    }
    if (this.state.coins < upg.coins) {
      this.audio.playWrong();
      this.showToast(this.i18n.t('notEnoughCoins'));
      return;
    }

    this.state.stars -= upg.stars;
    this.state.coins -= upg.coins;
    this.state.unlockedUpgrades[upg.id] = this.pendingStyleIdx;

    const totalUnlocked = Object.keys(this.state.unlockedUpgrades).length;
    if (this.state.tutorialStep <= 3) {
      this.state.tutorialStep = 4;
    }
    this.audio.playUpgrade();
    this.dachaRenderer.triggerCelebration(upg.id);
    this.platform.notifyLevelCompleted(totalUnlocked);
    this.platform.submitLeaderboardScore(this.state.totalEarned);

    // Advance focus smoothly if another upgrade is immediately affordable, else stay so player can admire & toggle styles
    const nextLocked = DACHA_UPGRADES.find((u) => this.state.unlockedUpgrades[u.id] === undefined);
    if (nextLocked && this.state.stars >= nextLocked.stars && this.state.coins >= nextLocked.coins) {
      this.activeRenovationId = nextLocked.id;
      this.pendingStyleIdx = 0;
    }

    this.persist(true);
    this.renderHud();
    this.renderDachaStrip();
    this.renderDachaModal();
  }

  // Energy, Bag, Chain & Leaderboard Modals
  openEnergyModal() {
    this.renderEnergyModal();
    this.openModal(this.dom.energyModal);
  }

  getEnergyCoinCost() {
    const today = this.getTodayDateKey();
    const buys = this.state.energyBuyDate === today ? (Number(this.state.energyBuysToday) || 0) : 0;
    const schedule = [90, 140, 200, 280];
    return schedule[Math.min(schedule.length - 1, Math.max(0, buys))];
  }

  formatWaitShort(sec) {
    const s = Math.max(1, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m <= 0) return `${r}s`;
    return `${m}m ${String(r).padStart(2, '0')}s`;
  }

  renderEnergyModal() {
    const now = Date.now();
    const waitSec = Math.max(0, Math.ceil(((this.state.thermosReadyAt || 0) - now) / 1000));
    const showWelcome = !this.state.firstFreeEnergyClaimed;
    const adAvailable = this.platform.isRewardedSupported() && !this.adFillUnavailable;

    if (this.dom.btnEnergyWelcome) {
      this.dom.btnEnergyWelcome.classList.toggle('hidden', !showWelcome);
      this.dom.btnEnergyWelcome.textContent = this.i18n.t('energyWelcomeBtn');
    }

    // Hide ad button while 1-time welcome gift is up so player never feels paywalled on their very first refill!
    this.dom.btnEnergyAd.classList.toggle('hidden', showWelcome || !adAvailable);
    this.dom.btnEnergyAd.textContent = this.i18n.t('energyAdBtn');

    if (waitSec > 0) {
      this.dom.btnEnergyThermos.disabled = true;
      this.dom.btnEnergyThermos.textContent = this.i18n.t('energyThermosUsed', { time: this.formatWaitShort(waitSec) });
    } else {
      this.dom.btnEnergyThermos.disabled = false;
      this.dom.btnEnergyThermos.textContent = this.i18n.t(adAvailable ? 'energyThermosBtn' : 'energyKettleNoAdBtn');
    }

    this.dom.btnEnergyCoin.textContent = `${this.i18n.t('energyCoinBtn', { cost: this.getEnergyCoinCost() })} 🪙`;
  }

  getBagSlotCoinCost() {
    return 45 + (this.state.bagSlots - 4) * 35;
  }

  openBagModal() {
    this.renderBagModal();
    this.openModal(this.dom.bagModal);
  }

  renderBagModal() {
    this.dom.bagSlotsGrid.innerHTML = '';
    for (let i = 0; i < this.state.bagSlots; i++) {
      const entry = this.state.bag[i];
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = `bag-slot-cell ${entry ? 'has-item' : 'is-empty'}`;
      if (entry) {
        const img = document.createElement('img');
        img.className = 'bag-slot-img';
        img.alt = '';
        this.setImgSprite(img, entry.id);
        const cap = document.createElement('span');
        cap.className = 'bag-slot-name';
        cap.textContent = this.i18n.pick(ITEMS[entry.id]?.name);
        slot.append(img, cap);
        slot.addEventListener('click', () => {
          const free = this.findNearestFreeCell(3, 3);
          if (!free) {
            this.audio.playWrong();
            return;
          }
          this.state.board[free.r][free.c] = { id: entry.id, frosted: false };
          this.state.bag.splice(i, 1);
          this.selectedCell = { r: free.r, c: free.c };
          this.audio.playBag();
          this.persist();
          this.renderOrders();
          this.renderBoard();
          this.renderDock();
          this.renderBagModal();
        });
      } else {
        slot.textContent = this.i18n.t('bagEmptySlot');
        slot.disabled = true;
      }
      this.dom.bagSlotsGrid.appendChild(slot);
    }

    if (this.state.bagSlots >= 12) {
      this.dom.btnBagExpandCoin.classList.add('hidden');
      this.dom.btnBagExpandAd.classList.add('hidden');
    } else {
      this.dom.btnBagExpandCoin.classList.remove('hidden');
      this.dom.btnBagExpandAd.classList.remove('hidden');
      this.dom.btnBagExpandCoin.textContent = `${this.i18n.t('bagBuyCoin', { cost: this.getBagSlotCoinCost() })} 🪙`;
      this.dom.btnBagExpandAd.textContent = this.i18n.t('bagBuyAd');
    }
  }

  openChainModal(chainId, targetItemId = null) {
    this.activeChainModalId = chainId;
    this.activeRecipeTargetId = targetItemId;
    const ch = CHAINS[chainId] || CHAINS.tea;
    const prodMeta = ITEMS[ch.producerId];
    const unlocked = this.isProducerUnlockedByProgress(ch.producerId);
    const reqOrders = PRODUCER_UNLOCK_ORDERS[ch.producerId] ?? 0;
    const left = Math.max(1, reqOrders - (Number(this.state.ordersCompleted) || 0));

    this.dom.chainModalTitle.textContent = `${this.i18n.t('chainModalTitle')}: ${this.i18n.pick(ch.name)}`;
    this.setImgSprite(this.dom.chainProducerImg, ch.producerId);
    this.dom.chainProducerName.textContent = `${this.i18n.pick(prodMeta?.name)} ${unlocked ? '⚡' : '🔒'}`;
    this.dom.chainProducerBanner?.classList.toggle('is-locked-banner', !unlocked);
    this.dom.chainProducerHint.textContent = unlocked
      ? this.i18n.t('chainSourceHint', { name: this.i18n.pick(prodMeta?.name) })
      : this.i18n.t('chainLockedBanner', { left });
    if (this.dom.btnChainPointProducer) {
      this.dom.btnChainPointProducer.textContent = this.i18n.t('chainShowProducerBtn');
      this.dom.btnChainPointProducer.classList.toggle('hidden', !unlocked);
    }

    this.dom.chainStepsList.innerHTML = '';

    ch.items.forEach((id, idx) => {
      const discovered = this.state.discoveredIds.includes(id);
      const isTarget = targetItemId === id;
      const card = document.createElement('div');
      card.className = `chain-step-card ${discovered ? 'is-discovered' : 'is-unknown'} ${isTarget ? 'is-target-highlight' : ''}`;
      const img = document.createElement('img');
      img.className = 'chain-step-img';
      img.alt = '';
      this.setImgSprite(img, id);

      const badge = document.createElement('span');
      badge.className = isTarget ? 'chain-needed-pill' : 'chain-step-num';
      badge.textContent = isTarget ? this.i18n.t('chainNeededTag') : `${idx + 1}/7`;

      const name = document.createElement('span');
      name.className = 'chain-step-name';
      name.textContent = this.i18n.pick(ITEMS[id]?.name);

      card.append(badge, img, name);
      this.dom.chainStepsList.appendChild(card);
    });

    this.openModal(this.dom.chainModal);
  }

  getCurrentLeagueInfo() {
    const score = Math.max(0, Math.floor(Number(this.state?.totalEarned) || 0));
    let current = DACHA_LEAGUES[0];
    let next = null;
    for (let i = 0; i < DACHA_LEAGUES.length; i++) {
      if (score >= DACHA_LEAGUES[i].minScore) {
        current = DACHA_LEAGUES[i];
        next = DACHA_LEAGUES[i + 1] || null;
      }
    }
    return { score, current, next };
  }

  getUnclaimedLeaguePromo() {
    const score = Math.max(0, Math.floor(Number(this.state?.totalEarned) || 0));
    const claimed = Array.isArray(this.state?.claimedLeagues) ? this.state.claimedLeagues : [0];
    for (const lg of DACHA_LEAGUES) {
      if (lg.idx > 0 && score >= lg.minScore && !claimed.includes(lg.idx)) {
        return lg;
      }
    }
    return null;
  }

  claimNextLeaguePromo() {
    const lg = this.getUnclaimedLeaguePromo();
    if (!lg) return;
    if (!Array.isArray(this.state.claimedLeagues)) this.state.claimedLeagues = [0];
    this.state.claimedLeagues.push(lg.idx);
    this.addCoins(lg.rewardCoins);
    this.addStars(lg.rewardStars);
    this.audio.playUpgrade();
    this.persist(true);
    this.showToast(this.i18n.t('lbLeagueClaimedToast', { coins: lg.rewardCoins, stars: lg.rewardStars }));
    this.renderHud();
    this.renderDachaStrip();
    this.openLeaderboardModal();
  }

  async openLeaderboardModal() {
    const usedNative = await this.platform.showNativeLeaderboardPopup();
    if (usedNative) return;

    this.syncScoreTotals();
    const curLgIdx = this.getCurrentLeagueInfo().current.idx;
    if (curLgIdx > (Number(this.state.autoOpenedLeagueIdx) || 0)) {
      this.state.autoOpenedLeagueIdx = curLgIdx;
      this.persist();
    }
    await this.platform.submitLeaderboardScore(this.state.totalEarned);
    this.openModal(this.dom.lbModal);

    const canAuth = this.platform.isAuthSupported() && !this.platform.isPlayerAuthorized();
    this.dom.lbAuthWrap.classList.toggle('hidden', !canAuth);

    const entries = await this.platform.getLeaderboardEntries(this.state.totalEarned);
    const list = entries.length > 1 ? entries : this.buildLocalLeaderboardFallback();

    // Update League Card & Next Rival Gap
    const { score, current, next } = this.getCurrentLeagueInfo();
    if (this.dom.lbLeagueBadge) {
      this.dom.lbLeagueBadge.textContent = this.i18n.t(current.nameKey);
      this.dom.lbScorePill.textContent = `🏆 ${score}`;
      if (next) {
        const span = Math.max(1, next.minScore - current.minScore);
        const pct = Math.max(6, Math.min(100, Math.round(((score - current.minScore) / span) * 100)));
        this.dom.lbLeagueBarFill.style.width = `${pct}%`;
        this.dom.lbLeagueNext.textContent = this.i18n.t('lbNextLeague', {
          name: this.i18n.t(next.nameKey),
          cur: score,
          target: next.minScore
        });
      } else {
        this.dom.lbLeagueBarFill.style.width = '100%';
        this.dom.lbLeagueNext.textContent = this.i18n.t('lbMaxLeague');
      }

      const myIdx = list.findIndex((r) => r.isMe);
      if (myIdx > 0) {
        const above = list[myIdx - 1];
        const diff = Math.max(1, above.score - score + 1);
        this.dom.lbRivalHint.textContent = this.i18n.t('lbRivalGap', {
          rank: above.rank,
          name: above.name,
          diff
        });
      } else {
        this.dom.lbRivalHint.textContent = this.i18n.t('lbTopOne');
      }

      const unclaimed = this.getUnclaimedLeaguePromo();
      if (unclaimed && this.dom.btnLbClaimLeague) {
        this.dom.btnLbClaimLeague.classList.remove('hidden');
        this.dom.btnLbClaimLeague.textContent = this.i18n.t('lbClaimLeagueBtn', {
          name: this.i18n.t(unclaimed.nameKey),
          coins: unclaimed.rewardCoins,
          stars: unclaimed.rewardStars
        });
      } else {
        this.dom.btnLbClaimLeague?.classList.add('hidden');
      }
    }

    this.dom.lbList.innerHTML = '';
    let meRowEl = null;
    for (const row of list) {
      const item = document.createElement('div');
      item.className = `lb-row ${row.isMe ? 'is-me' : ''}`;
      item.innerHTML = `
        <span class="lb-rank">#${row.rank}</span>
        <span class="lb-name">${escapeHtml(row.name)}</span>
        <span class="lb-score">🏆 ${row.score}</span>
      `;
      if (row.isMe) meRowEl = item;
      this.dom.lbList.appendChild(item);
    }
    if (meRowEl) {
      requestAnimationFrame(() => {
        meRowEl.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
    }
  }

  buildLocalLeaderboardFallback() {
    const myScore = Math.max(0, Math.floor(Number(this.state.totalEarned) || 0));
    const myName = this.platform.getPlayerDisplayName();
    const bots = DACHA_RIVALS.map((r) => ({
      name: r.nameKey ? this.i18n.t(r.nameKey) : this.i18n.pick(r.name),
      score: r.score,
      isMe: false
    }));
    bots.push({ name: myName, score: myScore, isMe: true });
    bots.sort((a, b) => (b.score !== a.score ? b.score - a.score : (a.isMe ? -1 : 1)));
    return bots.map((b, idx) => ({ ...b, rank: idx + 1 }));
  }

  openIntroModal() {
    this.renderIntroModal();
    this.openModal(this.dom.introModal);
  }

  renderIntroModal() {
    this.dom.introBadge.textContent = this.i18n.t('introBadge');
    this.dom.introTitle.textContent = this.i18n.t('introTitle');
    this.dom.introStory.textContent = this.i18n.t('introStory');
    this.dom.introR1T.textContent = this.i18n.t('introR1Title');
    this.dom.introR1D.textContent = this.i18n.t('introR1Desc');
    this.dom.introR2T.textContent = this.i18n.t('introR2Title');
    this.dom.introR2D.textContent = this.i18n.t('introR2Desc');
    this.dom.introR3T.textContent = this.i18n.t('introR3Title');
    this.dom.introR3D.textContent = this.i18n.t('introR3Desc');
    this.dom.btnIntroStart.textContent = this.i18n.t('introStartBtn');
    this.dom.btnIntroReplay.textContent = this.i18n.t('introReplayTutBtn');
    this.dom.btnIntroReplay.classList.toggle('hidden', (this.state.tutorialStep || 0) < 4);
  }

  getTodayDateKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  isDailyGiftAvailable() {
    return this.state.lastDailyDate !== this.getTodayDateKey();
  }

  getCurrentDailyDay() {
    const claimed = Math.max(0, Number(this.state.dailyClaimedCount) || 0);
    if (this.isDailyGiftAvailable()) {
      return (claimed % 7) + 1;
    }
    return ((Math.max(1, claimed) - 1) % 7) + 1;
  }

  openDailyModal() {
    if (!this.dom.dailyModal) return;
    this.renderDailyModal();
    this.openModal(this.dom.dailyModal);
  }

  renderDailyModal() {
    if (!this.dom.dailyModal) return;
    this.dom.dailyKicker.textContent = this.i18n.t('dailyKicker');
    this.dom.dailyTitle.textContent = this.i18n.t('dailyTitle');
    this.dom.dailySub.textContent = this.i18n.t('dailySub');
    this.dom.btnCloseDaily.textContent = this.i18n.t('closeBtn');

    const avail = this.isDailyGiftAvailable();
    const curDay = this.getCurrentDailyDay();

    this.dom.dailyGrid.innerHTML = '';
    for (const r of DACHA_DAILY_REWARDS) {
      const isClaimed = avail ? r.day < curDay : r.day <= curDay;
      const isToday = avail && r.day === curDay;

      const card = document.createElement('div');
      card.className = `dacha-day-card ${r.day === 7 ? 'is-day7' : ''} ${isClaimed ? 'is-claimed' : ''} ${isToday ? 'is-today' : ''}`;

      const num = document.createElement('div');
      num.className = 'dacha-day-num';
      num.textContent = r.day === 7 ? this.i18n.t('dailyDay7') : this.i18n.t('dailyDayN', { n: r.day });

      const img = document.createElement('img');
      img.className = 'dacha-day-img';
      img.alt = '';
      this.setImgSprite(img, r.iconId);

      const rew = document.createElement('div');
      rew.className = 'dacha-day-reward';
      rew.textContent = r.label;

      card.append(num, img, rew);
      if (isClaimed) {
        const chk = document.createElement('span');
        chk.className = 'dacha-day-check';
        chk.textContent = '✓';
        card.appendChild(chk);
      }
      this.dom.dailyGrid.appendChild(card);
    }

    if (avail) {
      this.dom.dailyActions.classList.remove('hidden');
      this.dom.dailyClaimedBox.classList.add('hidden');
      this.dom.btnDailyDouble.classList.toggle('hidden', !this.platform.isRewardedSupported());
      this.dom.btnDailyDouble.textContent = this.i18n.t('dailyDoubleBtn');
      this.dom.btnDailyClaim.textContent = this.i18n.t('dailyClaimBtn');
    } else {
      this.dom.dailyActions.classList.add('hidden');
      this.dom.dailyClaimedBox.classList.remove('hidden');
      this.dom.dailyClaimedBox.textContent = this.i18n.t('dailyClaimedNote', { next: (curDay % 7) + 1 });
    }
  }

  claimDailyGift(multiplier = 1) {
    if (!this.isDailyGiftAvailable()) return;
    const curDay = this.getCurrentDailyDay();
    const reward = DACHA_DAILY_REWARDS[curDay - 1] || DACHA_DAILY_REWARDS[0];

    if (reward.coins) this.addCoins(reward.coins * multiplier);
    if (reward.stars) this.addStars(reward.stars * multiplier);
    if (reward.energy) {
      this.state.energy = Math.min(MAX_ENERGY + 200, this.state.energy + reward.energy * multiplier);
      if (this.state.energy >= MAX_ENERGY) this.state.energyFracSec = 0;
    }
    if (reward.itemId) {
      for (let i = 0; i < multiplier; i++) {
        const free = this.findNearestFreeCell(3, 3);
        if (free) {
          this.state.board[free.r][free.c] = { id: reward.itemId, frosted: false };
          this.checkDiscovery(reward.itemId, free.r, free.c);
        } else if (this.state.bag.length < this.state.bagSlots) {
          this.state.bag.push({ id: reward.itemId });
        }
      }
    }

    this.state.dailyClaimedCount = (Number(this.state.dailyClaimedCount) || 0) + 1;
    this.state.lastDailyDate = this.getTodayDateKey();
    this.audio.playUpgrade();
    this.showToast(this.i18n.t('dailyToast', { n: curDay }));
    this.persist(true);
    this.renderAll();
    this.renderDailyModal();
  }

  openModal(el) {
    el.classList.remove('hidden');
    this.platform.setGameplayActive(false);
  }

  isAnyModalOpen() {
    return [
      this.dom.dachaModal,
      this.dom.energyModal,
      this.dom.bagModal,
      this.dom.chainModal,
      this.dom.streakModal,
      this.dom.lbModal,
      this.dom.introModal,
      this.dom.prodUnlockModal,
      this.dom.dailyModal
    ].some((m) => m && !m.classList.contains('hidden'));
  }

  checkPendingEngagementModals() {
    if (this.isAnyModalOpen() || this.engagementTimer) return;
    if ((Number(this.state.tutorialStep) || 0) < 4) return;

    const today = this.getTodayDateKey();
    if (this.isDailyGiftAvailable() && this.state.dailyAutoShownDate !== today) {
      this.engagementTimer = setTimeout(() => {
        this.engagementTimer = null;
        if (this.isAnyModalOpen()) return;
        this.state.dailyAutoShownDate = this.getTodayDateKey();
        this.persist();
        this.openDailyModal();
      }, 360);
      return;
    }

    const curLg = this.getCurrentLeagueInfo().current;
    if (this.getUnclaimedLeaguePromo() && curLg.idx > (Number(this.state.autoOpenedLeagueIdx) || 0)) {
      this.engagementTimer = setTimeout(() => {
        this.engagementTimer = null;
        if (this.isAnyModalOpen()) return;
        this.state.autoOpenedLeagueIdx = curLg.idx;
        this.persist();
        this.openLeaderboardModal();
      }, 420);
    }
  }

  closeModal(el) {
    el.classList.add('hidden');
    if (!this.isAnyModalOpen()) {
      this.platform.setGameplayActive(true);
      this.checkPendingEngagementModals();
    }
  }

  // Rendering UI
  applyTranslations() {
    document.title = this.i18n.t('gameTitle');
    this.dom.langLabel.textContent = this.i18n.lang.toUpperCase();
    this.dom.btnOpenDachaText.textContent = this.i18n.t('buildBtn');
    this.dom.streakTitle.textContent = this.i18n.t('streakFull');
    this.dom.bagLabelText.textContent = this.i18n.t('bagBtn');

    this.dom.dachaModalTitle.textContent = this.i18n.t('renovateTitle');
    this.dom.dachaModalSub.textContent = this.i18n.t('renovateSub');
    this.dom.btnCloseDacha.textContent = this.i18n.t('backToBoard');

    this.dom.energyModalTitle.textContent = this.i18n.t('energyModalTitle');
    this.dom.energyModalSub.textContent = this.i18n.t('energyModalSub');
    this.dom.btnCloseEnergy.textContent = this.i18n.t('closeBtn');

    this.dom.bagModalTitle.textContent = this.i18n.t('bagModalTitle');
    this.dom.bagModalSub.textContent = this.i18n.t('bagModalSub');
    this.dom.btnCloseBag.textContent = this.i18n.t('closeBtn');

    this.dom.btnCloseChain.textContent = this.i18n.t('closeBtn');

    this.dom.streakModalTitle.textContent = this.i18n.t('streakModalTitle');
    this.dom.streakModalSub.textContent = this.i18n.t('streakModalSub');
    this.dom.btnStreakClaim.textContent = this.i18n.t('streakClaimBtn');
    this.dom.btnStreakDouble.textContent = this.i18n.t('streakDoubleAdBtn');

    this.dom.lbModalTitle.textContent = this.i18n.t('lbTitle');
    this.dom.lbModalSub.textContent = this.i18n.t('lbSub');
    this.dom.lbAuthText.textContent = this.i18n.t('lbAuthPrompt');
    this.dom.btnLbAuth.textContent = this.i18n.t('lbAuthBtn');
    this.dom.btnCloseLb.textContent = this.i18n.t('closeBtn');
  }

  renderAll() {
    this.renderHud();
    this.renderDachaStrip();
    this.renderOrders();
    this.renderBoard();
    this.renderDock();
    if (!this.dom.dachaModal.classList.contains('hidden')) {
      this.renderDachaModal();
    }
  }

  renderHud() {
    this.dom.starsVal.textContent = String(this.state.stars);
    this.dom.coinsVal.textContent = String(this.state.coins);
    this.dom.energyVal.textContent = `${this.state.energy}/${MAX_ENERGY}`;
    const pct = Math.max(0, Math.min(100, (this.state.energy / MAX_ENERGY) * 100));
    this.dom.energyFill.style.width = `${pct}%`;

    if (this.state.energy < MAX_ENERGY) {
      const rem = Math.max(1, Math.ceil(ENERGY_REGEN_SEC - this.state.energyFracSec));
      this.dom.energyTimer.textContent = `+1:${rem}s`;
      this.dom.energyTimer.classList.remove('hidden');
    } else {
      this.dom.energyTimer.classList.add('hidden');
    }

    this.dom.soundIcon.textContent = this.audio.userMuted ? '🔇' : '🔊';
    this.dom.langLabel.textContent = this.i18n.lang.toUpperCase();
    this.dom.dailyDot?.classList.toggle('hidden', !this.isDailyGiftAvailable());
    this.dom.lbDot?.classList.toggle('hidden', !this.getUnclaimedLeaguePromo());
    if (this.dom.lbRankLabel) {
      this.dom.lbRankLabel.textContent = `#${this.getLocalRankInfo().rank}`;
    }
  }

  renderDachaStrip() {
    const unlockedCount = Object.keys(this.state.unlockedUpgrades).length;
    const nextUpg = DACHA_UPGRADES.find((u) => this.state.unlockedUpgrades[u.id] === undefined);

    if (nextUpg) {
      this.dom.dachaProgressText.textContent = `🏡 ${this.i18n.t('dachaLabel')}: ${unlockedCount}/${DACHA_UPGRADES.length}`;
      this.dom.btnOpenDachaText.textContent = this.i18n.t('buildBtn');
      const canBuy = this.state.stars >= nextUpg.stars && this.state.coins >= nextUpg.coins;
      this.dom.dachaNextName.textContent = `${nextUpg.icon} ${this.i18n.pick(nextUpg.name)} (★${nextUpg.stars} • 🪙${nextUpg.coins})`;
      this.dom.dachaNotifyDot.classList.toggle('hidden', !canBuy);
      this.dom.btnOpenDacha.classList.toggle('pulse-cta', canBuy);
    } else {
      const p = this.getPrestigeCost();
      const canCelebrate = this.state.stars >= p.stars && this.state.coins >= p.coins;
      this.dom.dachaProgressText.textContent = `🏡 ${this.i18n.t('prestigeStripBadge', { lv: p.nextLv })}`;
      this.dom.btnOpenDachaText.textContent = this.i18n.t('celebrateBtn');
      this.dom.dachaNextName.textContent = this.i18n.t('prestigeStripNext', { stars: p.stars, coins: p.coins });
      this.dom.dachaNotifyDot.classList.toggle('hidden', !canCelebrate);
      this.dom.btnOpenDacha.classList.toggle('pulse-cta', canCelebrate);
    }
  }

  renderOrders() {
    this.dom.streakCountText.textContent = `${this.state.streakCount}/4`;
    this.dom.streakFill.style.width = `${Math.min(100, (this.state.streakCount / 4) * 100)}%`;

    const counts = this.getActiveBoardItemCounts();
    this.dom.ordersGrid.innerHTML = '';

    this.state.orders.forEach((ord, idx) => {
      const neighbor = NEIGHBORS.find((n) => n.id === ord.neighborId) || NEIGHBORS[0];
      const tempCounts = new Map(counts);
      const itemStatuses = ord.reqs.map((reqId) => {
        const have = tempCounts.get(reqId) || 0;
        if (have > 0) {
          tempCounts.set(reqId, have - 1);
          return true;
        }
        return false;
      });
      const ready = itemStatuses.every(Boolean);

      const card = document.createElement('div');
      card.className = `order-card ${ready ? 'is-ready' : ''}`;

      const top = document.createElement('div');
      top.className = 'order-card-head';
      top.innerHTML = `
        <span class="neighbor-avatar" style="background:${neighbor.bg}; border-color:${neighbor.color}">${neighbor.avatar}</span>
        <span class="neighbor-name">${this.i18n.t(neighbor.nameKey)}</span>
      `;

      const reqRow = document.createElement('div');
      reqRow.className = 'order-reqs-row';
      ord.reqs.forEach((reqId, rIdx) => {
        const chId = ITEMS[reqId]?.chain || 'tea';
        const chMeta = CHAINS[chId] || CHAINS.tea;
        const slot = document.createElement('div');
        slot.className = `order-req-slot ${itemStatuses[rIdx] ? 'has-item' : ''}`;
        if (!itemStatuses[rIdx]) {
          slot.style.borderColor = chMeta.color;
        }
        const img = document.createElement('img');
        img.className = 'order-req-img';
        img.alt = '';
        this.setImgSprite(img, reqId);
        slot.appendChild(img);

        // Mini badge of the Producer that creates this item!
        const prodBadge = document.createElement('span');
        prodBadge.className = 'order-req-prod-badge';
        prodBadge.style.borderColor = chMeta.color;
        const prodImg = document.createElement('img');
        prodImg.alt = '';
        this.setImgSprite(prodImg, chMeta.producerId);
        prodBadge.appendChild(prodImg);
        slot.appendChild(prodBadge);

        if (itemStatuses[rIdx]) {
          const chk = document.createElement('span');
          chk.className = 'order-req-check';
          chk.textContent = '✓';
          slot.appendChild(chk);
        }
        slot.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.audio.playClick();
          this.openChainModal(chId, reqId);
        });
        reqRow.appendChild(slot);
      });

      const foot = document.createElement('div');
      foot.className = 'order-card-foot';
      if (ready) {
        const serveBtn = document.createElement('button');
        serveBtn.type = 'button';
        serveBtn.className = 'tactile-btn btn-emerald btn-serve-order';
        serveBtn.textContent = `${this.i18n.t('deliverBtn')} ★${ord.stars}`;
        serveBtn.addEventListener('click', () => this.fulfillOrder(idx, card));
        foot.appendChild(serveBtn);
      } else {
        foot.innerHTML = `<span class="order-reward-tag"><span class="gold-coin-ic"></span> ${ord.coins} • ★ ${ord.stars}</span>`;
      }

      card.append(top, reqRow, foot);
      this.dom.ordersGrid.appendChild(card);
    });
  }

  getNeededOrderItemSet() {
    const set = new Set();
    for (const ord of this.state.orders) {
      for (const id of ord.reqs) set.add(id);
    }
    return set;
  }

  renderBoard() {
    const neededSet = this.getNeededOrderItemSet();
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        const ui = this.cellEls[r][c];
        const isSel = Boolean(this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c);
        const isHint = Boolean(
          this.hintPair &&
          ((this.hintPair.r1 === r && this.hintPair.c1 === c) || (this.hintPair.r2 === r && this.hintPair.c2 === c))
        );

        ui.el.classList.toggle('is-selected', isSel);
        ui.el.classList.toggle('is-hint-pulse', isHint);

        if (!cell) {
          ui.el.classList.remove('is-frosted', 'is-producer', 'is-locked-producer', 'is-overdrive', 'is-bubble');
          ui.img.classList.add('hidden');
          ui.frostLayer.classList.add('hidden');
          ui.bubbleLayer.classList.add('hidden');
          ui.topBadge.classList.add('hidden');
          ui.botBadge.classList.add('hidden');
          continue;
        }

        const meta = ITEMS[cell.id];
        const isProd = Boolean(meta?.isProducer);
        const isLockedProd = Boolean(isProd && cell.lockedProducer);

        ui.img.classList.remove('hidden');
        this.setImgSprite(ui.img, cell.id);

        ui.el.classList.toggle('is-frosted', Boolean(cell.frosted));
        ui.el.classList.toggle('is-producer', isProd && !isLockedProd);
        ui.el.classList.toggle('is-locked-producer', isLockedProd);
        ui.el.classList.toggle('is-overdrive', isProd && !isLockedProd && this.state.overdrive);
        ui.el.classList.toggle('is-bubble', Boolean(cell.isBubble));

        ui.frostLayer.classList.toggle('hidden', !cell.frosted);
        ui.bubbleLayer.classList.toggle('hidden', !cell.isBubble);

        // Top-right badge: green checkmark if needed by neighbor order, or snowflake if frosted
        if (cell.frosted) {
          ui.topBadge.className = 'cell-badge-top badge-frost';
          ui.topBadge.textContent = '❄️';
        } else if (!cell.isBubble && !isProd && neededSet.has(cell.id)) {
          ui.topBadge.className = 'cell-badge-top badge-needed';
          ui.topBadge.textContent = '✓';
        } else if (!cell.isBubble && meta?.tier === 7) {
          ui.topBadge.className = 'cell-badge-top badge-max';
          ui.topBadge.textContent = '★';
        } else {
          ui.topBadge.classList.add('hidden');
        }

        // Bottom badge: Locked producer milestone OR Producer lightning OR Bubble timer
        if (isLockedProd) {
          const reqOrd = PRODUCER_UNLOCK_ORDERS[cell.id] ?? 2;
          const left = Math.max(1, reqOrd - (Number(this.state.ordersCompleted) || 0));
          ui.botBadge.className = 'cell-badge-bot badge-lock-prod';
          ui.botBadge.textContent = this.i18n.t('lockBadgeOrders', { n: left });
        } else if (isProd) {
          ui.botBadge.className = `cell-badge-bot ${this.state.overdrive ? 'badge-boost' : 'badge-bolt'}`;
          ui.botBadge.textContent = this.state.overdrive ? '⚡×2' : '⚡';
        } else if (cell.isBubble) {
          ui.botBadge.className = 'cell-badge-bot badge-timer';
          ui.botBadge.textContent = `${Math.ceil(cell.secLeft || 1)}s`;
        } else {
          ui.botBadge.classList.add('hidden');
        }
      }
    }
  }

  renderDock() {
    // Keep 2x Boost button hidden until 4+ completed orders so beginners see a clean, simple dock!
    const boostUnlocked = (Number(this.state.ordersCompleted) || 0) >= 4;
    if (!boostUnlocked && this.state.overdrive) {
      this.state.overdrive = false;
    }
    this.dom.btnBoost.classList.toggle('hidden', !boostUnlocked);
    this.dom.btnBoost.className = `tactile-btn ${this.state.overdrive ? 'btn-overdrive-on' : 'btn-overdrive-off'} dock-boost-btn ${boostUnlocked ? '' : 'hidden'}`;
    this.dom.boostLabel.textContent = this.i18n.t(this.state.overdrive ? 'boostOverdrive' : 'boostNormal');

    this.dom.bagCountText.textContent = `${this.state.bag.length}/${this.state.bagSlots}`;
    this.dom.infoOutputs?.classList.add('hidden');
    this.dom.infoSub?.classList.remove('hidden');

    const cell = this.getSelectedBoardCell();
    if (!cell) {
      this.dom.infoIconWrap.classList.add('hidden');
      this.dom.infoTitle.textContent = this.i18n.t('gameTitle');
      this.dom.infoSub.textContent = this.i18n.t('selectHint');
      this.dom.btnChainInfo.classList.add('hidden');
      this.dom.btnStoreItem.classList.add('hidden');
      this.dom.btnSellItem.classList.add('hidden');
      this.dom.btnPopBubbleAd.classList.add('hidden');
      this.dom.btnPopBubbleCoin.classList.add('hidden');
      return;
    }

    const meta = ITEMS[cell.id];
    this.dom.infoIconWrap.classList.remove('hidden');
    this.setImgSprite(this.dom.infoIconImg, cell.id);
    this.dom.infoTitle.textContent = this.i18n.pick(meta?.name);

    if (cell.isBubble) {
      this.dom.infoSub.textContent = this.i18n.t('bubbleBadge', { sec: Math.ceil(cell.secLeft || 1) });
      this.dom.btnChainInfo.classList.add('hidden');
      this.dom.btnStoreItem.classList.add('hidden');
      this.dom.btnPopBubbleAd.classList.remove('hidden');
      this.dom.btnPopBubbleCoin.classList.remove('hidden');
      this.dom.btnSellItem.classList.remove('hidden');

      this.dom.btnPopBubbleAd.textContent = this.i18n.t('popBubbleAd');
      this.dom.btnPopBubbleCoin.textContent = `${this.i18n.t('popBubbleCoins', { coins: meta?.bubbleCoins || 35 })} 🪙`;
      this.dom.btnSellItem.textContent = this.i18n.t('popBubbleTurnCoins');
      return;
    }

    this.dom.btnPopBubbleAd.classList.add('hidden');
    this.dom.btnPopBubbleCoin.classList.add('hidden');
    this.dom.btnChainInfo.classList.remove('hidden');
    const compactMobile = typeof window !== 'undefined' && window.innerWidth < 460;
    this.dom.btnChainInfo.textContent = compactMobile ? '📖' : `📖 ${this.i18n.t('chainBtn')}`;

    if (cell.frosted) {
      this.dom.infoSub.textContent = this.i18n.t('frostedBadge');
      this.dom.btnStoreItem.classList.add('hidden');
      this.dom.btnSellItem.classList.add('hidden');
      return;
    }

    if (meta?.isProducer) {
      const ch = CHAINS[meta.producesChain] || CHAINS.tea;
      if (cell.lockedProducer) {
        const reqOrd = PRODUCER_UNLOCK_ORDERS[cell.id] ?? 2;
        const left = Math.max(1, reqOrd - (Number(this.state.ordersCompleted) || 0));
        this.dom.infoSub.textContent = this.i18n.t('lockedProducerSub', { left });
      } else if (this.dom.infoOutputs) {
        // Put cost + visual output strip on a single clean row instead of adding a 3rd text line!
        const cost = this.state.overdrive ? 2 : 1;
        this.dom.infoSub.classList.add('hidden');
        this.dom.infoOutputs.innerHTML = '';
        const pref = document.createElement('span');
        pref.className = 'out-prefix';
        pref.textContent = `(${cost}⚡):`;
        this.dom.infoOutputs.appendChild(pref);
        ch.items.slice(0, 5).forEach((outId, idx) => {
          if (idx > 0) {
            const arr = document.createElement('span');
            arr.className = 'out-arrow';
            arr.textContent = '➔';
            this.dom.infoOutputs.appendChild(arr);
          }
          const im = document.createElement('img');
          im.alt = '';
          this.setImgSprite(im, outId);
          this.dom.infoOutputs.appendChild(im);
        });
        this.dom.infoOutputs.classList.remove('hidden');
      } else {
        const cost = this.state.overdrive ? 2 : 1;
        this.dom.infoSub.textContent = this.i18n.t('producerBadge', { cost });
      }
      // Never allow hiding producers in storage bag so beginners never lose their generators!
      this.dom.btnStoreItem.classList.add('hidden');
      this.dom.btnSellItem.classList.add('hidden');
      return;
    }

    this.dom.infoSub.textContent = this.i18n.t('tierStep', { tier: meta?.tier || 1, max: 7 });
    this.dom.btnStoreItem.classList.remove('hidden');
    this.dom.btnStoreItem.textContent = compactMobile ? '🎒' : `🎒 ${this.i18n.t('toBagBtn')}`;
    this.dom.btnSellItem.classList.remove('hidden');
    this.dom.btnSellItem.textContent = compactMobile
      ? `+${meta?.sellCoins || 2}`
      : `${this.i18n.t('sellBtn')} +${meta?.sellCoins || 2}`;
  }

  // Visual FX & Animations
  pulseCell(r, c) {
    const el = this.cellEls[r]?.[c]?.el;
    if (!el) return;
    el.classList.remove('cell-pop-anim');
    void el.offsetWidth;
    el.classList.add('cell-pop-anim');
  }

  spawnArcVisual(sr, sc, tr, tc, itemId, onDone = null) {
    const p1 = this.getCellCenterInStage(sr, sc);
    const p2 = this.getCellCenterInStage(tr, tc);
    this.flyingArcs.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      size: (p1.size || 48) * 0.85,
      itemId,
      t: 0,
      dur: 0.27,
      onDone
    });
  }

  spawnMergeFx(r, c, tier, brokeFrost) {
    const pt = this.getCellCenterInStage(r, c);
    this.shockwaves.push({
      x: pt.x,
      y: pt.y,
      r: 8,
      maxR: 48 + tier * 5,
      life: 1.0,
      color: brokeFrost ? '#38bdf8' : '#fde047'
    });

    const count = brokeFrost ? 20 : 14;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const spd = 65 + Math.random() * 135;
      this.particles.push({
        x: pt.x,
        y: pt.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 35,
        r: brokeFrost && i % 2 === 0 ? 5.5 : 4.2,
        life: 1.0,
        ice: brokeFrost && i % 2 === 0,
        color: brokeFrost
          ? (i % 2 === 0 ? '#bae6fd' : '#38bdf8')
          : (i % 2 === 0 ? '#fde047' : '#34d399')
      });
    }
  }

  spawnOrderRewardBurst(cardEl, coins, stars) {
    const stageRect = this.dom.boardWrap.getBoundingClientRect();
    const cardRect = cardEl?.getBoundingClientRect() || stageRect;
    const x = cardRect.left - stageRect.left + cardRect.width * 0.5;
    const y = Math.max(12, cardRect.top - stageRect.top + cardRect.height * 0.5);

    this.floatingTexts.push({
      x,
      y,
      text: `+${coins} 🪙  +${stars} ★`,
      color: '#34d399',
      life: 1.25
    });

    for (let i = 0; i < 18; i++) {
      const ang = (Math.PI * 2 * i) / 18;
      const spd = 75 + Math.random() * 110;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 45,
        r: 4.8,
        life: 1.0,
        ice: false,
        color: i % 2 === 0 ? '#fbbf24' : '#34d399'
      });
    }
  }

  showToast(msg) {
    this.dom.toastEl.textContent = msg;
    this.dom.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.dom.toastEl.classList.add('hidden');
    }, 2200);
  }

  resetIdleHint() {
    this.idleTimer = 0;
    if (this.hintPair) {
      this.hintPair = null;
      this.renderBoard();
    }
  }

  findBestHintPair() {
    const activeByItem = new Map();
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (!cell || cell.isBubble || ITEMS[cell.id]?.isProducer || !getNextTierItemId(cell.id)) continue;
        if (!cell.frosted) {
          if (!activeByItem.has(cell.id)) activeByItem.set(cell.id, []);
          activeByItem.get(cell.id).push({ r, c });
        }
      }
    }

    // Prioritize shattering frosted cells with an active matching item!
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (cell?.frosted && activeByItem.has(cell.id)) {
          const act = activeByItem.get(cell.id)[0];
          return { r1: act.r, c1: act.c, r2: r, c2: c };
        }
      }
    }

    // Otherwise two active matching items
    for (const list of activeByItem.values()) {
      if (list.length >= 2) {
        return { r1: list[0].r, c1: list[0].c, r2: list[1].r, c2: list[1].c };
      }
    }
    return null;
  }

  // Main 60 FPS Loop
  loop(nowPerf) {
    const rawDtMs = nowPerf - this.lastFramePerf;
    this.lastFramePerf = nowPerf;
    this.platform.recordGameplayFrame(rawDtMs, nowPerf);

    const dt = Math.min(0.1, Math.max(0.001, rawDtMs / 1000));
    if (!this.isPaused) {
      this.tickTimers(dt);
      this.dachaRenderer.update(dt, this.state.unlockedUpgrades);
      this.dachaRenderer.renderToCanvas(this.dom.dachaStripCanvas, this.state.unlockedUpgrades, nowPerf * 0.001);
      if (!this.dom.dachaModal.classList.contains('hidden')) {
        // Preview pending style live on the Dacha Renovation Canvas!
        const previewMap = { ...this.state.unlockedUpgrades };
        let previewLockedId = null;
        if (previewMap[this.activeRenovationId] === undefined) {
          previewMap[this.activeRenovationId] = this.pendingStyleIdx;
          previewLockedId = this.activeRenovationId;
        }
        this.dachaRenderer.renderToCanvas(this.dom.dachaFullCanvas, previewMap, nowPerf * 0.001, previewLockedId);
      }
      this.updateTutorialOverlay(nowPerf * 0.001);
      this.updateAndRenderBoardFx(dt);
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  findTutorialMergePair() {
    // Prefer merging active a1_tea_leaf onto frosted a1_tea_leaf so Step 2 completes Order #1 & breaks frost!
    let srcTea = null;
    let dstTea = null;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (cell?.id === 'a1_tea_leaf' && !cell.isBubble) {
          if (!cell.frosted && !srcTea) srcTea = { r, c };
          else if (cell.frosted && !dstTea) dstTea = { r, c };
        }
      }
    }
    if (srcTea && dstTea) {
      return { r1: srcTea.r, c1: srcTea.c, r2: dstTea.r, c2: dstTea.c };
    }
    return this.findBestHintPair();
  }

  updateTutorialOverlay(nowSec) {
    const banner = this.dom.tutBanner;
    const hand = this.dom.tutHand;
    if (!banner || !hand) return;

    const blockingModalOpen = [
      this.dom.introModal,
      this.dom.energyModal,
      this.dom.bagModal,
      this.dom.chainModal,
      this.dom.streakModal,
      this.dom.lbModal,
      this.dom.prodUnlockModal,
      this.dom.dailyModal
    ].some((m) => m && !m.classList.contains('hidden'));

    // If player clicked "Показать на поле! 👇" in Recipe or New Producer modal, point 3D hand directly at that producer!
    if (!blockingModalOpen && this.dom.dachaModal.classList.contains('hidden') && this.spotlightProducerId && nowSec < this.spotlightUntilSec) {
      banner.classList.add('hidden');
      let targetEl = null;
      for (let r = 0; r < BOARD_ROWS && !targetEl; r++) {
        for (let c = 0; c < BOARD_COLS && !targetEl; c++) {
          if (this.state.board[r][c]?.id === this.spotlightProducerId) {
            targetEl = this.cellEls[r][c]?.el;
          }
        }
      }
      const rect = targetEl?.getBoundingClientRect();
      if (rect && rect.width > 6) {
        hand.classList.remove('hidden');
        const bob = Math.sin(nowSec * 5.6);
        const hx = rect.left + rect.width * 0.5;
        const hy = rect.top + rect.height * 0.5 + bob * 5;
        const sc = 0.96 + 0.08 * Math.max(0, -bob);
        hand.style.transform = `translate3d(${Math.round(hx)}px, ${Math.round(hy)}px, 0) scale(${sc.toFixed(3)})`;
        return;
      }
    }

    const step = Number(this.state.tutorialStep) || 0;
    if (step >= 4 || this.drag?.isDragging) {
      banner.classList.add('hidden');
      hand.classList.add('hidden');
      return;
    }

    const dachaOpen = !this.dom.dachaModal.classList.contains('hidden');
    if (blockingModalOpen || (dachaOpen && step !== 3)) {
      banner.classList.add('hidden');
      hand.classList.add('hidden');
      return;
    }

    let stepNum = step + 1;
    let msgKey = 'tutStep0';
    let hostId = 'char_dedushka';
    let targetRect1 = null;
    let targetRect2 = null;

    if (step === 0) {
      msgKey = 'tutStep0';
      hostId = 'char_dedushka';
      // Locate Samovar Stove producer (or any producer)
      let prodEl = null;
      for (let r = 0; r < BOARD_ROWS && !prodEl; r++) {
        for (let c = 0; c < BOARD_COLS && !prodEl; c++) {
          if (this.state.board[r][c]?.id === 'gen_samovar_stove') {
            prodEl = this.cellEls[r][c]?.el;
          }
        }
      }
      if (!prodEl) {
        for (let r = 0; r < BOARD_ROWS && !prodEl; r++) {
          for (let c = 0; c < BOARD_COLS && !prodEl; c++) {
            if (ITEMS[this.state.board[r][c]?.id]?.isProducer) {
              prodEl = this.cellEls[r][c]?.el;
            }
          }
        }
      }
      if (prodEl) targetRect1 = prodEl.getBoundingClientRect();
    } else if (step === 1) {
      const counts = this.getActiveBoardItemCounts();
      if (this.state.orders.some((o) => this.isOrderReady(o, counts))) {
        this.state.tutorialStep = 2;
        this.persist();
        return;
      }
      msgKey = 'tutStep1';
      hostId = 'char_babushka';
      const pair = this.findTutorialMergePair();
      if (pair) {
        targetRect1 = this.cellEls[pair.r1]?.[pair.c1]?.el?.getBoundingClientRect() || null;
        targetRect2 = this.cellEls[pair.r2]?.[pair.c2]?.el?.getBoundingClientRect() || null;
      }
    } else if (step === 2) {
      msgKey = 'tutStep2';
      hostId = 'char_babushka';
      const serveBtn = this.dom.ordersGrid.querySelector('.btn-serve-order');
      if (serveBtn) {
        targetRect1 = serveBtn.getBoundingClientRect();
      } else {
        const pair = this.findTutorialMergePair();
        if (pair) {
          targetRect1 = this.cellEls[pair.r1]?.[pair.c1]?.el?.getBoundingClientRect() || null;
          targetRect2 = this.cellEls[pair.r2]?.[pair.c2]?.el?.getBoundingClientRect() || null;
        }
      }
    } else if (step === 3) {
      hostId = 'char_dedushka';
      if (dachaOpen) {
        msgKey = 'tutStep3Modal';
        targetRect1 = this.dom.btnUnlockUpgrade?.getBoundingClientRect() || null;
      } else {
        msgKey = 'tutStep3Card';
        targetRect1 = this.dom.btnOpenDacha?.getBoundingClientRect() || null;
      }
    }

    banner.classList.remove('hidden');
    banner.classList.toggle('in-modal-top', dachaOpen);
    this.setImgSprite(this.dom.tutAvatar, hostId);
    this.dom.tutStep.textContent = this.i18n.t('tutStepLabel', { cur: stepNum });
    this.dom.tutText.textContent = this.i18n.t(msgKey);

    if (!targetRect1 || targetRect1.width < 4) {
      hand.classList.add('hidden');
      return;
    }

    hand.classList.remove('hidden');
    let hx = targetRect1.left + targetRect1.width * 0.5;
    let hy = targetRect1.top + targetRect1.height * 0.5;
    let sc = 1;

    if (targetRect2 && targetRect2.width >= 4) {
      const x2 = targetRect2.left + targetRect2.width * 0.5;
      const y2 = targetRect2.top + targetRect2.height * 0.5;
      const cyc = (nowSec % 1.85) / 1.85;
      const p = Math.min(1, Math.max(0, (cyc - 0.14) / 0.68));
      const ease = p * p * (3 - 2 * p);
      hx = hx + (x2 - hx) * ease;
      hy = hy + (y2 - hy) * ease - Math.sin(ease * Math.PI) * 18;
      sc = cyc < 0.14 || cyc > 0.84 ? 0.92 : 1.04;
    } else {
      const bob = Math.sin(nowSec * 5.2);
      hy += bob * 5;
      sc = 0.96 + 0.07 * Math.max(0, -bob);
    }

    hand.style.transform = `translate3d(${Math.round(hx)}px, ${Math.round(hy)}px, 0) scale(${sc.toFixed(3)})`;
  }

  tickTimers(dt) {
    // 1. Live Energy Regeneration (+1 / 60s)
    if (this.state.energy < MAX_ENERGY) {
      const prevCeil = Math.ceil(ENERGY_REGEN_SEC - this.state.energyFracSec);
      this.state.energyFracSec += dt;
      if (this.state.energyFracSec >= ENERGY_REGEN_SEC) {
        this.state.energyFracSec -= ENERGY_REGEN_SEC;
        this.state.energy = Math.min(MAX_ENERGY, this.state.energy + 1);
        if (this.state.energy >= MAX_ENERGY) this.state.energyFracSec = 0;
        this.persist();
        this.renderHud();
      } else {
        const nextCeil = Math.ceil(ENERGY_REGEN_SEC - this.state.energyFracSec);
        if (nextCeil !== prevCeil) {
          this.renderHud();
        }
      }
    }

    // 2. Floating Holiday Soap Bubbles countdown
    let bubbleChangedSec = false;
    let bubbleExpired = false;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.state.board[r][c];
        if (cell?.isBubble) {
          const b1 = Math.ceil(cell.secLeft);
          cell.secLeft -= dt;
          if (cell.secLeft <= 0) {
            this.state.board[r][c] = null;
            this.addCoins(15);
            const pt = this.getCellCenterInStage(r, c);
            this.floatingTexts.push({ x: pt.x, y: pt.y, text: '+15 🪙', color: '#fbbf24', life: 1.0 });
            bubbleExpired = true;
          } else if (Math.ceil(cell.secLeft) !== b1) {
            bubbleChangedSec = true;
          }
        }
      }
    }
    if (bubbleExpired) {
      this.audio.playBubblePop();
      this.persist();
      this.renderHud();
      this.renderBoard();
      this.renderDock();
    } else if (bubbleChangedSec) {
      this.renderBoard();
      if (this.getSelectedBoardCell()?.isBubble) this.renderDock();
    }

    // 3. Energy modal thermos countdown if open
    if (!this.dom.energyModal.classList.contains('hidden')) {
      this.renderEnergyModal();
    }

    // 4. Idle Merge Hint after 4.2s
    if (!this.drag && !this.hintPair) {
      this.idleTimer += dt;
      if (this.idleTimer >= 4.2) {
        this.hintPair = this.findBestHintPair();
        if (this.hintPair) this.renderBoard();
      }
    }
  }

  updateAndRenderBoardFx(dt) {
    const canvas = this.dom.fxCanvas;
    if (!canvas) return;
    const rect = this.dom.boardWrap.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const tw = Math.round(rect.width * dpr);
    const th = Math.round(rect.height * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, tw, th);

    if (
      !this.flyingArcs.length &&
      !this.shockwaves.length &&
      !this.particles.length &&
      !this.floatingTexts.length
    ) {
      return;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Shockwave rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt * 2.8;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const prog = 1 - sw.life;
      const rad = sw.r + (sw.maxR - sw.r) * prog;
      ctx.save();
      ctx.globalAlpha = sw.life;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4 * sw.life + 1;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Parabolic flying item arcs
    for (let i = this.flyingArcs.length - 1; i >= 0; i--) {
      const a = this.flyingArcs[i];
      a.t += dt / a.dur;
      if (a.t >= 1) {
        this.flyingArcs.splice(i, 1);
        a.onDone?.();
        continue;
      }
      const p = a.t;
      const x = a.x1 + (a.x2 - a.x1) * p;
      const arcLift = Math.sin(p * Math.PI) * 52;
      const y = a.y1 + (a.y2 - a.y1) * p - arcLift;
      const sc = 0.85 + Math.sin(p * Math.PI) * 0.35;

      const img = this.spriteBank.getImage(a.itemId);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      if (img && img.naturalWidth > 0) {
        ctx.drawImage(img, -a.size * 0.5, -a.size * 0.5, a.size, a.size);
      } else {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, a.size * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Particles (sparkles & frost shards)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt * 1.9;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 260 * dt;

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      if (pt.ice) {
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.life * 5);
        ctx.fillRect(-pt.r, -pt.r * 0.6, pt.r * 2, pt.r * 1.2);
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * pt.life + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Floating reward texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt * 1.1;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y -= 34 * dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, ft.life * 1.4);
      ctx.font = '800 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const game = new HolidayDachaGame();
if (typeof window !== 'undefined') {
  window.__dachaGame = game;
}
game.boot();
