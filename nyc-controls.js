const combatIcons = new Map([
  ['冲拳', ['punch', '<path d="M8 18V9a2 2 0 0 1 4 0V6a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v7l1-2a2 2 0 0 1 4 2l-4 7-4 4H12z" fill="currentColor"/><path d="M12 10v4m4-6v6m4-4v4" stroke="var(--ink)" stroke-width="1.5"/><path d="M2 12h3m-4 5h4m-2 5h4"/>']],
  ['闪避', ['dodge', '<circle cx="22" cy="7" r="3" fill="currentColor"/><path d="m6 25 7-5 4-7 4 4 6-1M9 13l6-3 5 2m-5 8 5 2-3 6" stroke-width="3"/><path d="M2 10h5m-6 6h7"/>']],
  ['破冰', ['ice', '<path d="m10 20 2-12 6-5 3 9-7 10zm9 0 5-8 4-1-2 9-6 3z" fill="currentColor"/><path d="m12 25-5 2m10-2 2 4m3-5 6 2M7 17l-3-3"/>']],
  ['引雷', ['thunder', '<path d="M17 3h9l-9 11h7L9 30l4-13H6z" fill="currentColor" stroke="none"/>']],
  ['落火', ['fire', '<path d="M17 2c2 7 8 9 6 15 2-1 3-3 3-5 5 10-1 17-10 17C7 29 3 22 6 16c1-2 3-4 5-6 0 4 1 5 2 6 3-4 5-8 4-14Z" fill="currentColor" stroke="none"/><path d="M16 26c-4-1-5-4-3-7l2 2 3-6c4 5 4 9-2 11Z" fill="var(--ink)" stroke="none"/>']],
  ['打坐', ['meditate', '<circle cx="16" cy="7" r="3" fill="currentColor"/><path d="m5 20 5-2 3-6h6l3 6 5 2M7 22c-6 3-2 6 4 5l11-4m3-1c6 3 2 6-4 5l-11-4" stroke-width="2.4"/>']],
]);

/**
 * Input only: movement is camera-relative, +X right and +Z forward.
 * Read state every frame, then consume() once for look/zoom/jump edges.
 */
export function createInputs(canvas, {attackLabel = '发掌', punchEnabled = false, combatEnabled = false, mysticSkills = []} = {}) {
  if (!canvas || typeof canvas.addEventListener !== 'function') {
    throw new TypeError('createInputs requires the game canvas.');
  }

  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  const state = {
    moveX: 0, moveZ: 0, moveY: 0, lookX: 0, lookY: 0,
    zoom: 0, jump: false, attack: false, punch: false, sprint: false,
    dodge: null, skill: 0, meditate: false, skillAim: null, mystic: null,
  };
  const keys = new Set();
  const cleanup = [];
  const coarse = win.matchMedia('(pointer: coarse)');
  const previousTouchAction = canvas.style.touchAction;
  let touchSeen = false;
  let disposed = false;
  let stickX = 0;
  let stickZ = 0;
  let stickPointer = null;
  let stickOrigin = null;
  let lookPointer = null;
  let lookPosition = null;
  let skillPress = null;
  let sprintPointer = null;
  let jumpPointer = null;
  let touchSprint = false;
  let flightMode=false,touchRise=false,touchFall=false,fallPointer=null;

  const style = doc.createElement('style');
  style.textContent = `
    .nyc-touch {position:absolute;inset:0;z-index:40;pointer-events:none;
      --combat-row-bottom:108px;
      display:none;user-select:none;-webkit-user-select:none;}
    .nyc-touch[data-visible="true"] {display:block;}
    .nyc-touch__stick {position:absolute;left:calc(env(safe-area-inset-left,0px) + 18px);
      bottom:calc(env(safe-area-inset-bottom,0px) + 20px);width:116px;height:116px;
      border:1px solid rgba(151,229,242,.32);border-radius:4px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.36);
      background:rgba(7,18,25,.35);box-shadow:inset 0 0 25px rgba(49,179,205,.06);
      pointer-events:auto;touch-action:none;}
    .nyc-touch__knob {position:absolute;left:36px;top:36px;width:44px;height:44px;
      border:1px solid rgba(194,247,255,.58);border-radius:4px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.36);
      background:rgba(132,221,235,.24);box-sizing:border-box;pointer-events:none;}
    .nyc-touch__actions {position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);
      bottom:calc(env(safe-area-inset-bottom,0px) + 26px);display:flex;
      align-items:flex-end;gap:14px;pointer-events:none;}
    .nyc-touch__button {width:62px;height:62px;padding:0;border-radius:4px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.36);
      border:1px solid rgba(159,231,243,.45);background:rgba(7,18,25,.55);
      color:#e1f8fc;font:600 13px system-ui,sans-serif;pointer-events:auto;
      touch-action:none;-webkit-tap-highlight-color:transparent;}
    .nyc-touch__button[data-held="true"] {background:rgba(35,134,157,.7);
      border-color:rgba(198,249,255,.85);}
    .nyc-touch__button--jump {width:72px;height:72px;margin-bottom:28px;}
    .nyc-touch__button--fall {margin-bottom:0;}
    .nyc-touch__combat {position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);
      bottom:calc(env(safe-area-inset-bottom,0px) + var(--combat-row-bottom));display:flex;gap:8px;pointer-events:none;}
    .nyc-touch__combat[hidden] {display:none;}
    .nyc-touch__combat[data-mystic] {display:grid;grid-template-columns:repeat(5,minmax(44px,58px));gap:5px;}
    .nyc-touch__combat[data-mystic][hidden] {display:none;}
    .nyc-touch__combat[data-mystic] ~ .nyc-touch__button--punch {bottom:calc(env(safe-area-inset-bottom,0px) + var(--combat-row-bottom) + 107px);}
    .nyc-touch__combat[data-mystic] .nyc-touch__button {width:100%;min-height:44px;height:46px;padding:2px;line-height:1.1;}
    .nyc-touch__skill-hint {display:block;color:#afdadc;font-size:9px;margin-top:3px;}
    .nyc-skill-reticle {position:absolute;z-index:42;left:50%;top:55%;transform:translate(-50%,-50%);
      color:#a4f7ef;font:600 24px/1 system-ui,sans-serif;pointer-events:none;text-shadow:0 1px 3px #061219;}
    .nyc-touch__aim-cancel {position:absolute;right:90px;bottom:calc(env(safe-area-inset-bottom,0px) + var(--combat-row-bottom) + 108px);
      min-width:74px;height:44px;}
    .nyc-touch__aim-cancel[hidden], .nyc-skill-reticle[hidden] {display:none;}
    .nyc-touch__combat .nyc-touch__button {width:46px;height:46px;font-size:11px;}
    .nyc-touch__button--punch {position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);
      bottom:calc(env(safe-area-inset-bottom,0px) + var(--combat-row-bottom) + 54px);}
    @media (max-width:420px) {
      .nyc-touch {--combat-row-bottom:144px;}
      .nyc-touch[data-combat="true"]:not([data-flight="true"]) .nyc-touch__actions {gap:8px;}
      .nyc-touch[data-combat="true"]:not([data-flight="true"]) .nyc-touch__actions .nyc-touch__button {width:54px;height:54px;}
    }
    @media(max-width:370px){.nyc-touch[data-flight="true"] .nyc-touch__actions{gap:7px}.nyc-touch[data-flight="true"] .nyc-touch__button{width:46px;height:46px;font-size:11px}.nyc-touch[data-flight="true"] .nyc-touch__button--jump{width:54px;height:54px}}
    .nyc-touch__button:focus-visible {outline:2px solid #c6f9ff;outline-offset:3px;}
    @media (max-height:420px) {
      .nyc-touch__stick {width:98px;height:98px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);}
      .nyc-touch__knob {left:27px;top:27px;}
      .nyc-touch__actions {bottom:calc(env(safe-area-inset-bottom,0px) + 12px);}
      .nyc-touch__button--jump {margin-bottom:14px;}
    }
  `;
  doc.head.appendChild(style);

  const layer = doc.createElement('div');
  layer.className = 'nyc-touch';
  layer.dataset.combat = String(combatEnabled);
  const stick = doc.createElement('div');
  stick.className = 'nyc-touch__stick';
  stick.setAttribute('role', 'group');
  stick.setAttribute('aria-label', '移动摇杆');
  const knob = doc.createElement('div');
  knob.className = 'nyc-touch__knob';
  stick.appendChild(knob);
  const actions = doc.createElement('div');
  actions.className = 'nyc-touch__actions';
  const sprintButton = makeButton('疾跑', '按住疾跑');
  const palmButton = makeButton(attackLabel || '发掌', attackLabel || '发掌');
  palmButton.hidden = !attackLabel;
  const punchButton = makeButton('冲拳', '踏步右冲拳');
  punchButton.classList.add('nyc-touch__button--punch');
  punchButton.hidden = !punchEnabled;
  const jumpButton = makeButton('跳跃', '跳跃');
  const fallButton=makeButton('下降','按住下降');fallButton.classList.add('nyc-touch__button--fall');fallButton.hidden=true;
  jumpButton.classList.add('nyc-touch__button--jump');
  actions.append(palmButton,sprintButton,fallButton,jumpButton);
  const combatButtons = doc.createElement('div');
  combatButtons.className = 'nyc-touch__combat';
  combatButtons.hidden = !combatEnabled;
  const dodgeButton = makeButton('闪避', '向摇杆方向闪避');
  const meditateButton = makeButton('打坐', '开始或结束打坐');
  const skillButtons = mysticSkills.length?mysticSkills.map(({title,hold})=>{
    const button=makeButton(title,title);
    if(hold){
      const hint=doc.createElement('small');hint.className='nyc-touch__skill-hint';hint.textContent='长按瞄准';
      button.appendChild(hint);
    }
    return button;
  }):['破冰', '引雷', '落火'].map(label => makeButton(label, label));
  if(mysticSkills.length)combatButtons.dataset.mystic='';
  const aimCancel=makeButton('取消瞄准','取消瞄准');
  aimCancel.classList.add('nyc-touch__aim-cancel');aimCancel.hidden=true;
  const reticle=doc.createElement('div');
  reticle.className='nyc-skill-reticle';reticle.hidden=true;reticle.textContent='+';
  reticle.setAttribute('aria-hidden','true');
  combatButtons.append(dodgeButton, ...skillButtons, meditateButton);
  layer.append(stick, actions, combatButtons, punchButton, aimCancel);
  (canvas.parentElement || doc.body).append(layer,reticle);
  canvas.style.touchAction = 'none';

  function makeButton(text, label) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'nyc-touch__button';
    const icon = combatIcons.get(text);
    if (icon) {
      const [name, paths] = icon;
      button.dataset.icon = name;
      button.title = label;
      button.innerHTML = `<svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">${paths}</svg>`;
    } else {
      button.textContent = text;
    }
    button.setAttribute('aria-label', label);
    return button;
  }

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  }

  function interactive(target) {
    return target && typeof target.closest === 'function'
      && Boolean(target.closest('input,textarea,select,button,a[href],[contenteditable]:not([contenteditable="false"]),[role="textbox"]'));
  }

  function updateMove() {
    let x = Number(keys.has('KeyD') || keys.has('ArrowRight'))
      - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + stickX;
    let z = Number(keys.has('KeyW') || keys.has('ArrowUp'))
      - Number(keys.has('KeyS') || keys.has('ArrowDown')) + stickZ;
    const length = Math.hypot(x, z);
    if (length > 1) { x /= length; z /= length; }
    state.moveX = x;
    state.moveZ = z;
    state.moveY=flightMode?Number(touchRise||keys.has('KeyE')||keys.has('Space'))-Number(touchFall||keys.has('KeyQ')):0;
    state.sprint = touchSprint || keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  function showTouch(event) {
    if (event?.pointerType === 'touch') touchSeen = true;
    layer.dataset.visible = String(coarse.matches || touchSeen || doc.body.classList.contains('mobile-preview'));
  }

  function capture(element, id) {
    try { element.setPointerCapture(id); } catch { /* A cancelled pointer needs no capture. */ }
  }

  function release(element, id) {
    if (id === null) return;
    try {
      if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    } catch { /* Pointer capture can already be lost during blur. */ }
  }

  listen(palmButton,'click',()=>{if(attackLabel && !flightMode) state.attack=true;});
  listen(punchButton,'click',()=>{if(punchEnabled && !flightMode) state.punch=true;});
  const directions = new Map([
    ['KeyW','forward'],['ArrowUp','forward'],['KeyS','back'],['ArrowDown','back'],
    ['KeyA','left'],['ArrowLeft','left'],['KeyD','right'],['ArrowRight','right'],
  ]);
  const skillKeys = new Map([['KeyQ',1], ['KeyE',2], ['KeyR',3]]);
  const controlKeys = new Set(['ControlLeft','ControlRight']);
  function movementDirection() {
    if (!state.moveX && !state.moveZ) return null;
    if (Math.abs(state.moveX) > Math.abs(state.moveZ)) return state.moveX > 0 ? 'right' : 'left';
    return state.moveZ > 0 ? 'forward' : 'back';
  }
  listen(dodgeButton,'click',()=>{if(combatEnabled&&!flightMode) state.dodge=movementDirection() || 'forward';});
  listen(meditateButton,'click',()=>{if(combatEnabled&&!flightMode) state.meditate=true;});
  function aim(press){
    if(skillPress===press&&press.skill.hold)state.skillAim=press.skill.id;
  }

  function pressSkill(skill,source,event){
    if(skillPress||!combatEnabled||flightMode)return false;
    const x=event.clientX??0,y=event.clientY??0;
    const press={skill,source,x,y,startX:x,startY:y};
    skillPress=press;
    if(skill.hold)press.timer=win.setTimeout(()=>aim(press),210);
    return true;
  }

  function releaseSkill(source,cancelled){
    if(skillPress?.source!==source)return;
    const {skill,timer}=skillPress;
    win.clearTimeout(timer);
    skillPress=null;
    const aimed=state.skillAim===skill.id;
    state.skillAim=null;
    if(!cancelled)state.mystic={id:skill.id,aimed};
  }

  function cancelSkill(){
    if(!skillPress)return false;
    releaseSkill(skillPress.source,true);
    return true;
  }

  listen(aimCancel,'click',cancelSkill);
  skillButtons.forEach((button,i)=>{
    const skill=mysticSkills[i];
    if(!skill){
      listen(button,'click',()=>{if(combatEnabled&&!flightMode)state.skill=i+1;});
      return;
    }
    listen(button,'pointerdown',event=>{
      if(event.button!==0||!pressSkill(skill,event.pointerId,event))return;
      event.preventDefault();
      capture(button,event.pointerId);
    });
    listen(button,'pointermove',event=>{
      if(skillPress?.source!==event.pointerId||!skill.hold)return;
      const press=skillPress;
      if(Math.hypot(event.clientX-press.startX,event.clientY-press.startY)>7)aim(press);
      if(state.skillAim){
        state.lookX+=event.clientX-press.x;state.lookY+=event.clientY-press.y;
      }
      press.x=event.clientX;press.y=event.clientY;
    });
    listen(button,'pointerup',event=>{
      const hit=doc.elementFromPoint(event.clientX,event.clientY);
      releaseSkill(event.pointerId,hit===aimCancel||(!state.skillAim&&!button.contains(hit)));
    });
    for(const type of ['pointercancel','lostpointercapture']){
      listen(button,type,event=>releaseSkill(event.pointerId,true));
    }
    listen(button,'contextmenu',event=>event.preventDefault());
    listen(button,'click',event=>{
      if(event.detail===0&&combatEnabled&&!flightMode)state.mystic={id:skill.id,aimed:false};
    });
  });
  const movementKeys = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
    'ShiftLeft', 'ShiftRight', 'Space','KeyJ','KeyQ','KeyE','KeyR',...controlKeys,
  ]);
  listen(win, 'keydown', (event) => {
    if(event.code==='KeyJ' && (!attackLabel || flightMode))return;
    const mystic=/^Digit[1-7]$/.test(event.code)?mysticSkills[Number(event.code.at(-1))-1]:null;
    if(mystic&&!flightMode&&!event.isComposing&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&
      !interactive(event.target)&&!interactive(doc.activeElement)){
      event.preventDefault();
      if(!event.repeat&&pressSkill(mystic,event.code,event)&&!mystic.hold)releaseSkill(event.code,false);
      return;
    }
    const dodgeControl=combatEnabled&&!flightMode&&controlKeys.has(event.code);
    const dodgeDirection=combatEnabled&&!flightMode&&event.ctrlKey&&directions.get(event.code);
    const skill=skillKeys.get(event.code);
    if (skill && (flightMode ? event.code==='KeyR' : !combatEnabled)) return;
    if (controlKeys.has(event.code) && !dodgeControl) return;
    if (!movementKeys.has(event.code) || event.isComposing
      || (event.ctrlKey && !dodgeControl && !dodgeDirection) || event.metaKey || event.altKey
      || interactive(event.target) || interactive(doc.activeElement)) return;
    event.preventDefault();
    if (!flightMode && skill) {
      if (!event.repeat) state.skill=skill;
      return;
    }
    if (!event.repeat) {
      if (dodgeControl) state.dodge=movementDirection();
      else if (dodgeDirection) state.dodge=dodgeDirection;
    }
    if (event.code === 'Space') {
      if (!event.repeat && !keys.has('Space')) state.jump = true;
    }
    if(event.code==='KeyJ' && !event.repeat) state.attack=true;
    keys.add(event.code);
    updateMove();
  });
  listen(win, 'keyup', (event) => {
    releaseSkill(event.code,false);
    if (!movementKeys.has(event.code)) return;
    const wasHeld = keys.delete(event.code);
    if (wasHeld && !interactive(event.target)) event.preventDefault();
    updateMove();
  });
  listen(win, 'focusin', (event) => {
    if (!interactive(event.target) || layer.contains(event.target)) return;
    keys.clear();
    updateMove();
  });

  listen(canvas, 'pointerdown', (event) => {
    showTouch(event);
    if (punchEnabled && !flightMode && event.pointerType === 'mouse' && event.button === 0) {
      event.preventDefault();
      canvas.focus({ preventScroll: true });
      state.punch = true;
      return;
    }
    if (lookPointer !== null) return;
    const bounds = canvas.getBoundingClientRect();
    if (event.pointerType === 'touch') {
      if (event.clientX < bounds.left + bounds.width * 0.5) return;
    } else if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    // Focus the game without moving the page or automatically locking the cursor.
    canvas.focus({ preventScroll: true });
    lookPointer = event.pointerId;
    lookPosition = { x: event.clientX, y: event.clientY };
    capture(canvas, event.pointerId);
  });
  listen(canvas, 'pointermove', (event) => {
    if(event.pointerType==='mouse'&&state.skillAim&&typeof skillPress?.source==='string'&&lookPointer===null){
      state.lookX+=event.movementX;state.lookY+=event.movementY;
      return;
    }
    if (event.pointerId !== lookPointer || !lookPosition) return;
    state.lookX += event.clientX - lookPosition.x;
    state.lookY += event.clientY - lookPosition.y;
    lookPosition.x = event.clientX;
    lookPosition.y = event.clientY;
    event.preventDefault();
  });
  function endLook(event) {
    if (event.pointerId !== lookPointer) return;
    const id = lookPointer;
    lookPointer = null;
    lookPosition = null;
    release(canvas, id);
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(canvas, type, endLook);
  }
  listen(canvas, 'contextmenu', (event) => event.preventDefault());
  listen(canvas, 'wheel', (event) => {
    if (!Number.isFinite(event.deltaY)) return;
    event.preventDefault();
    state.zoom += event.deltaY;
  }, { passive: false });

  function moveStick(event) {
    if (!stickOrigin) return;
    const dx = event.clientX - stickOrigin.x;
    const dy = event.clientY - stickOrigin.y;
    const distance = Math.hypot(dx, dy);
    const radius = stickOrigin.radius;
    const clamped = Math.min(distance, radius);
    const deadZone = 0.14;
    const magnitude = Math.max(0, (clamped / radius - deadZone) / (1 - deadZone));
    stickX = distance ? dx / distance * magnitude : 0;
    stickZ = distance ? -dy / distance * magnitude : 0;
    knob.style.transform = `translate(${distance ? dx / distance * clamped : 0}px,${distance ? dy / distance * clamped : 0}px)`;
    updateMove();
  }
  listen(stick, 'pointerdown', (event) => {
    if (stickPointer !== null || (event.pointerType !== 'touch' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    showTouch(event);
    const bounds = stick.getBoundingClientRect();
    stickOrigin = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
      radius: Math.max(12, bounds.width / 2 - 24),
    };
    stickPointer = event.pointerId;
    capture(stick, event.pointerId);
    moveStick(event);
  });
  listen(stick, 'pointermove', (event) => {
    if (event.pointerId !== stickPointer) return;
    event.preventDefault();
    moveStick(event);
  });
  function endStick(event) {
    if (event.pointerId !== stickPointer) return;
    const id = stickPointer;
    stickPointer = null;
    stickOrigin = null;
    stickX = stickZ = 0;
    knob.style.transform = '';
    release(stick, id);
    updateMove();
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(stick, type, endStick);
  }

  listen(sprintButton, 'pointerdown', (event) => {
    if (sprintPointer !== null || (event.pointerType !== 'touch' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    sprintPointer = event.pointerId;
    touchSprint = true;
    sprintButton.dataset.held = 'true';
    capture(sprintButton, event.pointerId);
    updateMove();
  });
  function endSprint(event) {
    if (event.pointerId !== sprintPointer) return;
    const id = sprintPointer;
    sprintPointer = null;
    touchSprint = false;
    sprintButton.dataset.held = 'false';
    release(sprintButton, id);
    updateMove();
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(sprintButton, type, endSprint);
  }

  listen(jumpButton, 'pointerdown', (event) => {
    if (jumpPointer !== null || (event.pointerType !== 'touch' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    jumpPointer = event.pointerId;
    if(flightMode)touchRise=true;else state.jump = true;
    jumpButton.dataset.held = 'true';
    capture(jumpButton, event.pointerId);
    updateMove();
  });
  function endJump(event) {
    if (event.pointerId !== jumpPointer) return;
    const id = jumpPointer;
    jumpPointer = null;
    touchRise=false;
    jumpButton.dataset.held = 'false';
    release(jumpButton, id);
    updateMove();
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(jumpButton, type, endJump);
  }
  // Preserve native keyboard activation when the touch controls are tab-focused.
  listen(jumpButton, 'click', (event) => {
    if (event.detail === 0&&!flightMode) state.jump = true;
  });
  listen(fallButton,'pointerdown',event=>{
    if(!flightMode||fallPointer!==null||(event.pointerType!=='touch'&&event.button!==0))return;
    event.preventDefault();event.stopPropagation();fallPointer=event.pointerId;touchFall=true;fallButton.dataset.held='true';capture(fallButton,event.pointerId);updateMove();
  });
  function endFall(event){if(event.pointerId!==fallPointer)return;const id=fallPointer;fallPointer=null;touchFall=false;fallButton.dataset.held='false';release(fallButton,id);updateMove();}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(fallButton,type,endFall);
  for(const[button,rise]of [[jumpButton,true],[fallButton,false]]){
    listen(button,'keydown',event=>{if(!flightMode||(event.code!=='Space'&&event.code!=='Enter'))return;event.preventDefault();if(rise)touchRise=true;else touchFall=true;button.dataset.held='true';updateMove();});
    const end=()=>{if(rise)touchRise=false;else touchFall=false;button.dataset.held='false';updateMove();};
    listen(button,'keyup',event=>{if(event.code==='Space'||event.code==='Enter')end();});listen(button,'blur',end);
  }
  listen(sprintButton, 'keydown', (event) => {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    touchSprint = true;
    sprintButton.dataset.held = 'true';
    updateMove();
  });
  listen(sprintButton, 'keyup', (event) => {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    touchSprint = false;
    sprintButton.dataset.held = 'false';
    updateMove();
  });
  listen(sprintButton, 'blur', () => {
    if (sprintPointer !== null) return;
    touchSprint = false;
    sprintButton.dataset.held = 'false';
    updateMove();
  });

  function consume() {
    const delta = {
      lookX: state.lookX, lookY: state.lookY,
      zoom: state.zoom, jump: state.jump, attack: state.attack, punch: state.punch,
      dodge: state.dodge, skill: state.skill, meditate: state.meditate, mystic: state.mystic,
    };
    state.lookX = state.lookY = state.zoom = 0;
    state.attack = state.punch = state.jump = false;
    state.dodge = null;
    state.skill = 0;
    state.mystic = null;
    state.meditate = false;
    return delta;
  }

  function clear() {
    cancelSkill();
    setSkillAiming(false);
    keys.clear();
    const previous = [lookPointer, stickPointer, sprintPointer, jumpPointer,fallPointer];
    lookPointer = stickPointer = sprintPointer = jumpPointer = fallPointer=null;
    lookPosition = stickOrigin = null;
    stickX = stickZ = 0;
    touchSprint = false;
    touchRise=touchFall=false;
    state.moveX = state.moveZ = state.moveY = state.lookX = state.lookY = state.zoom = 0;
    state.attack = state.punch = state.jump = state.sprint = false;
    state.dodge = null;
    state.skill = 0;
    state.mystic = null;
    state.meditate = false;
    knob.style.transform = '';
    sprintButton.dataset.held = jumpButton.dataset.held = fallButton.dataset.held='false';
    [canvas, stick, sprintButton, jumpButton,fallButton].forEach((element, i) => release(element, previous[i]));
  }

  listen(win, 'blur', clear);
  listen(doc, 'visibilitychange', () => { if (doc.hidden) clear(); });
  listen(win, 'resize', clear);
  // Listen without capturing the event, so panels retain their normal controls.
  listen(win, 'pointerdown', showTouch, { passive: true });
  listen(coarse, 'change', showTouch);
  showTouch();

  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    cleanup.splice(0).forEach((remove) => remove());
    layer.remove();
    reticle.remove();
    style.remove();
    if (canvas.style.touchAction === 'none') canvas.style.touchAction = previousTouchAction;
  }

  function setFlightMode(value){clear();flightMode=Boolean(value);layer.dataset.flight=String(flightMode);jumpButton.textContent=flightMode?'上升':'跳跃';jumpButton.setAttribute('aria-label',flightMode?'按住上升':'跳跃');sprintButton.textContent=flightMode?'加速':'疾跑';fallButton.hidden=!flightMode;palmButton.hidden=flightMode||!attackLabel;punchButton.hidden=flightMode||!punchEnabled;combatButtons.hidden=flightMode||!combatEnabled;}
  function setSkillAiming(aiming){
    reticle.hidden=aimCancel.hidden=!aiming;
  }
  return {state,consume,clear,dispose,setFlightMode,setSkillAiming,cancelSkill};
}
