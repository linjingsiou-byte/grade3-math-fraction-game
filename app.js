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
  battleQuestionQueue: [],  // 對戰隨機題目陣列
  lockedOptions: [],        // 對戰中已被選錯而鎖定的選項

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
    this.battleQuestionQueue = [];
    this.lockedOptions = [];

    this.selectedOption = null;
    this.selectedItemsCount = 0;
    this.scaleSelectedOp = null;
    this.draggedElementsCount = 0;
    this.dragPlacements = {};
  },

  getCurrentQuestion() {
    if (this.gameMode === 'learn') {
      return this.currentLevelQuestions[this.currentQuestionIdx];
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

    // 7. 鍵盤監聽事件 (A 搶答, L 搶答)
    window.addEventListener('keydown', (e) => {
      if (GameState.gameMode !== 'battle') return;
      if (e.target.tagName === 'INPUT') return;

      if (e.code === 'KeyA') {
        this.handleBuzzerPress('A');
      } else if (e.code === 'KeyL') {
        this.handleBuzzerPress('B');
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

      if (!GameState.buzzerLocked) {
        this.footerHintText.textContent = "⚡ 雙方準備... 請按 A 鍵或 L 鍵進行魔法搶答！";
      } else {
        const pName = GameState.currentPlayer === 'A' ? '玩家 A (🐱)' : '玩家 B (🐶)';
        const turnLabel = GameState.isPassOnTurn ? '【接力作答】' : '【搶答作答】';
        this.footerHintText.textContent = `${turnLabel} 現在由 ${pName} 進行回答！`;
      }
    }
  },

  loadQuestion() {
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

    this.submitBtn.disabled = true;
    this.submitBtn.classList.remove('hidden');
    this.nextBtn.classList.add('hidden');
    this.workspaceArea.style.pointerEvents = 'auto';
    this.hideMessage();

    if (GameState.gameMode === 'battle') {
      this.workspaceOverlay.classList.remove('hidden');
      this.buzzerBtnA.disabled = false;
      this.buzzerBtnB.disabled = false;
      this.buzzerBtnA.classList.remove('buzzer-active');
      this.buzzerBtnB.classList.remove('buzzer-active');
    }

    this.questionText.innerHTML = q.desc;
    this.renderWorkspace(q);

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
    if (GameState.buzzerLocked) return;
    if (GameState.isPassOnTurn) return;

    AudioSynth.playBuzzerSuccess();
    
    GameState.buzzerLocked = true;
    GameState.buzzerWinner = player;
    GameState.currentPlayer = player;

    this.workspaceOverlay.classList.add('hidden');

    if (player === 'A') {
      this.buzzerBtnA.classList.add('buzzer-active');
      this.buzzerBtnB.disabled = true;
    } else {
      this.buzzerBtnB.classList.add('buzzer-active');
      this.buzzerBtnA.disabled = true;
    }

    this.updateStatusUI();

    const announceMsg = player === 'A' ? '玩家 A 搶答成功！請作答。' : '玩家 B 搶答成功！請作答。';
    this.showMessage(`⚡ ${announceMsg}`, "info");
    SpeechManager.speak(announceMsg);
  },

  // ==========================================
  // 7. 互動工作區繪製引擎
  // ==========================================
  renderWorkspace(q) {
    this.workspaceArea.innerHTML = '';
    
    if (GameState.gameMode === 'battle') {
      this.workspaceArea.appendChild(this.workspaceOverlay);
    }

    if (q.layout === 'split-unequal-pizza') {
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
  },

  renderUnequalPizza() {
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
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
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
    box.style.width = '300px';
    box.style.padding = '16px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
    box.appendChild(label);

    const chocolates = Array(8).fill('🍫');
    chocolates.forEach((c) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      itemWrapper.style.width = '60px';
      itemWrapper.style.height = '60px';
      
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
    box.style.width = '380px';
    box.style.padding = '16px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
    box.appendChild(label);

    const jellies = Array(10).fill('🍮');
    jellies.forEach((j) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      itemWrapper.style.width = '60px';
      itemWrapper.style.height = '60px';
      
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
    box.style.width = '340px';
    box.style.height = 'auto';
    box.style.padding = '16px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
    box.appendChild(label);

    const cookies = Array(12).fill('🍪');
    cookies.forEach((c) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      itemWrapper.style.width = '60px';
      itemWrapper.style.height = '60px';
      
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
    box.style.width = '280px';
    box.style.padding = '16px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
    box.appendChild(label);

    for (let i = 0; i < 9; i++) {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      itemWrapper.style.width = '60px';
      itemWrapper.style.height = '60px';
      
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
    box.style.width = '280px';
    box.style.padding = '16px';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
    box.appendChild(label);

    for (let i = 0; i < 6; i++) {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'l2-item-wrapper';
      itemWrapper.style.cursor = 'default';
      itemWrapper.style.width = '60px';
      itemWrapper.style.height = '60px';
      
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
    
    ctxA.beginPath();
    ctxA.arc(55, 55, 45, 0, Math.PI * 2);
    ctxA.fillStyle = '#ffb84d';
    ctxA.fill();
    ctxA.strokeStyle = '#b87333';
    ctxA.lineWidth = 4;
    ctxA.stroke();

    ctxA.strokeStyle = 'rgba(139, 69, 19, 0.4)';
    ctxA.lineWidth = 2;
    ctxA.beginPath();
    ctxA.moveTo(55, 10); ctxA.lineTo(55, 100);
    ctxA.moveTo(10, 55); ctxA.lineTo(100, 55);
    ctxA.stroke();

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
    
    ctxB.beginPath();
    ctxB.arc(55, 55, 45, 0, Math.PI * 2);
    ctxB.fillStyle = '#ff7ebb';
    ctxB.fill();
    ctxB.strokeStyle = '#b87333';
    ctxB.lineWidth = 4;
    ctxB.stroke();

    ctxB.strokeStyle = 'rgba(139, 69, 19, 0.4)';
    ctxB.lineWidth = 2;
    ctxB.beginPath();
    ctxB.moveTo(55, 10); ctxB.lineTo(55, 100);
    ctxB.moveTo(10, 55); ctxB.lineTo(100, 55);
    ctxB.stroke();

    const lblB = document.createElement('div');
    lblB.style.marginTop = '8px';
    lblB.style.fontWeight = '700';
    lblB.innerHTML = '<span class="fraction"><span class="frac-row"><span class="frac-cell frac-num">4</span></span><span class="frac-row"><span class="frac-cell frac-den">4</span></span></span> 個';
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
    box.style.width = itemsCount === 10 ? '450px' : '420px';
    box.style.height = itemsCount === 10 ? '240px' : '320px';

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
    box.appendChild(label);

    const svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgOverlay.setAttribute('class', 'l2-svg-overlay');
    box.appendChild(svgOverlay);

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
        
        this.updateSvgOutline(box, svgOverlay);
        this.submitBtn.disabled = (selectedCount === 0);
      });

      box.appendChild(wrapper);
    });

    container.appendChild(box);
    this.workspaceArea.appendChild(container);
  },

  updateSvgOutline(box, svg) {
    svg.innerHTML = '';
    const selectedWrappers = box.querySelectorAll('.l2-item-wrapper.selected');
    if (selectedWrappers.length === 0) return;

    const boxRect = box.getBoundingClientRect();
    const pad = 4;

    selectedWrappers.forEach(w => {
      const rect = w.getBoundingClientRect();
      const relX = rect.left - boxRect.left;
      const relY = rect.top - boxRect.top;
      
      const x = relX - pad;
      const y = relY - pad;
      const width = rect.width + pad * 2;
      const height = rect.height + pad * 2;

      const rectElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rectElement.setAttribute('class', 'l2-group-outline');
      rectElement.setAttribute('x', x);
      rectElement.setAttribute('y', y);
      rectElement.setAttribute('width', width);
      rectElement.setAttribute('height', height);
      rectElement.setAttribute('rx', 12);
      rectElement.setAttribute('ry', 12);
      
      svg.appendChild(rectElement);
    });
  },

  renderDonuts6() {
    const container = document.createElement('div');
    container.className = 'level2-container';

    const box = document.createElement('div');
    box.className = 'l2-box';
    box.style.gridTemplateColumns = 'repeat(3, 1fr)';
    box.style.width = '320px';

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-12px';
    label.style.left = '20px';
    label.style.background = 'var(--panel-border)';
    label.style.color = 'var(--text-color)';
    label.style.padding = '2px 10px';
    label.style.borderRadius = '10px';
    label.style.fontSize = '0.85rem';
    label.style.fontWeight = '700';
    label.textContent = '1 盒';
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
      ribbon10.innerHTML = `<span style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); font-size:1rem; font-weight:700;">${den}/${den} ${unit}</span>`;
      
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

    const beam = document.createElement('div');
    beam.className = 'l4-beam';
    beam.id = 'scale-beam';

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
    const pillar = document.createElement('div');
    pillar.className = 'l4-pillar';
    const base = document.createElement('div');
    base.className = 'l4-base';

    scaleSys.appendChild(pivot);
    scaleSys.appendChild(beam);
    scaleSys.appendChild(pillar);
    scaleSys.appendChild(base);

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
          
          this.tiltScale(op === '<' ? -5 : op === '>' ? 5 : 0);
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
    
    let lTotal = 9;
    if (q.leftLabel.includes('/8') || q.rightLabel.includes('/8')) lTotal = 8;
    if (q.leftLabel.includes('/10') || q.rightLabel.includes('/10')) lTotal = 10;
    if (q.leftLabel.includes('/12') || q.rightLabel.includes('/12')) lTotal = 12;

    if (q.leftVisual.startsWith('pizza-')) {
      const canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 80;
      const parts = Math.round(q.leftVal * lTotal);
      this.drawPizzaOnCanvas(canvas, parts, lTotal);
      leftVisual.appendChild(canvas);
    } else if (q.leftVisual === 'discrete-5') {
      const val = Math.round(q.leftVal * lTotal);
      let emojis = "";
      for (let i = 0; i < val; i++) emojis += "🍬";
      leftVisual.textContent = emojis;
      leftVisual.style.fontSize = '1.3rem';
      leftVisual.style.maxWidth = '80px';
      leftVisual.style.wordBreak = 'break-all';
    } else if (q.leftVisual === 'whole-1') {
      const canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 60;
      this.drawBoxedItems(canvas, lTotal, lTotal);
      leftVisual.appendChild(canvas);
    }
    
    const leftDesc = document.createElement('div');
    leftDesc.className = 'l4-pan-item-desc';
    leftDesc.innerHTML = this.formatFractionText(q.leftLabel);
    leftContainer.appendChild(leftVisual);
    leftContainer.appendChild(leftDesc);

    const rightVisual = document.createElement('div');
    rightVisual.style.fontSize = '2.5rem';
    
    if (q.rightVisual.startsWith('pizza-')) {
      const canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 80;
      const parts = Math.round(q.rightVal * lTotal);
      this.drawPizzaOnCanvas(canvas, parts, lTotal);
      rightVisual.appendChild(canvas);
    } else if (q.rightVisual === 'discrete-8') {
      const val = Math.round(q.rightVal * lTotal);
      let emojis = "";
      for (let i = 0; i < val; i++) emojis += "🍬";
      rightVisual.textContent = emojis;
      rightVisual.style.fontSize = '1.3rem';
      rightVisual.style.maxWidth = '80px';
      rightVisual.style.wordBreak = 'break-all';
    } else if (q.rightVisual === 'discrete-10') {
      const canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 60;
      const parts = Math.round(q.rightVal * lTotal);
      this.drawBoxedItems(canvas, parts, lTotal);
      rightVisual.appendChild(canvas);
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

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#42326b';
    ctx.fill();
    ctx.strokeStyle = '#5a468f';
    ctx.lineWidth = 2;
    ctx.stroke();

    const step = (Math.PI * 2) / total;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + step * parts);
    ctx.lineTo(cx, cy);
    ctx.fillStyle = '#ff7ebb';
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < total; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(-Math.PI / 2 + step * i) * r, cy + Math.sin(-Math.PI / 2 + step * i) * r);
      ctx.stroke();
    }
  },

  drawBoxedItems(canvas, selected, total) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.setLineDash([]);

    const cols = total === 12 ? 4 : 5;
    const rows = total === 12 ? 3 : 2;
    const cellW = (w - 14) / cols;
    const cellH = (h - 14) / rows;

    let drawn = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (drawn >= total) break;
        const x = 7 + c * cellW + cellW / 2;
        const y = 7 + r * cellH + cellH / 2;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);

        if (drawn < selected) {
          ctx.fillStyle = '#ffb800';
        } else {
          ctx.fillStyle = '#3a2b54';
        }
        ctx.fill();
        ctx.strokeStyle = '#23193a';
        ctx.lineWidth = 1;
        ctx.stroke();

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
    panLeft.style.transform = `rotate(${-deg}deg)`;
    panRight.style.transform = `rotate(${-deg}deg)`;
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
          this.tiltScale(diff < 0 ? -12 : diff > 0 ? 12 : 0);
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
          this.tiltScale(diff < 0 ? -12 : diff > 0 ? 12 : 0);
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
        } else {
          this.triggerMisconceptionVisuals(q);

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
    if (q.layout === 'split-unequal-pizza') {
      const canvas = document.querySelector('.l1-visual-canvas');
      if (canvas) {
        let flash = true;
        const interval = setInterval(() => {
          const ctx = canvas.getContext('2d');
          ctx.strokeStyle = flash ? '#ff4a70' : '#8b4513';
          ctx.lineWidth = 5;
          const cx = 120, cy = 120, r = 100;
          const angles = [0, Math.PI * 0.4, Math.PI * 0.95];
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
        
        ctx.clearRect(0,0,140,140);
        
        let den = q.leftLabel.includes('/8') ? 8 : q.leftLabel.includes('/10') ? 10 : 9;
        
        const step = (Math.PI * 2) / den;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + step * Math.round(q.leftVal * den));
        ctx.lineTo(cx, cy);
        ctx.fillStyle = 'rgba(0, 240, 181, 0.4)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + step * Math.round(q.rightVal * den));
        ctx.lineTo(cx, cy);
        ctx.fillStyle = 'rgba(255, 126, 187, 0.3)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < den; i++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(-Math.PI / 2 + step * i) * r, cy + Math.sin(-Math.PI / 2 + step * i) * r);
          ctx.stroke();
        }
      }
    } else if (q.layout === 'scale-discrete-compare') {
      this.tiltScale(-12);
    }
  },

  // ==========================================
  // 9. 關卡與結算管理器
  // ==========================================
  loadNextQuestion() {
    if (this.nextBtn.classList.contains('hidden')) return; // 防止重複點選下一題
    this.nextBtn.classList.add('hidden');
    SpeechManager.stop();
    
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
        layout: "split-unequal-pizza",
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


