// ---------- Site chrome: shared header/footer across all pages ----------
var NAV = [
  { id: 'index',   href: 'index.html',   label: '홈' },
  { id: 'about',   href: 'about.html',   label: '프로필' },
  { id: 'career',  href: 'career.html',  label: '항해 일지' },
  { id: 'books',   href: 'books.html',   label: '저서' },
  { id: 'media',   href: 'media.html',   label: '미디어·채널' },
  { id: 'mentor',  href: 'mentor.html',  label: '항해 상담실' },
  { id: 'contact', href: 'contact.html', label: '섭외 문의' }
];

(function renderChrome(){
  var current = document.body.getAttribute('data-page');
  var headerEl = document.getElementById('site-header');
  var footerEl = document.getElementById('site-footer');

  if (headerEl){
    var linksHtml = NAV.map(function(item){
      var isActive = item.id === current;
      return '<a href="' + item.href + '"' + (isActive ? ' aria-current="page"' : '') + '>' + item.label + '</a>';
    }).join('');

    headerEl.innerHTML =
      '<header class="topbar">' +
        '<div class="topbar-inner">' +
          '<a class="brand" href="index.html"><span class="rank-dot"></span>김승주 항해록</a>' +
          '<nav class="primary-nav" id="primaryNav">' + linksHtml + '</nav>' +
          '<button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="primaryNav" aria-label="메뉴 열기">☰</button>' +
        '</div>' +
      '</header>';

    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('primaryNav');
    toggle.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function(e){
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (footerEl){
    footerEl.innerHTML =
      '<footer>' +
        '<div class="footer-inner">' +
          '<span class="brand">김승주 항해록</span>' +
          '<span>© 2025 Kim Seung-ju. 본 페이지는 팬·미디어 소통을 위한 개인 브랜딩 사이트입니다.</span>' +
        '</div>' +
      '</footer>';
  }
})();

// ---------- Compass ticks (index.html only) ----------
if (document.getElementById('compassTicks')) {
  (function(){
    var g = document.getElementById('compassTicks');
    var cx = 160, cy = 160, rOuter = 150, rInnerMajor = 136, rInnerMinor = 143;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 72; i++){
      var angle = (i * 5) * Math.PI / 180;
      var major = i % 18 === 0;
      var rInner = major ? rInnerMajor : rInnerMinor;
      var x1 = cx + rOuter * Math.sin(angle), y1 = cy - rOuter * Math.cos(angle);
      var x2 = cx + rInner * Math.sin(angle), y2 = cy - rInner * Math.cos(angle);
      var line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', x1.toFixed(1)); line.setAttribute('y1', y1.toFixed(1));
      line.setAttribute('x2', x2.toFixed(1)); line.setAttribute('y2', y2.toFixed(1));
      line.setAttribute('stroke-width', major ? '1.4' : '0.7');
      frag.appendChild(line);
    }
    g.appendChild(frag);
  })();
}

// ---------- Navigation consultation / AI mentor (mentor.html only) ----------
if (document.getElementById('chatForm')) {
  (function(){
    var chatLog = document.getElementById('chatLog');
    var chatStatus = document.getElementById('chatStatus');
    var chatForm = document.getElementById('chatForm');
    var chatInput = document.getElementById('chatInput');
    var chatSubmit = document.getElementById('chatSubmit');
    var intakeBox = document.getElementById('mentorIntake');

    var PROFILE_FACTS = [
      '이름: 김승주 (선장, 1993.03.19 부산 출생)',
      '학력: 한국해양대학교 해사수송과학부 학사',
      '경력: 2016.02 삼등항해사로 첫 승선 → 이등항해사 → 2020.01 일등항해사 → 2021.04-2023.12 지마린서비스 일등항해사 → 2024.06-2025.04 코리아쉽메니져스 일등항해사 → 2025.04부터 코리아쉽메니져스 선장',
      '특이사항: 승선 회사 항해사 500명 중 여성은 단 3명뿐인 환경에서 커리어를 쌓음',
      '저서: 『나는 스물일곱, 2등 항해사입니다』, 『해운 무역의 리더 항해사』(청소년 진로 지침서), 『오진다 오력』(자기계발서)',
      '방송: 유 퀴즈 온 더 블럭, KBS 아침마당, CBS 라디오 출연'
    ].join('\n- ');

    var turns = null;
    var sampleFn = null;
    var busy = false;

    function bubble(role, text){
      var div = document.createElement('div');
      div.className = 'chat-bubble ' + (role === 'user' ? 'user' : 'captain');
      if (role !== 'user'){
        var who = document.createElement('b');
        who.className = 'who';
        who.textContent = '김승주 선장 (AI)';
        div.appendChild(who);
      }
      var body = document.createElement('span');
      body.textContent = text;
      div.appendChild(body);
      chatLog.appendChild(div);
      chatLog.scrollTop = chatLog.scrollHeight;
      return body;
    }

    function setStatus(msg){ chatStatus.textContent = msg || ''; }

    function errorCopy(code){
      switch(code){
        case 'not_granted': return '이 기능을 사용하려면 동의가 필요해요. 다시 시도해 주세요.';
        case 'rate_limited': return '지금 요청이 많아요. 잠시 후 다시 시도해 주세요.';
        case 'sampling_disabled': return '현재 계정에서는 AI 상담 기능을 사용할 수 없어요.';
        case 'session_expired': return '로그인이 만료되었어요. 다시 로그인 후 시도해 주세요.';
        case 'refused': return '이 질문에는 답변하기 어려워요. 다른 방식으로 다시 물어봐 주세요.';
        case 'empty_completion': return '답변을 생성하지 못했어요. 조금 더 구체적으로 질문해 주세요.';
        case 'cancelled': return '';
        default: return '잠시 문제가 생겼어요. 다시 시도해 주세요.';
      }
    }

    if (typeof claude !== 'undefined' && claude && typeof claude.use === 'function') {
      claude.use('sample').then(function(fn){ sampleFn = fn; }).catch(function(){ sampleFn = null; });
    } else {
      sampleFn = null;
    }

    chatForm.addEventListener('submit', async function(e){
      e.preventDefault();
      if (busy) return;
      var question = chatInput.value.trim();
      if (!question) return;

      if (!sampleFn){
        setStatus('이 브라우저 환경에서는 AI 상담 기능을 사용할 수 없어요. 아래 FAQ를 참고해 주세요.');
        return;
      }

      busy = true;
      chatSubmit.disabled = true;
      chatInput.value = '';
      bubble('user', question);

      if (!turns){
        var gender = document.getElementById('mGender').value;
        var age = document.getElementById('mAge').value;
        var situation = document.getElementById('mSituation').value.trim();
        var instruction = '당신은 김승주 선장입니다. 실제 프로필:\n- ' + PROFILE_FACTS +
          '\n\n말투는 담백하고 다정하며, 바다 경험에서 우러나온 비유를 가끔 사용합니다. ' +
          '방문자의 배경: 성별(' + (gender || '비공개') + '), 나이대(' + age + ')' +
          (situation ? ', 상황: ' + situation : '') +
          '\n\n방문자의 질문에 선배 항해사이자 작가로서 3~6문장으로 진심 어린 조언을 건네주세요. ' +
          '실제 경력(예: 500명 중 3명뿐인 여성 항해사, 삼등항해사부터 9년 만에 선장이 된 경험)을 자연스럽게 녹여 공감과 현실적인 조언을 함께 담고, 마지막에 짧은 응원 한마디로 마무리하세요.';
        turns = [{ role: 'user', content: instruction + '\n\n질문: ' + question }];
        intakeBox.style.opacity = '.5';
        intakeBox.querySelectorAll('select,textarea').forEach(function(el){ el.disabled = true; });
      } else {
        turns.push({ role: 'user', content: question });
      }

      setStatus('선장님이 답변을 준비 중이에요…');
      var target = bubble('captain', '');
      var started = false;

      try {
        var result = await sampleFn(turns, {
          modelTier: 'default',
          cache: false,
          onText: function(u){
            started = true;
            setStatus('');
            target.textContent = u.text;
            chatLog.scrollTop = chatLog.scrollHeight;
          }
        });
        turns.push({ role: 'assistant', content: result.text });
        if (result.truncated) setStatus('답변이 길어서 일부만 표시됐어요.');
      } catch (err){
        if (!started) target.parentElement.remove();
        else if (err.text) target.textContent = err.text;
        setStatus(errorCopy(err && err.code));
        if (err && err.code !== 'refused') turns && turns.pop();
      } finally {
        busy = false;
        chatSubmit.disabled = false;
      }
    });
  })();
}

// ---------- Contact form: mailto + copy fallback (contact.html only) ----------
if (document.getElementById('contactForm')) {
  (function(){
    var form = document.getElementById('contactForm');
    var fallbackBox = document.getElementById('fallbackBox');
    var fallbackText = document.getElementById('fallbackText');
    var copyBtn = document.getElementById('copyFallback');
    var TO = 'powertmdwn@naver.com';

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var type = document.getElementById('cType').value;
      var date = document.getElementById('cDate').value || '날짜 미정';
      var detail = document.getElementById('cDetail').value.trim();
      var reply = document.getElementById('cReply').value.trim();
      if (!detail || !reply) return;

      var subject = '[' + type + '] 김승주 선장 섭외 문의 (' + date + ')';
      var body = '문의 종류: ' + type + '\n희망 날짜: ' + date + '\n\n문의 내용:\n' + detail + '\n\n회신받을 연락처: ' + reply;

      window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      fallbackText.value = '받는 사람: ' + TO + '\n제목: ' + subject + '\n\n' + body;
      fallbackBox.hidden = false;
    });

    copyBtn.addEventListener('click', async function(){
      try {
        await navigator.clipboard.writeText(fallbackText.value);
        copyBtn.textContent = '복사됨';
        setTimeout(function(){ copyBtn.textContent = '문의 내용 복사'; }, 1800);
      } catch(e){
        fallbackText.focus();
        fallbackText.select();
      }
    });
  })();
}
