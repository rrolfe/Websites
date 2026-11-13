// Challenge pieces: Beat the Clock (a timed daily mission with a small bonus), the play streak, and the Weekly Prize Pot (a real-world prize a grown-up picks).
// Nothing here can cost pearls: a slow run only loses the bonus. Saved in S.chal (created on first use, so old saves load fine).
import { S, save, today, day, dateKey, weekView } from '../core/store.js';
import { weekKey } from '../progress/stats.js';
import { h, confetti, toast } from '../core/dom.js';
import { icons } from '../core/icons.js';
import { t, addStrings } from '../core/i18n.js';
import { sfx } from '../core/audio.js';
import { dailyMissions } from '../quiz/missions.js';
import { awardBadges } from '../core/badges.js';

addStrings({
  en: {
    chToday: 'Today’s challenge', chBeat: 'Beat the Clock', chClockSub: '{m}: finish in {time} and win +{n} pearls', chGo: 'Go!', chEnds: 'Ends in {x}',
    chDoneT: 'Challenge done!', chDoneSub: 'Nice work. A new challenge comes tomorrow.', chTryAgain: 'Not yet today. Try again!',
    chStreak: '{n}-day streak', chStreak0: 'Start a streak', chStreakKeep: 'Play today to keep it going!', chStreakSafe: 'Today is in the bank ✓',
    chPot: 'Weekly Prize Pot', chPotGot: '{a} of {b} pearls', chPotLeft: 'Resets in {x}', chPrizeIs: 'Prize: {p}', chPrizeNone: 'Ask a grown-up to pick the prize', chPotFull: 'The pot is full!',
    chClaim: 'Claim the prize!', chClaimed: 'Prize claimed! Show a grown-up 🎉', chClaimedT: 'Prize claimed ✓',
    chTimesUp: 'Time’s up! Keep going. There is no penalty.', bonusClock: 'Beat the Clock', chClockWin: 'You beat the clock in {t}!', chClockAgain: 'Beat the clock again! (The bonus is once a day.)',
    chClockMiss: 'The clock won this time. Finish in time with 2 stars to win the bonus.',
    chPrizeSet: 'Weekly prize', chPrizeName: 'Prize for filling the pot', chPrizeNamePh: 'Pizza night, a new book…', chPrizeGoal: 'Pearls to fill the pot',
    chPrizeNote: 'The pot fills with the pearls earned this week (Monday to Sunday). When it is full, the lab shows the prize and a Claim button. You give the real prize.',
  },
  es: {
    chToday: 'El reto de hoy', chBeat: 'Gana al reloj', chClockSub: '{m}: termina en {time} y gana +{n} perlas', chGo: '¡Vamos!', chEnds: 'Termina en {x}',
    chDoneT: '¡Reto cumplido!', chDoneSub: 'Buen trabajo. Mañana hay un reto nuevo.', chTryAgain: 'Todavía no hoy. ¡Inténtalo otra vez!',
    chStreak: 'Racha de {n} días', chStreak0: 'Empieza una racha', chStreakKeep: '¡Juega hoy para mantenerla!', chStreakSafe: 'Hoy ya cuenta ✓',
    chPot: 'Bote semanal de premios', chPotGot: '{a} de {b} perlas', chPotLeft: 'Se reinicia en {x}', chPrizeIs: 'Premio: {p}', chPrizeNone: 'Pide a un adulto que elija el premio', chPotFull: '¡El bote está lleno!',
    chClaim: '¡Reclama el premio!', chClaimed: '¡Premio reclamado! Muéstraselo a un adulto 🎉', chClaimedT: 'Premio reclamado ✓',
    chTimesUp: '¡Se acabó el tiempo! Sigue. No hay penalización.', bonusClock: 'Gana al reloj', chClockWin: '¡Ganaste al reloj en {t}!', chClockAgain: '¡Ganaste al reloj otra vez! (El bono es una vez al día.)',
    chClockMiss: 'Esta vez ganó el reloj. Termina a tiempo con 2 estrellas para ganar el bono.',
    chPrizeSet: 'Premio semanal', chPrizeName: 'Premio por llenar el bote', chPrizeNamePh: 'Noche de pizza, un libro nuevo…', chPrizeGoal: 'Perlas para llenar el bote',
    chPrizeNote: 'El bote se llena con las perlas ganadas esta semana (de lunes a domingo). Cuando está lleno, el laboratorio muestra el premio y un botón para reclamarlo. El premio real lo das tú.',
  },
});

export const CLOCK = { perQ: 40, bonus: 10 };           // seconds per question; pearls for beating the clock (once a day)
const ch = () => (S.chal ||= { done: {}, claimed: {} });
export const fmtClock = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.round(sec)) % 60).padStart(2, '0')}`;

/** Has the clock bonus already been won today? */
export const clockWonToday = () => !!ch().done[today()]?.ok;
/** Record a Beat the Clock run. */
export function recordClock({ ok, sec }) {
  const d = (ch().done[today()] ||= { ok: false, tries: 0 });
  d.tries++; d.sec = sec; if (ok) d.ok = true;
  ch().wins = (ch().wins || 0) + (ok ? 1 : 0);
  save();
}

const played = (k) => { const v = S.days[k]; return !!(v && (v.q > 0 || v.sec > 120)); };
/** Days in a row with some play, counting today if played (an unplayed today does not break it until the day ends). */
export function streak() {
  const d = new Date(); let n = 0;
  const doneToday = played(dateKey(d));
  if (!doneToday) d.setDate(d.getDate() - 1);
  while (played(dateKey(d)) && n < 400) { n++; d.setDate(d.getDate() - 1); }
  return { n, doneToday };
}
export const bestStreakOk = (k) => streak().n >= k;

const msToMidnight = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; };
const msToWeekEnd = () => { const n = new Date(); const dow = (n.getDay() + 6) % 7; return new Date(n.getFullYear(), n.getMonth(), n.getDate() + (7 - dow)) - n; };
function fmtLeft(ms) {
  const m = Math.max(1, Math.round(ms / 60000)), d = Math.floor(m / 1440), hr = Math.floor((m % 1440) / 60), mi = m % 60;
  return d ? `${d}d ${hr}h` : hr ? `${hr}h ${mi}m` : `${mi}m`;
}

/** This week's pot: pearls earned Monday to Sunday against the grown-up's goal. */
export function pot() {
  const goal = Math.max(50, Number(S.settings.potGoal) || 300), prize = String(S.settings.potPrize || '').trim();
  let got = 0; for (const d of weekView()) { const v = S.days[d.key]; if (v) got += (v.pearls || 0) + (v.chore || 0) + (v.checkin || 0); }
  return { goal, prize, got, pct: Math.min(100, Math.round((got / goal) * 100)), full: got >= goal, claimed: !!ch().claimed[weekKey()] };
}
export const potsClaimed = () => Object.keys(ch().claimed || {}).length;
export const clockWins = () => ch().wins || 0;

function potCard() {
  const p = pot();
  const card = h('div', { class: 'ccard pot' + (p.full ? ' full' : '') },
    h('div', { class: 'ci', html: icons.gift(56) }),
    h('div', { class: 'cc' }, h('small', {}, t('chPot')),
      h('strong', {}, p.full ? t('chPotFull') : t('chPotGot', { a: p.got.toLocaleString(), b: p.goal.toLocaleString() })),
      h('div', { class: 'potbar', role: 'img', 'aria-label': t('chPotGot', { a: p.got, b: p.goal }) }, h('i', { style: { width: p.pct + '%' } })),
      h('span', { class: 'prize' }, p.prize ? t('chPrizeIs', { p: p.prize }) : t('chPrizeNone')),
      h('small', { class: 'left' }, t('chPotLeft', { x: fmtLeft(msToWeekEnd()) })),
      p.full && !p.claimed ? h('button', { class: 'btn small claim', onclick: (e) => {
        ch().claimed[weekKey()] = Date.now(); save(); sfx.found(); confetti(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2); toast(t('chClaimed'), 4000); awardBadges();
        card.replaceWith(potCard());
      } }, t('chClaim')) : p.claimed ? h('span', { class: 'chip on claimed' }, t('chClaimedT')) : null));
  return card;
}

/** The three challenge cards for the Home screen. */
export function challengeBoard() {
  const first = dailyMissions()[0], won = clockWonToday(), tries = ch().done[today()]?.tries || 0, s = streak();
  const clock = won
    ? h('div', { class: 'ccard clock done' }, h('div', { class: 'ci', html: icons.trophy(56) }), h('div', { class: 'cc' }, h('small', {}, t('chToday')), h('strong', {}, t('chDoneT')), h('span', {}, t('chDoneSub'))))
    : h('a', { class: 'ccard clock', href: '#/quiz/mission/' + first + '/clock', onclick: () => sfx.pop() },
      h('div', { class: 'ci', html: icons.clock(56) }),
      h('div', { class: 'cc' }, h('small', {}, t('chToday')), h('strong', {}, t('chBeat')),
        h('span', {}, t('chClockSub', { m: t('m_' + first), time: fmtClock(8 * CLOCK.perQ), n: CLOCK.bonus })),
        h('small', { class: 'left' }, tries ? t('chTryAgain') : t('chEnds', { x: fmtLeft(msToMidnight()) }))),
      h('span', { class: 'btn small' }, t('chGo')));
  const streakCard = h('div', { class: 'ccard streak' + (s.n ? ' lit' : '') }, h('div', { class: 'ci', html: icons.flame(56) }),
    h('div', { class: 'cc' }, h('strong', {}, s.n ? t('chStreak', { n: s.n }) : t('chStreak0')), h('small', {}, s.doneToday ? t('chStreakSafe') : t('chStreakKeep'))));
  return h('div', { class: 'cboard' }, clock, streakCard, potCard());
}

/** Grown-up corner: the prize and how many pearls fill the pot. */
export function prizeNodes() {
  const name = h('input', { class: 'textin', type: 'text', maxlength: 36, placeholder: t('chPrizeNamePh'), value: S.settings.potPrize || '', 'aria-label': t('chPrizeName'),
    onchange: (e) => { S.settings.potPrize = e.target.value.trim().slice(0, 36); save(); } });
  const goal = h('select', { class: 'textin', 'aria-label': t('chPrizeGoal'), onchange: (e) => { S.settings.potGoal = +e.target.value; save(); } },
    [150, 300, 450, 600, 900].map((n) => h('option', { value: n, selected: (Number(S.settings.potGoal) || 300) === n }, String(n))));
  return [h('label', { class: 'field' }, h('span', {}, t('chPrizeName')), name), h('label', { class: 'field' }, h('span', {}, t('chPrizeGoal')), goal), h('p', { class: 'muted small' }, t('chPrizeNote'))];
}
