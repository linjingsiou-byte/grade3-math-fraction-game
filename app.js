/**
 * 分數魔法烘焙屋 2.0 - 遊戲核心邏輯 (支持個人自學 & 雙人搶答對戰模式)
 */

// ==========================================
// 1. 原生音效合成器 (Web Audio API)
// ==========================================
const AudioSynth = {
  ctx: null,

  init() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      } catch (e) {
        console.warn("Web Audio API is not supported or blocked in this browser.", e);
        this.ctx = null;
      }
    }
  },

  // 輕快點擊聲 (啵)
  playClick() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 答對音效：C和弦上升琶音
  playCorrect() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.1, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 答錯音效：低沉下降音
  playWrong() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.4);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 搶答成功警示音 (清脆叮咚聲)
  playBuzzerSuccess() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 快速琶音

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 天平沉穩回彈木質音效
  playScaleThud() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 搶答開放警示音 (清脆叮咚二連音：E5 -> B5 -> E6)
  playBuzzerOpen() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [659.25, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.16, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 讀題冷卻期偷按無效輕音
  playSoftClick() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 接力作答音效 (雙聲頓音)
  playPassOn() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [330, 440].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.08, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.15);
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 魔法完成大音效 (挑戰成功)
  playCertificate() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const chords = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 輸送帶齒輪轉動與聖代滑動音 (連續輕快喀嚓下滑音)
  playConveyorMove() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [587.33, 739.99, 880.00, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 狐狸狡黠輕快笑聲 (俏皮頑皮雙音調)
  playFoxChuckle() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 554.37].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now + idx * 0.08);

        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.09, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.14);
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  },

  // 狐狸算錯烤焦冒煙失誤音效 (噗嗤下滑頓音)
  playFoxFail() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  }
};

// ==========================================
// 2. 語音朗讀與引導引擎 (Web Speech API)
// ==========================================
const SpeechManager = {
  synth: window.speechSynthesis,
  currentUtterance: null,

  speak(text, callback) {
    if (!this.synth) return;
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      if (callback) callback();
      this.currentUtterance = null;
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  },

  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }
};

// ==========================================
// 3. 獨立題庫配置
// ==========================================

// (A) 個人自學闖關題庫 (共 20 題，每關 5 題)
const LEARN_QUESTIONS = [
  // --- 第 1 關：平分魔法切切樂 ---
  {
    type: "select-card",
    desc: "媽媽把一個草莓派切成 3 片，如下圖。奇奇拿了其中的 1 片，是拿了 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">3</span></span></span> 個草莓派嗎？",
    speechDesc: "媽媽把一個草莓派切成 3 片。奇奇拿了其中的 1 片，是拿了三分之一個草莓派嗎？",
    layout: "split-unequal-pizza",
    options: [
      { id: "yes", text: "是，因為切成了 3 片" },
      { id: "no", text: "不是，因為這 3 片沒有一樣大，所以不是平分" }
    ],
    answer: "no",
    misconceptionSpeech: "注意看喔！這三片派沒有一樣大，沒有平分，就不能用分數來表示喔！"
  },
  {
    type: "select-card",
    desc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
    speechDesc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
    layout: "equal-waffle-4",
    num: 3,
    den: 4,
    options: [
      { id: "1/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
      { id: "3/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
      { id: "4/3", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">3</span></span></span> 個' }
    ],
    answer: "3/4",
    misconceptionSpeech: "不對喔！這個鬆餅被平分成四份，每一份是四分之一個，塗色的有三份，是三個四分之一，所以是四分之三個鬆餅！"
  },
  {
    type: "select-card",
    desc: "下面哪一個正方形紙的塗色部分是 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">2</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">4</span></span></span> 張色紙？",
    speechDesc: "下面哪一個正方形紙 of 色紙的塗色部分是四分之二張色紙？",
    layout: "select-paper-options",
    options: [
      { id: "A", text: "圖 A（平分成 4 份，塗色 2 份）" },
      { id: "B", text: "圖 B（分成 4 份但大小不一樣）" }
    ],
    answer: "A",
    misconceptionSpeech: "注意喔！圖 B 雖然也分成四塊，但它們大小不一樣，只有平分成一樣大，才能用四分之二表示！"
  },
  {
    type: "select-card",
    desc: "一塊正方形蛋糕被斜斜切成兩塊，如圖。這兩塊一樣大嗎？其中的一塊是 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">2</span></span></span> 個蛋糕嗎？",
    speechDesc: "一塊正方形蛋糕被斜斜切成兩塊。這兩塊一樣大嗎？其中的一塊是二分之一個蛋糕嗎？",
    layout: "split-square-cake-diagonal",
    options: [
      { id: "yes", text: "是，因為切成了 2 塊" },
      { id: "no", text: "不是，因為沒有均勻平分，兩塊不一樣大" }
    ],
    answer: "no",
    misconceptionSpeech: "答錯囉！必須把蛋糕平分成一樣大的兩塊，其中的一塊才能叫作二分之一個！"
  },
  {
    type: "select-card",
    desc: "一個平分成 8 片的草莓披薩，被妙妙吃了 3 片。妙妙是吃了幾個披薩？",
    speechDesc: "一個平分成 8 片的草莓披薩，被妙妙吃了 3 片。妙妙是吃了幾個披薩？",
    layout: "equal-pizza-8",
    num: 3,
    den: 8,
    options: [
      { id: "3/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' },
      { id: "8/3", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">8</span></span><span class="frac-row"><span class="frac-cell frac-den">3</span></span></span> 個' }
    ],
    answer: "3/8",
    misconceptionSpeech: "想一想喔！一個披薩平分 8 片，一片是八分之一個，3 片就是三個八分之一，也就是八分之三個披薩！"
  },

  // --- 第 2 關：魔法甜點包裝盒 ---
  {
    type: "select-card",
    desc: "一盒餅乾有 6 個，平分給 6 個人。奇奇分到 1 個，也可以說是分到幾盒餅乾？",
    speechDesc: "一盒餅乾有 6 個，平分給 6 個人。奇奇分到 1 個，也可以說是分到幾盒餅乾？",
    layout: "macaron-discrete-6",
    options: [
      { id: "1/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 盒' },
      { id: "1", text: "1 盒" },
      { id: "6", text: "6 盒" }
    ],
    answer: "1/6",
    misconceptionSpeech: "不對喔！一盒餅乾有六個，一個是六分之一盒。奇奇拿到了一個，所以是六分之一盒，不是一盒，也不是六盒！"
  },
  {
    type: "interactive-click",
    desc: "一盒杯子蛋糕有 12 個。客人想要買 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒，請在盒內點選正確數量的蛋糕拿給他。",
    speechDesc: "一盒杯子蛋糕有 12 個。客人想要買十二分之五盒，請在盒內點選正確數量的蛋糕拿給他。",
    layout: "cupcake-discrete-12",
    answer: 5,
    misconceptionSpeech: "不對喔！十二分之五盒代表把一盒平分成十二份，取出其中的五份。因為一盒有十二個，每一份是一個，所以要選五個杯子蛋糕！"
  },
  {
    type: "select-card",
    desc: "一盒甜甜圈有 6 個。哥哥拿走 2 個，妹妹拿走 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">6</span></span></span> 盒。盒子裡還剩下幾盒甜甜圈？",
    speechDesc: "一盒甜甜圈有 6 個。哥哥拿走 2 個，妹妹拿走六分之一盒。盒子裡還剩下幾盒甜甜圈？",
    layout: "donut-discrete-6",
    options: [
      { id: "3/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 盒' },
      { id: "2/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">2</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 盒' },
      { id: "4/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 盒' }
    ],
    answer: "3/6",
    misconceptionSpeech: "想一想喔！一盒有六個，兩個甜甜圈是六分之二盒。哥哥拿走六分之二盒，妹妹拿走六分之一盒，兩個人共拿走六分之三盒，所以剩下六分之三盒！"
  },
  {
    type: "select-card",
    desc: "一盒巧克力有 8 顆。平分給 8 個人，每人拿到的 1 顆巧克力，是幾分之幾盒巧克力？",
    speechDesc: "一盒巧克力有 8 顆。平分給 8 個人，每人拿到的 1 顆巧克力，是幾分之幾盒巧克力？",
    layout: "chocolate-discrete-8",
    options: [
      { id: "1/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 盒' },
      { id: "1", text: "1 盒" },
      { id: "8", text: "8 盒" }
    ],
    answer: "1/8",
    misconceptionSpeech: "注意喔！一盒巧克力有八顆，每一顆是八分之一盒。拿到一顆就是拿到八分之一盒！"
  },
  {
    type: "select-card",
    desc: "一盒果凍有 10 個。奇奇拿走 3 個，妙妙拿走 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">4</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 盒。兩個人合起來共拿走了幾盒果凍？",
    speechDesc: "一盒果凍有 10 個。奇奇拿走 3 個，妙妙拿走十分之四盒。兩個人合起來共拿走了幾盒果凍？",
    layout: "jelly-discrete-10",
    options: [
      { id: "7/10", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">7</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 盒' },
      { id: "3/10", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 盒' },
      { id: "4/10", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 盒' }
    ],
    answer: "7/10",
    misconceptionSpeech: "想一想喔！三個果凍是十分之三盒。加上十分之四盒，合起來一共是十分之七盒果凍！"
  },

  // --- 第 3 關：魔法點心輸送帶 ---
  {
    type: "interactive-drag",
    desc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
    speechDesc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
    layout: "swiss-roll-axis-10",
    targets: [
      { ratio: 0.3, label: "3/10" },
      { ratio: 0.7, label: "7/10" },
      { ratio: 1.0, label: "10/10" }
    ],
    misconceptionSpeech: "哎呀！十分之三公尺在第三格，十分之七在第七格，十分之十則是在第十格，也就是跟一公尺一樣長的地方。再試試看喔！"
  },
  {
    type: "select-card",
    desc: "<span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">8</span></span></span> 是幾個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">8</span></span></span> 合起來的？",
    speechDesc: "八分之五是幾個八分之一合起來的？",
    layout: "unit-fraction-sum",
    num: 5,
    den: 8,
    unit: "",
    options: [
      { id: "3", text: "3 個" },
      { id: "5", text: "5 個" },
      { id: "8", text: "8 個" }
    ],
    answer: "5",
    misconceptionSpeech: "不對喔！八分之五是五個八分之一合起來的，分子表示有幾個單位分數！"
  },
  {
    type: "select-card",
    desc: "一條彩帶平分成 10 等分。 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">10</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 條彩帶和 1 條彩帶，哪一個比較長？",
    speechDesc: "一條彩帶平分成 10 等分。十分之十條彩帶和一條彩帶，哪一個比較長？",
    layout: "equals-one-concept",
    den: 10,
    unit: "條",
    options: [
      { id: "left", text: "十分之十條比較長" },
      { id: "right", text: "1 條比較長" },
      { id: "equal", text: "一樣長" }
    ],
    answer: "equal",
    misconceptionSpeech: "想一想喔！把一條彩帶平分成十等分，裡面的十份剛好湊成一條完整的彩帶，所以十分之十條就是一條，一樣長喔！"
  },
  {
    type: "select-card",
    desc: "一條 1 公尺長的紙帶平分成 12 份。 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 公尺是幾個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 公尺合起來的？",
    speechDesc: "一條 1 公尺長的紙帶平分成 12 份。十二分之五公尺是幾個十二分之一公尺合起來的？",
    layout: "unit-fraction-sum",
    num: 5,
    den: 12,
    unit: "公尺",
    options: [
      { id: "5", text: "5 個" },
      { id: "12", text: "12 個" }
    ],
    answer: "5",
    misconceptionSpeech: "不對喔！十二分之五公尺是由五個十二分之一公尺累加合起來的，分子表示單位分數的個數！"
  },
  {
    type: "select-card",
    desc: "一條長 1 公尺的彩帶平分成 9 份。 9 個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">9</span></span></span> 公尺合起來是多少公尺？",
    speechDesc: "一條長 1 公尺的彩帶平分成 9 份。9 個九分之一公尺合起來是多少公尺？",
    layout: "ribbons-equals-one-9",
    options: [
      { id: "1", text: "1 公尺" },
      { id: "9", text: "9 公尺" }
    ],
    answer: "1",
    misconceptionSpeech: "想一想喔！九個九分之一公尺就是九分之九公尺，把平分的九份全部加起來，剛好就是一整條的 1 公尺！"
  },

  // --- 第 4 關：魔法天平比大小 ---
  {
    type: "interactive-scale",
    desc: "請點選符號，比較兩個分數的大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">9</span></span></span> 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">7</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">9</span></span></span>。",
    speechDesc: "請比較兩個分數的大小：九分之五和九分之七哪一個比較大？",
    layout: "scale-fraction-compare",
    leftVal: 5/9,
    rightVal: 7/9,
    leftLabel: "5/9",
    rightLabel: "7/9",
    leftVisual: "pizza-5/9",
    rightVisual: "pizza-7/9",
    answer: "<",
    misconceptionSpeech: "注意看喔！分母相同時，分子越大，分數就越大。九分之七是七片，九分之五是五片，所以九分之五小於九分之七！"
  },
  {
    type: "interactive-scale",
    desc: "一盒巧克力有 12 顆。請比較大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒 與 8 顆巧克力。",
    speechDesc: "請比較大小：十二分之五盒與 8 顆巧克力哪一個多？",
    layout: "scale-discrete-compare",
    leftVal: 5/12,
    rightVal: 8/12,
    leftLabel: "5/12 盒",
    rightLabel: "8 顆",
    leftVisual: "discrete-5",
    rightVisual: "discrete-8",
    answer: "<",
    misconceptionSpeech: "想一想喔！一盒巧克力有十二顆，十二分之五盒就代表五顆。五顆比八顆少，所以十二分之五盒小於八顆！"
  },
  {
    type: "interactive-scale",
    desc: "一盒水蜜桃有 12 顆。請比較大小: 1 盒 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">10</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒。",
    speechDesc: "一盒水蜜桃有 12 顆。請比較大小：1 盒與十二分之十盒哪一個多？",
    layout: "scale-whole-compare",
    leftVal: 1.0,
    rightVal: 10/12,
    leftLabel: "1 盒",
    rightLabel: "10/12 盒",
    leftVisual: "whole-1",
    rightVisual: "discrete-10",
    answer: ">",
    misconceptionSpeech: "不對喔！十二分之十盒代表十顆水蜜桃，而一盒是十二顆。十二顆比十顆多，所以一盒大於十二分之十盒！"
  },
  {
    type: "interactive-scale",
    desc: "請點選符號，比較兩個分數的大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">6</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">4</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span>。",
    speechDesc: "請比較兩個分數的大小：十分之六和十分之四哪一個比較大？",
    layout: "scale-fraction-compare",
    leftVal: 6/10,
    rightVal: 4/10,
    leftLabel: "6/10",
    rightLabel: "4/10",
    leftVisual: "pizza-5/9",
    rightVisual: "pizza-7/9",
    answer: ">",
    misconceptionSpeech: "不對喔！分母相同時，分子越大，分數就越大。十分之六是六個十分之一，比四個十分之一多，所以是大於！"
  },
  {
    type: "interactive-scale",
    desc: "一盒馬卡龍有 12 個。請比較大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">7</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒 與 5 顆馬卡龍。",
    speechDesc: "一盒馬卡龍有 12 個. 請比較大小：十二分之七盒與 5 顆馬卡龍哪一個多？",
    layout: "scale-discrete-compare",
    leftVal: 7/12,
    rightVal: 5/12,
    leftLabel: "7/12 盒",
    rightLabel: "5 顆",
    leftVisual: "discrete-5",
    rightVisual: "discrete-8",
    answer: ">",
    misconceptionSpeech: "想一想喔！一盒馬卡龍有十二個，十二分之七盒代表七個。七個比五個多，所以十二分之七盒大於五顆！"
  }
];

// (B) 雙人對戰獨立題庫 (精選 30 題)
const BATTLE_QUESTIONS = [
  {
    id: "BT1",
    type: "select-card",
    desc: "一塊正方形蛋糕被斜斜切成兩塊，如圖。這兩塊一樣大嗎？其中的一塊是 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">2</span></span></span> 個蛋糕嗎？",
    speechDesc: "一塊正方形蛋糕被斜斜切成兩塊。這兩塊一樣大嗎？其中的一塊是二分之一個蛋糕嗎？",
    layout: "split-square-cake-diagonal", 
    options: [
      { id: "yes", text: "是，因為切成了 2 塊" },
      { id: "no", text: "不是，因為沒有均勻平分，兩塊不一樣大" }
    ],
    answer: "no",
    misconceptionSpeech: "答錯囉！必須把蛋糕平分成一樣大的兩塊，其中的一塊才能叫作二分之一個！"
  },
  {
    id: "BT2",
    type: "select-card",
    desc: "媽媽切巧克力，她把巧克力分成 4 塊，但有 2 塊很大， 2 塊很小。奇奇吃其中的 1 塊，是吃了 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">4</span></span></span> 個巧克力嗎？",
    speechDesc: "媽媽把巧克力分成四塊，但有兩塊很大，兩塊很小。奇奇吃其中的一塊，是吃了四分之一個巧克力嗎？",
    layout: "chocolate-unequal", 
    options: [
      { id: "yes", text: "是，反正有 4 塊" },
      { id: "no", text: "不是，因為這 4 塊沒有一樣大" }
    ],
    answer: "no",
    misconceptionSpeech: "不對喔！巧克力沒有平分，每一塊的大小不一樣，就不能說其中一塊是四分之一！"
  },
  {
    id: "BT3",
    type: "select-card",
    desc: "一個平分成 8 片的草莓披薩，被妙妙吃了 3 片。妙妙是吃了幾個披薩？",
    speechDesc: "一個平分成 8 片的草莓披薩，被妙妙吃了 3 片。妙妙是吃了幾個披薩？",
    layout: "equal-pizza-8",
    num: 3,
    den: 8,
    options: [
      { id: "3/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' },
      { id: "8/3", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">8</span></span><span class="frac-row"><span class="frac-cell frac-den">3</span></span></span> 個' }
    ],
    answer: "3/8",
    misconceptionSpeech: "想一想喔！一個披薩平分 8 片，一片是八分之一個，3 片就是三個八分之一，也就是八分之三個披薩！"
  },
  {
    id: "BT4",
    type: "select-card",
    desc: "一條長 1 公尺的紅緞帶平分成 6 份。其中的 5 份是多少公尺？",
    speechDesc: "一條長 1 公尺的紅緞帶平分成 6 份。其中的 5 份是多少公尺？",
    layout: "unit-fraction-sum",
    num: 5,
    den: 6,
    unit: "公尺",
    options: [
      { id: "1/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 公尺' },
      { id: "5/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">5</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 公尺' }
    ],
    answer: "5/6",
    misconceptionSpeech: "不對喔！平分成六份，每一份是六分之一公尺。五份就是五個六分之一，合起來是六分之五公尺！"
  },
  {
    id: "BT5",
    type: "select-card",
    desc: "小華吃了一個小披薩的 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">4</span></span></span>，大明吃了一個大披薩的 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">4</span></span></span>。誰吃得比較多？",
    speechDesc: "小華吃了一個小披薩的四分之一，大明吃了一個大披薩的四分之一。誰吃得比較多？",
    layout: "pizza-equals-one",
    options: [
      { id: "xiaohua", text: "小華吃的多" },
      { id: "daming", text: "大明吃的多" },
      { id: "equal", text: "一樣多" }
    ],
    answer: "daming",
    misconceptionSpeech: "注意喔！雖然都是四分之一，但是大披薩比小披薩大，所以大披薩的四分之一會比小披薩的四分之一還要多喔！"
  },
  {
    id: "BT6",
    type: "select-card",
    desc: "一條紙帶平分成 5 份，其中的 5 份是多少條紙帶？",
    speechDesc: "一條紙帶平分成 5 份，其中的 5 份是多少條紙帶？",
    layout: "unit-fraction-sum",
    num: 5,
    den: 5,
    unit: "條",
    options: [
      { id: "1", text: "1 條" },
      { id: "5/5", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">5</span></span><span class="frac-row"><span class="frac-cell frac-den">5</span></span></span> 條' },
      { id: "both", text: "以上兩個都對" }
    ],
    answer: "both",
    misconceptionSpeech: "不對喔！五分之五條紙帶剛好是五份全部拿走，也就是完整的一條紙帶，所以兩個答案都是對的喔！"
  },
  {
    id: "BT7",
    type: "select-card",
    desc: "一個大蛋糕平分成 10 片，大寶吃了 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">10</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 個蛋糕。大寶吃的部分和一整個蛋糕一樣多嗎？",
    speechDesc: "一個大蛋糕平分成 10 片，大寶吃了十分之十個蛋糕。大寶吃的部分和一整個蛋糕一樣多嗎？",
    layout: "cake-equals-one",
    options: [
      { id: "yes", text: "是一樣多的" },
      { id: "no", text: "不一樣多" }
    ],
    answer: "yes",
    misconceptionSpeech: "注意喔！十分之十個蛋糕就是把平分的十片蛋糕全部吃完，剛好就是完整的一個蛋糕！"
  },
  {
    id: "BT8",
    type: "select-card",
    desc: "甲彩帶的 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">2</span></span></span> 和乙彩帶的 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">2</span></span></span>，哪一條比較長？",
    speechDesc: "甲彩帶的二分之一和乙彩帶的二分之一，哪一條比較長？",
    layout: "ribbons-different-half",
    options: [
      { id: "jia", text: "甲彩帶比較長" },
      { id: "yi", text: "乙彩帶比較長" },
      { id: "unknown", text: "不一定，要看原本的彩帶哪一條比較長" }
    ],
    answer: "unknown",
    misconceptionSpeech: "想一想喔！如果不知道原本甲和乙彩帶誰比較長，就沒有辦法比較它們二分之一的長度！"
  },
  {
    id: "BT9",
    type: "select-card",
    desc: "一張正方形色紙平分切成 4 塊，塗色 3 塊。塗色部分是多少張色紙？",
    speechDesc: "一張正方形色紙平分切成 4 塊，塗色 3 塊。塗色部分是多少張色紙？",
    layout: "square-paper-3-4",
    options: [
      { id: "1/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 張' },
      { id: "3/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 張' }
    ],
    answer: "3/4",
    misconceptionSpeech: "不對喔！平分成四份，塗了其中三份，是三個四分之一，就是四分之三張色紙！"
  },
  {
    id: "BT10",
    type: "select-card",
    desc: "下面哪一個正方形圖形的塗色部分是 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">4</span></span></span> 張色紙？",
    speechDesc: "下面哪一個正方形圖形的塗色部分是四分之一張色紙？",
    layout: "select-paper-options-1-4",
    options: [
      { id: "A", text: "圖 A（四等份長方形，塗 1 份）" },
      { id: "B", text: "圖 B（分成大小不同的四塊）" }
    ],
    answer: "A",
    misconceptionSpeech: "記住喔！分數必須是在「平分（每一份都一樣大）」的前提下才算數喔！"
  },
  {
    id: "BT11",
    type: "select-card",
    desc: "一盒巧克力有 8 顆。平分給 8 個人，每人拿到的 1 顆巧克力，是幾分之幾盒巧克力？",
    speechDesc: "一盒巧克力有 8 顆。平分給 8 個人，每人拿到的 1 顆巧克力，是幾分之幾盒巧克力？",
    layout: "chocolate-discrete-8",
    options: [
      { id: "1/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 盒' },
      { id: "1", text: "1 盒" },
      { id: "8", text: "8 盒" }
    ],
    answer: "1/8",
    misconceptionSpeech: "注意喔！一盒巧克力有八顆，每一顆是八分之一盒。拿到一顆就是拿到八分之一盒！"
  },
  {
    id: "BT12",
    type: "interactive-click",
    desc: "一盒糖果有 10 顆。小兔想要買 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">6</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 盒，請幫小兔在盒內點選正確數量的糖果。",
    speechDesc: "一盒糖果有 10 顆。小兔想要買十分之六盒，請幫小兔在盒內點選正確數量的糖果。",
    layout: "cupcake-discrete-12", 
    answer: 6,
    misconceptionSpeech: "答錯囉！十分之六盒代表把一盒平分成十等份，取出其中的六等份。因為一等份是一顆，所以要點選六顆！"
  },
  {
    id: "BT13",
    type: "select-card",
    desc: "一盒果凍有 10 個。奇奇拿走 3 個，妙妙拿走 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">4</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 盒。兩個人合起來共拿走了幾盒果凍？",
    speechDesc: "一盒果凍有 10 個。奇奇拿走 3 個，妙妙拿走十分之四盒。兩個人合起來共拿走了幾盒果凍？",
    layout: "jelly-discrete-10",
    options: [
      { id: "7/10", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">7</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 盒' },
      { id: "3/10", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 盒' },
      { id: "4/10", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 盒' }
    ],
    answer: "7/10",
    misconceptionSpeech: "想一想喔！三個果凍是十分之三盒。加上十分之四盒，合起來一共是十分之七盒果凍！"
  },
  {
    id: "BT14",
    type: "select-card",
    desc: "一盒餅乾有 12 個，平分給 12 個小朋友。3 個小朋友分到的餅乾，合起來是幾盒？",
    speechDesc: "一盒餅乾有 12 個，平分給 12 個小朋友。3 個小朋友分到的餅乾，合起來是幾盒？",
    layout: "cookie-discrete-12",
    options: [
      { id: "3", text: "3 盒" },
      { id: "3/12", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">12</span></span></span> 盒' }
    ],
    answer: "3/12",
    misconceptionSpeech: "注意喔！一盒有十二個，一個小朋友拿到一個（即十二分之一盒）。三個小朋友共拿到三個，合起來是十二分之三盒！"
  },
  {
    id: "BT15",
    type: "select-card",
    desc: "一盒甜甜圈有 6 個。哥哥先拿走 2 個，妹妹再拿走 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">6</span></span></span> 盒。盒子裡最後剩下幾盒甜甜圈？",
    speechDesc: "一盒甜甜圈有 6 個。哥哥先拿走 2 個，妹妹再拿走六分之一盒。盒子裡最後剩下幾盒甜甜圈？",
    layout: "donut-discrete-6",
    options: [
      { id: "3/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 盒' },
      { id: "2/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">2</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 盒' }
    ],
    answer: "3/6",
    misconceptionSpeech: "算算看喔！兩個甜甜圈是六分之二盒。一共被拿走了六分之二和六分之一，共六分之三盒。剩下也是六分之三盒！"
  },
  {
    id: "BT16",
    type: "select-card",
    desc: "一盒吊飾有 9 個。抹茶綠吊飾有 3 個，抹茶綠吊飾是幾分之幾盒吊飾？",
    speechDesc: "一盒吊飾有 9 個。抹茶綠吊飾有 3 個，抹茶綠吊飾是幾分之幾盒吊飾？",
    layout: "ornament-discrete-9",
    options: [
      { id: "3/9", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">9</span></span></span> 盒' },
      { id: "1/3", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">3</span></span></span> 盒' },
      { id: "both", text: "兩個答案都可以" }
    ],
    answer: "both",
    misconceptionSpeech: "哇！這題兩個答案都對喔。三個吊飾是九分之三盒；如果每三個分成一組，九個剛好分成三組，它也是三分之一盒喔！"
  },
  {
    id: "BT17",
    type: "select-card",
    desc: "一盒玩具車有 6 個，但其中 2 個是紅色大卡車，4 個是綠色小汽車（大小不一樣）。大卡車是 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">2</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">6</span></span></span> 盒嗎？",
    speechDesc: "一盒玩具車有 6 個，但大小不一樣。大卡車是六分之二盒嗎？",
    layout: "toy-cars-discrete",
    options: [
      { id: "yes", text: "是，六個裡面的兩個" },
      { id: "no", text: "不是，因為玩具車大小不同，沒有平分" }
    ],
    answer: "no",
    misconceptionSpeech: "答錯囉！一盒的點心如果大小不同、沒有平分，就不能直接用分數六分之二來表示喔！"
  },
  {
    id: "BT18",
    type: "interactive-click",
    desc: "一盒杯子蛋糕有 12 個。媽媽想要分出 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">8</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒，請點選正確數量的杯子蛋糕拿給她。",
    speechDesc: "一盒杯子蛋糕有 12 個。媽媽想要分出十二分之八盒，請點選正確數量的杯子蛋糕拿給她。",
    layout: "cupcake-discrete-12",
    answer: 8,
    misconceptionSpeech: "不對喔！十二分之八盒代表把一盒平分十二等份中的八份。因為一個是一個，所以要選八個杯子蛋糕！"
  },
  {
    id: "BT19",
    type: "select-card",
    desc: "一盒巧克力有 12 顆。妹妹拿了 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">4</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒，姊姊拿了 5 顆。誰拿的巧克力比較多？",
    speechDesc: "一盒巧克力有 12 顆。妹妹拿了十二分之四盒，姊姊拿了 5 顆。誰拿的巧克力比較多？",
    layout: "chocolates-equals-one",
    options: [
      { id: "sister", text: "姊姊拿得多" },
      { id: "younger", text: "妹妹拿得多" },
      { id: "equal", text: "一樣多" }
    ],
    answer: "sister",
    misconceptionSpeech: "想一想喔！十二分之四盒巧克力就是四顆. 姊姊拿了五顆，比四顆多，所以是姊姊比較多！"
  },
  {
    id: "BT20",
    type: "select-card",
    desc: "一盒餅乾有 6 個。哥哥拿走 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">6</span></span></span> 盒，也就是拿走幾個餅乾？",
    speechDesc: "一盒餅乾有 6 個。哥哥拿走六分之一盒，也就是拿走幾個餅乾？",
    layout: "macaron-discrete-6",
    options: [
      { id: "1", text: "1 個" },
      { id: "6", text: "6 個" }
    ],
    answer: "1",
    misconceptionSpeech: "注意喔！六分之一盒代表將六個餅乾平分給六個人，每人拿到的一個，所以是拿走一個餅乾！"
  },
  {
    id: "BT21",
    type: "interactive-drag",
    desc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
    speechDesc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
    layout: "swiss-roll-axis-10",
    targets: [
      { ratio: 0.3, label: "3/10" },
      { ratio: 0.7, label: "7/10" },
      { ratio: 1.0, label: "10/10" }
    ],
    misconceptionSpeech: "哎呀！十分之三公尺在第三格，十分之七在第七格，十分之十則是在第十格，也就是跟一公尺一樣長的地方。再試試看喔！"
  },
  {
    id: "BT22",
    type: "select-card",
    desc: "一條 1 公尺長的紙帶平分成 12 份。 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 公尺是幾個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 公尺合起來的？",
    speechDesc: "一條 1 公尺長的紙帶平分成 12 份。十二分之五公尺是幾個十二分之一公尺合起來的？",
    layout: "unit-fraction-sum",
    num: 5,
    den: 12,
    unit: "公尺",
    options: [
      { id: "5", text: "5 個" },
      { id: "12", text: "12 個" }
    ],
    answer: "5",
    misconceptionSpeech: "不對喔！十二分之五公尺是由五個十二分之一公尺累加合起來的，分子表示單位分數的個數！"
  },
  {
    id: "BT23",
    type: "select-card",
    desc: "一條長 1 公尺的彩帶平分成 9 份。 9 個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">9</span></span></span> 公尺合起來是多少公尺？",
    speechDesc: "一條長 1 公尺的彩帶平分成 9 份。9 個九分之一公尺合起來是多少公尺？",
    layout: "ribbons-equals-one-9",
    options: [
      { id: "1", text: "1 公尺" },
      { id: "9", text: "9 公尺" }
    ],
    answer: "1",
    misconceptionSpeech: "想一想喔！九個九分之一公尺就是九分之九公尺，把平分的九份全部加起來，剛好就是一整條的 1 公尺！"
  },
  {
    id: "BT24",
    type: "select-card",
    desc: "<span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">8</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 公尺是幾個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 公尺合起來的？",
    speechDesc: "十分之八公尺是幾個十分之一公尺合起來的？",
    layout: "unit-fraction-sum",
    num: 8,
    den: 10,
    unit: "公尺",
    options: [
      { id: "8", text: "8 個" },
      { id: "10", text: "10 個" }
    ],
    answer: "8",
    misconceptionSpeech: "答錯囉！十分之八公尺代表有八個十分之一公尺合起來，分子表示個數！"
  },
  {
    id: "BT25",
    type: "select-card",
    desc: "一條瑞士捲平分成 10 份。 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">10</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 條瑞士捲和 1 條瑞士捲，哪一個比較多？",
    speechDesc: "一條瑞士捲平分成 10 份。十分之十條瑞士捲和一條瑞士捲，哪一個比較多？",
    layout: "swissroll-equals-one-10",
    options: [
      { id: "left", text: "十分之十條比較多" },
      { id: "right", text: "1 條比較多" },
      { id: "equal", text: "一樣多" }
    ],
    answer: "equal",
    misconceptionSpeech: "注意喔！十分之十條就是十份中的十份，代表一整條瑞士捲，所以是一樣多的！"
  },
  {
    id: "BT26",
    type: "interactive-scale",
    desc: "請點選符號，比較兩個分數的大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">6</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">4</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span>。",
    speechDesc: "請比較兩個分數的大小：十分之六和十分之四哪一個比較大？",
    layout: "scale-fraction-compare",
    leftVal: 6/10,
    rightVal: 4/10,
    leftLabel: "6/10",
    rightLabel: "4/10",
    leftVisual: "pizza-5/9", 
    rightVisual: "pizza-7/9",
    answer: ">",
    misconceptionSpeech: "不對喔！分母相同時，分子越大，分數就越大。十分之六是六個十分之一，比四個十分之一多，所以是大於！"
  },
  {
    id: "BT27",
    type: "interactive-scale",
    desc: "一盒馬卡龍有 12 個。請比較大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">7</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒 與 5 顆馬卡龍。",
    speechDesc: "一盒馬卡龍有 12 個. 請比較大小：十二分之七盒與 5 顆馬卡龍哪一個多？",
    layout: "scale-discrete-compare",
    leftVal: 7/12,
    rightVal: 5/12,
    leftLabel: "7/12 盒",
    rightLabel: "5 顆",
    leftVisual: "discrete-5",
    rightVisual: "discrete-8",
    answer: ">",
    misconceptionSpeech: "想一想喔！一盒馬卡龍有十二個，十二分之七盒代表七個。七個比五個多，所以十二分之七盒大於五顆！"
  },
  {
    id: "BT28",
    type: "interactive-scale",
    desc: "一盒杯子蛋糕有 10 個。請比較大小：1 盒 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">9</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 盒。",
    speechDesc: "一盒杯子蛋糕有 10 個. 請比較大小：1 盒與十分之九盒哪一個多？",
    layout: "scale-whole-compare",
    leftVal: 1.0,
    rightVal: 9/10,
    leftLabel: "1 盒",
    rightLabel: "9/10 盒",
    leftVisual: "whole-1",
    rightVisual: "discrete-10",
    answer: ">",
    misconceptionSpeech: "答錯囉！一盒是十個，十分之九盒代表九個。十個比九個多，所以一盒大於十分之九盒！"
  },
  {
    id: "BT29",
    type: "interactive-scale",
    desc: "請點選符號，比較兩個分數的大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">3</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">8</span></span></span> 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">8</span></span></span>。",
    speechDesc: "請比較兩個分數的大小：八分之三和八分之五哪一個比較大？",
    layout: "scale-fraction-compare",
    leftVal: 3/8,
    rightVal: 5/8,
    leftLabel: "3/8",
    rightLabel: "5/8",
    leftVisual: "pizza-5/9",
    rightVisual: "pizza-7/9",
    answer: "<",
    misconceptionSpeech: "分母都是八，分子大的分數比較大。八分之三是三個，八分之五是五個，所以八分之三小於八分之五！"
  },
  {
    id: "BT30",
    type: "interactive-scale",
    desc: "一盒巧克力有 8 顆。請比較大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">4</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">8</span></span></span> 盒 與 4 顆巧克力。",
    speechDesc: "一盒巧克力有 8 顆. 請比較大小：八分之四盒與 4 顆巧克力哪一個多？",
    layout: "scale-discrete-compare",
    leftVal: 4/8,
    rightVal: 4/8,
    leftLabel: "4/8 盒",
    rightLabel: "4 顆",
    leftVisual: "discrete-5",
    rightVisual: "discrete-8",
    answer: "=",
    misconceptionSpeech: "想一想喔！一盒巧克力有八顆，八分之四盒巧克力就是把八顆平分八等份，取其中的四份，剛好就是四顆，所以是一樣多的！"
  }
];

// ==========================================
// 4. 遊戲狀態管理器 (State Manager)
// ==========================================
const GameState = {
  gameMode: 'learn', // 'learn' | 'battle'
  
  autoSpeech: (() => {
    try {
      return localStorage.getItem('fraction_bakery_autospeech') === 'true';
    } catch(e) {
      return false;
    }
  })(),
  
  // 個人自學進度
  currentLevelIdx: 0,
  currentQuestionIdx: 0,
  lives: 3,
  
  score: (() => {
    try {
      const saved = localStorage.getItem('fraction_bakery_score');
      return saved ? parseInt(saved) || 0 : 0;
    } catch(e) {
      return 0;
    }
  })(),
  
  completedLevels: (() => {
    try {
      const saved = localStorage.getItem('fraction_bakery_completed');
      return saved ? JSON.parse(saved) : [false, false, false, false];
    } catch(e) {
      return [false, false, false, false];
    }
  })(),
  
  currentLevelQuestions: [], // 當前關卡隨機挑選出的 5 題自學題目

  // 雙人對戰進度與狀態 (搶答機制)
  battleTotalRounds: 10,
  battleCurrentRound: 0,
  playerScores: { A: 0, B: 0 },
  currentPlayer: null,      // 當前作答玩家 ('A' | 'B' | null，未搶答前為 null)
  buzzerLocked: false,      // 本題是否已被搶答鎖定
  buzzerWinner: null,       // 誰搶答成功
  isPassOnTurn: false,      // 當前是否為接力答題輪 (搶答答錯後)
  isThinkingPhase: false,   // 是否處於讀題思考倒數期
  battleThinkingTimer: null,// 讀題思考計時器 ID
  battleAnswerTimer: null,  // 搶答後作答限時 (10 秒) 計時器 ID
  battleQuestionQueue: [],  // 對戰隨機題目陣列
  lockedOptions: [],        // 對戰中已被選錯而鎖定的選項

  // 單人 vs AI 挑戰模式 (甜點輸送帶大拔河)
  aiDifficulty: 'normal',   // 'easy' | 'normal' | 'hard'
  tugPosition: 0,           // 拔河刻度位置：-5 (學生大勝) ~ 0 (中立平衡) ~ +5 (狐狸大勝)
  aiThinkingTimer: null,    // 狐狸思考計時器 ID
  aiThinkingElapsed: 0,     // 狐狸已思考毫秒數
  aiThinkingTotal: 10,      // 狐狸單題總思考秒數
  aiQuestionQueue: [],      // AI 對決題目清單
  aiRoundsPlayed: 0,        // 目前進行第幾題
  aiPlayerPulls: 0,         // 學生拉動次數
  aiFoxPulls: 0,            // 狐狸拉動次數
  aiTimerPaused: false,     // 答錯迷思導正時是否暫停計時

  selectedOption: null,
  selectedItemsCount: 0, 
  scaleSelectedOp: null,  
  draggedElementsCount: 0, 
  dragPlacements: {},     

  saveToLocalStorage() {
    try {
      localStorage.setItem('fraction_bakery_completed', JSON.stringify(this.completedLevels));
      localStorage.setItem('fraction_bakery_score', this.score.toString());
    } catch(e) {}
  },

  saveAutoSpeech() {
    try {
      localStorage.setItem('fraction_bakery_autospeech', this.autoSpeech.toString());
    } catch(e) {}
  },

  resetLearnProgress() {
    this.completedLevels = [false, false, false, false];
    this.score = 0;
    this.saveToLocalStorage();
  },

  reset() {
    this.currentLevelIdx = 0;
    this.currentQuestionIdx = 0;
    this.lives = 3;
    // 保留 completedLevels 與 score 以利進度累積
    this.currentLevelQuestions = [];

    this.battleCurrentRound = 0;
    this.playerScores = { A: 0, B: 0 };
    this.currentPlayer = null;
    this.buzzerLocked = false;
    this.buzzerWinner = null;
    this.isPassOnTurn = false;
    this.isThinkingPhase = false;
    if (this.battleThinkingTimer) {
      clearInterval(this.battleThinkingTimer);
      this.battleThinkingTimer = null;
    }
    if (this.battleAnswerTimer) {
      clearInterval(this.battleAnswerTimer);
      this.battleAnswerTimer = null;
    }
    this.battleQuestionQueue = [];
    this.lockedOptions = [];

    // 重置 AI 挑戰狀態
    this.tugPosition = 0;
    if (this.aiThinkingTimer) {
      clearInterval(this.aiThinkingTimer);
      this.aiThinkingTimer = null;
    }
    this.aiThinkingElapsed = 0;
    this.aiThinkingTotal = 10;
    this.aiQuestionQueue = [];
    this.aiRoundsPlayed = 0;
    this.aiPlayerPulls = 0;
    this.aiFoxPulls = 0;
    this.aiTimerPaused = false;

    this.selectedOption = null;
    this.selectedItemsCount = 0;
    this.scaleSelectedOp = null;
    this.draggedElementsCount = 0;
    this.dragPlacements = {};
  },

  getCurrentQuestion() {
    if (this.gameMode === 'learn') {
      return this.currentLevelQuestions[this.currentQuestionIdx];
    } else if (this.gameMode === 'ai-challenge') {
      return this.aiQuestionQueue[this.aiRoundsPlayed];
    } else {
      return this.battleQuestionQueue[this.battleCurrentRound];
    }
  },

  getCurrentLevel() {
    return LEVEL_CONFIGS[this.currentLevelIdx];
  }
};

// ==========================================
// 5. 遊戲介面控制器 (UI Controller)
// ==========================================
const GameApp = {
  // DOM 元素
  welcomeScreen: null,
  levelSelectScreen: null,
  setupScreen: null,
  playScreen: null,
  certModal: null,
  battleResultModal: null,
  gameoverModal: null,
  
  learnModeBtn: null,
  battleModeBtn: null,
  backToMenuBtn: null,
  backToMenuFromSelectBtn: null,
  claimCertBtn: null,
  
  backHomeBtn: null,
  currentLevelNum: null,
  levelTitleDisplay: null,
  levelLabelDisplay: null,
  progressFill: null,
  heartContainer: null,
  scoreVal: null,
  
  battlePlayersPanel: null,
  playerCardA: null,
  playerCardB: null,
  scoreA: null,
  scoreB: null,

  buzzerBtnA: null,
  buzzerBtnB: null,
  workspaceOverlay: null,
  battleStatusBar: null,
  battleStatusIcon: null,
  battleStatusText: null,
  battleStatusTimer: null,
  battleStatusProgressFill: null,
  
  autoSpeechCb: null,
  
  questionText: null,
  ttsBtn: null,
  workspaceArea: null,
  messageBanner: null,
  messageIcon: null,
  messageText: null,
  
  submitBtn: null,
  nextBtn: null,
  
  restartCertBtn: null,
  restartBattleBtn: null,
  restartGoBtn: null,
  certDateStr: null,

  battleWinnerTitle: null,
  battleWinnerStatus: null,
  finalScoreA: null,
  finalScoreB: null,
  battleTrophyEmoji: null,
  footerHintText: null,

  init() {
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.levelSelectScreen = document.getElementById('level-select-screen');
    this.setupScreen = document.getElementById('setup-screen');
    this.playScreen = document.getElementById('play-screen');
    this.certModal = document.getElementById('certificate-modal');
    this.battleResultModal = document.getElementById('battle-result-modal');
    this.gameoverModal = document.getElementById('gameover-modal');
    
    this.learnModeBtn = document.getElementById('learn-mode-btn');
    this.battleModeBtn = document.getElementById('battle-mode-btn');
    this.backToMenuBtn = document.getElementById('back-to-menu-btn');
    this.backToMenuFromSelectBtn = document.getElementById('back-to-menu-from-select-btn');
    this.claimCertBtn = document.getElementById('claim-cert-btn');
    
    this.backHomeBtn = document.getElementById('back-home-btn');
    this.currentLevelNum = document.getElementById('current-level-num');
    this.levelTitleDisplay = document.getElementById('level-title-display');
    this.levelLabelDisplay = document.getElementById('level-label-display');
    this.progressFill = document.getElementById('progress-fill');
    this.heartContainer = document.getElementById('heart-container');
    this.scoreVal = document.getElementById('score-val');
    
    this.battlePlayersPanel = document.getElementById('battle-players-panel');
    this.playerCardA = document.getElementById('player-card-A');
    this.playerCardB = document.getElementById('player-card-B');
    this.scoreA = document.getElementById('score-A');
    this.scoreB = document.getElementById('score-B');

    this.buzzerBtnA = document.getElementById('buzzer-btn-A');
    this.buzzerBtnB = document.getElementById('buzzer-btn-B');
    this.workspaceOverlay = document.getElementById('workspace-overlay');
    this.battleStatusBar = document.getElementById('battle-status-bar');
    this.battleStatusIcon = document.getElementById('battle-status-icon');
    this.battleStatusText = document.getElementById('battle-status-text');
    this.battleStatusTimer = document.getElementById('battle-status-timer');
    this.battleStatusProgressFill = document.getElementById('battle-status-progress-fill');
    
    this.autoSpeechCb = document.getElementById('auto-speech-cb');
    
    this.questionText = document.getElementById('question-text');
    this.ttsBtn = document.getElementById('tts-btn');
    this.workspaceArea = document.getElementById('workspace-area');
    this.messageBanner = document.getElementById('message-banner');
    this.messageIcon = document.getElementById('message-icon');
    this.messageText = document.getElementById('message-text');
    
    this.submitBtn = document.getElementById('submit-btn');
    this.nextBtn = document.getElementById('next-btn');
    
    this.restartCertBtn = document.getElementById('restart-cert-btn');
    this.restartBattleBtn = document.getElementById('restart-battle-btn');
    this.restartGoBtn = document.getElementById('restart-go-btn');
    this.certDateStr = document.getElementById('cert-date-str');
    this.resetProgressBtn = document.getElementById('reset-progress-btn');
    this.welcomeSecretGuideBtn = document.getElementById('welcome-secret-guide-btn');
    this.menuSecretGuideBtn = document.getElementById('menu-secret-guide-btn');
    this.modalSecretGuide = document.getElementById('modal-secret-guide');
    this.btnCloseGuide = document.getElementById('btn-close-guide');

    this.battleWinnerTitle = document.getElementById('battle-winner-title');
    this.battleWinnerStatus = document.getElementById('battle-winner-text');
    this.finalScoreA = document.getElementById('final-score-A');
    this.finalScoreB = document.getElementById('final-score-B');
    this.battleTrophyEmoji = document.getElementById('battle-trophy-emoji');
    this.footerHintText = document.getElementById('footer-hint-text');

    // AI 挑戰模式元件
    this.aiModeBtn = document.getElementById('ai-mode-btn');
    this.aiSetupScreen = document.getElementById('ai-setup-screen');
    this.backToMenuFromAiBtn = document.getElementById('back-to-menu-from-ai-btn');
    this.startAiChallengeBtn = document.getElementById('start-ai-challenge-btn');
    this.aiDiffCards = document.querySelectorAll('.ai-diff-card');

    this.conveyorTugWar = document.getElementById('conveyor-tug-war');
    this.conveyorSundae = document.getElementById('conveyor-sundae');
    this.playerTugScore = document.getElementById('player-tug-score');
    this.aiOpponentName = document.getElementById('ai-opponent-name');
    this.aiThinkingState = document.getElementById('ai-thinking-state');
    this.aiFoxAvatar = document.getElementById('ai-fox-avatar');
    this.tugStatusText = document.getElementById('tug-status-text');
    this.aiTimerFill = document.getElementById('ai-timer-fill');

    this.aiResultModal = document.getElementById('ai-result-modal');
    this.aiResultCard = document.getElementById('ai-result-card');
    this.aiWinnerTitle = document.getElementById('ai-winner-title');
    this.aiFinalPlayerPull = document.getElementById('ai-final-player-pull');
    this.aiFinalFoxPull = document.getElementById('ai-final-fox-pull');
    this.aiTrophyEmoji = document.getElementById('ai-trophy-emoji');
    this.aiWinnerText = document.getElementById('ai-winner-text');
    this.aiDialogueText = document.getElementById('ai-dialogue-text');
    this.aiRestartBtn = document.getElementById('ai-restart-btn');
    this.aiBackMenuBtn = document.getElementById('ai-back-menu-btn');

    if (this.autoSpeechCb) {
      this.autoSpeechCb.checked = GameState.autoSpeech;
    }
    this.bindEvents();
    this.generateParticles();
  },

  bindEvents() {
    // 1. 首頁模式選擇
    this.learnModeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      GameState.gameMode = 'learn';
      // 改為跳轉到自學關卡選擇頁面，而不是直接開始！
      GameState.reset(); // 首頁進入時重置生命值和金幣
      this.updateLevelSelectUI();
      this.showScreen(this.levelSelectScreen);
      SpeechManager.speak("請選擇你想修煉的分數魔法關卡！");
    });

    this.battleModeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      GameState.gameMode = 'battle';
      GameState.reset();
      this.showScreen(this.setupScreen);
      SpeechManager.speak("請選擇對決題數！");
    });

    // 1-B. AI 挑戰模式按鈕事件
    if (this.aiModeBtn) {
      this.aiModeBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        GameState.gameMode = 'ai-challenge';
        GameState.reset();
        this.showScreen(this.aiSetupScreen);
        SpeechManager.speak("歡迎來到單人 AI 挑戰賽！隔壁街的狡猾狐狸店長來搶聖代囉，請選擇挑戰難度！");
      });
    }

    if (this.backToMenuFromAiBtn) {
      this.backToMenuFromAiBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        SpeechManager.stop();
        this.clearAiThinkingTimer();
        this.showScreen(this.welcomeScreen);
      });
    }

    if (this.aiDiffCards) {
      this.aiDiffCards.forEach(card => {
        card.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          this.aiDiffCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          GameState.aiDifficulty = card.dataset.diff;
          const diffNames = { easy: "見習烘焙學徒", normal: "熟練甜點師傅", hard: "傳奇狡猾主廚" };
          SpeechManager.speak(`已選擇難度：${diffNames[GameState.aiDifficulty]}`);
        });
      });
    }

    if (this.startAiChallengeBtn) {
      this.startAiChallengeBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        this.startAiChallenge();
      });
    }

    if (this.aiRestartBtn) {
      this.aiRestartBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        this.aiResultModal.classList.remove('active');
        this.startAiChallenge();
      });
    }

    if (this.aiBackMenuBtn) {
      this.aiBackMenuBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        this.aiResultModal.classList.remove('active');
        this.clearAiThinkingTimer();
        this.showScreen(this.welcomeScreen);
      });
    }

    this.backToMenuBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      SpeechManager.stop();
      this.showScreen(this.welcomeScreen);
    });

    this.backToMenuFromSelectBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      SpeechManager.stop();
      this.showScreen(this.welcomeScreen);
    });

    this.claimCertBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      this.showCertificate();
    });

    // 2. 自學關卡點擊事件
    document.querySelectorAll('.level-card-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        const lvlIdx = parseInt(btn.dataset.level);
        GameState.currentLevelIdx = lvlIdx;
        GameState.currentQuestionIdx = 0; // 從該關卡第 1 題開始
        this.startGame();
      });
    });

    // 3. 對戰題數設定
    document.querySelectorAll('.dessert-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        GameState.battleTotalRounds = parseInt(btn.dataset.rounds);
        this.startGame();
      });
    });

    // 4. 全域語音報讀開關
    this.autoSpeechCb.addEventListener('change', (e) => {
      e.stopPropagation();
      GameState.autoSpeech = e.target.checked;
      GameState.saveAutoSpeech(); // 保存狀態至 localStorage
      AudioSynth.playClick();
      if (GameState.autoSpeech) {
        this.speakCurrentQuestion();
      } else {
        SpeechManager.stop();
      }
    });

    this.backHomeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      SpeechManager.stop();
      this.clearBattleThinkingTimer();
      this.clearBattleAnswerTimer();
      this.clearAiThinkingTimer();
      this.showScreen(this.welcomeScreen);
    });

    this.ttsBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      this.speakCurrentQuestion();
    });

    this.submitBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      this.checkAnswer();
    });

    this.nextBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      this.loadNextQuestion();
    });

    this.restartCertBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      this.certModal.classList.remove('active');
      GameState.resetLearnProgress(); // 證書點選再次挑戰時重置自學進度
      this.updateLevelSelectUI();
      this.showScreen(this.levelSelectScreen); // 證書後回關卡選擇
    });

    this.restartBattleBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      this.battleResultModal.classList.remove('active');
      this.showScreen(this.welcomeScreen);
    });

    this.restartGoBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.gameoverModal.classList.remove('active');
      this.updateLevelSelectUI();
      this.showScreen(this.levelSelectScreen); // 能量耗盡回關卡選擇
    });

    // 5. 搶答按鈕點擊事件
    this.buzzerBtnA.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.handleBuzzerPress('A');
    });

    this.buzzerBtnB.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.handleBuzzerPress('B');
    });

    // 6. 重置自學進度按鈕
    if (this.resetProgressBtn) {
      this.resetProgressBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        if (confirm("您確定要清除所有自學關卡的通關紀錄與金幣分數嗎？")) {
          GameState.resetLearnProgress();
          this.updateLevelSelectUI();
          SpeechManager.speak("所有學習進度已清除。");
        }
      });
    }

    // 6.5. 魔法烘焙秘笈按鈕與彈窗控制
    const openGuide = () => {
      if (this.modalSecretGuide) {
        this.modalSecretGuide.classList.add('active');
        SpeechManager.speak("歡迎閱讀分數魔法烘焙秘笈！點擊右上角的叉叉可以關閉秘笈喔。");
      }
    };
    
    const closeGuide = () => {
      if (this.modalSecretGuide) {
        this.modalSecretGuide.classList.remove('active');
        SpeechManager.stop();
      }
    };

    if (this.welcomeSecretGuideBtn) {
      this.welcomeSecretGuideBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        openGuide();
      });
    }

    if (this.menuSecretGuideBtn) {
      this.menuSecretGuideBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        openGuide();
      });
    }

    if (this.btnCloseGuide) {
      this.btnCloseGuide.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        closeGuide();
      });
    }

    if (this.modalSecretGuide) {
      this.modalSecretGuide.addEventListener('pointerdown', (e) => {
        // 點擊彈窗外背景關閉秘笈
        if (e.target === this.modalSecretGuide) {
          e.stopPropagation();
          AudioSynth.playClick();
          closeGuide();
        }
      });
    }

    // 7. 鍵盤監聽事件 (A 搶答, L 搶答, [1][2][3] 選項, Enter/Space 送出或下一題)
    window.addEventListener('keydown', (e) => {
      if (GameState.gameMode !== 'battle' && GameState.gameMode !== 'ai-challenge') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // (1) 搶答鍵 (貓咪 A / 狗狗 L，僅限雙人對戰模式)
      if (GameState.gameMode === 'battle') {
        if (e.code === 'KeyA') {
          this.handleBuzzerPress('A');
          return;
        } else if (e.code === 'KeyL') {
          this.handleBuzzerPress('B');
          return;
        }
      }

      // (2) 數字快捷鍵：[1], [2], [3] 選取工作區選項
      if (['Digit1', 'Numpad1'].includes(e.code)) {
        this.selectOptionByIndex(0);
        return;
      } else if (['Digit2', 'Numpad2'].includes(e.code)) {
        this.selectOptionByIndex(1);
        return;
      } else if (['Digit3', 'Numpad3'].includes(e.code)) {
        this.selectOptionByIndex(2);
        return;
      }

      // (3) Enter 鍵：送出答案 或 進入下一題
      if (['Enter', 'NumpadEnter'].includes(e.code)) {
        if (!this.nextBtn.classList.contains('hidden')) {
          e.preventDefault();
          AudioSynth.playClick();
          this.loadNextQuestion();
        } else if (!this.submitBtn.classList.contains('hidden') && !this.submitBtn.disabled) {
          e.preventDefault();
          AudioSynth.playClick();
          this.checkAnswer();
        }
        return;
      }

      // (4) 空白鍵：進入下一題
      if (e.code === 'Space') {
        if (!this.nextBtn.classList.contains('hidden')) {
          e.preventDefault();
          AudioSynth.playClick();
          this.loadNextQuestion();
        }
      }
    });
  },

  generateParticles() {
    const container = document.getElementById('particle-container');
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'magic-particle';
      p.style.width = p.style.height = `${Math.random() * 40 + 20}px`;
      p.style.left = `${Math.random() * 100}vw`;
      p.style.animationDelay = `${Math.random() * 5}s`;
      p.style.animationDuration = `${Math.random() * 4 + 4}s`;
      container.appendChild(p);
    }
  },

  showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  },

  startGame() {
    // 移除 GameState.reset() 的直接調用，因為 reset 已經被搬到首頁按鈕點選時了！
    // 這樣在自學關卡選擇特定的 currentLevelIdx 才不會被洗掉！
    
    if (GameState.gameMode === 'learn') {
      GameState.lives = 3; // 重置本關卡生命值
      this.battlePlayersPanel.classList.add('hidden');
      document.getElementById('learn-status-tracker').classList.remove('hidden');
      this.levelLabelDisplay.style.display = 'inline';
      
      this.buzzerBtnA.classList.add('hidden');
      this.buzzerBtnB.classList.add('hidden');
      this.workspaceOverlay.classList.add('hidden');

      // 隨機自學題目挑選與打亂
      const levelConfig = LEVEL_CONFIGS[GameState.currentLevelIdx];
      const allLevelQuestions = [...levelConfig.questions];
      const shuffled = allLevelQuestions.sort(() => Math.random() - 0.5);
      GameState.currentLevelQuestions = shuffled.slice(0, 5);
      GameState.currentQuestionIdx = 0;
    } else {
      this.battlePlayersPanel.classList.remove('hidden');
      document.getElementById('learn-status-tracker').classList.add('hidden');
      this.levelLabelDisplay.style.display = 'none';

      this.buzzerBtnA.classList.remove('hidden');
      this.buzzerBtnB.classList.remove('hidden');
      this.workspaceOverlay.classList.remove('hidden');

      this.shuffleAndQueueBattleQuestions();
    }

    this.updateStatusUI();
    this.showScreen(this.playScreen);
    this.loadQuestion();
  },

  shuffleAndQueueBattleQuestions() {
    const shuffled = [...BATTLE_QUESTIONS].sort(() => Math.random() - 0.5);
    const count = Math.min(GameState.battleTotalRounds, shuffled.length);
    GameState.battleQuestionQueue = shuffled.slice(0, count);
  },

  updateStatusUI() {
    if (GameState.gameMode === 'learn') {
      this.scoreVal.textContent = GameState.score;
      this.heartContainer.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const h = document.createElement('span');
        h.className = `heart ${i < GameState.lives ? 'active' : ''}`;
        h.innerHTML = '❤️';
        this.heartContainer.appendChild(h);
      }

      const lvl = GameState.getCurrentLevel();
      const pct = (GameState.currentQuestionIdx / GameState.currentLevelQuestions.length) * 100;
      this.progressFill.style.width = `${pct}%`;

      this.currentLevelNum.textContent = lvl.levelNum;
      this.levelTitleDisplay.textContent = lvl.name;
      this.footerHintText.textContent = "操作提示：請點擊或拖曳甜點來回答問題。";
    } else if (GameState.gameMode === 'ai-challenge') {
      this.levelTitleDisplay.textContent = `拔河對決第 ${GameState.aiRoundsPlayed + 1} / ${GameState.aiQuestionQueue.length} 題`;
      const pct = (GameState.aiRoundsPlayed / GameState.aiQuestionQueue.length) * 100;
      this.progressFill.style.width = `${pct}%`;
      this.footerHintText.textContent = "操作提示：請仔細看題並選出正確答案，搶在狐狸算出前送出，把聖代往左拉！";
    } else {
      this.scoreA.textContent = GameState.playerScores.A;
      this.scoreB.textContent = GameState.playerScores.B;

      if (GameState.currentPlayer === 'A') {
        this.playerCardA.classList.add('active');
        this.playerCardB.classList.remove('active');
      } else if (GameState.currentPlayer === 'B') {
        this.playerCardA.classList.remove('active');
        this.playerCardB.classList.add('active');
      } else {
        this.playerCardA.classList.remove('active');
        this.playerCardB.classList.remove('active');
      }

      this.levelTitleDisplay.textContent = `搶答對戰第 ${GameState.battleCurrentRound + 1} / ${GameState.battleTotalRounds} 題`;

      const pct = (GameState.battleCurrentRound / GameState.battleTotalRounds) * 100;
      this.progressFill.style.width = `${pct}%`;

      if (GameState.isThinkingPhase) {
        this.footerHintText.textContent = "⏳ 仔細看題思考中... 倒數結束前請先不要按按鈕喔！";
      } else if (!GameState.buzzerLocked) {
        this.footerHintText.textContent = "⚡ 搶答已開放！請按 A 鍵 (🐱) 或 L 鍵 (🐶) 進行魔法搶答！";
      } else {
        const pName = GameState.currentPlayer === 'A' ? '玩家 A (🐱)' : '玩家 B (🐶)';
        const turnLabel = GameState.isPassOnTurn ? '【接力作答】' : '【搶答作答】';
        this.footerHintText.textContent = `${turnLabel} 現在由 ${pName} 回答（可按數字鍵 [1][2][3] 選選項，按 Enter 送出）！`;
      }
    }
  },

  clearBattleThinkingTimer() {
    if (GameState.battleThinkingTimer) {
      clearInterval(GameState.battleThinkingTimer);
      GameState.battleThinkingTimer = null;
    }
  },

  clearBattleAnswerTimer() {
    if (GameState.battleAnswerTimer) {
      clearInterval(GameState.battleAnswerTimer);
      GameState.battleAnswerTimer = null;
    }
  },

  // ==========================================
  // AI 挑戰模式（甜點輸送帶大拔河）核心控制器
  // ==========================================
  startAiChallenge() {
    GameState.gameMode = 'ai-challenge';
    GameState.reset();

    // 隨機抽選 10 題
    const shuffled = [...BATTLE_QUESTIONS].sort(() => Math.random() - 0.5);
    GameState.aiQuestionQueue = shuffled.slice(0, 10);
    GameState.aiRoundsPlayed = 0;
    GameState.tugPosition = 0;
    GameState.aiPlayerPulls = 0;
    GameState.aiFoxPulls = 0;

    // 介面切換
    this.battlePlayersPanel.classList.add('hidden');
    document.getElementById('learn-status-tracker').classList.add('hidden');
    this.levelLabelDisplay.style.display = 'none';

    this.buzzerBtnA.classList.add('hidden');
    this.buzzerBtnB.classList.add('hidden');
    if (this.workspaceOverlay) this.workspaceOverlay.classList.add('hidden');
    if (this.battleStatusBar) this.battleStatusBar.classList.add('hidden');

    if (this.conveyorTugWar) this.conveyorTugWar.classList.remove('hidden');

    // 設定對手名稱
    const diffNames = { easy: "見習狐狸學徒", normal: "熟練狐狸師傅", hard: "傳奇狡猾主廚" };
    if (this.aiOpponentName) this.aiOpponentName.textContent = diffNames[GameState.aiDifficulty] || "狡猾狐狸店長";

    this.updateConveyorUI();
    this.updateStatusUI();
    this.showScreen(this.playScreen);
    this.loadQuestion();

    SpeechManager.speak(`甜點輸送帶大拔河開始！對手是${this.aiOpponentName ? this.aiOpponentName.textContent : '狡猾狐狸店長'}，快把彩虹聖代拉進你的店裡吧！`);
  },

  updateConveyorUI() {
    if (!this.conveyorSundae) return;

    // 刻度範圍 -5 (學生端 10%) ~ 0 (正中央 50%) ~ +5 (狐狸端 90%)
    // 每格 8%
    const centerPct = 50;
    const stepPct = 8;
    const targetLeft = centerPct + (GameState.tugPosition * stepPct);
    this.conveyorSundae.style.left = `${Math.max(10, Math.min(90, targetLeft))}%`;

    if (this.playerTugScore) {
      const pDiff = -GameState.tugPosition;
      this.playerTugScore.textContent = pDiff > 0 ? `領先 +${pDiff} 格` : pDiff < 0 ? `落後 ${pDiff} 格` : `平手 0 格`;
      this.playerTugScore.style.color = pDiff > 0 ? '#2E7D32' : pDiff < 0 ? '#d32f2f' : '#f57c00';
    }

    if (this.tugStatusText) {
      if (GameState.tugPosition <= -3) {
        this.tugStatusText.innerHTML = '🔥 <strong>優勢巨大！</strong> 就差一點點把聖代拉進店裡了！';
      } else if (GameState.tugPosition >= 3) {
        this.tugStatusText.innerHTML = '⚠️ <strong>危險！</strong> 聖代快被狐狸偷走啦，快專注答題！';
      } else if (GameState.tugPosition === 0) {
        this.tugStatusText.innerHTML = '⚖️ <strong>勢均力敵！</strong> 聖代在中央，快搶先答對！';
      } else if (GameState.tugPosition < 0) {
        this.tugStatusText.innerHTML = `🌟 <strong>領先 ${-GameState.tugPosition} 格！</strong> 保持氣勢繼續推進！`;
      } else {
        this.tugStatusText.innerHTML = `💦 <strong>落後 ${GameState.tugPosition} 格！</strong> 加油，一題就能扳回局勢！`;
      }
    }
  },

  clearAiThinkingTimer() {
    if (GameState.aiThinkingTimer) {
      clearInterval(GameState.aiThinkingTimer);
      GameState.aiThinkingTimer = null;
    }
    if (this.aiFoxAvatar) {
      this.aiFoxAvatar.classList.remove('fox-sweat', 'fox-fail');
    }
    if (this.aiTimerFill) {
      this.aiTimerFill.style.width = '0%';
    }
  },

  pauseAiThinkingTimer() {
    GameState.aiTimerPaused = true;
    if (this.aiThinkingState) {
      this.aiThinkingState.textContent = '⏸️ 思考暫停中';
      this.aiThinkingState.style.background = '#e0e0e0';
      this.aiThinkingState.style.color = '#616161';
    }
  },

  resumeAiThinkingTimer() {
    GameState.aiTimerPaused = false;
    if (this.aiThinkingState) {
      this.aiThinkingState.textContent = '🦊 計算中...';
      this.aiThinkingState.style.background = '#fff3e0';
      this.aiThinkingState.style.color = '#e65100';
    }
  },

  startAiThinkingTimer() {
    this.clearAiThinkingTimer();
    GameState.aiTimerPaused = false;

    // 依難度設定思考秒數
    let durationSec = 9.0;
    if (GameState.aiDifficulty === 'easy') {
      durationSec = 12.0 + Math.random() * 3.0; // 12~15s
      // 放水機制：若學生落後達 2 格以上，狐狸放慢 +4 秒
      if (GameState.tugPosition >= 2) {
        durationSec += 4.0;
      }
    } else if (GameState.aiDifficulty === 'hard') {
      durationSec = 4.5 + Math.random() * 2.0; // 4.5~6.5s
    } else {
      durationSec = 8.0 + Math.random() * 2.0; // 8~10s
    }

    GameState.aiThinkingTotal = durationSec;
    GameState.aiThinkingElapsed = 0;

    const totalMs = durationSec * 1000;
    const intervalMs = 100;

    if (this.aiThinkingState) {
      this.aiThinkingState.textContent = '🦊 計算中...';
      this.aiThinkingState.style.background = '#fff3e0';
      this.aiThinkingState.style.color = '#e65100';
    }
    if (this.aiFoxAvatar) {
      this.aiFoxAvatar.classList.remove('fox-sweat', 'fox-fail');
    }

    GameState.aiThinkingTimer = setInterval(() => {
      // 若安全閥暫停，不累加時間
      if (GameState.aiTimerPaused) return;

      GameState.aiThinkingElapsed += intervalMs;
      const remainingSec = Math.max(0, (totalMs - GameState.aiThinkingElapsed) / 1000);
      const percent = Math.min(100, (GameState.aiThinkingElapsed / totalMs) * 100);

      if (this.aiTimerFill) {
        this.aiTimerFill.style.width = `${percent}%`;
      }

      // 剩餘 2 秒內，狐狸頭像抖動冒汗提醒學生
      if (remainingSec <= 2.0 && remainingSec > 0) {
        if (this.aiFoxAvatar) this.aiFoxAvatar.classList.add('fox-sweat');
        if (this.aiThinkingState) {
          this.aiThinkingState.textContent = '💦 快算出來了！';
          this.aiThinkingState.style.background = '#ffebee';
          this.aiThinkingState.style.color = '#c62828';
        }
      }

      if (GameState.aiThinkingElapsed >= totalMs) {
        this.clearAiThinkingTimer();
        this.onAiThinkingComplete();
      }
    }, intervalMs);
  },

  onAiThinkingComplete() {
    // 計算 AI 正確率
    let successRate = 0.90;
    if (GameState.aiDifficulty === 'easy') successRate = 0.75;
    else if (GameState.aiDifficulty === 'hard') successRate = 1.0;

    const isSuccess = Math.random() < successRate;

    if (isSuccess) {
      this.handleAiAnswerCorrect();
    } else {
      this.handleAiAnswerWrong();
    }
  },

  handleAiAnswerCorrect() {
    GameState.tugPosition++;
    GameState.aiFoxPulls++;
    this.updateConveyorUI();

    AudioSynth.playFoxChuckle();
    AudioSynth.playConveyorMove();

    const msg = "🦊 狐狸店長解出題目了！聖代往狐狸端移動了 1 格！";
    this.showMessage(msg, "error");
    SpeechManager.speak("狐狸算出來囉，聖代被拉過去一格了！");

    // 檢查狐狸是否已拉到終點 (+5)
    if (GameState.tugPosition >= 5) {
      setTimeout(() => {
        this.finishAiChallenge('lose');
      }, 1200);
      return;
    }

    // 換下一題繼續拔河
    setTimeout(() => {
      this.nextAiQuestion();
    }, 1500);
  },

  handleAiAnswerWrong() {
    AudioSynth.playFoxFail();
    if (this.aiFoxAvatar) {
      this.aiFoxAvatar.classList.add('fox-fail');
    }
    const msg = "💥 哎呀！狐狸店長心急算錯烤焦了，聖代原地不動！";
    this.showMessage(msg, "info");
    SpeechManager.speak("哎呀，狐狸算錯囉！快趁現在答題！");

    // 狐狸重新開始思考本題
    setTimeout(() => {
      if (GameState.gameMode === 'ai-challenge' && !this.submitBtn.classList.contains('hidden')) {
        this.startAiThinkingTimer();
      }
    }, 1200);
  },

  nextAiQuestion() {
    GameState.aiRoundsPlayed++;
    if (GameState.aiRoundsPlayed >= GameState.aiQuestionQueue.length) {
      // 題數打滿結算
      if (GameState.tugPosition < 0) {
        this.finishAiChallenge('win');
      } else if (GameState.tugPosition > 0) {
        this.finishAiChallenge('lose');
      } else {
        this.finishAiChallenge('draw');
      }
    } else {
      this.loadQuestion();
    }
  },

  finishAiChallenge(result) {
    this.clearAiThinkingTimer();
    SpeechManager.stop();

    if (this.aiFinalPlayerPull) this.aiFinalPlayerPull.textContent = `${GameState.aiPlayerPulls} 次`;
    if (this.aiFinalFoxPull) this.aiFinalFoxPull.textContent = `${GameState.aiFoxPulls} 次`;

    if (result === 'win') {
      AudioSynth.playCertificate();
      if (this.aiResultCard) {
        this.aiResultCard.style.borderColor = '#2E7D32';
        this.aiResultCard.style.boxShadow = '0 0 35px rgba(46, 125, 50, 0.4)';
      }
      if (this.aiWinnerTitle) this.aiWinnerTitle.textContent = "🏆 拔河大獲全勝！";
      if (this.aiTrophyEmoji) this.aiTrophyEmoji.textContent = "🍨✨";
      if (this.aiWinnerText) {
        this.aiWinnerText.textContent = "恭喜你！成功將傳奇彩虹聖代拉進店內！";
        this.aiWinnerText.style.color = '#2E7D32';
      }
      if (this.aiDialogueText) {
        this.aiDialogueText.innerHTML = "🦊 狐狸店長：「甘拜下風！你的分數魔法太純熟了，看來隔壁街的甜點霸主非你莫屬！」";
      }
      SpeechManager.speak("太棒了！你戰勝了狡猾狐狸店長，成功奪得傳奇彩虹聖代！");
    } else if (result === 'lose') {
      AudioSynth.playWrong();
      if (this.aiResultCard) {
        this.aiResultCard.style.borderColor = '#e65100';
        this.aiResultCard.style.boxShadow = '0 0 35px rgba(230, 81, 0, 0.4)';
      }
      if (this.aiWinnerTitle) this.aiWinnerTitle.textContent = "😿 聖代被狐狸抱走了...";
      if (this.aiTrophyEmoji) this.aiTrophyEmoji.textContent = "🦊🍨";
      if (this.aiWinnerText) {
        this.aiWinnerText.textContent = "再接再厲！狐狸手速太快，把聖代拉走了！";
        this.aiWinnerText.style.color = '#e65100';
      }
      if (this.aiDialogueText) {
        this.aiDialogueText.innerHTML = "🦊 狐狸店長：「哈哈！這座彩虹聖代我就心懷感激地收下囉，下次準備好再來挑戰我吧！」";
      }
      SpeechManager.speak("哎呀，聖代被狐狸店長抱走囉。不要氣餒，再挑戰一次吧！");
    } else {
      AudioSynth.playBuzzerOpen();
      if (this.aiResultCard) {
        this.aiResultCard.style.borderColor = '#f57c00';
        this.aiResultCard.style.boxShadow = '0 0 35px rgba(245, 124, 0, 0.4)';
      }
      if (this.aiWinnerTitle) this.aiWinnerTitle.textContent = "🤝 勢均力敵，拔河平手！";
      if (this.aiTrophyEmoji) this.aiTrophyEmoji.textContent = "🍨🤝";
      if (this.aiWinnerText) {
        this.aiWinnerText.textContent = "雙方實力旗鼓相當，聖代剛好停留在中央！";
        this.aiWinnerText.style.color = '#f57c00';
      }
      if (this.aiDialogueText) {
        this.aiDialogueText.innerHTML = "🦊 狐狸店長：「居然能跟我打成平手，你的分數心算真不簡單，我們擇日再戰！」";
      }
      SpeechManager.speak("雙方打成平手！聖代剛好停留在中央，你的分數實力真不簡單！");
    }

    if (this.aiResultModal) {
      this.aiResultModal.classList.add('active');
    }
  },

  startBattleThinkingCountdown(durationSec = 3.0) {
    this.clearBattleThinkingTimer();
    this.clearBattleAnswerTimer();

    GameState.isThinkingPhase = true;
    GameState.buzzerLocked = true;
    this.workspaceArea.style.pointerEvents = 'none'; // 讀題期間鎖定選項操作

    if (this.battleStatusBar) {
      this.battleStatusBar.classList.remove('hidden', 'ready', 'winner', 'warning');
      if (this.battleStatusIcon) this.battleStatusIcon.textContent = '⏳';
      if (this.battleStatusText) {
        this.battleStatusText.innerHTML = `仔細看題思考中... <strong id="battle-status-timer">${durationSec.toFixed(1)}</strong> 秒後開放搶答！`;
      }
      if (this.battleStatusProgressFill) {
        this.battleStatusProgressFill.style.transition = 'none';
        this.battleStatusProgressFill.style.width = '0%';
        this.battleStatusProgressFill.style.background = 'linear-gradient(90deg, #FFB800, #FF7EBB)';
      }
    }

    this.updateBuzzerButtonsState('cooling');

    const totalMs = durationSec * 1000;
    const intervalMs = 100;
    let elapsedMs = 0;

    GameState.battleThinkingTimer = setInterval(() => {
      elapsedMs += intervalMs;
      const remainingSec = Math.max(0, (totalMs - elapsedMs) / 1000);
      const percent = Math.min(100, (elapsedMs / totalMs) * 100);

      const timerEl = document.getElementById('battle-status-timer');
      if (timerEl) {
        timerEl.textContent = remainingSec.toFixed(1);
      }
      if (this.battleStatusProgressFill) {
        this.battleStatusProgressFill.style.transition = 'width 0.1s linear';
        this.battleStatusProgressFill.style.width = `${percent}%`;
      }

      if (elapsedMs >= totalMs) {
        this.clearBattleThinkingTimer();
        this.onThinkingPhaseComplete();
      }
    }, intervalMs);
  },

  onThinkingPhaseComplete() {
    GameState.isThinkingPhase = false;
    GameState.buzzerLocked = false;

    AudioSynth.playBuzzerOpen();

    if (this.battleStatusBar) {
      this.battleStatusBar.className = 'battle-status-bar ready';
      if (this.battleStatusIcon) this.battleStatusIcon.textContent = '⚡';
      if (this.battleStatusText) {
        this.battleStatusText.innerHTML = '⚡ <strong>搶答開始！</strong>快按下搶答按鈕（貓咪 A / 狗狗 L）！';
      }
    }

    this.updateBuzzerButtonsState('ready');
    this.updateStatusUI();
  },

  startBattleAnswerCountdown(durationSec = 10) {
    this.clearBattleAnswerTimer();
    this.clearBattleThinkingTimer();

    const activePName = GameState.currentPlayer === 'A' ? '玩家 A (🐱 貓咪)' : '玩家 B (🐶 狗狗)';
    const turnTitle = GameState.isPassOnTurn ? '🔄【接力作答】' : '🎉【搶答作答】';

    if (this.battleStatusBar) {
      this.battleStatusBar.className = 'battle-status-bar winner';
      if (this.battleStatusIcon) this.battleStatusIcon.textContent = '⏱️';
      if (this.battleStatusText) {
        this.battleStatusText.innerHTML = `${turnTitle} <strong>${activePName} 請作答！</strong> 剩餘時間：<strong id="battle-answer-timer">${durationSec.toFixed(1)}</strong> 秒（可按 [1][2][3] 選項）`;
      }
      if (this.battleStatusProgressFill) {
        this.battleStatusProgressFill.style.transition = 'none';
        this.battleStatusProgressFill.style.width = '100%';
        this.battleStatusProgressFill.style.background = 'linear-gradient(90deg, #FFB800, #FF5252)';
      }
    }

    this.updateStatusUI();

    const totalMs = durationSec * 1000;
    const intervalMs = 100;
    let remainingMs = totalMs;

    GameState.battleAnswerTimer = setInterval(() => {
      remainingMs -= intervalMs;
      const remainingSec = Math.max(0, remainingMs / 1000);
      const percent = Math.max(0, (remainingMs / totalMs) * 100);

      const timerEl = document.getElementById('battle-answer-timer');
      if (timerEl) {
        timerEl.textContent = remainingSec.toFixed(1);
      }

      if (this.battleStatusProgressFill) {
        this.battleStatusProgressFill.style.transition = 'width 0.1s linear';
        this.battleStatusProgressFill.style.width = `${percent}%`;
      }

      // 剩餘 3 秒以內進入緊急警告震動狀態
      if (remainingSec <= 3.0 && remainingSec > 0) {
        if (this.battleStatusBar && !this.battleStatusBar.classList.contains('warning')) {
          this.battleStatusBar.classList.add('warning');
        }
      }

      if (remainingMs <= 0) {
        this.clearBattleAnswerTimer();
        this.handleAnswerTimeout();
      }
    }, intervalMs);
  },

  handleAnswerTimeout() {
    AudioSynth.playWrong();
    const q = GameState.getCurrentQuestion();
    const activePName = GameState.currentPlayer === 'A' ? '玩家 A (🐱)' : '玩家 B (🐶)';
    const opponentP = GameState.currentPlayer === 'A' ? 'B' : 'A';
    const opponentPName = opponentP === 'A' ? '玩家 A (🐱)' : '玩家 B (🐶)';

    if (!GameState.isPassOnTurn) {
      // 第一次作答超時 ➡️ 轉交接力
      AudioSynth.playPassOn();
      GameState.isPassOnTurn = true;
      GameState.currentPlayer = opponentP;
      this.updateStatusUI();
      this.renderWorkspace(q);
      this.workspaceArea.style.pointerEvents = 'auto';

      if (opponentP === 'A') {
        this.buzzerBtnA.classList.add('buzzer-active');
        this.buzzerBtnB.classList.remove('buzzer-active');
        this.buzzerBtnB.disabled = true;
        this.buzzerBtnA.disabled = true;
      } else {
        this.buzzerBtnB.classList.add('buzzer-active');
        this.buzzerBtnA.classList.remove('buzzer-active');
        this.buzzerBtnA.disabled = true;
        this.buzzerBtnB.disabled = true;
      }

      const passMsg = `⏰ 作答超時！${activePName} 未在 10 秒內回答，換 ${opponentPName} 接力作答！`;
      this.showMessage(passMsg, "error");
      SpeechManager.speak(passMsg);

      this.submitBtn.disabled = true;
      this.submitBtn.classList.remove('hidden');
      this.nextBtn.classList.add('hidden');

      // 接力玩家獲得全新 10 秒作答倒數！
      this.startBattleAnswerCountdown(10);
    } else {
      // 接力玩家也超時 ➡️ 雙輸，看迷思概念
      this.triggerMisconceptionVisuals(q);

      if (this.battleStatusBar) {
        this.battleStatusBar.className = 'battle-status-bar';
        if (this.battleStatusIcon) this.battleStatusIcon.textContent = '💡';
        if (this.battleStatusText) {
          this.battleStatusText.innerHTML = '💡 <strong>雙方皆作答超時！</strong> 請看解題說明。';
        }
      }

      this.buzzerBtnA.disabled = true;
      this.buzzerBtnB.disabled = true;

      this.showMessage(`⏰ 雙方皆作答超時！${q.misconceptionSpeech}`, "error");
      SpeechManager.speak(`雙方都超時囉。${q.misconceptionSpeech}`);

      this.submitBtn.classList.add('hidden');
      this.nextBtn.classList.remove('hidden');
      this.workspaceArea.style.pointerEvents = 'none';
    }
  },

  enhanceWorkspaceWithShortcuts() {
    if (GameState.gameMode !== 'battle' && GameState.gameMode !== 'ai-challenge') return;
    const optionBtns = this.workspaceArea.querySelectorAll('.l1-option-btn, .l4-op-btn');
    optionBtns.forEach((btn, idx) => {
      if (idx < 9 && !btn.querySelector('.key-badge')) {
        const badge = document.createElement('span');
        badge.className = 'key-badge';
        badge.textContent = `${idx + 1}`;
        btn.insertBefore(badge, btn.firstChild);
      }
    });
  },

  selectOptionByIndex(idx) {
    if (GameState.gameMode !== 'battle' && GameState.gameMode !== 'ai-challenge') return;
    if (GameState.gameMode === 'battle') {
      if (!GameState.currentPlayer || GameState.isThinkingPhase) return;
    }
    const optionBtns = Array.from(this.workspaceArea.querySelectorAll('.l1-option-btn, .l4-op-btn'));
    if (optionBtns[idx] && !optionBtns[idx].disabled && !optionBtns[idx].classList.contains('disabled')) {
      optionBtns[idx].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    }
  },

  updateBuzzerButtonsState(state) {
    if (!this.buzzerBtnA || !this.buzzerBtnB) return;

    if (state === 'cooling') {
      this.buzzerBtnA.disabled = false;
      this.buzzerBtnB.disabled = false;
      this.buzzerBtnA.className = 'buzzer-btn player-A cooling';
      this.buzzerBtnB.className = 'buzzer-btn player-B cooling';
      this.buzzerBtnA.innerHTML = `<span class="buzzer-emoji">🐱</span><span class="buzzer-text">讀題中<br><span class="key-hint">請先思考</span></span>`;
      this.buzzerBtnB.innerHTML = `<span class="buzzer-emoji">🐶</span><span class="buzzer-text">讀題中<br><span class="key-hint">請先思考</span></span>`;
    } else if (state === 'ready') {
      this.buzzerBtnA.disabled = false;
      this.buzzerBtnB.disabled = false;
      this.buzzerBtnA.className = 'buzzer-btn player-A ready-to-buzz';
      this.buzzerBtnB.className = 'buzzer-btn player-B ready-to-buzz';
      this.buzzerBtnA.innerHTML = `<span class="buzzer-emoji">🐱</span><span class="buzzer-text">⚡ 快搶答！<br><span class="key-hint">(按 A)</span></span>`;
      this.buzzerBtnB.innerHTML = `<span class="buzzer-emoji">🐶</span><span class="buzzer-text">⚡ 快搶答！<br><span class="key-hint">(按 L)</span></span>`;
    } else if (state === 'default') {
      this.buzzerBtnA.className = 'buzzer-btn player-A';
      this.buzzerBtnB.className = 'buzzer-btn player-B';
      this.buzzerBtnA.innerHTML = `<span class="buzzer-emoji">🐱</span><span class="buzzer-text">搶答<br><span class="key-hint">(按 A)</span></span>`;
      this.buzzerBtnB.innerHTML = `<span class="buzzer-emoji">🐶</span><span class="buzzer-text">搶答<br><span class="key-hint">(按 L)</span></span>`;
    }
  },

  loadQuestion() {
    this.clearBattleThinkingTimer();
    this.clearBattleAnswerTimer();
    const q = GameState.getCurrentQuestion();
    
    GameState.selectedOption = null;
    GameState.selectedItemsCount = 0;
    GameState.scaleSelectedOp = null;
    GameState.dragPlacements = {};
    GameState.lockedOptions = [];

    GameState.buzzerLocked = false;
    GameState.buzzerWinner = null;
    GameState.currentPlayer = null;
    GameState.isPassOnTurn = false;
    GameState.isThinkingPhase = false;

    this.submitBtn.disabled = true;
    this.submitBtn.classList.remove('hidden');
    this.nextBtn.classList.add('hidden');
    this.hideMessage();

    this.questionText.innerHTML = q.desc;
    this.renderWorkspace(q);

    if (GameState.gameMode === 'battle') {
      if (this.conveyorTugWar) this.conveyorTugWar.classList.add('hidden');
      if (this.workspaceOverlay) this.workspaceOverlay.classList.add('hidden');
      this.buzzerBtnA.classList.remove('hidden');
      this.buzzerBtnB.classList.remove('hidden');
      this.startBattleThinkingCountdown(3.0);
    } else if (GameState.gameMode === 'ai-challenge') {
      if (this.battleStatusBar) this.battleStatusBar.classList.add('hidden');
      if (this.conveyorTugWar) this.conveyorTugWar.classList.remove('hidden');
      this.workspaceArea.style.pointerEvents = 'auto';
      this.buzzerBtnA.classList.add('hidden');
      this.buzzerBtnB.classList.add('hidden');
      if (this.workspaceOverlay) this.workspaceOverlay.classList.add('hidden');
      this.updateConveyorUI();
      this.startAiThinkingTimer();
    } else {
      if (this.conveyorTugWar) this.conveyorTugWar.classList.add('hidden');
      if (this.battleStatusBar) this.battleStatusBar.classList.add('hidden');
      this.workspaceArea.style.pointerEvents = 'auto';
      this.buzzerBtnA.classList.add('hidden');
      this.buzzerBtnB.classList.add('hidden');
    }

    if (GameState.autoSpeech) {
      setTimeout(() => {
        this.speakCurrentQuestion();
      }, 500);
    }

    this.updateStatusUI();
  },

  speakCurrentQuestion() {
    const q = GameState.getCurrentQuestion();
    SpeechManager.speak(q.speechDesc || q.desc);
  },

  hideMessage() {
    this.messageBanner.classList.add('hidden');
    this.messageBanner.className = 'message-banner hidden';
  },

  showMessage(text, type = 'info') {
    this.messageBanner.className = `message-banner ${type}`;
    this.messageIcon.textContent = type === 'success' ? '🎉' : type === 'error' ? '💡' : '💡';
    this.messageText.innerHTML = text;
    this.messageBanner.classList.remove('hidden');
  },

  // ==========================================
  // 6. 搶答控制事件處理 ( BZZZ! )
  // ==========================================
  handleBuzzerPress(player) {
    if (GameState.gameMode !== 'battle') return;
    if (GameState.buzzerLocked && !GameState.isThinkingPhase) return;
    if (GameState.isPassOnTurn) return;

    // 若處於讀題思考倒數期，按下按鈕提示「先讀題思考喔！」
    if (GameState.isThinkingPhase) {
      AudioSynth.playSoftClick();
      const btn = player === 'A' ? this.buzzerBtnA : this.buzzerBtnB;
      if (btn) {
        btn.classList.add('buzzer-shake');
        setTimeout(() => btn.classList.remove('buzzer-shake'), 400);
      }
      this.showMessage("👀 請先讀題思考喔！倒數結束後才能搶答！", "info");
      return;
    }

    AudioSynth.playBuzzerSuccess();
    
    GameState.buzzerLocked = true;
    GameState.buzzerWinner = player;
    GameState.currentPlayer = player;

    // 解鎖工作區操作權限
    this.workspaceArea.style.pointerEvents = 'auto';

    this.buzzerBtnA.classList.remove('ready-to-buzz');
    this.buzzerBtnB.classList.remove('ready-to-buzz');

    if (player === 'A') {
      this.buzzerBtnA.classList.add('buzzer-active');
      this.buzzerBtnA.innerHTML = `<span class="buzzer-emoji">🐱</span><span class="buzzer-text">作答中！<br><span class="key-hint">請回答</span></span>`;
      this.buzzerBtnB.disabled = true;
    } else {
      this.buzzerBtnB.classList.add('buzzer-active');
      this.buzzerBtnB.innerHTML = `<span class="buzzer-emoji">🐶</span><span class="buzzer-text">作答中！<br><span class="key-hint">請回答</span></span>`;
      this.buzzerBtnA.disabled = true;
    }

    this.updateStatusUI();

    // 啟動作答 10 秒倒數計時！
    this.startBattleAnswerCountdown(10);

    const announceMsg = player === 'A' ? '玩家 A 搶答成功！請作答。' : '玩家 B 搶答成功！請作答。';
    this.showMessage(`⚡ ${announceMsg}`, "info");
    SpeechManager.speak(announceMsg);
  },

  // ==========================================
  // 7. 互動工作區繪製引擎
  // ==========================================
  renderWorkspace(q) {
    this.workspaceArea.innerHTML = '';

    if (q.layout === 'split-unequal-pizza' || q.layout === 'split-unequal-pizza-4') {
      this.renderUnequalPizza();
    } else if (q.layout === 'equal-waffle-4') {
      this.renderEqualWaffle();
    } else if (q.layout === 'select-paper-options') {
      this.renderPaperOptions();
    } else if (q.layout === 'macaron-discrete-6') {
      this.renderMacarons6();
    } else if (q.layout === 'cupcake-discrete-12') {
      this.renderCupcakes12();
    } else if (q.layout === 'donut-discrete-6') {
      this.renderDonuts6();
    } else if (q.layout === 'swiss-roll-axis-10') {
      this.renderSwissRollAxis();
    } else if (q.layout === 'unit-fraction-sum' || q.layout === 'equals-one-concept') {
      this.renderStandardOptions(q);
    } else if (q.layout === 'scale-fraction-compare' || q.layout === 'scale-discrete-compare' || q.layout === 'scale-whole-compare') {
      this.renderPhysicsScale(q);
    } else if (q.layout === 'split-square-cake-diagonal') {
      this.renderSquareCakeUnequal();
    } else if (q.layout === 'chocolate-unequal') {
      this.renderChocolateUnequal();
    } else if (q.layout === 'equal-pizza-8') {
      this.renderEqualPizza8();
    } else if (q.layout === 'square-paper-3-4') {
      this.renderSquarePaper3_4();
    } else if (q.layout === 'select-paper-options-1-4') {
      this.renderPaperOptions1_4();
    } else if (q.layout === 'chocolate-discrete-8') {
      this.renderChocolates8();
    } else if (q.layout === 'jelly-discrete-10') {
      this.renderJellies10();
    } else if (q.layout === 'cookie-discrete-12') {
      this.renderCookies12();
    } else if (q.layout === 'ornament-discrete-9') {
      this.renderOrnaments9();
    } else if (q.layout === 'toy-cars-discrete') {
      this.renderToyCarsDiscrete();
    } else if (q.layout === 'pizza-equals-one') {
      this.renderPizzaEqualsOne();
    } else if (q.layout === 'cake-equals-one') {
      this.renderCakeEqualsOne();
    } else if (q.layout === 'ribbons-different-half') {
      this.renderRibbonsDifferentHalf();
    } else if (q.layout === 'chocolates-equals-one') {
      this.renderChocolatesEqualsOne();
    } else if (q.layout === 'ribbons-equals-one-9') {
      this.renderRibbonsEqualsOne9();
    } else if (q.layout === 'swissroll-equals-one-10') {
      this.renderSwissRollEqualsOne10();
    }

    if (GameState.gameMode === 'battle' || GameState.gameMode === 'ai-challenge') {
      this.enhanceWorkspaceWithShortcuts();
    }
  },

  renderUnequalPizza() {
    const q = GameState.getCurrentQuestion();
    const is4Pieces = (q.pieces === 4 || q.layout === 'split-unequal-pizza-4' || (q.desc && q.desc.includes('4 塊')));

    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.className = 'l1-visual-area';

    const canvas = document.createElement('canvas');
    canvas.className = 'l1-visual-canvas';
    canvas.width = 240;
    canvas.height = 240;
    visualArea.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const cx = 120, cy = 120, r = 100;

    if (is4Pieces) {
      // --- 4 塊不平分圓形巧克力披薩 ---
      // 餅皮底色與巧克力深色邊框
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f5cf9e';
      ctx.fill();
      ctx.strokeStyle = '#794017';
      ctx.lineWidth = 8;
      ctx.stroke();

      // 切成明顯大小不一的 4 塊：45°, 135°, 72°, 108°
      const angles = [0, Math.PI * 0.25, Math.PI * 1.0, Math.PI * 1.4];

      // 弟弟拿取的其中 1 塊（0 到 45度扇形），標示半透明粉紅陰影
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 4, angles[0], angles[1]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(214, 62, 138, 0.25)';
      ctx.fill();

      // 4 條切割線
      ctx.strokeStyle = '#5a2e12';
      ctx.lineWidth = 4;
      angles.forEach(a => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      });

      // 4 塊上各放 1 顆深色巧克力豆配飾
      const chocoDots = [
        { x: cx + Math.cos(Math.PI * 0.125) * 55, y: cy + Math.sin(Math.PI * 0.125) * 55 },
        { x: cx + Math.cos(Math.PI * 0.625) * 55, y: cy + Math.sin(Math.PI * 0.625) * 55 },
        { x: cx + Math.cos(Math.PI * 1.2) * 55, y: cy + Math.sin(Math.PI * 1.2) * 55 },
        { x: cx + Math.cos(Math.PI * 1.7) * 55, y: cy + Math.sin(Math.PI * 1.7) * 55 }
      ];
      chocoDots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#4a2612';
        ctx.fill();
        // 巧克力立體光澤小亮點
        ctx.beginPath();
        ctx.arc(d.x - 2.5, d.y - 2.5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#a87857';
        ctx.fill();
      });
    } else {
      // --- 3 塊不平分草莓派（原有邏輯）---
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f0c27b';
      ctx.fill();
      ctx.strokeStyle = '#b87333';
      ctx.lineWidth = 8;
      ctx.stroke();

      const angles = [0, Math.PI * 0.4, Math.PI * 0.95];
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 4;
      
      angles.forEach(a => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 4, angles[0], angles[1]);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = 'rgba(255, 66, 112, 0.2)';
      ctx.fill();

      ctx.fillStyle = '#ff4a70';
      const strawberries = [
        { x: cx + 40, y: cy + 30 },
        { x: cx - 40, y: cy + 40 },
        { x: cx - 20, y: cy - 50 }
      ];
      strawberries.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderEqualWaffle() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.className = 'l1-visual-area';

    const canvas = document.createElement('canvas');
    canvas.className = 'l1-visual-canvas';
    canvas.width = 240;
    canvas.height = 240;
    visualArea.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const cx = 120, cy = 120, r = 100;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#e5a65d';
    ctx.fill();
    ctx.strokeStyle = '#c47d2b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.stroke();

    const q = GameState.getCurrentQuestion();
    const num = q.num !== undefined ? q.num : 3;
    const den = q.den !== undefined ? q.den : 4;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 3, 0, (num / den) * Math.PI * 2);
    ctx.lineTo(cx, cy);
    ctx.fillStyle = 'rgba(214, 62, 138, 0.4)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.lineWidth = 2;
    for (let i = -r; i <= r; i += 20) {
      if (i === 0) continue;
      ctx.beginPath();
      const w = Math.sqrt(r * r - i * i);
      ctx.moveTo(cx - w, cy + i); ctx.lineTo(cx + w, cy + i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + i, cy - w); ctx.lineTo(cx + i, cy + w);
      ctx.stroke();
    }

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    // q is already declared
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderPaperOptions() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'column';
    visualArea.style.alignItems = 'center';
    visualArea.style.gap = '15px';

    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    const canvasA = document.createElement('canvas');
    canvasA.width = 120; canvasA.height = 120;
    canvasA.style.border = '2px solid #3b2861';
    canvasA.style.background = '#2a1e45';
    const ctxA = canvasA.getContext('2d');
    ctxA.fillStyle = '#ff7ebb';
    ctxA.fillRect(0, 0, 60, 120);
    ctxA.strokeStyle = '#ffffff';
    ctxA.lineWidth = 2;
    ctxA.beginPath();
    ctxA.moveTo(60, 0); ctxA.lineTo(60, 120);
    ctxA.moveTo(0, 60); ctxA.lineTo(120, 60);
    ctxA.stroke();
    const lblA = document.createElement('div');
    lblA.style.marginTop = '8px';
    lblA.textContent = '圖 A';
    divA.appendChild(canvasA);
    divA.appendChild(lblA);

    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    const canvasB = document.createElement('canvas');
    canvasB.width = 120; canvasB.height = 120;
    canvasB.style.border = '2px solid #3b2861';
    canvasB.style.background = '#2a1e45';
    const ctxB = canvasB.getContext('2d');
    ctxB.fillStyle = '#ff7ebb';
    ctxB.fillRect(0, 0, 30, 120);
    ctxB.strokeStyle = '#ffffff';
    ctxB.lineWidth = 2;
    ctxB.beginPath();
    ctxB.moveTo(15, 0); ctxB.lineTo(15, 120);
    ctxB.moveTo(30, 0); ctxB.lineTo(30, 120);
    ctxB.moveTo(75, 0); ctxB.lineTo(75, 120);
    ctxB.stroke();
    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.textContent = '圖 B';
    divB.appendChild(canvasB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderMacarons6() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(3, 1fr)';
    box.style.width = '320px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    const macarons = ['🍪', '🍪', '🍪', '🍪', '🍪', '🍪'];
    macarons.forEach((m, idx) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      el.textContent = m;
      
      itemWrapper.appendChild(el);
      box.appendChild(itemWrapper);
    });

    const bottomArea = document.createElement('div');
    bottomArea.className = 'l1-options-area';
    bottomArea.style.flexDirection = 'row';
    bottomArea.style.marginTop = '20px';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      bottomArea.appendChild(btn);
    });

    container.appendChild(box);
    container.appendChild(bottomArea);
    this.workspaceArea.appendChild(container);
  },

  renderSquareCakeUnequal() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.className = 'l1-visual-area';

    const canvas = document.createElement('canvas');
    canvas.className = 'l1-visual-canvas';
    canvas.width = 240;
    canvas.height = 240;
    visualArea.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const cx = 120, cy = 120;
    const size = 160;
    const left = cx - size/2, top = cy - size/2;

    ctx.fillStyle = '#ffb3d1';
    ctx.fillRect(left, top, size, size);
    ctx.strokeStyle = '#d63e8a';
    ctx.lineWidth = 6;
    ctx.strokeRect(left, top, size, size);

    ctx.fillStyle = '#ff4a70';
    const decorations = [
      {x: left + 20, y: top + 20},
      {x: left + size - 20, y: top + 20},
      {x: left + 20, y: top + size - 20},
      {x: left + size - 20, y: top + size - 20},
      {x: cx - 30, y: cy - 20},
      {x: cx + 30, y: cy + 20}
    ];
    decorations.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(left, top + 40);
    ctx.lineTo(left + size, top + size - 30);
    ctx.stroke();

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderChocolateUnequal() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.className = 'l1-visual-area';

    const canvas = document.createElement('canvas');
    canvas.className = 'l1-visual-canvas';
    canvas.width = 240;
    canvas.height = 240;
    visualArea.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const left = 30, top = 30, size = 180;

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(left, top, size, size);
    ctx.strokeStyle = '#3d2514';
    ctx.lineWidth = 6;
    ctx.strokeRect(left, top, size, size);

    ctx.fillStyle = '#6f4e37';
    ctx.fillRect(35, 35, 50, 80);
    ctx.fillRect(35, 125, 50, 80);
    ctx.fillRect(95, 35, 110, 80);
    ctx.fillRect(95, 125, 110, 80);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(90, 30); ctx.lineTo(90, 210);
    ctx.moveTo(30, 120); ctx.lineTo(210, 120);
    ctx.stroke();

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderEqualPizza8() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.className = 'l1-visual-area';

    const canvas = document.createElement('canvas');
    canvas.className = 'l1-visual-canvas';
    canvas.width = 240;
    canvas.height = 240;
    visualArea.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const cx = 120, cy = 120, r = 100;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f0c27b';
    ctx.fill();
    ctx.strokeStyle = '#b87333';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb84d';
    ctx.fill();

    const q = GameState.getCurrentQuestion();
    const num = q.num !== undefined ? q.num : 3;
    const den = q.den !== undefined ? q.den : 8;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 4, 0, (num / den) * Math.PI * 2);
    ctx.lineTo(cx, cy);
    ctx.fillStyle = 'rgba(255, 66, 112, 0.4)';
    ctx.fill();

    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      let angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    ctx.fillStyle = '#ff4a70';
    for (let i = 0; i < 8; i++) {
      let midAngle = ((i + 0.5) * Math.PI) / 4;
      let sx = cx + Math.cos(midAngle) * (r * 0.6);
      let sy = cy + Math.sin(midAngle) * (r * 0.6);
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    // q is already declared
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderSquarePaper3_4() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.className = 'l1-visual-area';

    const canvas = document.createElement('canvas');
    canvas.className = 'l1-visual-canvas';
    canvas.width = 240;
    canvas.height = 240;
    visualArea.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const left = 40, top = 40, size = 160;

    ctx.fillStyle = '#2a1e45';
    ctx.fillRect(left, top, size, size);

    ctx.fillStyle = '#ff7ebb';
    ctx.fillRect(left, top, 80, 80);
    ctx.fillRect(left + 80, top, 80, 80);
    ctx.fillRect(left, top + 80, 80, 80);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left + 80, top); ctx.lineTo(left + 80, top + size);
    ctx.moveTo(left, top + 80); ctx.lineTo(left + size, top + 80);
    ctx.stroke();

    ctx.strokeStyle = '#3b2861';
    ctx.lineWidth = 4;
    ctx.strokeRect(left, top, size, size);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderPaperOptions1_4() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'column';
    visualArea.style.alignItems = 'center';
    visualArea.style.gap = '15px';

    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    const canvasA = document.createElement('canvas');
    canvasA.width = 120; canvasA.height = 120;
    canvasA.style.border = '2px solid #3b2861';
    canvasA.style.background = '#2a1e45';
    const ctxA = canvasA.getContext('2d');
    
    ctxA.fillStyle = '#ff7ebb';
    ctxA.fillRect(0, 0, 30, 120);
    
    ctxA.strokeStyle = '#ffffff';
    ctxA.lineWidth = 2;
    ctxA.beginPath();
    ctxA.moveTo(30, 0); ctxA.lineTo(30, 120);
    ctxA.moveTo(60, 0); ctxA.lineTo(60, 120);
    ctxA.moveTo(90, 0); ctxA.lineTo(90, 120);
    ctxA.stroke();
    
    const lblA = document.createElement('div');
    lblA.style.marginTop = '8px';
    lblA.textContent = '圖 A';
    divA.appendChild(canvasA);
    divA.appendChild(lblA);

    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    const canvasB = document.createElement('canvas');
    canvasB.width = 120; canvasB.height = 120;
    canvasB.style.border = '2px solid #3b2861';
    canvasB.style.background = '#2a1e45';
    const ctxB = canvasB.getContext('2d');
    
    ctxB.fillStyle = '#ff7ebb';
    ctxB.fillRect(0, 0, 15, 120);
    
    ctxB.strokeStyle = '#ffffff';
    ctxB.lineWidth = 2;
    ctxB.beginPath();
    ctxB.moveTo(15, 0); ctxB.lineTo(15, 120);
    ctxB.moveTo(30, 0); ctxB.lineTo(30, 120);
    ctxB.moveTo(75, 0); ctxB.lineTo(75, 120);
    ctxB.stroke();
    
    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.textContent = '圖 B';
    divB.appendChild(canvasB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderChocolates8() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(4, 1fr)';
    box.style.width = '360px';
    box.style.padding = '22px 18px 18px 18px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    const chocolates = Array(8).fill('🍫');
    chocolates.forEach((c) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      el.textContent = c;
      el.style.fontSize = '2.2rem';
      
      itemWrapper.appendChild(el);
      box.appendChild(itemWrapper);
    });

    const bottomArea = document.createElement('div');
    bottomArea.className = 'l1-options-area';
    bottomArea.style.flexDirection = 'row';
    bottomArea.style.marginTop = '20px';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      bottomArea.appendChild(btn);
    });

    container.appendChild(box);
    container.appendChild(bottomArea);
    this.workspaceArea.appendChild(container);
  },

  renderJellies10() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(5, 1fr)';
    box.style.width = '440px';
    box.style.padding = '22px 18px 18px 18px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    const jellies = Array(10).fill('🍮');
    jellies.forEach((j) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      el.textContent = j;
      el.style.fontSize = '2.2rem';
      
      itemWrapper.appendChild(el);
      box.appendChild(itemWrapper);
    });

    const bottomArea = document.createElement('div');
    bottomArea.className = 'l1-options-area';
    bottomArea.style.flexDirection = 'row';
    bottomArea.style.marginTop = '20px';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      bottomArea.appendChild(btn);
    });

    container.appendChild(box);
    container.appendChild(bottomArea);
    this.workspaceArea.appendChild(container);
  },

  renderCookies12() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(4, 1fr)';
    box.style.width = '360px';
    box.style.padding = '22px 18px 18px 18px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    const cookies = Array(12).fill('🍪');
    cookies.forEach((c) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      el.textContent = c;
      el.style.fontSize = '2.2rem';
      
      itemWrapper.appendChild(el);
      box.appendChild(itemWrapper);
    });

    const bottomArea = document.createElement('div');
    bottomArea.className = 'l1-options-area';
    bottomArea.style.flexDirection = 'row';
    bottomArea.style.marginTop = '20px';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      bottomArea.appendChild(btn);
    });

    container.appendChild(box);
    container.appendChild(bottomArea);
    this.workspaceArea.appendChild(container);
  },

  renderOrnaments9() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(3, 1fr)';
    box.style.width = '300px';
    box.style.padding = '22px 18px 18px 18px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    for (let i = 0; i < 9; i++) {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      el.textContent = '🎐';
      el.style.fontSize = '2.2rem';
      
      if (i < 3) {
        // Matcha Green
        el.style.filter = 'hue-rotate(280deg) saturate(1.5)';
      } else {
        // Pink/Red
        el.style.filter = 'hue-rotate(110deg) saturate(1.5)';
      }
      
      itemWrapper.appendChild(el);
      box.appendChild(itemWrapper);
    }

    const bottomArea = document.createElement('div');
    bottomArea.className = 'l1-options-area';
    bottomArea.style.flexDirection = 'row';
    bottomArea.style.marginTop = '20px';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      bottomArea.appendChild(btn);
    });

    container.appendChild(box);
    container.appendChild(bottomArea);
    this.workspaceArea.appendChild(container);
  },

  renderToyCarsDiscrete() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(3, 1fr)';
    box.style.width = '300px';
    box.style.padding = '22px 18px 18px 18px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    for (let i = 0; i < 6; i++) {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      
      if (i < 2) {
        el.textContent = '🚒';
        el.style.fontSize = '3.0rem';
      } else {
        el.textContent = '🚗';
        el.style.filter = 'hue-rotate(100deg) saturate(2)';
        el.style.fontSize = '1.8rem';
      }
      
      itemWrapper.appendChild(el);
      box.appendChild(itemWrapper);
    }

    const bottomArea = document.createElement('div');
    bottomArea.className = 'l1-options-area';
    bottomArea.style.flexDirection = 'row';
    bottomArea.style.marginTop = '20px';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      bottomArea.appendChild(btn);
    });

    container.appendChild(box);
    container.appendChild(bottomArea);
    this.workspaceArea.appendChild(container);
  },

  renderPizzaEqualsOne() {
    const container = document.createElement('div');
    container.className = 'level1-container';
    container.style.maxWidth = '100%';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';
    layout.style.alignItems = 'center';
    layout.style.gap = '24px';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'row';
    visualArea.style.alignItems = 'flex-end';
    visualArea.style.justifyContent = 'center';
    visualArea.style.gap = '20px';
    visualArea.style.padding = '8px';
    visualArea.style.flexWrap = 'wrap';

    // 披薩繪製輔助函數
    const drawPizzaWithSlice = (canvas, cx, cy, r, isLarge) => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. 金黃烘焙厚餅皮外圈
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f5cf9e';
      ctx.fill();
      ctx.strokeStyle = '#9c5123';
      ctx.lineWidth = isLarge ? 8 : 5.5;
      ctx.stroke();

      // 2. 底層起司 (完整圓)
      ctx.beginPath();
      ctx.arc(cx, cy, r - (isLarge ? 4 : 3), 0, Math.PI * 2);
      ctx.fillStyle = '#fff4bd';
      ctx.fill();

      // 3. 吃掉的 1/4 個扇形 (0 到 90 度扇形)：鮮明濃郁橘紅起司番茄色
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - (isLarge ? 4 : 3), 0, Math.PI * 0.5);
      ctx.closePath();
      ctx.fillStyle = '#ff9f43';
      ctx.fill();

      // 4. 香腸配料 (Pepperoni)
      const pepR = isLarge ? 8 : 5;
      const pepDots = isLarge
        ? [
            { ang: 0.16 * Math.PI, dist: r * 0.45 },
            { ang: 0.36 * Math.PI, dist: r * 0.52 },
            { ang: 0.22 * Math.PI, dist: r * 0.72 }
          ]
        : [
            { ang: 0.25 * Math.PI, dist: r * 0.52 }
          ];

      pepDots.forEach(p => {
        const px = cx + Math.cos(p.ang) * p.dist;
        const py = cy + Math.sin(p.ang) * p.dist;
        ctx.beginPath();
        ctx.arc(px, py, pepR, 0, Math.PI * 2);
        ctx.fillStyle = '#d63031';
        ctx.fill();
        ctx.strokeStyle = '#991515';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 5. 四等分均勻切割線
      ctx.strokeStyle = '#5a2d0c';
      ctx.lineWidth = isLarge ? 2.5 : 2;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // 6. 吃掉的 1/4 塊外框加上警示虛線與吃掉標記
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 0.5);
      ctx.closePath();
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // --- (A) 小華的小披薩 ---
    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    divA.style.background = 'rgba(255, 248, 235, 0.95)';
    divA.style.border = '2px solid #ffb74d';
    divA.style.borderRadius = '14px';
    divA.style.padding = '8px 12px';
    divA.style.boxShadow = '0 3px 8px rgba(255, 183, 77, 0.2)';

    const tagA = document.createElement('div');
    tagA.innerHTML = '<span style="display:inline-block; background:#ffe0b2; color:#bf360c; font-weight:800; font-size:0.95rem; padding:2px 10px; border-radius:12px; margin-bottom:6px;">🍕 小華的小披薩</span>';

    const canvasA = document.createElement('canvas');
    canvasA.width = 130;
    canvasA.height = 130;
    drawPizzaWithSlice(canvasA, 65, 65, 46, false);

    const lblA = document.createElement('div');
    lblA.style.marginTop = '6px';
    lblA.style.fontWeight = '700';
    lblA.style.fontSize = '1.05rem';
    lblA.style.color = '#5d4037';
    lblA.innerHTML = '吃了 <span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個';

    divA.appendChild(tagA);
    divA.appendChild(canvasA);
    divA.appendChild(lblA);

    // --- (B) 大明的大披薩 ---
    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    divB.style.background = 'rgba(255, 240, 245, 0.95)';
    divB.style.border = '2.5px solid #ff7ebb';
    divB.style.borderRadius = '16px';
    divB.style.padding = '10px 14px';
    divB.style.boxShadow = '0 4px 12px rgba(255, 126, 187, 0.25)';

    const tagB = document.createElement('div');
    tagB.innerHTML = '<span style="display:inline-block; background:#fce4ec; color:#880e4f; font-weight:800; font-size:1.05rem; padding:3px 12px; border-radius:14px; margin-bottom:6px;">🍕 大明的大披薩</span>';

    const canvasB = document.createElement('canvas');
    canvasB.width = 180;
    canvasB.height = 180;
    drawPizzaWithSlice(canvasB, 90, 90, 76, true);

    const lblB = document.createElement('div');
    lblB.style.marginTop = '6px';
    lblB.style.fontWeight = '800';
    lblB.style.fontSize = '1.15rem';
    lblB.style.color = '#5d4037';
    lblB.innerHTML = '吃了 <span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個';

    divB.appendChild(tagB);
    divB.appendChild(canvasB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderCakeEqualsOne() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'column';
    visualArea.style.alignItems = 'center';
    visualArea.style.gap = '15px';

    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    const canvasA = document.createElement('canvas');
    canvasA.width = 110; canvasA.height = 110;
    canvasA.style.border = '2px dashed var(--panel-border)';
    canvasA.style.borderRadius = '8px';
    canvasA.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxA = canvasA.getContext('2d');
    
    ctxA.fillStyle = '#ffb3d1';
    ctxA.fillRect(20, 20, 70, 70);
    ctxA.strokeStyle = '#d63e8a';
    ctxA.lineWidth = 4;
    ctxA.strokeRect(20, 20, 70, 70);

    const lblA = document.createElement('div');
    lblA.style.marginTop = '8px';
    lblA.style.fontWeight = '700';
    lblA.textContent = '1 個';
    divA.appendChild(canvasA);
    divA.appendChild(lblA);

    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    const canvasB = document.createElement('canvas');
    canvasB.width = 110; canvasB.height = 110;
    canvasB.style.border = '2px dashed var(--panel-border)';
    canvasB.style.borderRadius = '8px';
    canvasB.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxB = canvasB.getContext('2d');
    
    ctxB.fillStyle = '#ffb3d1';
    ctxB.fillRect(20, 20, 70, 70);
    ctxB.strokeStyle = '#d63e8a';
    ctxB.lineWidth = 4;
    ctxB.strokeRect(20, 20, 70, 70);

    ctxB.strokeStyle = '#ffffff';
    ctxB.lineWidth = 1.5;
    for (let i = 1; i < 10; i++) {
      let x = 20 + i * 7;
      ctxB.beginPath();
      ctxB.moveTo(x, 20); ctxB.lineTo(x, 90);
      ctxB.stroke();
    }

    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.style.fontWeight = '700';
    lblB.innerHTML = '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">10</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 個';
    divB.appendChild(canvasB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderRibbonsDifferentHalf() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'column';
    visualArea.style.alignItems = 'center';
    visualArea.style.gap = '10px';

    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    const canvasA = document.createElement('canvas');
    canvasA.width = 120; canvasA.height = 70;
    canvasA.style.border = '2px dashed var(--panel-border)';
    canvasA.style.borderRadius = '8px';
    canvasA.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxA = canvasA.getContext('2d');
    
    ctxA.fillStyle = '#2e283b';
    ctxA.fillRect(10, 25, 100, 20);
    ctxA.fillStyle = '#ff7ebb';
    ctxA.fillRect(10, 25, 50, 20);
    ctxA.strokeStyle = '#5a468f';
    ctxA.lineWidth = 2;
    ctxA.strokeRect(10, 25, 100, 20);
    ctxA.beginPath();
    ctxA.moveTo(60, 25); ctxA.lineTo(60, 45);
    ctxA.stroke();

    const lblA = document.createElement('div');
    lblA.style.marginTop = '8px';
    lblA.style.fontSize = '0.9rem';
    lblA.style.fontWeight = '700';
    lblA.innerHTML = '甲彩帶的 <span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">2</span></span></span>';
    divA.appendChild(canvasA);
    divA.appendChild(lblA);

    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    const canvasB = document.createElement('canvas');
    canvasB.width = 120; canvasB.height = 70;
    canvasB.style.border = '2px dashed var(--panel-border)';
    canvasB.style.borderRadius = '8px';
    canvasB.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxB = canvasB.getContext('2d');
    
    ctxB.fillStyle = '#2e283b';
    ctxB.fillRect(30, 25, 60, 20);
    ctxB.fillStyle = '#ff7ebb';
    ctxB.fillRect(30, 25, 30, 20);
    ctxB.strokeStyle = '#5a468f';
    ctxB.lineWidth = 2;
    ctxB.strokeRect(30, 25, 60, 20);
    ctxB.beginPath();
    ctxB.moveTo(60, 25); ctxB.lineTo(60, 45);
    ctxB.stroke();

    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.style.fontSize = '0.9rem';
    lblB.style.fontWeight = '700';
    lblB.innerHTML = '乙彩帶的 <span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">2</span></span></span>';
    divB.appendChild(canvasB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderChocolatesEqualsOne() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'column';
    visualArea.style.alignItems = 'center';
    visualArea.style.gap = '15px';

    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    
    const boxA = document.createElement('div');
    boxA.className = 'l2-box';
    boxA.style.gridTemplateColumns = 'repeat(4, 1fr)';
    boxA.style.width = '120px';
    boxA.style.padding = '8px';
    boxA.style.gap = '4px';
    boxA.style.height = '90px';

    for (let i = 0; i < 12; i++) {
      const el = document.createElement('div');
      el.textContent = '🍫';
      el.style.fontSize = '1.1rem';
      boxA.appendChild(el);
    }
    const lblA = document.createElement('div');
    lblA.style.marginTop = '8px';
    lblA.style.fontWeight = '700';
    lblA.textContent = '1 盒';
    divA.appendChild(boxA);
    divA.appendChild(lblA);

    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    
    const boxB = document.createElement('div');
    boxB.className = 'l2-box';
    boxB.style.gridTemplateColumns = 'repeat(4, 1fr)';
    boxB.style.width = '120px';
    boxB.style.padding = '8px';
    boxB.style.gap = '4px';
    boxB.style.height = '90px';

    for (let i = 0; i < 12; i++) {
      const el = document.createElement('div');
      el.textContent = '🍫';
      el.style.fontSize = '1.1rem';
      boxB.appendChild(el);
    }
    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.style.fontWeight = '700';
    lblB.innerHTML = '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">12</span></span><span class="frac-row"><span class="frac-cell frac-den">12</span></span></span> 盒';
    divB.appendChild(boxB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderRibbonsEqualsOne9() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'column';
    visualArea.style.alignItems = 'center';
    visualArea.style.gap = '10px';

    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    const canvasA = document.createElement('canvas');
    canvasA.width = 120; canvasA.height = 70;
    canvasA.style.border = '2px dashed var(--panel-border)';
    canvasA.style.borderRadius = '8px';
    canvasA.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxA = canvasA.getContext('2d');
    
    ctxA.fillStyle = '#ffb800';
    ctxA.fillRect(10, 25, 100, 20);
    ctxA.strokeStyle = '#5a468f';
    ctxA.lineWidth = 2;
    ctxA.strokeRect(10, 25, 100, 20);

    const lblA = document.createElement('div');
    lblA.style.marginTop = '8px';
    lblA.style.fontWeight = '700';
    lblA.textContent = '1 公尺';
    divA.appendChild(canvasA);
    divA.appendChild(lblA);

    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    const canvasB = document.createElement('canvas');
    canvasB.width = 120; canvasB.height = 70;
    canvasB.style.border = '2px dashed var(--panel-border)';
    canvasB.style.borderRadius = '8px';
    canvasB.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxB = canvasB.getContext('2d');
    
    ctxB.fillStyle = '#ff7ebb';
    ctxB.fillRect(10, 25, 100, 20);
    ctxB.strokeStyle = '#5a468f';
    ctxB.lineWidth = 2;
    ctxB.strokeRect(10, 25, 100, 20);

    ctxB.strokeStyle = '#ffffff';
    ctxB.lineWidth = 1.5;
    for (let i = 1; i < 9; i++) {
      let x = 10 + i * (100 / 9);
      ctxB.beginPath();
      ctxB.moveTo(x, 25); ctxB.lineTo(x, 45);
      ctxB.stroke();
    }

    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.style.fontWeight = '700';
    lblB.innerHTML = '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">9</span></span><span class="frac-row"><span class="frac-cell frac-den">9</span></span></span> 公尺';
    divB.appendChild(canvasB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderSwissRollEqualsOne10() {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const layout = document.createElement('div');
    layout.className = 'l1-split-layout';

    const visualArea = document.createElement('div');
    visualArea.style.display = 'flex';
    visualArea.style.flexDirection = 'column';
    visualArea.style.alignItems = 'center';
    visualArea.style.gap = '10px';

    function drawRoll(ctx, x, y, w, h, fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#ffebad';
      ctx.beginPath();
      ctx.ellipse(x, y + h/2, 6, h/2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y + h/2, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    const divA = document.createElement('div');
    divA.style.textAlign = 'center';
    const canvasA = document.createElement('canvas');
    canvasA.width = 120; canvasA.height = 70;
    canvasA.style.border = '2px dashed var(--panel-border)';
    canvasA.style.borderRadius = '8px';
    canvasA.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxA = canvasA.getContext('2d');
    
    drawRoll(ctxA, 15, 25, 90, 20, '#ffb800');

    const lblA = document.createElement('div');
    lblA.style.marginTop = '8px';
    lblA.style.fontWeight = '700';
    lblA.textContent = '1 條';
    divA.appendChild(canvasA);
    divA.appendChild(lblA);

    const divB = document.createElement('div');
    divB.style.textAlign = 'center';
    const canvasB = document.createElement('canvas');
    canvasB.width = 120; canvasB.height = 70;
    canvasB.style.border = '2px dashed var(--panel-border)';
    canvasB.style.borderRadius = '8px';
    canvasB.style.background = 'rgba(18, 12, 31, 0.4)';
    const ctxB = canvasB.getContext('2d');
    
    drawRoll(ctxB, 15, 25, 90, 20, '#ff7ebb');

    ctxB.strokeStyle = '#8b4513';
    ctxB.lineWidth = 1.5;
    for (let i = 1; i < 10; i++) {
      let x = 15 + i * 9;
      ctxB.beginPath();
      ctxB.moveTo(x, 25); ctxB.lineTo(x, 45);
      ctxB.stroke();
    }

    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.style.fontWeight = '700';
    lblB.innerHTML = '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">10</span></span><span class="frac-row"><span class="frac-cell frac-den">10</span></span></span> 條';
    divB.appendChild(canvasB);
    divB.appendChild(lblB);

    visualArea.appendChild(divA);
    visualArea.appendChild(divB);

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    layout.appendChild(visualArea);
    layout.appendChild(optionsArea);
    container.appendChild(layout);
    this.workspaceArea.appendChild(container);
  },

  renderCupcakes12() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const q = GameState.getCurrentQuestion();
    const itemsCount = q.id === 'BT12' ? 10 : 12;
    const emoji = q.id === 'BT12' ? '🍬' : '🧁';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = itemsCount === 10 ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)';
    box.style.width = itemsCount === 10 ? '450px' : '390px';
    box.style.height = 'auto';
    box.style.padding = '24px 18px 18px 18px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    const items = Array(itemsCount).fill(emoji);
    items.forEach((itemEmoji, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'l2-item-wrapper';
      wrapper.dataset.index = idx;
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      el.textContent = itemEmoji;
      
      wrapper.appendChild(el);
      
      wrapper.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        
        wrapper.classList.toggle('selected');
        
        const selectedCount = box.querySelectorAll('.l2-item-wrapper.selected').length;
        GameState.selectedItemsCount = selectedCount;
        
        const fracNumEl = container.querySelector('.l2-frac-num');
        const countNumEl = container.querySelector('.l2-count-num');
        const counterPill = container.querySelector('.l2-counter-pill');
        if (fracNumEl) {
          fracNumEl.textContent = selectedCount;
        }
        if (countNumEl) {
          countNumEl.textContent = selectedCount;
        }
        if (counterPill) {
          if (selectedCount > 0) {
            counterPill.classList.add('has-selection');
          } else {
            counterPill.classList.remove('has-selection');
          }
        }
        
        this.submitBtn.disabled = (selectedCount === 0);
      });

      box.appendChild(wrapper);
    });

    container.appendChild(box);

    // 提案 3：點選即時計數膠囊（垂直分數格式，單位為盒）
    const unitItem = q.id === 'BT12' ? '顆' : '個';
    const counterPill = document.createElement('div');
    counterPill.className = 'l2-counter-pill';
    counterPill.innerHTML = `已點選放入：<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num l2-frac-num">0</span></span><span class="frac-row"><span class="frac-cell frac-den">${itemsCount}</span></span></span> 盒（共 <strong class="l2-count-num">0</strong> ${unitItem}）`;
    container.appendChild(counterPill);

    this.workspaceArea.appendChild(container);
  },

  updateSvgOutline(box, svg) {
    if (svg) svg.innerHTML = '';
  },

  renderDonuts6() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(3, 1fr)';
    box.style.width = '320px';
    box.style.padding = '22px 18px 18px 18px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.className = 'l2-box-badge';
    label.innerHTML = '📦 完整 1 盒';
    box.appendChild(label);

    const donuts = ['🍩', '🍩', '🍩', '🍩', '🍩', '🍩'];
    donuts.forEach((d, idx) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      
      const el = document.createElement('div');
      el.className = 'l2-item';
      el.textContent = d;
      
      if (idx < 2) {
        itemWrapper.style.background = 'rgba(255, 184, 0, 0.15)'; 
      } else if (idx === 2) {
        itemWrapper.style.background = 'rgba(0, 240, 181, 0.15)'; 
      }

      itemWrapper.appendChild(el);
      box.appendChild(itemWrapper);
    });

    const bottomArea = document.createElement('div');
    bottomArea.className = 'l1-options-area';
    bottomArea.style.flexDirection = 'row';
    bottomArea.style.marginTop = '20px';

    const q = GameState.getCurrentQuestion();
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      bottomArea.appendChild(btn);
    });

    container.appendChild(box);
    container.appendChild(bottomArea);
    this.workspaceArea.appendChild(container);
  },

  renderSwissRollAxis() {
    const container = document.createElement('div');
    container.className = 'level3-container';

    const belt = document.createElement('div');
    belt.className = 'l3-conveyor-belt';

    const width = 800;
    const offset = 50;

    const swissRollImg = document.createElement('div');
    swissRollImg.style.position = 'absolute';
    swissRollImg.style.left = `${offset}px`;
    swissRollImg.style.width = `${width - offset * 2}px`;
    swissRollImg.style.height = '40px';
    swissRollImg.style.background = 'repeating-linear-gradient(90deg, #d2b48c, #d2b48c 35px, #8b4513 35px, #8b4513 70px)';
    swissRollImg.style.borderRadius = '20px';
    swissRollImg.style.opacity = '0.35';
    swissRollImg.style.border = '2px solid #8b4513';
    belt.appendChild(swissRollImg);

    const axis = document.createElement('div');
    axis.className = 'l3-axis';
    axis.style.left = `${offset}px`;
    axis.style.right = `${offset}px`;
    belt.appendChild(axis);

    const q = GameState.getCurrentQuestion();
    const ticksCount = 10;
    const beltWidth = width - offset * 2;

    for (let i = 0; i <= ticksCount; i++) {
      const pct = i / ticksCount;
      const leftPos = offset + pct * beltWidth;

      const tick = document.createElement('div');
      tick.className = 'l3-tick';
      tick.style.left = `${leftPos}px`;
      belt.appendChild(tick);

      const label = document.createElement('div');
      label.className = 'l3-tick-label';
      label.style.left = `${leftPos}px`;
      if (i === 0) {
        label.textContent = '0';
      } else if (i === 10) {
        label.innerHTML = '1<br>(公尺)';
      } else {
        label.innerHTML = `
          <span class="fraction">
            <span class="frac-row"><span class="frac-cell frac-num">${i}</span></span>
            <span class="frac-row"><span class="frac-cell frac-den">10</span></span>
          </span>
        `;
      }
      belt.appendChild(label);

      const target = q.targets.find(t => Math.round(t.ratio * ticksCount) === i);
      if (target) {
        const dropzone = document.createElement('div');
        dropzone.className = 'l3-dropzone';
        dropzone.style.left = `${leftPos}px`;
        dropzone.dataset.label = target.label;
        dropzone.innerHTML = '?';
        belt.appendChild(dropzone);
      }
    }

    const platesArea = document.createElement('div');
    platesArea.className = 'l3-plates-area';

    const shuffledTargets = [...q.targets].sort(() => Math.random() - 0.5);
    shuffledTargets.forEach(t => {
      const plate = document.createElement('div');
      plate.className = 'l3-plate';
      plate.dataset.label = t.label;

      const numStr = t.label.split('/')[0];
      const denStr = t.label.split('/')[1];

      plate.innerHTML = `
        <span class="fraction">
          <span class="frac-row"><span class="frac-cell frac-num">${numStr}</span></span>
          <span class="frac-row"><span class="frac-cell frac-den">${denStr}</span></span>
        </span>
      `;

      this.initDragAndDrop(plate, belt);
      platesArea.appendChild(plate);
    });

    container.appendChild(belt);
    container.appendChild(platesArea);
    this.workspaceArea.appendChild(container);
  },

  renderStandardOptions(q) {
    const container = document.createElement('div');
    container.className = 'level1-container';

    const visual = document.createElement('div');
    visual.style.fontSize = '4.5rem';
    visual.style.marginBottom = '20px';

    if (q.layout === 'unit-fraction-sum') {
      const comparisonContainer = document.createElement('div');
      comparisonContainer.className = 'fraction-comparison-container';
      comparisonContainer.style.display = 'flex';
      comparisonContainer.style.flexDirection = 'column';
      comparisonContainer.style.gap = '15px';
      comparisonContainer.style.justifyContent = 'center';
      comparisonContainer.style.alignItems = 'center';
      comparisonContainer.style.fontSize = '1.1rem';
      comparisonContainer.style.fontWeight = '700';

      const den = q.den || 8;
      const num = q.num || 5;
      const unit = q.unit || '';

      // Create Whole (1)
      const wholeBox = document.createElement('div');
      wholeBox.style.display = 'flex';
      wholeBox.style.flexDirection = 'column';
      wholeBox.style.alignItems = 'center';
      wholeBox.style.gap = '8px';

      const wholeBar = document.createElement('div');
      wholeBar.style.width = '240px';
      wholeBar.style.height = '32px';
      wholeBar.style.background = '#2e283b';
      wholeBar.style.border = '2px solid #5a468f';
      wholeBar.style.borderRadius = '16px';
      wholeBar.style.position = 'relative';
      wholeBar.style.overflow = 'hidden';
      wholeBar.style.display = 'flex';

      for (let i = 0; i < den; i++) {
        const seg = document.createElement('div');
        seg.style.flex = '1';
        seg.style.height = '100%';
        seg.style.background = 'linear-gradient(180deg, #ffb800 0%, #cc9300 100%)';
        seg.style.borderRight = i < den - 1 ? '1.5px solid rgba(0,0,0,0.35)' : 'none';
        wholeBar.appendChild(seg);
      }

      const wholeLabel = document.createElement('div');
      wholeLabel.innerHTML = `完整的第一個單位：<span style="color:var(--highlight-color); font-weight:900;">1</span> ${unit}`;
      wholeBox.appendChild(wholeBar);
      wholeBox.appendChild(wholeLabel);

      // Create Part (Fraction)
      const partBox = document.createElement('div');
      partBox.style.display = 'flex';
      partBox.style.flexDirection = 'column';
      partBox.style.alignItems = 'center';
      partBox.style.gap = '8px';

      const partBar = document.createElement('div');
      partBar.style.width = '240px';
      partBar.style.height = '32px';
      partBar.style.background = '#2e283b';
      partBar.style.border = '2px solid #5a468f';
      partBar.style.borderRadius = '16px';
      partBar.style.position = 'relative';
      partBar.style.overflow = 'hidden';
      partBar.style.display = 'flex';

      for (let i = 0; i < den; i++) {
        const seg = document.createElement('div');
        seg.style.flex = '1';
        seg.style.height = '100%';
        if (i < num) {
          seg.style.background = 'linear-gradient(180deg, #ff7ebb 0%, #d63e8a 100%)';
        } else {
          seg.style.background = 'transparent';
        }
        seg.style.borderRight = i < den - 1 ? '1.5px solid rgba(0,0,0,0.35)' : 'none';
        partBar.appendChild(seg);
      }

      const partLabel = document.createElement('div');
      const fracHTML = `<span class="fraction" style="color:var(--highlight-color)">
        <span class="frac-row"><span class="frac-cell frac-num">${num}</span></span>
        <span class="frac-row"><span class="frac-cell frac-den">${den}</span></span>
      </span>`;
      
      partLabel.innerHTML = `塗色部分表示：${fracHTML} ${unit}`;
      partBox.appendChild(partBar);
      partBox.appendChild(partLabel);

      comparisonContainer.appendChild(wholeBox);
      comparisonContainer.appendChild(partBox);
      
      visual.appendChild(comparisonContainer);
    } else {
      visual.style.display = 'flex';
      visual.style.flexDirection = 'column';
      visual.style.alignItems = 'center';
      visual.style.gap = '35px';
      
      const den = q.den || 10;
      const unit = q.unit || '條';

      const ribbon1 = document.createElement('div');
      ribbon1.style.width = '200px';
      ribbon1.style.height = '30px';
      ribbon1.style.background = 'linear-gradient(90deg, #ff7ebb, #ffb800)';
      ribbon1.style.borderRadius = '15px';
      ribbon1.style.position = 'relative';
      ribbon1.innerHTML = `<span style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); font-size:1rem; font-weight:700;">1 ${unit}</span>`;

      const ribbon10 = document.createElement('div');
      ribbon10.style.width = '200px';
      ribbon10.style.height = '30px';
      ribbon10.style.background = 'linear-gradient(90deg, #ff7ebb, #ffb800)';
      ribbon10.style.borderRadius = '15px';
      ribbon10.style.position = 'relative';
      ribbon10.innerHTML = `<span style="position:absolute; top:-28px; left:50%; transform:translateX(-50%); font-size:1rem; font-weight:700;"><span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">${den}</span></span><span class="frac-row"><span class="frac-cell frac-den">${den}</span></span></span> ${unit}</span>`;
      
      for (let i = 1; i < den; i++) {
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.left = `${i * (100 / den)}%`;
        line.style.width = '2px';
        line.style.height = '30px';
        line.style.background = 'rgba(0,0,0,0.3)';
        ribbon10.appendChild(line);
      }

      visual.appendChild(ribbon1);
      visual.appendChild(ribbon10);
    }

    const optionsArea = document.createElement('div');
    optionsArea.className = 'l1-options-area';
    optionsArea.style.flexDirection = 'row';

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'l1-option-btn';
      btn.innerHTML = opt.text;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(opt.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l1-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.selectedOption = opt.id;
          this.submitBtn.disabled = false;
        });
      }
      optionsArea.appendChild(btn);
    });

    container.appendChild(visual);
    container.appendChild(optionsArea);
    this.workspaceArea.appendChild(container);
  },

  renderPhysicsScale(q) {
    const container = document.createElement('div');
    container.className = 'level4-container';

    const scaleSys = document.createElement('div');
    scaleSys.className = 'l4-scale-system';

    const pillar = document.createElement('div');
    pillar.className = 'l4-pillar';
    const base = document.createElement('div');
    base.className = 'l4-base';

    // 中央平衡刻度盤 (位於立柱上方、梁的後方)
    const gauge = document.createElement('div');
    gauge.className = 'l4-gauge';
    gauge.innerHTML = `
      <div class="l4-gauge-mark left"></div>
      <div class="l4-gauge-mark center" title="平衡基準"></div>
      <div class="l4-gauge-mark right"></div>
    `;

    const beam = document.createElement('div');
    beam.className = 'l4-beam';
    beam.id = 'scale-beam';

    // 金色立體指針 (附著於橫梁中心，隨梁同軸擺動)
    const needle = document.createElement('div');
    needle.className = 'l4-beam-needle';
    beam.appendChild(needle);

    const panLeft = document.createElement('div');
    panLeft.className = 'l4-pan-container l4-pan-left';
    panLeft.id = 'pan-left';
    panLeft.innerHTML = '<div class="l4-strings"></div><div class="l4-pan-plate"></div>';
    
    const contentLeft = document.createElement('div');
    contentLeft.className = 'l4-pan-content';
    contentLeft.id = 'content-left';
    panLeft.appendChild(contentLeft);

    const panRight = document.createElement('div');
    panRight.className = 'l4-pan-container l4-pan-right';
    panRight.id = 'pan-right';
    panRight.innerHTML = '<div class="l4-strings"></div><div class="l4-pan-plate"></div>';
    
    const contentRight = document.createElement('div');
    contentRight.className = 'l4-pan-content';
    contentRight.id = 'content-right';
    panRight.appendChild(contentRight);

    beam.appendChild(panLeft);
    beam.appendChild(panRight);

    const pivot = document.createElement('div');
    pivot.className = 'l4-pivot';

    scaleSys.appendChild(pillar);
    scaleSys.appendChild(base);
    scaleSys.appendChild(gauge);
    scaleSys.appendChild(beam);
    scaleSys.appendChild(pivot);

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.className = 'l4-overlay-canvas';
    overlayCanvas.id = 'scale-overlay';
    overlayCanvas.width = 140;
    overlayCanvas.height = 140;
    scaleSys.appendChild(overlayCanvas);

    this.renderScaleContent(q, contentLeft, contentRight);

    const operatorsArea = document.createElement('div');
    operatorsArea.className = 'l4-operators';

    const ops = ['<', '>', '='];
    ops.forEach(op => {
      const btn = document.createElement('button');
      btn.className = 'l4-op-btn';
      btn.textContent = op;

      if (GameState.gameMode === 'battle' && GameState.lockedOptions.includes(op)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          AudioSynth.playClick();
          document.querySelectorAll('.l4-op-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          GameState.scaleSelectedOp = op;
          this.submitBtn.disabled = false;
          
          // 點選微傾預覽：左大則左盤微沉(-3.5deg)，右大則右盤微沉(+3.5deg)，相等則水平(0deg)
          const previewDeg = op === '<' ? 3.5 : op === '>' ? -3.5 : 0;
          this.tiltScale(previewDeg);
        });
      }
      operatorsArea.appendChild(btn);
    });

    container.appendChild(scaleSys);
    container.appendChild(operatorsArea);
    this.workspaceArea.appendChild(container);

    this.tiltScale(0);
  },

  renderScaleContent(q, leftContainer, rightContainer) {
    const leftVisual = document.createElement('div');
    leftVisual.style.fontSize = '2.5rem';
    
    // 安全分母解析：排除預設值阻擋右側標籤分母的 Bug
    const getDen = (label) => {
      if (!label) return null;
      const match = label.match(/\/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    };
    const descMatch = q.desc && q.desc.match(/有\s*(\d+)\s*[個顆片份]/);
    const descTotal = descMatch ? parseInt(descMatch[1], 10) : null;
    const lTotal = q.den || getDen(q.leftLabel) || getDen(q.rightLabel) || descTotal || 10;

    const getEmoji = (desc) => {
      if (!desc) return '🧁';
      if (desc.includes('水蜜桃') || desc.includes('桃')) return '🍑';
      if (desc.includes('馬卡龍') || desc.includes('餅乾')) return '🍪';
      if (desc.includes('巧克力')) return '🍫';
      if (desc.includes('果凍') || desc.includes('布丁')) return '🍮';
      if (desc.includes('甜甜圈')) return '🍩';
      if (desc.includes('糖果')) return '🍬';
      return '🧁';
    };
    const dessertEmoji = getEmoji(q.desc);

    // --- 左盤視覺呈現 ---
    if (q.leftVisual && q.leftVisual.startsWith('pizza-')) {
      const canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 80;
      const parts = Math.round(q.leftVal * lTotal);
      this.drawPizzaOnCanvas(canvas, parts, lTotal);
      leftVisual.appendChild(canvas);
    } else if (q.leftVisual === 'whole-1' || (q.leftLabel && q.leftLabel.includes('盒'))) {
      const canvas = document.createElement('canvas');
      canvas.width = 100; canvas.height = 64;
      const parts = Math.round(q.leftVal * lTotal);
      this.drawBoxedItems(canvas, parts, lTotal, dessertEmoji);
      leftVisual.appendChild(canvas);
    } else {
      const val = Math.round(q.leftVal * lTotal);
      leftVisual.style.display = 'flex';
      leftVisual.style.flexWrap = 'wrap';
      leftVisual.style.justifyContent = 'center';
      leftVisual.style.gap = '2px';
      leftVisual.style.maxWidth = '95px';
      leftVisual.style.fontSize = val > 6 ? '1.25rem' : '1.45rem';
      leftVisual.style.lineHeight = '1.2';
      for (let i = 0; i < val; i++) {
        const itemSpan = document.createElement('span');
        itemSpan.textContent = dessertEmoji;
        leftVisual.appendChild(itemSpan);
      }
    }
    
    const leftDesc = document.createElement('div');
    leftDesc.className = 'l4-pan-item-desc';
    leftDesc.innerHTML = this.formatFractionText(q.leftLabel);
    leftContainer.appendChild(leftVisual);
    leftContainer.appendChild(leftDesc);

    // --- 右盤視覺呈現 ---
    const rightVisual = document.createElement('div');
    rightVisual.style.fontSize = '2.5rem';
    
    if (q.rightVisual && q.rightVisual.startsWith('pizza-')) {
      const canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 80;
      const parts = Math.round(q.rightVal * lTotal);
      this.drawPizzaOnCanvas(canvas, parts, lTotal);
      rightVisual.appendChild(canvas);
    } else if (q.rightVisual === 'discrete-10' || (q.rightLabel && q.rightLabel.includes('盒'))) {
      const canvas = document.createElement('canvas');
      canvas.width = 100; canvas.height = 64;
      const parts = Math.round(q.rightVal * lTotal);
      this.drawBoxedItems(canvas, parts, lTotal, dessertEmoji);
      rightVisual.appendChild(canvas);
    } else {
      const val = Math.round(q.rightVal * lTotal);
      rightVisual.style.display = 'flex';
      rightVisual.style.flexWrap = 'wrap';
      rightVisual.style.justifyContent = 'center';
      rightVisual.style.gap = '2px';
      rightVisual.style.maxWidth = '95px';
      rightVisual.style.fontSize = val > 6 ? '1.25rem' : '1.45rem';
      rightVisual.style.lineHeight = '1.2';
      for (let i = 0; i < val; i++) {
        const itemSpan = document.createElement('span');
        itemSpan.textContent = dessertEmoji;
        rightVisual.appendChild(itemSpan);
      }
    }

    const rightDesc = document.createElement('div');
    rightDesc.className = 'l4-pan-item-desc';
    rightDesc.innerHTML = this.formatFractionText(q.rightLabel);
    rightContainer.appendChild(rightVisual);
    rightContainer.appendChild(rightDesc);
  },

  formatFractionText(str) {
    if (!str.includes('/')) return str;
    const parts = str.split(' ');
    const fracPart = parts[0];
    const unitPart = parts[1] || '';
    
    const num = fracPart.split('/')[0];
    const den = fracPart.split('/')[1];

    return `
      <span class="fraction">
        <span class="frac-row"><span class="frac-cell frac-num">${num}</span></span>
        <span class="frac-row"><span class="frac-cell frac-den">${den}</span></span>
      </span>${unitPart}
    `;
  },

  drawPizzaOnCanvas(canvas, parts, total) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 5;

    // 1. 底盤餅皮：溫馨柔和烘焙淺金黃底色 (#fcedd8)
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fcedd8';
    ctx.fill();
    ctx.strokeStyle = '#c47d2b';
    ctx.lineWidth = 3;
    ctx.stroke();

    const step = (Math.PI * 2) / total;

    // 2. 分子所佔份數（塗色／被拿取的扇形部分）：鮮明草莓甜點粉紅 (#ff4a70)
    if (parts > 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 1.5, -Math.PI / 2, -Math.PI / 2 + step * parts);
      ctx.closePath();
      ctx.fillStyle = '#ff4a70';
      ctx.fill();

      // 在塗色區域的每片扇形中心加上小果醬點綴，一眼即可數出幾片分子
      for (let i = 0; i < parts; i++) {
        const midA = -Math.PI / 2 + step * (i + 0.5);
        const dotR = r * 0.62;
        const dx = cx + Math.cos(midA) * dotR;
        const dy = cy + Math.sin(midA) * dotR;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }

    // 3. 所有切等份線（平分線）：俐落可可棕線條，清楚分明
    ctx.strokeStyle = '#7a481c';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < total; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(-Math.PI / 2 + step * i) * r, cy + Math.sin(-Math.PI / 2 + step * i) * r);
      ctx.stroke();
    }
  },

  drawBoxedItems(canvas, selected, total, emoji = '🧁') {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. 溫暖焦糖實體禮盒盒身（對齊第二關烘焙木盒質感）
    const bx = 3, by = 3, bw = w - 6, bh = h - 6, br = 6;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, br);
    ctx.fillStyle = '#fff9f0';
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 內層細線
    ctx.beginPath();
    ctx.roundRect(bx + 2, by + 2, bw - 4, bh - 4, br - 1);
    ctx.strokeStyle = 'rgba(196, 125, 43, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. 自動判斷排版欄列
    let cols = 5, rows = 2;
    if (total === 6) { cols = 3; rows = 2; }
    else if (total === 8) { cols = 4; rows = 2; }
    else if (total === 9) { cols = 3; rows = 3; }
    else if (total === 10) { cols = 5; rows = 2; }
    else if (total === 12) { cols = 4; rows = 3; }
    else if (total <= 4) { cols = total; rows = 1; }

    const padX = 5;
    const padY = 5;
    const availW = bw - padX * 2;
    const availH = bh - padY * 2;
    const cellW = availW / cols;
    const cellH = availH / rows;
    const itemSize = Math.max(12, Math.floor(Math.min(cellW, cellH) * 0.82));

    let drawn = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (drawn >= total) break;
        const cx = bx + padX + c * cellW + cellW / 2;
        const cy = by + padY + r * cellH + cellH / 2;
        const slotR = Math.min(cellW, cellH) * 0.42;

        if (drawn < selected) {
          // [已放入點心格]：烘焙紙托 + 點心 emoji
          ctx.beginPath();
          ctx.arc(cx, cy, slotR, 0, Math.PI * 2);
          ctx.fillStyle = '#ffe9b8';
          ctx.fill();
          ctx.strokeStyle = '#e0aa3e';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.font = `${itemSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, cx, cy + 1);
        } else {
          // [等分內襯空格]：虛線紙托槽，清晰展示分母平分總格數
          ctx.beginPath();
          ctx.arc(cx, cy, slotR, 0, Math.PI * 2);
          ctx.fillStyle = '#f0e6da';
          ctx.fill();
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = '#c4b09c';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        drawn++;
      }
    }
  },

  tiltScale(deg) {
    const beam = document.getElementById('scale-beam');
    const panLeft = document.getElementById('pan-left');
    const panRight = document.getElementById('pan-right');
    
    if (!beam) return;

    beam.style.transform = `rotate(${deg}deg)`;
    if (panLeft) panLeft.style.transform = `rotate(${-deg}deg)`;
    if (panRight) panRight.style.transform = `rotate(${-deg}deg)`;
  },

  initDragAndDrop(plate, belt) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentTx = 0, currentTy = 0;

    plate.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      AudioSynth.playClick();
      
      if (plate.classList.contains('placed')) {
        plate.classList.remove('placed');
        plate.style.position = 'static';
        plate.style.left = 'auto';
        plate.style.top = 'auto';
        
        const platesArea = document.querySelector('.l3-plates-area');
        if (platesArea) platesArea.appendChild(plate);

        for (let key in GameState.dragPlacements) {
          if (GameState.dragPlacements[key] === plate.dataset.label) {
            delete GameState.dragPlacements[key];
            const zone = belt.querySelector(`.l3-dropzone[data-label="${key}"]`);
            if (zone) zone.style.opacity = '1';
          }
        }
        this.submitBtn.disabled = true;
      }

      isDragging = true;
      plate.classList.add('dragged');
      plate.style.touchAction = 'none';
      plate.setPointerCapture(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;
      currentTx = 0;
      currentTy = 0;
    });

    plate.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.stopPropagation();

      currentTx = e.clientX - startX;
      currentTy = e.clientY - startY;

      plate.style.transform = `translate(${currentTx}px, ${currentTy}px) scale(1.1)`;

      const dropzones = belt.querySelectorAll('.l3-dropzone');
      dropzones.forEach(zone => {
        const zoneRect = zone.getBoundingClientRect();
        const plateRect = plate.getBoundingClientRect();

        const isOverlap = !(
          plateRect.right < zoneRect.left ||
          plateRect.left > zoneRect.right ||
          plateRect.bottom < zoneRect.top ||
          plateRect.top > zoneRect.bottom
        );

        if (isOverlap) {
          zone.classList.add('hovered');
        } else {
          zone.classList.remove('hovered');
        }
      });
    });

    plate.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      plate.classList.remove('dragged');
      plate.releasePointerCapture(e.pointerId);

      const dropzones = belt.querySelectorAll('.l3-dropzone');
      let matchedZone = null;

      dropzones.forEach(zone => {
        const zoneRect = zone.getBoundingClientRect();
        const plateRect = plate.getBoundingClientRect();

        const isOverlap = !(
          plateRect.right < zoneRect.left ||
          plateRect.left > zoneRect.right ||
          plateRect.bottom < zoneRect.top ||
          plateRect.top > zoneRect.bottom
        );

        if (isOverlap) {
          matchedZone = zone;
        }
        zone.classList.remove('hovered');
      });

      plate.style.transform = '';

      if (matchedZone) {
        belt.appendChild(plate);
        plate.classList.add('placed');
        
        const beltRect = belt.getBoundingClientRect();
        const zoneRect = matchedZone.getBoundingClientRect();
        
        plate.style.position = 'absolute';
        plate.style.left = `${zoneRect.left - beltRect.left + zoneRect.width / 2}px`;
        plate.style.top = '2px';

        GameState.dragPlacements[matchedZone.dataset.label] = plate.dataset.label;
        matchedZone.style.opacity = '0';
        
        const q = GameState.getCurrentQuestion();
        const placedCount = Object.keys(GameState.dragPlacements).length;
        if (placedCount === q.targets.length) {
          this.submitBtn.disabled = false;
        }
      } else {
        plate.style.position = 'static';
        plate.style.left = 'auto';
        plate.style.top = 'auto';
        this.submitBtn.disabled = true;
      }
    });
  },

  // ==========================================
  // 8. 答題檢查與對戰接力作答控制流
  // ==========================================
  checkAnswer() {
    if (this.submitBtn.classList.contains('hidden')) return; // 防止重複送出答案
    this.clearBattleAnswerTimer(); // 送出答案即刻清除限時倒數
    const q = GameState.getCurrentQuestion();
    let isCorrect = false;

    let currentPlayerAns = null;
    if (q.type === 'select-card') {
      currentPlayerAns = GameState.selectedOption;
      isCorrect = (currentPlayerAns === q.answer);
    } else if (q.type === 'interactive-click') {
      isCorrect = (GameState.selectedItemsCount === q.answer);
    } else if (q.type === 'interactive-drag') {
      isCorrect = true;
      for (let key in GameState.dragPlacements) {
        if (GameState.dragPlacements[key] !== key) {
          isCorrect = false;
          break;
        }
      }
    } else if (q.type === 'interactive-scale') {
      currentPlayerAns = GameState.scaleSelectedOp;
      isCorrect = (currentPlayerAns === q.answer);
    }

    if (GameState.gameMode === 'learn') {
      // ----------------- (A) 個人自學作答 -----------------
      this.submitBtn.classList.add('hidden');
      this.nextBtn.classList.remove('hidden');
      this.workspaceArea.style.pointerEvents = 'none'; // 鎖定工作區防止作答後繼續點選

      if (isCorrect) {
        AudioSynth.playCorrect();
        GameState.score += 10;
        GameState.saveToLocalStorage(); // 保存金幣分數至 localStorage
        this.showMessage("喵～回答得太棒了！你真有分數魔法天分！", "success");
        if (q.type === 'interactive-scale') {
          const diff = q.leftVal - q.rightVal;
          // 左重 (diff > 0): 左盤下沉 (逆時針 -12deg)
          // 右重 (diff < 0): 右盤下沉 (順時針 +12deg)
          // 相等 (diff === 0): 水平平衡 (0deg)
          const targetDeg = diff > 0 ? -12 : diff < 0 ? 12 : 0;
          this.tiltScale(targetDeg);
          setTimeout(() => {
            AudioSynth.playScaleThud();
          }, 250);
        }
      } else {
        AudioSynth.playWrong();
        GameState.lives -= 1;
        this.updateStatusUI();
        this.triggerMisconceptionVisuals(q);
        SpeechManager.speak(q.misconceptionSpeech);
        this.showMessage(q.misconceptionSpeech, "error");

        if (GameState.lives <= 0) {
          this.nextBtn.classList.add('hidden');
          setTimeout(() => {
            this.showGameOver();
          }, 3000);
        }
      }
    } else if (GameState.gameMode === 'ai-challenge') {
      // ----------------- (C) 單人 AI 拔河作答 -----------------
      this.clearAiThinkingTimer(); // 學生作答立即結算本題計時
      this.submitBtn.classList.add('hidden');
      this.workspaceArea.style.pointerEvents = 'none';

      if (isCorrect) {
        AudioSynth.playCorrect();
        AudioSynth.playConveyorMove();

        // 聖代往左移動 1 格 (靠近學生店舖)
        GameState.tugPosition--;
        GameState.aiPlayerPulls++;
        this.updateConveyorUI();

        if (q.type === 'interactive-scale') {
          const diff = q.leftVal - q.rightVal;
          const targetDeg = diff > 0 ? -12 : diff < 0 ? 12 : 0;
          this.tiltScale(targetDeg);
          setTimeout(() => {
            AudioSynth.playScaleThud();
          }, 250);
        }

        const msg = "🎉 答對了！彩虹聖代向你的烘焙坊拉近了 1 格！";
        this.showMessage(msg, "success");
        SpeechManager.speak("太棒了！答對了，聖代往你這邊移動一格！");

        // 檢查是否直接拉到終點 (-5) 獲勝
        if (GameState.tugPosition <= -5) {
          setTimeout(() => {
            this.finishAiChallenge('win');
          }, 1200);
          return;
        }

        this.nextBtn.classList.remove('hidden');
      } else {
        AudioSynth.playWrong();
        this.triggerMisconceptionVisuals(q);
        SpeechManager.speak(q.misconceptionSpeech);
        this.showMessage(`💡 答錯囉！${q.misconceptionSpeech}`, "error");

        // 安全閥：暫停 AI 計時，讓學生安心看懂解析
        this.pauseAiThinkingTimer();

        this.nextBtn.classList.remove('hidden');
      }
    } else {
      // ----------------- (B) 雙人對戰接力作答 -----------------
      const activePName = GameState.currentPlayer === 'A' ? '玩家 A (🐱)' : '玩家 B (🐶)';
      const opponentP = GameState.currentPlayer === 'A' ? 'B' : 'A';
      const opponentPName = opponentP === 'A' ? '玩家 A (🐱)' : '玩家 B (🐶)';

      if (isCorrect) {
        AudioSynth.playCorrect();
        
        GameState.playerScores[GameState.currentPlayer] += 10;
        this.updateStatusUI();

        if (q.type === 'interactive-scale') {
          const diff = q.leftVal - q.rightVal;
          const targetDeg = diff > 0 ? -12 : diff < 0 ? 12 : 0;
          this.tiltScale(targetDeg);
          setTimeout(() => {
            AudioSynth.playScaleThud();
          }, 250);
        }

        const msgText = `🎉 太棒了！${activePName} 答對了，獲得 10 枚金幣！`;
        this.showMessage(msgText, "success");
        SpeechManager.speak(msgText);

        this.buzzerBtnA.disabled = true;
        this.buzzerBtnB.disabled = true;

        this.submitBtn.classList.add('hidden');
        this.nextBtn.classList.remove('hidden');
        this.workspaceArea.style.pointerEvents = 'none'; // 鎖定工作區防止作答後繼續點選
      } else {
        AudioSynth.playWrong();

        if (!GameState.isPassOnTurn) {
          // 首次搶答答錯 ➡️ 進入接力輪
          AudioSynth.playPassOn();
          GameState.isPassOnTurn = true;

          if (currentPlayerAns) {
            GameState.lockedOptions.push(currentPlayerAns);
          }

          GameState.currentPlayer = opponentP;
          this.updateStatusUI();

          this.renderWorkspace(q);
          this.workspaceArea.style.pointerEvents = 'auto'; // 接力玩家可直接作答

          if (this.battleStatusBar) {
            this.battleStatusBar.className = 'battle-status-bar winner';
            if (this.battleStatusIcon) this.battleStatusIcon.textContent = '🔄';
            if (this.battleStatusText) {
              this.battleStatusText.innerHTML = `🔄 <strong>接力作答！</strong> ${activePName} 答錯，換 <strong>${opponentPName}</strong> 進行回答！`;
            }
          }
          
          if (opponentP === 'A') {
            this.buzzerBtnA.classList.add('buzzer-active');
            this.buzzerBtnB.classList.remove('buzzer-active');
            this.buzzerBtnB.disabled = true;
            this.buzzerBtnA.disabled = true;
          } else {
            this.buzzerBtnB.classList.add('buzzer-active');
            this.buzzerBtnA.classList.remove('buzzer-active');
            this.buzzerBtnA.disabled = true;
            this.buzzerBtnB.disabled = true;
          }

          const passMsg = `接力作答！${activePName} 答錯囉，換 ${opponentPName} 接力作答！`;
          this.showMessage(passMsg, "error");
          SpeechManager.speak(passMsg);

          this.submitBtn.disabled = true;
          this.submitBtn.classList.remove('hidden');
          this.nextBtn.classList.add('hidden');

          // 接力玩家獲得全新的 10 秒限時作答倒數！
          this.startBattleAnswerCountdown(10);
        } else {
          this.triggerMisconceptionVisuals(q);

          if (this.battleStatusBar) {
            this.battleStatusBar.className = 'battle-status-bar';
            if (this.battleStatusIcon) this.battleStatusIcon.textContent = '💡';
            if (this.battleStatusText) {
              this.battleStatusText.innerHTML = '💡 <strong>雙方都答錯囉！</strong> 請看解題說明。';
            }
          }

          this.buzzerBtnA.disabled = true;
          this.buzzerBtnB.disabled = true;

          this.showMessage(`雙方都答錯囉！${q.misconceptionSpeech}`, "error");
          SpeechManager.speak(`都答錯囉。${q.misconceptionSpeech}`);

          this.submitBtn.classList.add('hidden');
          this.nextBtn.classList.remove('hidden');
          this.workspaceArea.style.pointerEvents = 'none'; // 鎖定工作區防止作答後繼續點選
        }
      }
    }
  },

  triggerMisconceptionVisuals(q) {
    if (q.layout === 'split-unequal-pizza' || q.layout === 'split-unequal-pizza-4') {
      const canvas = document.querySelector('.l1-visual-canvas');
      if (canvas) {
        const is4Pieces = (q.pieces === 4 || q.layout === 'split-unequal-pizza-4' || (q.desc && q.desc.includes('4 塊')));
        const angles = is4Pieces ? [0, Math.PI * 0.25, Math.PI * 1.0, Math.PI * 1.4] : [0, Math.PI * 0.4, Math.PI * 0.95];
        const normalColor = is4Pieces ? '#5a2e12' : '#8b4513';
        let flash = true;
        const interval = setInterval(() => {
          const ctx = canvas.getContext('2d');
          ctx.strokeStyle = flash ? '#ff4a70' : normalColor;
          ctx.lineWidth = 5;
          const cx = 120, cy = 120, r = 100;
          angles.forEach(a => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            ctx.stroke();
          });
          flash = !flash;
        }, 200);
        setTimeout(() => clearInterval(interval), 2000);
      }
    } else if (q.layout === 'scale-fraction-compare') {
      const overlay = document.getElementById('scale-overlay');
      if (overlay) {
        overlay.style.display = 'block';
        const ctx = overlay.getContext('2d');
        const cx = 70, cy = 70, r = 60;
        
        ctx.clearRect(0, 0, 140, 140);

        const getDen = (label) => {
          if (!label) return null;
          const match = label.match(/\/(\d+)/);
          return match ? parseInt(match[1], 10) : null;
        };
        const descMatch = q.desc && q.desc.match(/有\s*(\d+)\s*[個顆片份]/);
        const descTotal = descMatch ? parseInt(descMatch[1], 10) : null;
        const den = q.den || getDen(q.leftLabel) || getDen(q.rightLabel) || descTotal || 10;
        const leftParts = Math.round(q.leftVal * den);
        const rightParts = Math.round(q.rightVal * den);
        
        // 畫布底圓
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#fcedd8';
        ctx.fill();
        ctx.strokeStyle = '#c47d2b';
        ctx.lineWidth = 2;
        ctx.stroke();

        const step = (Math.PI * 2) / den;

        // 較大者與較小者以鮮明半透明色疊合對照 (左: 薄荷綠, 右: 櫻花粉)
        if (leftParts > 0) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r - 1, -Math.PI / 2, -Math.PI / 2 + step * leftParts);
          ctx.closePath();
          ctx.fillStyle = 'rgba(46, 204, 113, 0.45)';
          ctx.fill();
        }

        if (rightParts > 0) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r - 1, -Math.PI / 2, -Math.PI / 2 + step * rightParts);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 74, 112, 0.45)';
          ctx.fill();
        }

        // 切割線
        ctx.strokeStyle = '#7a481c';
        ctx.lineWidth = 1;
        for (let i = 0; i < den; i++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(-Math.PI / 2 + step * i) * r, cy + Math.sin(-Math.PI / 2 + step * i) * r);
          ctx.stroke();
        }
      }
    } else if (q.layout === 'scale-discrete-compare' || q.layout === 'scale-whole-compare') {
      const diff = q.leftVal - q.rightVal;
      const targetDeg = diff > 0 ? -12 : diff < 0 ? 12 : 0;
      this.tiltScale(targetDeg);
    }
  },

  // ==========================================
  // 9. 關卡與結算管理器
  // ==========================================
  loadNextQuestion() {
    if (this.nextBtn.classList.contains('hidden')) return; // 防止重複點選下一題
    this.nextBtn.classList.add('hidden');
    SpeechManager.stop();
    this.clearBattleThinkingTimer();
    this.clearBattleAnswerTimer();
    
    const overlay = document.getElementById('scale-overlay');
    if (overlay) overlay.style.display = 'none';

    if (GameState.gameMode === 'learn') {
      GameState.currentQuestionIdx++;
      const currentLevel = GameState.getCurrentLevel();

      if (GameState.currentQuestionIdx >= GameState.currentLevelQuestions.length) {
        // 標記此關卡為已完成
        GameState.completedLevels[GameState.currentLevelIdx] = true;
        GameState.saveToLocalStorage(); // 保存通關紀錄與分數至 localStorage
        
        // 更新關卡選單的按鈕與徽章
        this.updateLevelSelectUI();

        // 檢查是否所有關卡皆已完成
        const allCompleted = GameState.completedLevels.every(val => val === true);

        if (allCompleted) {
          this.showMessage(`🎉 恭喜通過所有關卡！正在為您準備魔法烘焙師證書...`, "success");
          AudioSynth.playCertificate();
          setTimeout(() => {
            this.showCertificate();
          }, 2500);
        } else {
          this.showMessage(`🎉 恭喜通過第 ${GameState.currentLevelIdx + 1} 關：「${currentLevel.name}」！`, "success");
          AudioSynth.playCertificate();
          setTimeout(() => {
            this.showScreen(this.levelSelectScreen);
            SpeechManager.speak(`恭喜通過第 ${GameState.currentLevelIdx + 1} 關！請選擇下一個關卡。`);
          }, 2500);
        }
      } else {
        this.loadQuestion();
      }
    } else if (GameState.gameMode === 'ai-challenge') {
      this.nextAiQuestion();
    } else {
      GameState.battleCurrentRound++;
      GameState.currentPlayer = null;
      GameState.isPassOnTurn = false;

      if (GameState.battleCurrentRound >= GameState.battleTotalRounds) {
        this.showBattleResults();
      } else {
        this.loadQuestion();
      }
    }
  },

  updateLevelSelectUI() {
    document.querySelectorAll('.level-card-btn').forEach(btn => {
      const lvlIdx = parseInt(btn.dataset.level);
      const oldBadge = btn.querySelector('.level-completed-badge');
      if (oldBadge) oldBadge.remove();

      if (GameState.completedLevels && GameState.completedLevels[lvlIdx]) {
        btn.classList.add('completed');
        const badge = document.createElement('span');
        badge.className = 'level-completed-badge';
        badge.innerHTML = '🌟 已完成';
        badge.style.color = '#ffd700';
        badge.style.fontSize = '0.9rem';
        badge.style.fontWeight = 'bold';
        badge.style.display = 'block';
        badge.style.marginTop = '5px';
        btn.appendChild(badge);
      } else {
        btn.classList.remove('completed');
      }
    });

    const allCompleted = GameState.completedLevels && GameState.completedLevels.every(val => val === true);
    if (allCompleted) {
      this.claimCertBtn.classList.remove('hidden');
    } else {
      this.claimCertBtn.classList.add('hidden');
    }
  },

  showCertificate() {
    AudioSynth.playCertificate();
    const today = new Date();
    const formattedDate = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
    this.certDateStr.textContent = formattedDate;

    this.certModal.classList.add('active');
    SpeechManager.speak("哇！太了不起了！你成功完成了所有分數魔法訂單，榮獲魔法烘焙師證書！");
  },

  showBattleResults() {
    AudioSynth.playCertificate();
    
    const scoreA = GameState.playerScores.A;
    const scoreB = GameState.playerScores.B;
    
    this.finalScoreA.textContent = scoreA;
    this.finalScoreB.textContent = scoreB;

    let winnerMsg = "";
    if (scoreA > scoreB) {
      winnerMsg = "恭喜 玩家 A (🐱) 榮獲「超級魔法烘焙王」稱號！";
      this.battleWinnerTitle.textContent = "🏆 玩家 A 獲勝 🏆";
      this.battleTrophyEmoji.textContent = "🏆🐱";
    } else if (scoreB > scoreA) {
      winnerMsg = "恭喜 玩家 B (🐶) 榮獲「超級魔法烘焙王」稱號！";
      this.battleWinnerTitle.textContent = "🏆 玩家 B 獲勝 🏆";
      this.battleTrophyEmoji.textContent = "🏆🐶";
    } else {
      winnerMsg = "雙方打成平手，都是優秀的分數烘焙大師！";
      this.battleWinnerTitle.textContent = "🤝 雙方平手 🤝";
      this.battleTrophyEmoji.textContent = "🐱🤝🐶";
    }

    this.battleWinnerStatus.textContent = winnerMsg;
    this.battleResultModal.classList.add('active');
    
    SpeechManager.speak("對戰結束囉！" + winnerMsg);
  },

  showGameOver() {
    this.gameoverModal.classList.add('active');
    SpeechManager.speak("魔法能量耗盡了，沒關係，我們重新挑戰，再練習一次！");
  }
};

// 自學四大活動
const LEVEL_CONFIGS = [
  { 
    levelNum: 1, 
    name: "平分魔法切切樂", 
    questions: [
      LEARN_QUESTIONS[0],
      LEARN_QUESTIONS[1],
      LEARN_QUESTIONS[2],
      LEARN_QUESTIONS[3],
      LEARN_QUESTIONS[4],
      BATTLE_QUESTIONS[1],
      BATTLE_QUESTIONS[8],
      BATTLE_QUESTIONS[9],
      {
        type: "select-card",
        desc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
        speechDesc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
        layout: "equal-waffle-4",
        num: 1,
        den: 4,
        options: [
          { id: "1/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">1</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
          { id: "2/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">2</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
          { id: "4/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' }
        ],
        answer: "1/4",
        misconceptionSpeech: "不對喔！這個鬆餅被平分成四份，每一份是四分之一個，塗色的只有一份，所以是四分之一個鬆餅！"
      },
      {
        type: "select-card",
        desc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
        speechDesc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
        layout: "equal-waffle-4",
        num: 2,
        den: 4,
        options: [
          { id: "2/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">2</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
          { id: "3/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
          { id: "4/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' }
        ],
        answer: "2/4",
        misconceptionSpeech: "不對喔！這個鬆餅被平分成四份，每一份是四分之一個，塗色的有兩份，所以是四分之二個鬆餅！"
      },
      {
        type: "select-card",
        desc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
        speechDesc: "這是一個平分成 4 份的鬆餅，塗色部分是多少個鬆餅？",
        layout: "equal-waffle-4",
        num: 4,
        den: 4,
        options: [
          { id: "2/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">2</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
          { id: "3/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' },
          { id: "4/4", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個' }
        ],
        answer: "4/4",
        misconceptionSpeech: "答錯囉！塗色部分佔了全部四份，也就是四分之四個，它也等於一個完整的鬆餅！"
      },
      {
        type: "select-card",
        desc: "一個平分成 8 片的草莓披薩，被妙妙吃了 5 片。妙妙是吃了幾個披薩？",
        speechDesc: "一個平分成 8 片的草莓披薩，被妙妙吃了 5 片。妙妙是吃了幾個披薩？",
        layout: "equal-pizza-8",
        num: 5,
        den: 8,
        options: [
          { id: "5/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">5</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' },
          { id: "3/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' },
          { id: "8/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">8</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' }
        ],
        answer: "5/8",
        misconceptionSpeech: "答錯囉！吃掉 5 片，就是 5 個八分之一，也就是八分之五個披薩！"
      },
      {
        type: "select-card",
        desc: "一個平分成 8 片的草莓披薩，被妙妙吃了 2 片。妙妙是吃了幾個披薩？",
        speechDesc: "一個平分成 8 片的草莓披薩，被妙妙吃了 2 片。妙妙是吃了幾個披薩？",
        layout: "equal-pizza-8",
        num: 2,
        den: 8,
        options: [
          { id: "2/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">2</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' },
          { id: "6/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">6</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' },
          { id: "8/8", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">8</span></span><span class="frac-row"><span class="frac-cell frac-den">8</span></span></span> 個' }
        ],
        answer: "2/8",
        misconceptionSpeech: "答錯囉！吃掉 2 片，就是 2 個八分之一，也就是八分之二個披薩！"
      },
      {
        type: "select-card",
        desc: "爸爸把一個圓形巧克力披薩分成 4 塊，如圖。弟弟拿了其中的 1 塊，是拿了 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">4</span></span></span> 個披薩嗎？",
        speechDesc: "爸爸把一個圓形巧克力披薩分成 4 塊，如圖。弟弟拿了其中的 1 塊，是拿了四分之一個披薩嗎？",
        layout: "split-unequal-pizza-4",
        pieces: 4,
        options: [
          { id: "yes", text: "是，因為分成了 4 塊" },
          { id: "no", text: "不是，因為這 4 塊沒有一樣大，所以不是平分" }
        ],
        answer: "no",
        misconceptionSpeech: "不對喔！這四塊披薩大小不一樣，沒有均勻平分，就不能用四分之一表示！"
      },
      {
        type: "select-card",
        desc: "下面哪一個正方形紙的塗色部分是 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">3</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">4</span></span></span> 張色紙？",
        speechDesc: "下面哪一個正方形紙的塗色部分是四分之三張色紙？",
        layout: "select-paper-options",
        options: [
          { id: "A", text: "圖 A（平分成 4 份，塗色 3 份）" },
          { id: "B", text: "圖 B（分成 4 份但大小不一樣）" }
        ],
        answer: "A",
        misconceptionSpeech: "注意喔！必須是均勻平分的一樣大四份，塗色三份才是四分之三張色紙！"
      }
    ] 
  },
  { 
    levelNum: 2, 
    name: "魔法甜點包裝盒", 
    questions: [
      LEARN_QUESTIONS[5],
      LEARN_QUESTIONS[6],
      LEARN_QUESTIONS[7],
      LEARN_QUESTIONS[8],
      LEARN_QUESTIONS[9],
      BATTLE_QUESTIONS[11],
      BATTLE_QUESTIONS[13],
      BATTLE_QUESTIONS[15],
      BATTLE_QUESTIONS[16],
      BATTLE_QUESTIONS[17],
      BATTLE_QUESTIONS[18],
      BATTLE_QUESTIONS[19],
      {
        type: "interactive-click",
        desc: "一盒杯子蛋糕有 12 個。小兔想要買 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">4</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒，請在包裝盒中點選需要的杯子蛋糕數量。",
        speechDesc: "一盒杯子蛋糕有 12 個。小兔想要買十二分之四盒，請在包裝盒中點選需要的杯子蛋糕數量。",
        layout: "cupcake-discrete-12",
        total: 12,
        answer: 4,
        misconceptionSpeech: "不對喔！一盒有十二個，十二分之四盒就是十二個中的四個，請點選四個！"
      },
      {
        type: "interactive-click",
        desc: "一盒杯子蛋糕有 12 個。小兔想要買 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">6</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒，請在包裝盒中點選需要的杯子蛋糕數量。",
        speechDesc: "一盒杯子蛋糕有 12 個。小兔想要買十二分之六盒，請在包裝盒中點選需要的杯子蛋糕數量。",
        layout: "cupcake-discrete-12",
        total: 12,
        answer: 6,
        misconceptionSpeech: "答錯囉！一盒有十二個，十二分之六盒就是十二個中的六個，也就是半盒，請點選六個！"
      },
      {
        type: "select-card",
        desc: "一盒餅乾有 6 個，平分給 6 個人。妙妙分到 3 個，也可以說是分到幾盒餅乾？",
        speechDesc: "一盒餅乾有 6 個，平分給 6 個人。妙妙分到 3 個，也可以說是分到幾盒餅乾？",
        layout: "macaron-discrete-6",
        options: [
          { id: "3/6", text: '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">3</span></span><span class="frac-row"><span class="frac-cell frac-den">6</span></span></span> 盒' },
          { id: "1", text: '1 盒' },
          { id: "6", text: '6 盒' }
        ],
        answer: "3/6",
        misconceptionSpeech: "答錯囉！一盒有六個，妙妙拿到三個，就是六分之三個，也就是半盒！"
      }
    ] 
  },
  { 
    levelNum: 3, 
    name: "魔法點心輸送帶", 
    questions: [
      LEARN_QUESTIONS[10],
      LEARN_QUESTIONS[11],
      LEARN_QUESTIONS[12],
      LEARN_QUESTIONS[13],
      LEARN_QUESTIONS[14],
      BATTLE_QUESTIONS[3],
      BATTLE_QUESTIONS[5],
      BATTLE_QUESTIONS[6],
      BATTLE_QUESTIONS[7],
      BATTLE_QUESTIONS[24],
      {
        type: "select-card",
        desc: "<span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">7</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 公尺是幾個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 公尺合起來的？",
        speechDesc: "十分之七公尺是幾個十分之一公尺合起來的？",
        layout: "unit-fraction-sum",
        num: 7,
        den: 10,
        unit: "公尺",
        options: [
          { id: "7", text: "7 個" },
          { id: "10", text: "10 個" },
          { id: "17", text: "17 個" }
        ],
        answer: "7",
        misconceptionSpeech: "不對喔！十分之七是由七個十分之一合起來的，分子是幾就是幾個！"
      },
      {
        type: "select-card",
        desc: "<span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">8</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 條紙帶是幾個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 條紙帶合起來的？",
        speechDesc: "十二分之八條紙帶是幾份十二分之一條紙帶合起來的？",
        layout: "unit-fraction-sum",
        num: 8,
        den: 12,
        unit: "條",
        options: [
          { id: "8", text: "8 個" },
          { id: "12", text: "12 個" },
          { id: "4", text: "4 個" }
        ],
        answer: "8",
        misconceptionSpeech: "答錯囉！分子是八，代表是由八個十二分之一合起來的！"
      },
      {
        type: "select-card",
        desc: "一條紙帶平分成 6 份。6 個 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">1</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">6</span></span></span> 條紙帶合起來是幾條紙帶？",
        speechDesc: "一條紙帶平分成 6 份。6 個六分之一條紙帶合起來是幾條紙帶？",
        layout: "equals-one-concept",
        den: 6,
        unit: "條",
        options: [
          { id: "1", text: "1 條" },
          { id: "6", text: "6 條" },
          { id: "12", text: "12 條" }
        ],
        answer: "1",
        misconceptionSpeech: "答錯囉！六份裡面的六份都拿到了，也就是六分之六條，剛好就是一條完整的紙帶！"
      },
      {
        type: "interactive-drag",
        desc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
        speechDesc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
        layout: "swiss-roll-axis-10",
        targets: [
          { ratio: 0.2, label: "2/10" },
          { ratio: 0.6, label: "6/10" },
          { ratio: 0.9, label: "9/10" }
        ]
      },
      {
        type: "interactive-drag",
        desc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
        speechDesc: "一條長 1 公尺的瑞士捲平分成 10 份。請拖曳分數盤子，放到輸送帶數線對應的位置上。",
        layout: "swiss-roll-axis-10",
        targets: [
          { ratio: 0.1, label: "1/10" },
          { ratio: 0.5, label: "5/10" },
          { ratio: 0.8, label: "8/10" }
        ]
      }
    ] 
  },
  { 
    levelNum: 4, 
    name: "魔法天平比大小", 
    questions: [
      LEARN_QUESTIONS[15],
      LEARN_QUESTIONS[16],
      LEARN_QUESTIONS[17],
      LEARN_QUESTIONS[18],
      LEARN_QUESTIONS[19],
      BATTLE_QUESTIONS[27],
      BATTLE_QUESTIONS[29],
      {
        type: "interactive-scale",
        desc: "請點選符號，比較兩個分數的大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">2</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">9</span></span></span> 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">9</span></span></span>。",
        speechDesc: "請比較兩個分數的大小：九分之二和九分之五哪一個比較大？",
        layout: "scale-fraction-compare",
        leftVal: 2/9,
        rightVal: 5/9,
        leftLabel: "2/9",
        rightLabel: "5/9",
        leftVisual: "pizza-2/9",
        rightVisual: "pizza-5/9",
        answer: "<",
        misconceptionSpeech: "答錯囉！分母相同時，分子越小，分數就越小。九分之二小於九分之五！"
      },
      {
        type: "interactive-scale",
        desc: "請點選符號，比較兩個分數的大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">8</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">5</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span>。",
        speechDesc: "請比較兩個分數的大小：十分之八和十分之五哪一個比較大？",
        layout: "scale-fraction-compare",
        leftVal: 8/10,
        rightVal: 5/10,
        leftLabel: "8/10",
        rightLabel: "5/10",
        leftVisual: "pizza-8/10",
        rightVisual: "pizza-5/10",
        answer: ">",
        misconceptionSpeech: "答錯囉！分母相同時，分子大代表的分量多。十分之八大於十分之五！"
      },
      {
        type: "interactive-scale",
        desc: "請點選符號，比較兩個分數的大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">6</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">9</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span>。",
        speechDesc: "請比較兩個分數的大小：十二分之六和十二分之九哪一個比較大？",
        layout: "scale-fraction-compare",
        leftVal: 6/12,
        rightVal: 9/12,
        leftLabel: "6/12",
        rightLabel: "9/12",
        leftVisual: "pizza-6/12",
        rightVisual: "pizza-9/12",
        answer: "<",
        misconceptionSpeech: "答錯囉！分母都是十二，分子六小於九，所以十二分之六小於十二分之九！"
      },
      {
        type: "interactive-scale",
        desc: "一盒巧克力有 12 顆。請比較大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">8</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒 與 6 顆巧克力。",
        speechDesc: "請比較大小：十二分之八盒與 6 顆巧克力哪一個多？",
        layout: "scale-discrete-compare",
        leftVal: 8/12,
        rightVal: 6/12,
        leftLabel: "8/12 盒",
        rightLabel: "6 顆",
        leftVisual: "discrete-5",
        rightVisual: "discrete-8",
        answer: ">",
        misconceptionSpeech: "答錯囉！一盒有十二顆，十二分之八盒代表八顆。八顆比六顆多，所以十二分之八盒大於六顆！"
      },
      {
        type: "interactive-scale",
        desc: "一盒糖果有 10 顆。請比較大小： <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">3</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 盒 與 5 顆糖果。",
        speechDesc: "請比較大小：十分之三盒與 5 顆糖果哪一個多？",
        layout: "scale-discrete-compare",
        leftVal: 3/10,
        rightVal: 5/10,
        leftLabel: "3/10 盒",
        rightLabel: "5 顆",
        leftVisual: "discrete-5",
        rightVisual: "discrete-8",
        answer: "<",
        misconceptionSpeech: "答錯囉！一盒有十顆，十分之三盒代表三顆。三顆比五顆少，所以十分之三盒小於五顆！"
      },
      {
        type: "interactive-scale",
        desc: "一盒巧克力有 12 顆。請比較大小：1 盒 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">12</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">12</span></span></span> 盒。",
        speechDesc: "一盒巧克力有 12 顆。請比較大小：1 盒與十二分之十二盒哪一個多？",
        layout: "scale-whole-compare",
        leftVal: 1.0,
        rightVal: 1.0,
        leftLabel: "1 盒",
        rightLabel: "12/12 盒",
        leftVisual: "whole-1",
        rightVisual: "discrete-10",
        answer: "=",
        misconceptionSpeech: "答錯囉！十二分之十二盒代表十二顆，也就是完整的一盒。所以 1 盒等於十二分之十二盒！"
      },
      {
        type: "interactive-scale",
        desc: "一盒水蜜桃有 10 顆。請比較大小：1 盒 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">8</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">10</span></span></span> 盒。",
        speechDesc: "一盒水蜜桃有 10 顆。請比較大小：1 盒與十分之八盒哪一個多？",
        layout: "scale-whole-compare",
        leftVal: 1.0,
        rightVal: 8/10,
        leftLabel: "1 盒",
        rightLabel: "8/10 盒",
        leftVisual: "whole-1",
        rightVisual: "discrete-10",
        answer: ">",
        misconceptionSpeech: "答錯囉！一盒有十顆，十分之八盒代表八顆。十顆比八顆多，所以一盒大於十分之八盒！"
      },
      {
        type: "interactive-scale",
        desc: "一盒甜甜圈有 6 顆。請比較大小：1 盒 與 <span class=\"fraction\"><span class=\"frac-row\"><span class=\"frac-cell frac-num\">6</span></span><span class=\"frac-row\"><span class=\"frac-cell frac-den\">6</span></span></span> 盒。",
        speechDesc: "一盒甜甜圈有 6 顆。請比較大小：1 盒與六分之六盒哪一個多？",
        layout: "scale-whole-compare",
        leftVal: 1.0,
        rightVal: 1.0,
        leftLabel: "1 盒",
        rightLabel: "6/6 盒",
        leftVisual: "whole-1",
        rightVisual: "discrete-10",
        answer: "=",
        misconceptionSpeech: "答錯囉！六分之六盒代表六顆，也就是整盒。所以 1 盒等於六分之六盒！"
      }
    ] 
  }
];

// 初始化載入 (防競態條件)
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    GameApp.init();
  });
} else {
  GameApp.init();
}


