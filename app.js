(function () {
  'use strict';

  /* ---------- 基础元素 ---------- */
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const dotsBox = document.getElementById('dots');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const progress = document.getElementById('progress');
  const chapterLabel = document.getElementById('chapter-label');
  const counter = document.getElementById('counter');
  const pet = document.getElementById('pet');
  const petText = document.getElementById('pet-text');
  const petChapter = document.getElementById('pet-chapter');
  const petStatus = document.getElementById('pet-status');

  let index = 0;
  let locked = false;

  /* ---------- 每页讲解词（只念标题） ---------- */
  const petLines = [
    'MBTI 为什么这么火',
    '目录',
    'MBTI 的基础科普介绍和当代流行现象',
    '当代青年心理需求：MBTI 爆火的底层逻辑',
    '社交属性与网络传播：MBTI 的破圈密码',
    'MBTI 的局限性与心理学争议',
    '如何破除 MBTI 的迷思：大学生合理使用建议',
    '拓展思考：人格成长与人格标签',
    '认知自我，是一场终身建构',
    '人员的分工情况'
  ];

  /* ---------- 场景配置 ---------- */
  const scenes = {
    morning:   { icon: '☀', label: '春日 · 晨光', caption: '晨间光影' },
    afternoon: { icon: '🌤', label: '午后 · 林间', caption: '斑驳树影' },
    golden:    { icon: '🌇', label: '黄昏 · 山谷', caption: '金色时刻' }
  };
  const sceneOrder = ['morning', 'afternoon', 'golden'];
  let motionOn = true;

  /* ---------- 渲染导航点 ---------- */
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.className = 'dock-dot' + (i === 0 ? ' on' : '');
    dot.type = 'button';
    dot.title = slide.dataset.chapter || ('第 ' + (i + 1) + ' 页');
    dot.setAttribute('aria-label', dot.title);
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      go(i);
    });
    dotsBox.appendChild(dot);
  });
  const dots = Array.from(dotsBox.children);

  /* ---------- 翻页 ---------- */
  function setScene(scene) {
    document.body.dataset.scene = scene;
    const cfg = scenes[scene] || scenes.morning;
    document.getElementById('weather-icon').textContent = cfg.icon;
    document.getElementById('scene-label').textContent = cfg.label;
    document.getElementById('scene-caption').textContent = cfg.caption;
  }

  function revealSlide(slide) {
    const items = Array.from(slide.querySelectorAll('.reveal'));
    items.forEach((el, i) => {
      el.style.animationDelay = Math.min(i * 70, 520) + 'ms';
    });
  }

  function render() {
    const slide = slides[index];
    const chapter = slide.dataset.chapter || '';

    chapterLabel.textContent = chapter;
    petChapter.textContent = chapter;
    counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    progress.style.width = ((index + 1) / total * 100) + '%';

    dots.forEach((d, i) => d.classList.toggle('on', i === index));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;

    if (slide.dataset.scene) setScene(slide.dataset.scene);

    petText.textContent = petLines[index] || '';
    petStatus.textContent = voiceOn ? '啾啾正在讲解…' : '点桌宠，可以再讲一遍';
    pet.dataset.state = 'idle';

    if (speaking) stopSpeak();
    // 语音开启时，翻页自动朗读本页标题
    if (voiceOn) speak(petLines[index] || '');
  }

  function go(target) {
    if (locked || target === index || target < 0 || target >= total) return;
    locked = true;

    const oldSlide = slides[index];
    oldSlide.classList.remove('active');
    oldSlide.classList.add('leaving');

    index = target;
    const newSlide = slides[index];
    newSlide.classList.add('active');
    revealSlide(newSlide);

    history.replaceState(null, '', '#' + (index + 1));
    render();

    window.setTimeout(() => {
      oldSlide.classList.remove('leaving');
      locked = false;
    }, 320);
  }

  function next() { if (index < total - 1) go(index + 1); }
  function prev() { if (index > 0) go(index - 1); }

  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  /* ---------- 点击页面翻页 ---------- */
  document.querySelector('.pages').addEventListener('click', (e) => {
    if (e.target.closest('a,button')) return;
    const sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length > 0) return;
    next();
  });

  /* ---------- 键盘 & 触摸 ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') {
      e.preventDefault(); next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); prev();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault(); toggleFullscreen();
    }
  });

  let touchY = 0;
  document.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dy) > 55) { dy < 0 ? next() : prev(); }
  }, { passive: true });

  /* ---------- 顶部工具 ---------- */
  document.getElementById('lighting').addEventListener('click', (e) => {
    e.stopPropagation();
    const current = document.body.dataset.scene || 'morning';
    const nextScene = sceneOrder[(sceneOrder.indexOf(current) + 1) % sceneOrder.length];
    setScene(nextScene);
  });

  const motionBtn = document.getElementById('motion');
  motionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    motionOn = !motionOn;
    motionBtn.setAttribute('aria-pressed', String(motionOn));
    motionBtn.querySelector('.tool-label').textContent = motionOn ? '动效开' : '动效关';
    document.documentElement.style.setProperty('--anim-play', motionOn ? 'running' : 'paused');
    document.body.classList.toggle('no-motion', !motionOn);
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  document.getElementById('fullscreen').addEventListener('click', (e) => {
    e.stopPropagation(); toggleFullscreen();
  });

  /* ---------- 桌宠 ---------- */
  document.getElementById('pet-replay').addEventListener('click', (e) => {
    e.stopPropagation();
    replayPet();
  });

  const petVoiceBtn = document.getElementById('pet-voice');
  let speaking = false;
  let voiceOn = false;

  petVoiceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    voiceOn = !voiceOn;

    if (!voiceOn && speaking) stopSpeak();

    petVoiceBtn.setAttribute('aria-pressed', String(voiceOn));
    petVoiceBtn.querySelector('span').textContent = voiceOn ? '关声音' : '开声音';
    petStatus.textContent = voiceOn ? '语音讲解已开启' : '点桌宠，可以再讲一遍';
    if (voiceOn) speak(petLines[index]);
  });

  /* ---------- 桌宠声音：挑选柔和自然的中文语音 ---------- */
  let naturalVoice = null;
  const softVoiceKeywords = ['Mei', 'Ting', 'Xiaoxiao', 'Yunxi', 'Yunjian', 'Yunyang', 'Siri', 'Natural', 'Premium', 'Neural', 'Online', 'Natural Sound', 'Google'];
  function pickVoice() {
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const zh = voices.filter(v => /zh|cmn|Chinese/i.test(v.lang) || /Chinese|中文|普通话/i.test(v.name));
    if (!zh.length) return null;
    // 优先柔和/自然音色，避免默认机械音
    const scored = zh.map(v => {
      const n = v.name;
      let s = 0;
      if (softVoiceKeywords.some(k => n.includes(k))) s += 5;
      if (/female|女|女音|女声/i.test(n)) s += 2;
      if (/online|neural|natural|premium|google/i.test(n)) s += 4;
      if (/robot|default|ting-ting/i.test(n)) s -= 3;   // 旧版 Ting-Ting 较机械
      return { v, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored[0].v;
  }
  if ('speechSynthesis' in window) {
    naturalVoice = pickVoice();
    window.speechSynthesis.onvoiceschanged = () => { naturalVoice = pickVoice(); populateVoiceSelect(); };
  }

  // 语音下拉框：列出系统所有中文语音，方便现场手动挑一个最自然的
  const voiceSelect = document.getElementById('pet-voice-select');
  function populateVoiceSelect() {
    if (!voiceSelect || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.filter(v => /zh|cmn|Chinese/i.test(v.lang) || /Chinese|中文|普通话/i.test(v.name));
    const list = zh.length ? zh : voices;
    voiceSelect.innerHTML = '';
    list.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = v.name + (v.default ? '（默认）' : '');
      voiceSelect.appendChild(opt);
    });
    // 默认选中当前自动挑选的音色
    if (naturalVoice) voiceSelect.value = naturalVoice.name;
  }
  populateVoiceSelect();
  // 某些浏览器语音列表加载较慢，多试几次
  [400, 1000, 2000].forEach(t => window.setTimeout(populateVoiceSelect, t));
  if (voiceSelect) {
    voiceSelect.addEventListener('change', (e) => {
      const v = window.speechSynthesis.getVoices().find(x => x.name === e.target.value);
      if (v) naturalVoice = v;
      if (voiceOn) speak(petLines[index] || '');
    });
  }

  // 仅用于朗读的文本润色：把 MBTI 等英文缩写换成中文谐音，避免一个字母一个字母地念
  function toSpokenText(text) {
    return text
      .replace(/MBTI/g, '艾姆毕踢艾')
      .replace(/NT/g, '恩踢')
      .replace(/NF/g, '恩艾夫')
      .replace(/SJ/g, '艾斯杰')
      .replace(/SP/g, '艾斯皮');
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      petStatus.textContent = '当前浏览器不支持语音';
      return;
    }
    window.speechSynthesis.cancel();
    if (!naturalVoice) naturalVoice = pickVoice();
    const utter = new SpeechSynthesisUtterance(toSpokenText(text));
    utter.lang = 'zh-CN';
    if (naturalVoice) utter.voice = naturalVoice;
    utter.rate = 0.88;   // 稍慢，更柔和
    utter.pitch = 0.94;  // 略低音高，温暖不尖锐
    utter.volume = 1;
    utter.onstart = () => {
      speaking = true;
      pet.dataset.state = 'talking';
      petStatus.textContent = '啾啾正在讲解…';
    };
    utter.onend = () => stopSpeak();
    utter.onerror = () => stopSpeak();
    window.speechSynthesis.speak(utter);
  }

  function stopSpeak() {
    speaking = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    pet.dataset.state = 'idle';
    petStatus.textContent = '点桌宠，可以再讲一遍';
  }

  function replayPet() {
    pet.dataset.state = 'pointing';
    petText.textContent = '';
    const text = petLines[index] || '';
    let i = 0;
    window.clearInterval(pet._timer);
    pet._timer = window.setInterval(() => {
      petText.textContent = text.slice(0, i++);
      if (i > text.length) {
        window.clearInterval(pet._timer);
        pet.dataset.state = 'happy';
        window.setTimeout(() => { pet.dataset.state = 'idle'; }, 1400);
      }
    }, 28);
    if (voiceOn) speak(text);
  }

  /* ---------- 指针视差 ---------- */
  const root = document.documentElement;
  document.addEventListener('pointermove', (e) => {
    if (!motionOn) return;
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    root.style.setProperty('--pointer-x', (x * 100) + '%');
    root.style.setProperty('--pointer-y', (y * 100) + '%');
    root.style.setProperty('--parallax-x', ((x - .5) * -12).toFixed(2) + 'px');
    root.style.setProperty('--parallax-y', ((y - .5) * -8).toFixed(2) + 'px');
  }, { passive: true });

  /* ---------- 大气粒子 ---------- */
  const canvas = document.getElementById('atmosphere');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, particles = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(window.innerWidth * dpr);
    H = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 42; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.2 + 0.5,
      vx: (Math.random() - .5) * 0.22,
      vy: -(Math.random() * 0.3 + 0.06),
      a: Math.random() * 0.45 + 0.12,
      hue: Math.random() > .55 ? 48 : 92
    });
  }

  let rafId = null;
  function loop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (motionOn) {
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = window.innerHeight + 10; p.x = Math.random() * window.innerWidth; }
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',72%,72%,' + p.a + ')';
        ctx.fill();
      });
    }
    rafId = requestAnimationFrame(loop);
  }
  loop();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(loop);
    }
  });

  /* ---------- 初始化 ---------- */
  function init() {
    const hash = parseInt((location.hash || '').replace('#', ''), 10);
    index = (!isNaN(hash) && hash >= 1 && hash <= total) ? hash - 1 : 0;

    slides.forEach((s, i) => {
      s.classList.remove('active', 'leaving');
      if (i === index) s.classList.add('active');
    });

    revealSlide(slides[index]);
    render();
    history.replaceState(null, '', '#' + (index + 1));
  }

  init();

  window.addEventListener('hashchange', () => {
    const hash = parseInt((location.hash || '').replace('#', ''), 10);
    if (!isNaN(hash) && hash >= 1 && hash <= total) go(hash - 1);
  });
})();
