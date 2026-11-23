export const BOARD_COLS = 7;
export const BOARD_ROWS = 8;
export const MAX_ENERGY = 65;
export const ENERGY_REGEN_SEC = 90;

export const CHAINS = {
  tea: {
    id: 'tea',
    color: '#e86a33',
    bgTint: '#fff2e6',
    name: { ru: 'Чай и выпечка', en: 'Tea & Bakery', tr: 'Çay ve Fırın' },
    producerId: 'gen_samovar_stove',
    items: [
      'a1_tea_leaf',
      'a2_cinnamon_spice',
      'a3_mug_tea',
      'a4_ginger_cookie',
      'a5_berry_tart',
      'a6_honey_cake',
      'a7_royal_samovar'
    ]
  },
  tree: {
    id: 'tree',
    color: '#1e9b68',
    bgTint: '#e9fbf2',
    name: { ru: 'Ёлка и огни', en: 'Tree & Lights', tr: 'Ağaç ve Işıklar' },
    producerId: 'gen_pine_chest',
    items: [
      'b1_pine_twig',
      'b2_silver_tinsel',
      'b3_glass_icicle',
      'b4_ruby_bauble',
      'b5_fairy_garland',
      'b6_festive_wreath',
      'b7_star_crown'
    ]
  },
  feast: {
    id: 'feast',
    color: '#e04f5f',
    bgTint: '#ffedf0',
    name: { ru: 'Новогодний стол', en: 'Holiday Feast', tr: 'Yılbaşı Sofrası' },
    producerId: 'gen_cellar_basket',
    items: [
      'c1_tangerine',
      'c2_mandarin_plate',
      'c3_pickles_jar',
      'c4_olivier_bowl',
      'c5_caviar_tartlet',
      'c6_sparkling_bottle',
      'c7_feast_basket'
    ]
  },
  yard: {
    id: 'yard',
    color: '#3b82f6',
    bgTint: '#edf5ff',
    name: { ru: 'Зимний двор', en: 'Winter Yard', tr: 'Kış Bahçesi' },
    producerId: 'gen_winter_shed',
    items: [
      'd1_firewood',
      'd2_warm_socks',
      'd3_knit_sweater',
      'd4_wooden_sled',
      'd5_snowman_cheer',
      'd6_ice_lantern',
      'd7_fireworks_box'
    ]
  }
};

export const ITEMS = {
  // Producers
  gen_samovar_stove: {
    id: 'gen_samovar_stove',
    isProducer: true,
    producesChain: 'tea',
    color: '#d95b26',
    glyph: '🫖',
    name: { ru: 'Печь с самоваром', en: 'Samovar Stove', tr: 'Semaverli Fırın' }
  },
  gen_pine_chest: {
    id: 'gen_pine_chest',
    isProducer: true,
    producesChain: 'tree',
    color: '#1b8a5a',
    glyph: '🎄',
    name: { ru: 'Сундук с игрушками', en: 'Ornament Chest', tr: 'Süs Sandığı' }
  },
  gen_cellar_basket: {
    id: 'gen_cellar_basket',
    isProducer: true,
    producesChain: 'feast',
    color: '#d63c4d',
    glyph: '🧺',
    name: { ru: 'Корзина из погребка', en: 'Pantry Basket', tr: 'Kiler Sepeti' }
  },
  gen_winter_shed: {
    id: 'gen_winter_shed',
    isProducer: true,
    producesChain: 'yard',
    color: '#2b6cb0',
    glyph: '🧰',
    name: { ru: 'Дачный верстак', en: 'Winter Workbench', tr: 'Kış Tezgahı' }
  },

  // Chain A: Tea & Bakery
  a1_tea_leaf: {
    id: 'a1_tea_leaf', chain: 'tea', tier: 1, sellCoins: 2, bubbleCoins: 18, glyph: '🍃',
    name: { ru: 'Чайный лист с ягодой', en: 'Tea & Berry Sprig', tr: 'Çay Yaprağı' }
  },
  a2_cinnamon_spice: {
    id: 'a2_cinnamon_spice', chain: 'tea', tier: 2, sellCoins: 4, bubbleCoins: 24, glyph: '🪵',
    name: { ru: 'Корица и бадьян', en: 'Cinnamon & Anise', tr: 'Tarçın ve Anason' }
  },
  a3_mug_tea: {
    id: 'a3_mug_tea', chain: 'tea', tier: 3, sellCoins: 8, bubbleCoins: 34, glyph: '☕',
    name: { ru: 'Чай с лимоном', en: 'Hot Lemon Tea', tr: 'Limonlu Çay' }
  },
  a4_ginger_cookie: {
    id: 'a4_ginger_cookie', chain: 'tea', tier: 4, sellCoins: 16, bubbleCoins: 48, glyph: '🍪',
    name: { ru: 'Имбирный пряник', en: 'Star Gingerbread', tr: 'Zencefilli Kurabiye' }
  },
  a5_berry_tart: {
    id: 'a5_berry_tart', chain: 'tea', tier: 5, sellCoins: 32, bubbleCoins: 72, glyph: '🥧',
    name: { ru: 'Клюквенный тарт', en: 'Cranberry Tartlet', tr: 'Kızılcık Tart' }
  },
  a6_honey_cake: {
    id: 'a6_honey_cake', chain: 'tea', tier: 6, sellCoins: 64, bubbleCoins: 110, glyph: '🍰',
    name: { ru: 'Домашний медовик', en: 'Honey Medovik Cake', tr: 'Ballı Pasta' }
  },
  a7_royal_samovar: {
    id: 'a7_royal_samovar', chain: 'tea', tier: 7, sellCoins: 135, bubbleCoins: 175, glyph: '🏆',
    name: { ru: 'Царский самовар', en: 'Royal Samovar Set', tr: 'Kraliyet Semaveri' }
  },

  // Chain B: Tree & Lights
  b1_pine_twig: {
    id: 'b1_pine_twig', chain: 'tree', tier: 1, sellCoins: 2, bubbleCoins: 18, glyph: '🌿',
    name: { ru: 'Еловая веточка', en: 'Snowy Pine Twig', tr: 'Çam Dalı' }
  },
  b2_silver_tinsel: {
    id: 'b2_silver_tinsel', chain: 'tree', tier: 2, sellCoins: 4, bubbleCoins: 24, glyph: '✨',
    name: { ru: 'Серебристая мишура', en: 'Silver Tinsel', tr: 'Gümüş Sim' }
  },
  b3_glass_icicle: {
    id: 'b3_glass_icicle', chain: 'tree', tier: 3, sellCoins: 8, bubbleCoins: 34, glyph: '💎',
    name: { ru: 'Стеклянная сосулька', en: 'Glass Icicle', tr: 'Cam Sarkıt Süs' }
  },
  b4_ruby_bauble: {
    id: 'b4_ruby_bauble', chain: 'tree', tier: 4, sellCoins: 16, bubbleCoins: 48, glyph: '🔮',
    name: { ru: 'Рубиновый шар', en: 'Ruby Painted Bauble', tr: 'Yakut Yılbaşı Topu' }
  },
  b5_fairy_garland: {
    id: 'b5_fairy_garland', chain: 'tree', tier: 5, sellCoins: 32, bubbleCoins: 72, glyph: '💡',
    name: { ru: 'Тёплая гирлянда', en: 'Warm Fairy Garland', tr: 'Peri Işıkları' }
  },
  b6_festive_wreath: {
    id: 'b6_festive_wreath', chain: 'tree', tier: 6, sellCoins: 64, bubbleCoins: 110, glyph: '🎀',
    name: { ru: 'Рождественский венок', en: 'Festive Bell Wreath', tr: 'Yılbaşı Çelengi' }
  },
  b7_star_crown: {
    id: 'b7_star_crown', chain: 'tree', tier: 7, sellCoins: 135, bubbleCoins: 175, glyph: '🌟',
    name: { ru: 'Рубиновая звезда', en: 'Radiant Tree Star', tr: 'Tepe Yıldızı' }
  },

  // Chain C: Holiday Feast
  c1_tangerine: {
    id: 'c1_tangerine', chain: 'feast', tier: 1, sellCoins: 2, bubbleCoins: 18, glyph: '🍊',
    name: { ru: 'Мандарин с листиком', en: 'Bright Tangerine', tr: 'Mandalina' }
  },
  c2_mandarin_plate: {
    id: 'c2_mandarin_plate', chain: 'feast', tier: 2, sellCoins: 4, bubbleCoins: 24, glyph: '🥣',
    name: { ru: 'Вазочка мандаринов', en: 'Tangerine Bowl', tr: 'Mandalina Kasesi' }
  },
  c3_pickles_jar: {
    id: 'c3_pickles_jar', chain: 'feast', tier: 3, sellCoins: 8, bubbleCoins: 34, glyph: '🫙',
    name: { ru: 'Баночка солений', en: 'Home Pickles Jar', tr: 'Ev Turşusu' }
  },
  c4_olivier_bowl: {
    id: 'c4_olivier_bowl', chain: 'feast', tier: 4, sellCoins: 16, bubbleCoins: 48, glyph: '🥗',
    name: { ru: 'Салатница Оливье', en: 'Olivier Salad Bowl', tr: 'Rus Salatası' }
  },
  c5_caviar_tartlet: {
    id: 'c5_caviar_tartlet', chain: 'feast', tier: 5, sellCoins: 32, bubbleCoins: 72, glyph: '🧁',
    name: { ru: 'Тарталетки с икрой', en: 'Caviar Tartlets', tr: 'Havyarlı Tartölet' }
  },
  c6_sparkling_bottle: {
    id: 'c6_sparkling_bottle', chain: 'feast', tier: 6, sellCoins: 64, bubbleCoins: 110, glyph: '🍾',
    name: { ru: 'Игристое во льду', en: 'Sparkling Cider', tr: 'Köpüklü İçecek' }
  },
  c7_feast_basket: {
    id: 'c7_feast_basket', chain: 'feast', tier: 7, sellCoins: 135, bubbleCoins: 175, glyph: '🎁',
    name: { ru: 'Праздничная корзина', en: 'Grand Feast Hamper', tr: 'Ziyafet Sepeti' }
  },

  // Chain D: Winter Yard
  d1_firewood: {
    id: 'd1_firewood', chain: 'yard', tier: 1, sellCoins: 2, bubbleCoins: 18, glyph: '🪵',
    name: { ru: 'Берёзовые дрова', en: 'Birch Firewood', tr: 'Huş Odunu' }
  },
  d2_warm_socks: {
    id: 'd2_warm_socks', chain: 'yard', tier: 2, sellCoins: 4, bubbleCoins: 24, glyph: '🧦',
    name: { ru: 'Шерстяные носки', en: 'Warm Wool Socks', tr: 'Yün Çoraplar' }
  },
  d3_knit_sweater: {
    id: 'd3_knit_sweater', chain: 'yard', tier: 3, sellCoins: 8, bubbleCoins: 34, glyph: '🧥',
    name: { ru: 'Свитер с оленями', en: 'Reindeer Sweater', tr: 'Geyikli Kazak' }
  },
  d4_wooden_sled: {
    id: 'd4_wooden_sled', chain: 'yard', tier: 4, sellCoins: 16, bubbleCoins: 48, glyph: '🛷',
    name: { ru: 'Расписные санки', en: 'Wooden Sled', tr: 'Ahşap Kızak' }
  },
  d5_snowman_cheer: {
    id: 'd5_snowman_cheer', chain: 'yard', tier: 5, sellCoins: 32, bubbleCoins: 72, glyph: '⛄',
    name: { ru: 'Весёлый снеговик', en: 'Cheerful Snowman', tr: 'Kardan Adam' }
  },
  d6_ice_lantern: {
    id: 'd6_ice_lantern', chain: 'yard', tier: 6, sellCoins: 64, bubbleCoins: 110, glyph: '🏮',
    name: { ru: 'Ледяной фонарь', en: 'Carved Ice Lantern', tr: 'Buz Feneri' }
  },
  d7_fireworks_box: {
    id: 'd7_fireworks_box', chain: 'yard', tier: 7, sellCoins: 135, bubbleCoins: 175, glyph: '🎆',
    name: { ru: 'Коробка салюта', en: 'Fireworks Battery', tr: 'Havai Fişek' }
  }
};

export const ALL_SPRITE_IDS = [
  ...Object.keys(ITEMS),
  'dacha_scene_base',
  'prop_stone_path',
  'prop_porch_garland',
  'prop_lantern_post',
  'prop_dressed_tree',
  'prop_samovar_table',
  'prop_snowman_deluxe',
  'prop_sleigh_gifts',
  'prop_door_wreath',
  'prop_firework_burst',
  'char_babushka',
  'char_dedushka',
  'ui_hand_pointer',
  'ui_star_seal'
];

export function getNextTierItemId(itemId) {
  const meta = ITEMS[itemId];
  if (!meta || meta.isProducer || !meta.chain) return null;
  const ch = CHAINS[meta.chain];
  if (!ch || meta.tier >= ch.items.length) return null;
  return ch.items[meta.tier];
}

export const NEIGHBORS = [
  { id: 'valya', nameKey: 'neighbor_valya', color: '#e14b6e', bg: '#ffe6ee', avatar: '👵' },
  { id: 'mihalych', nameKey: 'neighbor_mihalych', color: '#2b7de9', bg: '#e5f1ff', avatar: '🧔' },
  { id: 'masha', nameKey: 'neighbor_masha', color: '#e67e22', bg: '#fff1e0', avatar: '👧' },
  { id: 'moroz', nameKey: 'neighbor_moroz', color: '#c02638', bg: '#ffe8e8', avatar: '🎅' }
];

export const DACHA_UPGRADES = [
  {
    id: 'upg_chimney_glow',
    order: 1,
    stars: 1,
    coins: 40,
    icon: '🔥',
    name: { ru: 'Тепло камина и окна', en: 'Warm Windows & Smoke', tr: 'Şömine ve Sıcak Işık' },
    styles: [
      { name: { ru: 'Янтарь', en: 'Amber', tr: 'Kehribar' }, primary: '#ffb74d', secondary: '#ff8a00' },
      { name: { ru: 'Розовый закат', en: 'Rose Glow', tr: 'Gül Işığı' }, primary: '#ff9eb5', secondary: '#ff5c8a' },
      { name: { ru: 'Сливочный свет', en: 'Cream', tr: 'Krem Işık' }, primary: '#fff0b3', secondary: '#ffd166' }
    ]
  },
  {
    id: 'upg_snow_path',
    order: 2,
    stars: 1,
    coins: 65,
    icon: '🧹',
    name: { ru: 'Расчищенная дорожка', en: 'Cleared Garden Path', tr: 'Temizlenmiş Patika' },
    styles: [
      { name: { ru: 'Дикий камень', en: 'Cobblestone', tr: 'Taş Yol' }, primary: '#94a3b8', secondary: '#cbd5e1' },
      { name: { ru: 'Клинкер', en: 'Red Brick', tr: 'Kırmızı Tuğla' }, primary: '#c85a48', secondary: '#e07a5f' },
      { name: { ru: 'Кедр', en: 'Cedar Deck', tr: 'Sedir Ahşap' }, primary: '#b07d4f', secondary: '#d4a373' }
    ]
  },
  {
    id: 'upg_courtyard_tree',
    order: 3,
    stars: 2,
    coins: 95,
    icon: '🎄',
    name: { ru: 'Нарядная ёлка во дворе', en: 'Dressed Courtyard Tree', tr: 'Süslü Bahçe Ağacı' },
    styles: [
      { name: { ru: 'Рубин и золото', en: 'Ruby & Gold', tr: 'Yakut Altın' }, primary: '#ef233c', secondary: '#ffd166' },
      { name: { ru: 'Серебряный лёд', en: 'Silver Ice', tr: 'Gümüş Buz' }, primary: '#38bdf8', secondary: '#f8fafc' },
      { name: { ru: 'Ретро-карнавал', en: 'Carnival', tr: 'Karnaval' }, primary: '#ec4899', secondary: '#34d399' }
    ]
  },
  {
    id: 'upg_porch_garlands',
    order: 4,
    stars: 2,
    coins: 130,
    icon: '💡',
    name: { ru: 'Гирлянды на крыльце', en: 'Porch Fairy Garlands', tr: 'Veranda Işıkları' },
    styles: [
      { name: { ru: 'Тёплая роса', en: 'Warm Gold', tr: 'Sıcak Altın' }, primary: '#fde047', secondary: '#f59e0b' },
      { name: { ru: 'Монпансье', en: 'Candy Lights', tr: 'Şeker Işık' }, primary: '#fb7185', secondary: '#60a5fa' },
      { name: { ru: 'Сияние севера', en: 'Aurora', tr: 'Kuzey Işığı' }, primary: '#4ade80', secondary: '#22d3ee' }
    ]
  },
  {
    id: 'upg_samovar_table',
    order: 5,
    stars: 2,
    coins: 170,
    icon: '🫖',
    name: { ru: 'Стол с самоваром', en: 'Festive Samovar Table', tr: 'Semaver Masası' },
    styles: [
      { name: { ru: 'Алая скатерть', en: 'Red Check', tr: 'Kırmızı Örtü' }, primary: '#dc2626', secondary: '#fbbf24' },
      { name: { ru: 'Синяя гжель', en: 'Royal Blue', tr: 'Mavi Porselen' }, primary: '#2563eb', secondary: '#eff6ff' },
      { name: { ru: 'Золотая парча', en: 'Gold Brocade', tr: 'Altın İşleme' }, primary: '#d97706', secondary: '#fef08a' }
    ]
  },
  {
    id: 'upg_snowman',
    order: 6,
    stars: 3,
    coins: 210,
    icon: '⛄',
    name: { ru: 'Весёлый снеговик', en: 'Cheerful Snowman', tr: 'Neşeli Kardan Adam' },
    styles: [
      { name: { ru: 'Алый шарф', en: 'Red Scarf', tr: 'Kırmızı Atkı' }, primary: '#ef4444', secondary: '#94a3b8' },
      { name: { ru: 'Синий цилиндр', en: 'Blue Top Hat', tr: 'Mavi Şapka' }, primary: '#2563eb', secondary: '#60a5fa' },
      { name: { ru: 'Лесной эльф', en: 'Spruce Cap', tr: 'Çam Yeşili' }, primary: '#16a34a', secondary: '#facc15' }
    ]
  },
  {
    id: 'upg_ice_lanterns',
    order: 7,
    stars: 3,
    coins: 260,
    icon: '🏮',
    name: { ru: 'Садовые фонари', en: 'Garden Lantern Posts', tr: 'Bahçe Fenerleri' },
    styles: [
      { name: { ru: 'Золотое пламя', en: 'Golden Flame', tr: 'Altın Alev' }, primary: '#fbbf24', secondary: '#fffbeb' },
      { name: { ru: 'Зимний сапфир', en: 'Sapphire Glow', tr: 'Safir Işık' }, primary: '#38bdf8', secondary: '#e0f2fe' },
      { name: { ru: 'Брусничный свет', en: 'Berry Glow', tr: 'Kızıl Işık' }, primary: '#f43f5e', secondary: '#ffe4e6' }
    ]
  },
  {
    id: 'upg_wooden_sled',
    order: 8,
    stars: 3,
    coins: 320,
    icon: '🛷',
    name: { ru: 'Санки с подарками', en: 'Gift Wooden Sleds', tr: 'Hediyeli Kızak' },
    styles: [
      { name: { ru: 'Алое золото', en: 'Crimson Gold', tr: 'Kızıl Altın' }, primary: '#dc2626', secondary: '#facc15' },
      { name: { ru: 'Зимняя лазурь', en: 'Frost Blue', tr: 'Buz Mavisi' }, primary: '#0284c7', secondary: '#e0f2fe' },
      { name: { ru: 'Хвойный изумруд', en: 'Emerald Pine', tr: 'Zümrüt Çam' }, primary: '#15803d', secondary: '#fde047' }
    ]
  },
  {
    id: 'upg_festive_wreath',
    order: 9,
    stars: 4,
    coins: 390,
    icon: '🎀',
    name: { ru: 'Праздничный венок', en: 'Festive Bell Wreath', tr: 'Çanlı Yılbaşı Çelengi' },
    styles: [
      { name: { ru: 'Бархатный бант', en: 'Crimson Bow', tr: 'Kırmızı Kurdele' }, primary: '#e11d48', secondary: '#16a34a' },
      { name: { ru: 'Золотой звон', en: 'Golden Bells', tr: 'Altın Çanlar' }, primary: '#eab308', secondary: '#15803d' },
      { name: { ru: 'Жемчужный иней', en: 'Silver Frost', tr: 'Gümüş Kırağı' }, primary: '#e2e8f0', secondary: '#0ea5e9' }
    ]
  },
  {
    id: 'upg_fireworks',
    order: 10,
    stars: 4,
    coins: 480,
    icon: '🎆',
    name: { ru: 'Новогодний салют!', en: 'New Year Fireworks!', tr: 'Yılbaşı Havai Fişekleri!' },
    styles: [
      { name: { ru: 'Золотой пион', en: 'Gold & Ruby', tr: 'Altın Yakut' }, primary: '#facc15', secondary: '#fb7185' },
      { name: { ru: 'Изумрудный каскад', en: 'Emerald Sky', tr: 'Zümrüt Gökyüzü' }, primary: '#4ade80', secondary: '#c084fc' },
      { name: { ru: 'Гранд-финал', en: 'Grand Finale', tr: 'Büyük Final' }, primary: '#38bdf8', secondary: '#f472b6' }
    ]
  }
];

export const PRODUCER_UNLOCK_ORDERS = {
  gen_samovar_stove: 0,
  gen_pine_chest: 2,
  gen_cellar_basket: 5,
  gen_winter_shed: 8
};

/**
 * Initial 7x8 starter layout tailored for adult casual onboarding:
 * - Spacious, calm center with ONLY 1 active producer (`gen_samovar_stove`) + 3 gift-locked producers (`🔒 2 / 5 / 8`).
 * - Neat 12-item frosted snow frame at the top/sides (Tea & Tree items) instead of overwhelming 30+ items.
 */
export function buildInitialBoard() {
  const grid = Array.from({ length: BOARD_ROWS }, () => Array.from({ length: BOARD_COLS }, () => null));
  const put = (r, c, id, frosted = false, lockedProducer = false) => {
    grid[r][c] = { id, frosted, ...(lockedProducer ? { lockedProducer: true } : {}) };
  };

  // Calm, focused frosted snow border along top & upper corners (Tea + Tree chains)
  const topRow = ['a2_cinnamon_spice', 'a1_tea_leaf', 'a2_cinnamon_spice', 'b1_pine_twig', 'a1_tea_leaf', 'b2_silver_tinsel', 'a3_mug_tea'];
  for (let c = 0; c < BOARD_COLS; c++) put(0, c, topRow[c], true);

  put(1, 0, 'a1_tea_leaf', true);
  put(2, 0, 'a2_cinnamon_spice', true);
  put(1, 6, 'b1_pine_twig', true);
  put(2, 6, 'b2_silver_tinsel', true);
  put(7, 3, 'a3_mug_tea', true);

  // Producer 1: Open & ready right away!
  put(2, 2, 'gen_samovar_stove', false, false);

  // Producers 2, 3, 4: Neatly placed & locked until Orders 2, 5, and 8 so player learns 1 chain at a time!
  put(2, 4, 'gen_pine_chest', false, true);
  put(5, 2, 'gen_cellar_basket', false, true);
  put(5, 4, 'gen_winter_shed', false, true);

  // Starter Tea Leaf right next to frosted Tea Leaf (0,1) & (1,0) for instant Step 2 merge -> Cinnamon for Order 1!
  put(1, 1, 'a1_tea_leaf', false, false);

  return grid;
}

export function buildStarterOrders() {
  // All 3 starter orders exclusively use Producer #1 (Samovar Stove — Tea & Bakery) so zero confusion!
  return [
    {
      uid: 'ord_1',
      neighborId: 'valya',
      reqs: ['a2_cinnamon_spice'],
      coins: 45,
      stars: 1
    },
    {
      uid: 'ord_2',
      neighborId: 'masha',
      reqs: ['a3_mug_tea'],
      coins: 65,
      stars: 1
    },
    {
      uid: 'ord_3',
      neighborId: 'mihalych',
      reqs: ['a2_cinnamon_spice', 'a3_mug_tea'],
      coins: 85,
      stars: 1
    }
  ];
}
