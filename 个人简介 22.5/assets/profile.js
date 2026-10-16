
    // Resume data: edit this object to update profile content.
    const resume = {
      name: '李松鸿',
      politicalStatus: '共青团团员',
      phone: '15086146398',
      email: ['li-oct21-libra-h', 'qq.com'].join('@'),
      wechat: 'Li-Oct21-libra-h',
      qq: '2806902239',
      location: '贵州省黔南布依族苗族自治州瓮安县',
      highlights: [
        { value: '功能材料', label: '天津农学院本科专业' },
        { value: '第 7 名', label: '2025 年校运会 800 米' },
        { value: '2 项', label: '阿里云 AI 工程证书' },
        { value: '524.41 km', label: '累计跑步记录' }
      ],
      experience: {
        volunteer: {
          label: '志愿经历',
          items: [{
            org: '中国热带科学研究院', role: '志愿者', time: '2026 年 1 月', place: '海南省海口市',
            bullets: ['参与研究院相关志愿服务工作，按照组织安排完成服务任务。', '协助开展现场支持、信息传递及秩序维护等工作，配合团队保障活动顺利进行。', '在服务过程中提升沟通协作、责任意识与现场执行能力，遵守志愿服务纪律。']
          }]
        },
        campus: {
          label: '校园实践',
          items: [{
            org: '贵州省瓮安中学', role: '秋季运动会 800 米参赛者', time: '2025 年', place: '贵州省瓮安县',
            bullets: ['参加学校秋季运动会 800 米项目，通过赛前训练提升耐力、速度与比赛执行能力。', '在正式比赛中获得第七名，体现坚持、抗压与目标意识。', '长期坚持中长跑和足球运动，培养自律习惯与团队协作意识。']
          }]
        }
      },
      projects: {
        web: {
          label: '网页作品',
          items: [
            { name: '星际猎杀号', cover: 'assets/covers/star-hunter-gameplay.jpg', coverLabel: 'STAR HUNTER', coverTags: ['四关剧情 + 无尽模式', '三种战机', '双人合作'], teaser: '驾驶哨兵、突击者或幽灵战机，穿越深空弹幕，挑战多阶段首领。', subtitle: '个人原创 · Canvas 飞机大战', result: '使用原生 HTML、CSS 与 Canvas 制作科技风网页飞机大战，支持单人、双人合作、四关剧情与无尽模式，结合自动射击、量子炸弹和相位冲刺展开深空战斗。', link: 'star-hunter/index.html', stack: ['HTML5 Canvas', 'JavaScript', '响应式设计', 'PC / 移动端'], bullets: ['设计四个递增难度的剧情关卡、无尽模式、三类可选战机与多阶段 Boss 战。', '实现双人本地合作、强化道具、历史排名、战机强化及多套技能机制。', '适配键盘、鼠标和移动端触控操作，并同步优化首页布局，降低信息密度。'] },
            { name: '坦克大战', cover: 'assets/covers/tank-battle-lsh.jpg', coverLabel: 'TANK BATTLE', coverTags: ['六关战役', 'LSH 原创地图', '双人救援'], teaser: '在 LSH 字母构筑的校园战场中突破封锁、守住基地，与队友并肩作战。', subtitle: '个人原创 · Canvas 坦克游戏', result: '使用原生 HTML、CSS 与 Canvas 制作俯视角坦克对战游戏，围绕 LSH 原创地图完成六关战役与双人协作玩法。', link: 'tank-game/index.html', stack: ['HTML5 Canvas', 'JavaScript', '六关战役', 'PC / 移动端'], bullets: ['设计外围封锁等六张战役地图，并以浪尖儿大学社区图片作为战场底图。', '实现单人作战、双人协作、队友救援、关卡选择、排行榜与战斗金币强化系统。', '保留 LSH 字母障碍布局和原创地图标识，适配键盘、鼠标及移动端操作。'] }
          ]
        },
        learning: {
          label: '学习实践',
          items: [{ name: '人工智能工具与 Python 学习实践', subtitle: '个人学习实践 · 持续进行', result: '将工具学习转化为专业学习、数据处理和科研实践的基础能力。', stack: ['AI 工具', 'Python 基础', '资料整理'], bullets: ['自主学习人工智能工具和 Python 基础知识，逐步掌握 AI 辅助学习、信息整理与基础编程方法。', '使用 AI 工具拆解学习任务、整理知识要点和优化学习计划，提升自主学习效率。', '通过 Python 开展基础编程练习，尝试进行简单的数据处理和自动化任务。'] }]
        },
        sports: {
          label: '体育实践',
          items: [
            { name: '三年跑步，把坚持变成日常', subtitle: '中长跑 · 持续积累', result: '累计跑步记录 524.41 km。运动带来的改变，既体现在身体状态，也体现在面对学习与挑战时的耐心。', stack: ['中长跑', '长期坚持', '自我管理'], bullets: ['从开始跑步前到坚持后的状态变化，用照片与跑步记录留下成长轨迹。', '把长期目标拆成一次次出发，在重复练习中积累耐力和信心。'], link: '#sports' },
            { name: '800 米个人赛 · 第七名', subtitle: '2025 年秋季运动会 · 男子甲组', result: '参加贵州省瓮安中学校运会男子甲组 800 米项目，获得第七名。', stack: ['个人项目', '节奏控制', '专注与抗压'], bullets: ['通过赛前训练准备正式比赛，在赛道上检验自己的耐力与执行。', '比赛既是一次成绩记录，也是把日常坚持带上起跑线的过程。'], link: '#sports-results' },
            { name: '4×400 米接力 · 团体第五名', subtitle: '2025 年秋季运动会 · 班级团体', result: '代表班级参加男子甲组 4×400 米接力项目，获得团体第五名。', stack: ['田径接力', '团队协作', '集体荣誉'], bullets: ['在接力项目中为班级共同的目标尽一份力，让个人努力成为团队成绩的一部分。', '和同学一起参赛、互相加油，体会到协作与责任的分量。'], link: '#sports-results' },
            { name: '足球与校园运动', subtitle: '兴趣与日常 · 球场之外的成长', result: '保持对足球与中长跑的热爱，在个人运动和团队活动中体验不同的乐趣。', stack: ['足球', '同伴交流', '积极生活'], bullets: ['中长跑让我和自己较劲，足球让我重视观察、沟通与配合。', '把运动中积累的自律、协作和执行意识，带回学习与日常生活。'], link: '#sports-gallery' }
          ]
        }
      },
      skills: [
        { title: '编程与 AI', tags: ['Python（基础）', 'AI 工具应用', 'ima 知识库搭建', '数据处理（学习中）'] },
        { title: '语言能力', tags: ['中文', '英语'] },
        { title: '专业方向', tags: ['功能材料', '材料科学（学习中）', '科研实践（探索中）'] },
        { title: '综合能力', tags: ['资料整理', '任务执行', '沟通协作'] },
        { title: '兴趣爱好', tags: ['中长跑', '足球', '二次元', '王者荣耀', '游戏 ID：江户川·柯鸿'] }
      ],
      education: [
        { school: '天津农学院', degree: '本科 · 功能材料专业', time: '2026 年 9 月 2 日入学', bullets: ['计划系统学习材料科学基础、实验方法与专业应用。', '积极探索 AI 工具与 Python 在专业学习、数据处理及科研实践中的应用。'] },
        { school: '贵州省瓮安中学', degree: '高中', time: '2023 年 9 月—2026 年 6 月', bullets: ['完成高中阶段学习，持续参加中长跑和足球等校园体育活动。', '具备良好的学习能力、执行能力与团队协作意识。'] }
      ],
      credentials: ['阿里云 AI 工程高级证书', '阿里云 AI 工程初级证书', '2025 年秋季运动会男子甲组 800 米第七名', '2025 年秋季运动会男子甲组 4×400 米接力第五名（班级团体）'],
      portfolioImages: [
        { src: '3.jpg', title: '人工智能训练师初级证书' },
        { src: '4.jpg', title: '人工智能训练师高级证书' },
        { src: 'sports-awards.jpg', title: '2025 年秋季运动会个人及班级荣誉' }
      ],
      videoWorks: [
        { name: '高中时光 · 校园活动合集', meta: '校园记录 · 50 秒', src: 'assets/videos/video-work-04.mp4', poster: 'assets/videos/video-work-04.jpg' },
        { name: '天坛 · 影像创作', meta: '短视频 · 8 秒', src: 'video-work-1.mp4', poster: 'video-work-1.jpg' },
        { name: '天坛 · 实拍记录', meta: '短视频 · 12 秒', src: 'video-work-2.mp4', poster: 'video-work-2.jpg' },
        { name: '短视频作品 03', meta: '竖屏短视频 · 29 秒', src: 'video-work-3.mp4', poster: 'video-work-3.jpg' }
      ],
      webWorks: [
        { name: '李松鸿的专属星球', meta: '网页演示 · 20 秒', src: 'video-work-4.mp4', poster: 'video-work-4.jpg' },
        { name: '鹈鹕骑行日', meta: '网页演示 · 10 秒', src: 'video-work-5.mp4', poster: 'video-work-5.jpg' }
      ],
      currentWork: {
        title: '我正在做的事情',
        lead: 'AI 短剧的制作与创造：从故事、分镜到成片，用 AI 工具把想法做成完整的短剧作品。',
        tags: ['AI 短剧创作', '剧本与剧情设计', '分镜脚本', '角色形象生成', 'AI 图片创作', 'AI 视频生成', '剪辑与合成', '元一 AI 工作台'],
        media: [
          { type: 'video', src: 'ai-drama-clip.mp4', poster: 'ai-drama-clip.jpg', caption: '短剧片段' },
          { type: 'image', src: 'ai-drama-storyboard.png', caption: '分镜与角色设定 · 图片创作' },
          { type: 'image', src: 'ai-drama-studio.png', caption: '图片创作过程' },
          { type: 'image', src: 'ai-drama-character.jpg', caption: '制作的角色形象' }
        ]
      }
    };

    const icons = {
      pin: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2" stroke="currentColor" stroke-width="1.8"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none"><path d="M7.2 4.5 9.4 4l2 4.4-1.9 1.5a14.2 14.2 0 0 0 4.6 4.6l1.5-1.9 4.4 2-.5 2.2c-.3 1.4-1.6 2.4-3.1 2.2C9.9 18 6 14.1 4.9 7.6c-.3-1.5.8-2.8 2.3-3.1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      mail: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 3.5v4M16 3.5v4M4 10h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      award: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5" stroke="currentColor" stroke-width="1.8"/><path d="m9 13-1 7 4-2 4 2-1-7" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      briefcase: '<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="7" width="17" height="12.5" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3.5 12h17" stroke="currentColor" stroke-width="1.8"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.3-.7L4 20l1.5-4A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
    };

    const $ = (id) => document.getElementById(id);
    $('brandName').textContent = resume.name; $('heroName').textContent = resume.name; $('footerName').textContent = resume.name;
    $('emailBtn').href = `mailto:${resume.email}`;
    $('closingEmail').href = `mailto:${resume.email}`;
    $('heroBadges').innerHTML = ['功能材料', 'AI 创作', 'Python 学习中', '跑步爱好者'].map(x => `<span class="badge">${x}</span>`).join('');
    $('contactList').textContent = `来自${resume.location} · ${resume.politicalStatus}`;
    $('highlightGrid').innerHTML = resume.highlights.map(item => `<article class="highlight"><div class="highlight-value">${item.value}</div><div class="highlight-label">${item.label}</div></article>`).join('');
    $('navLinks').innerHTML = [['portfolio','作品'],['sports','体育'],['highlights','关于'],['experience','经历'],['projects','实践'],['skills','技能'],['education','教育'],['contact','联系']].map(([id,label]) => `<a class="nav-link" href="#${id}">${label}</a>`).join('');

    function renderTabs(data, tabsEl, panelsEl, prefix, type) {
      const entries = Object.entries(data);
      tabsEl.innerHTML = entries.map(([key, group], i) => `<button class="tab" type="button" role="tab" id="${prefix}-tab-${key}" aria-controls="${prefix}-panel-${key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${group.label}</button>`).join('');
      panelsEl.innerHTML = entries.map(([key, group], i) => {
        const content = type === 'experience' ? `<div class="timeline">${group.items.map(item => `<article class="timeline-item"><div class="timeline-dot">${icons.briefcase}</div><div class="card"><div class="card-top"><div><h3>${item.org}</h3><p class="card-subtitle">${item.role} · ${item.place}</p></div><time class="card-time">${item.time}</time></div><ul>${item.bullets.map(b => `<li>${b}</li>`).join('')}</ul></div></article>`).join('')}</div>` : `<div class="project-grid">${group.items.map(item => `<article class="card project-card${item.media ? ' has-media' : ''}"><div class="card-top"><div><h3>${item.name}</h3><p class="card-subtitle">${item.subtitle}</p></div></div><p class="project-result">${item.result}</p><ul>${item.bullets.map(b => `<li>${b}</li>`).join('')}</ul><div class="stack">${item.stack.map(s => `<span>${s}</span>`).join('')}</div>${item.media ? `<div class="project-media">${item.media.map(m => `<figure><a href="${m.src}" target="_blank" rel="noreferrer" aria-label="查看${m.caption}大图"><img src="${m.src}" alt="${m.caption}" loading="lazy" /></a><figcaption>${m.caption}</figcaption></figure>`).join('')}</div>` : ''}${item.link ? `<div class="project-actions"><a class="project-link" href="${item.link}" ${item.link.startsWith('#') ? '' : 'target="_blank" rel="noopener noreferrer"'} aria-label="${item.link.startsWith('#') ? '查看' : '在线体验'}${item.name}">${item.link.startsWith('#') ? '查看体育记录' : '在线体验'} <span aria-hidden="true">${item.link.startsWith('#') ? '↓' : '↗'}</span></a></div>` : ''}</article>`).join('')}</div>`;
        return `<div class="tab-panel ${i === 0 ? 'active' : ''}" role="tabpanel" id="${prefix}-panel-${key}" aria-labelledby="${prefix}-tab-${key}" ${i !== 0 ? 'hidden' : ''}>${content}</div>`;
      }).join('');
      const tabs = [...tabsEl.querySelectorAll('[role="tab"]')];
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activate(i));
        tab.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); activate((i + 1) % tabs.length); } if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); activate((i - 1 + tabs.length) % tabs.length); } if (e.key === 'Home') { e.preventDefault(); activate(0); } if (e.key === 'End') { e.preventDefault(); activate(tabs.length - 1); } });
      });
      function activate(index) { tabs.forEach((t, j) => { const panel = $(t.getAttribute('aria-controls')); const active = j === index; t.setAttribute('aria-selected', active); t.tabIndex = active ? 0 : -1; panel.hidden = !active; panel.classList.toggle('active', active); }); tabs[index].focus(); }
    }
    renderTabs(resume.experience, $('experienceTabs'), $('experiencePanels'), 'experience', 'experience');
    renderTabs(resume.projects, $('projectTabs'), $('projectPanels'), 'project', 'project');
    $('skillGrid').innerHTML = resume.skills.map(group => `<article class="skill-group"><h3>${group.title}</h3><div class="skill-tags">${group.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}</div></article>`).join('');
    const currentWork = resume.currentWork;
    if (currentWork) {
      const clip = currentWork.media.find(item => item.type === 'video');
      $('aiPortfolioGroup').innerHTML = `
        <div class="ai-copy"><p class="section-kicker">IN PROGRESS / 正在探索</p><h3 id="aiPortfolioTitle">用 AI，讲一个自己的故事。</h3><p>${currentWork.lead}</p><div class="skill-tags">${currentWork.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}</div></div>
        <div class="ai-media"><video src="${clip.src}" poster="${clip.poster}" controls preload="none" playsinline aria-label="AI 短剧片段"></video><details class="ai-process"><summary>看看制作过程与角色设定</summary><div class="skill-media">${currentWork.media.filter(item => item.type === 'image').map(item => `<figure><a href="${item.src}" target="_blank" rel="noopener noreferrer" aria-label="查看${item.caption}大图"><img src="${item.src}" alt="${item.caption}" loading="lazy" decoding="async" /></a><figcaption>${item.caption}</figcaption></figure>`).join('')}</div></details></div>`;
    }
    $('educationGrid').innerHTML = resume.education.map(item => `<article class="edu-card"><h3>${item.school}</h3><p class="edu-meta">${item.degree} · ${item.time}</p><ul>${item.bullets.map(b => `<li>${b}</li>`).join('')}</ul></article>`).join('');
    $('certGrid').innerHTML = resume.credentials.map(c => `<div class="cert"><span class="cert-icon">${icons.award}</span><span>${c}</span></div>`).join('');

    const portfolioSection = $('portfolio');
    const gamePortfolioGrid = $('gamePortfolioGrid');
    const videoPortfolioGrid = $('videoPortfolioGrid');
    const videoPortfolioGroup = $('videoPortfolioGroup');
    const awardPortfolioGrid = $('awardPortfolioGrid');
    const awardPortfolioGroup = $('awardPortfolioGroup');
    const updatePortfolioVisibility = () => {
      videoPortfolioGroup.hidden = videoPortfolioGrid.children.length === 0;
      awardPortfolioGroup.hidden = awardPortfolioGrid.children.length === 0;
      portfolioSection.hidden = gamePortfolioGrid.children.length === 0 && videoPortfolioGrid.children.length === 0 && awardPortfolioGrid.children.length === 0;
    };

    const webPortfolioItems = resume.projects.web?.items || [];
    const webWorks = resume.webWorks || [];
    gamePortfolioGrid.innerHTML = webPortfolioItems.map(item => `
      <a class="portfolio-item game-work" href="${item.link}" target="_blank" rel="noopener noreferrer" aria-label="在线体验${item.name}">
        <div class="game-cover">
          <img src="${item.cover}" alt="${item.name}真实游戏画面" loading="lazy" width="1280" height="720" />
          <span class="game-cover-label">${item.coverLabel} <span>实机画面</span></span>
          <span class="game-cover-title"><strong>${item.name}</strong><span>PLAY NOW ↗</span></span>
        </div>
        <div class="game-work-copy"><div class="game-work-tags">${item.coverTags.map(tag => `<span>${tag}</span>`).join('')}</div><p>${item.teaser}</p><span class="game-work-bottom"><span>原创网页游戏 · 键鼠 / 触控</span><strong>进入游戏 ↗</strong></span></div>
      </a>
    `).join('') + webWorks.map((item) => `
      <article class="portfolio-item portfolio-web-demo">
        <video src="${item.src}" poster="${item.poster}" controls preload="none" playsinline aria-label="${item.name}"></video>
        <span class="portfolio-caption">
          <strong>${item.name}</strong>
          <span>${item.meta}</span>
        </span>
      </article>
    `).join('');

    videoPortfolioGrid.innerHTML = (resume.videoWorks || []).map((item) => `
      <article class="portfolio-item portfolio-video">
        <video src="${item.src}" poster="${item.poster}" controls preload="none" playsinline aria-label="${item.name}"></video>
        <span class="portfolio-caption">
          <strong>${item.name}</strong>
          <span>${item.meta}</span>
        </span>
      </article>
    `).join('');

    awardPortfolioGrid.innerHTML = resume.portfolioImages.map(item => `
      <article class="award-panel"><a href="${item.src}" target="_blank" rel="noopener noreferrer" aria-label="查看${item.title}大图"><img src="${item.src}" alt="${item.title}" loading="lazy" decoding="async" /><span class="award-caption">${item.title}<small>查看完整图片 ↗</small></span></a></article>
    `).join('');
    updatePortfolioVisibility();

    // Filters keep every work reachable and expose the current selection to assistive technology.
    const filterButtons = [...document.querySelectorAll('[data-filter]')];
    const selectFilter = category => {
      filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
      document.querySelectorAll('[data-category]').forEach(group => { group.hidden = category !== 'all' && group.dataset.category !== category; });
      $('filterStatus').textContent = category === 'all' ? '已显示全部作品' : `已显示${filterButtons.find(button => button.dataset.filter === category).textContent}作品`;
    };
    filterButtons.forEach(button => button.addEventListener('click', () => selectFilter(button.dataset.filter)));
    const revealHashTarget = () => {
      const target = document.getElementById(location.hash.slice(1));
      if (target?.closest('[data-category]') || target === portfolioSection) selectFilter('all');
    };
    window.addEventListener('hashchange', revealHashTarget);
    document.querySelectorAll('a[href="#portfolio"], a[href="#aiPortfolioGroup"]').forEach(link => link.addEventListener('click', () => selectFilter('all')));
    revealHashTarget();

    const themeIcon = (dark) => dark ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    let storedTheme;
    try { storedTheme = localStorage.getItem('resume-theme-v3'); } catch {}
    const setTheme = dark => {
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      $('themeToggle').innerHTML = themeIcon(dark);
      $('themeToggle').setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
      try { localStorage.setItem('resume-theme-v3', dark ? 'dark' : 'light'); } catch {}
    };
    setTheme(storedTheme === 'dark');
    $('themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'dark'));
    $('printBtn').addEventListener('click', () => window.print());

    const toast = message => {
      $('toast').textContent = message;
      $('toast').classList.add('visible');
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => $('toast').classList.remove('visible'), 2200);
    };
    async function copyContact(key, button) {
      try {
        await navigator.clipboard.writeText(resume[key]);
        const label = key === 'email' ? button.querySelector('span') : button.querySelector('[aria-hidden]');
        if (label) label.textContent = '已复制';
        toast(`${({email:'邮箱',wechat:'微信号',qq:'QQ号'})[key]}已复制`);
        clearTimeout(button.copyTimer);
        button.copyTimer = setTimeout(() => { if (label) label.textContent = key === 'email' ? '复制邮箱' : '复制'; }, 1800);
      } catch { window.prompt('请复制以下联系方式：', resume[key]); }
    }
    $('copyBtn').addEventListener('click', () => copyContact('email', $('copyBtn')));
    document.querySelectorAll('[data-copy-contact]').forEach(button => button.addEventListener('click', () => copyContact(button.dataset.copyContact, button)));

    const bgMusic = $('bgMusic');
    const videoModal = $('videoModal');
    const videoModalPlayer = $('videoModalPlayer');
    const musicToggle = $('musicToggle');
    const videos = [...document.querySelectorAll('video')];
    let lastFocus, resumeMusic = false, musicWanted = false;
    bgMusic.volume = .38;
    const videoIsPlaying = () => videos.some(video => !video.paused && !video.ended);
    const updateMusicUI = () => {
      const playing = !bgMusic.paused;
      const busy = videoIsPlaying();
      musicToggle.classList.toggle('is-playing', playing);
      musicToggle.setAttribute('aria-pressed', String(playing));
      musicToggle.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
      $('musicLabel').textContent = playing ? '背景音乐 · 播放中' : '背景音乐 · 已暂停';
      $('musicStatus').textContent = busy ? '视频播放时自动暂停' : '点击切换 · 音量 38%';
    };
    musicToggle.addEventListener('click', async () => {
      if (!bgMusic.paused || (videoIsPlaying() && musicWanted)) {
        musicWanted = false; resumeMusic = false; bgMusic.pause();
      } else {
        videos.forEach(video => video.pause());
        musicWanted = true;
        try { await bgMusic.play(); } catch { musicWanted = false; toast('音乐暂时无法播放，请重试'); }
      }
      updateMusicUI();
    });
    videos.forEach(video => {
      video.addEventListener('play', () => {
        videos.forEach(other => { if (other !== video) other.pause(); });
        if (!bgMusic.paused) { resumeMusic = true; bgMusic.pause(); }
        updateMusicUI();
      });
      const afterPause = () => {
        updateMusicUI();
        // Defer until switching between two videos has completed.
        queueMicrotask(() => {
          if (!videoIsPlaying() && resumeMusic && musicWanted && !document.hidden) {
            resumeMusic = false;
            bgMusic.play().catch(() => {});
          }
        });
      };
      video.addEventListener('pause', afterPause);
      video.addEventListener('ended', afterPause);
    });
    bgMusic.addEventListener('play', updateMusicUI);
    bgMusic.addEventListener('pause', updateMusicUI);
    const closeVideoModal = () => {
      videoModalPlayer.pause();
      videoModal.hidden = true;
      videoModal.inert = true;
      videoModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      document.querySelector('main').inert = false;
      document.querySelector('header').inert = false;
      lastFocus?.focus();
    };
    $('videoPlayToggle').addEventListener('click', async () => {
      lastFocus = document.activeElement;
      videoModal.hidden = false;
      videoModal.inert = false;
      videoModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      document.querySelector('main').inert = true;
      document.querySelector('header').inert = true;
      $('videoModalClose').focus();
      try { await videoModalPlayer.play(); } catch { toast('点击视频中的播放按钮开始观看'); }
    });
    $('videoModalClose').addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', event => { if (event.target === videoModal) closeVideoModal(); });
    document.addEventListener('keydown', event => {
      if (videoModal.hidden) return;
      if (event.key === 'Escape') closeVideoModal();
      if (event.key === 'Tab') {
        const focusable = [...videoModal.querySelectorAll('button, video[controls]')];
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Do not restart media without an explicit visitor action after returning.
        musicWanted = false; resumeMusic = false; bgMusic.pause(); videos.forEach(video => video.pause());
      }
    });
    updateMusicUI();

    const navLinks = [...document.querySelectorAll('.nav-link')];
    const updateNav = () => {
      const current = navLinks.filter(link => {
        const section = document.querySelector(link.hash);
        return section && section.getBoundingClientRect().top <= 160;
      }).sort((a, b) => document.querySelector(a.hash).getBoundingClientRect().top - document.querySelector(b.hash).getBoundingClientRect().top).at(-1);
      navLinks.forEach(link => { if (link === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    };
    window.addEventListener('scroll', updateNav, {passive:true});
    updateNav();
    const backTop = $('backTop'); window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 420), { passive: true }); backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const reveals = document.querySelectorAll('.reveal'); if ('IntersectionObserver' in window) { const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }), { threshold: .08 }); reveals.forEach(el => io.observe(el)); } else reveals.forEach(el => el.classList.add('in-view'));
  