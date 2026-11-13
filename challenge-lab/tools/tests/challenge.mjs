// Challenge pieces (Nov 13 2026): home board, streak, Weekly Prize Pot (claim once), Beat the Clock (a real timed round, bonus once a day), the name token, and the logo slot.
import { open, shot, pearls } from './lib.mjs';
const lang = process.argv[2] || 'en', device = process.argv[3] || 'ipad-land';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const { page, browser, errors } = await open({ lang, device });
const goto = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await wait(500); };
await page.evaluate(async () => {
  const st = await import('./js/core/store.js'); const S = st.S;
  S.settings.dailyLimit = 0; S.settings.bedtime = ''; S.settings.pinHash = null; S.settings.potPrize = 'Pizza night'; S.settings.potGoal = 300;
  S.pearls = { balance: 50, earned: 50, spent: 0 };
  const y = new Date(); y.setDate(y.getDate() - 1); S.days[st.dateKey(y)] = { sec: 600, q: 12, ok: 9, pearls: 90, missions: 1, topics: {}, prog: {} };
  st.day().q = 3; st.day().sec = 200; st.save();
});
await goto('#/quiz'); await goto('#/home');

// 1. the board
ok((await page.locator('.cboard .ccard').count()) === 3, 'three challenge cards on Home');
ok(/2/.test(await page.locator('.ccard.streak').innerText()), 'the streak counts yesterday and today (2 days)');
ok(/Pizza night/.test(await page.locator('.ccard.pot').innerText()), 'the Prize Pot shows the prize a grown-up chose');
ok((await page.locator('a.ccard.clock').getAttribute('href')).endsWith('/clock'), 'the clock card opens today’s mission in clock mode');
ok(!(await page.locator('.ccard.pot .btn').count()), 'no Claim button while the pot is not full');
const title = await page.title();
ok(/Max/.test(await page.locator('.hud .brand b').innerText()) || lang === 'es', 'the title uses the child’s name from brand.js');

// 2. the logo slot
ok((await page.locator('.hud img.partner').count()) === 1, 'the logo slot is in the top bar');
ok(await page.evaluate(() => { const i = document.querySelector('.hud img.partner'); return i.complete && i.naturalWidth > 0; }), 'img/brand/logo.png loads');
ok(await page.evaluate(() => { const h = document.querySelector('.hud'); const r = h.getBoundingClientRect(), i = document.querySelector('.hud img.partner').getBoundingClientRect(); return i.right <= r.right + 1 && h.scrollWidth <= h.clientWidth + 1; }), 'the top bar does not overflow with the logo');
const lang2 = await page.evaluate(() => [...document.querySelectorAll('.hud .seg button')].every((b) => b.getBoundingClientRect().width > 40));
ok(lang2, 'the EN / ES buttons are not squeezed');

// 3. fill the pot and claim once
await page.evaluate(async () => { const st = await import('./js/core/store.js'); st.day().pearls = 400; st.save(); });
await goto('#/quiz'); await goto('#/home');
ok(await page.locator('.ccard.pot .btn').count() === 1, 'a Claim button appears when the pot is full');
await page.locator('.ccard.pot .btn').click(); await wait(400);
ok(!(await page.locator('.ccard.pot .btn').count()) && (await page.locator('.ccard.pot .chip.on').count()) === 1, 'after claiming, the card shows it is claimed and no button');
const claimed = await page.evaluate(() => Object.keys(window.__lab.S.chal.claimed).length);
ok(claimed === 1, 'the claim is saved for this week');
ok(await page.evaluate(() => !!window.__lab.S.passport.badges.pot1), 'the Prize Winner badge is awarded');
await goto('#/quiz'); await goto('#/home');
ok(!(await page.locator('.ccard.pot .btn').count()), 'it cannot be claimed twice');

// 4. Beat the Clock: not on a normal mission, ticking on the clock route
await goto('#/quiz/mission/wild'); await page.waitForSelector('.qcard', { timeout: 8000 });
ok(!(await page.locator('.clockchip').count()), 'a normal mission has no clock');
await goto('#/quiz'); await goto('#/quiz/mission/wild/clock'); await page.waitForSelector('.qcard', { timeout: 8000 });
const t0 = await page.locator('.clockchip b').innerText();
ok(/^\d:\d\d$/.test(t0), `the clock shows a time (${t0})`);
await wait(1700);
ok((await page.locator('.clockchip b').innerText()) !== t0, 'the clock counts down');

// 5. play the round properly: the bonus is paid once
const answerQ = async () => {
  const qtext = await page.textContent('.qtext');
  const q = await page.evaluate(async ({ qtext, lang }) => { const bank = (await import(`./data/questions.${lang}.js`)).default; return bank.find((x) => x.q === qtext) || null; }, { qtext, lang });
  if (!q) return 'unknown';
  await wait(520);
  if (q.type === 'choice') await page.locator('.ans', { has: page.locator('.lab', { hasText: new RegExp('^' + q.opts[q.a].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }) }).first().click();
  else if (q.type === 'order') for (const o of q.opts) await page.locator('.pool .tilechip', { hasText: new RegExp('^' + o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click();
  else for (const ch of String(q.a)) await page.locator('.key', { hasText: new RegExp('^' + (ch === '-' ? '-' : ch) + '$') }).first().click();
  await page.locator('.qfoot .btn:not([hidden]):not(.ghost):not(.alt)').first().click();
  return q.type;
};
const playRound = async () => {
  for (let i = 0; i < 14; i++) {
    if (await page.$('.summary')) break;
    const r = await answerQ(); await wait(r === 'unknown' ? 300 : 1900);
    const nx = page.locator('.qfoot .btn.alt:not([hidden])'); if (await nx.count()) await nx.first().click().catch(() => {});
    await wait(150);
  }
  await page.waitForSelector('.summary', { timeout: 8000 });
};
await playRound();
let sum = await page.locator('.summary').innerText();
ok(/Beat the Clock|Gana al reloj/.test(sum) && /\+10/.test(sum), 'finishing on time with 2+ stars pays the +10 clock bonus');
ok(/You beat the clock|Ganaste al reloj/.test(sum), 'the summary says so');
ok(await page.evaluate(() => window.__lab.S.chal.done[window.__lab.S.days && Object.keys(window.__lab.S.chal.done)[0]].ok), 'the win is saved for today');
await shot(page, `challenge-summary-${lang}-${device}`);
await goto('#/home');
ok(/Challenge done|Reto cumplido/.test(await page.locator('.ccard.clock').innerText()), 'Home now shows the challenge as done');
await shot(page, `challenge-home-${lang}-${device}`);

// 6. a second clocked run pays no second bonus, and a slow run only loses the bonus (no penalty)
await goto('#/quiz/mission/wild/clock'); await page.waitForSelector('.qcard', { timeout: 8000 });
const bank = await pearls(page);
await playRound();
sum = await page.locator('.summary').innerText();
ok(!/Beat the Clock \+10|Gana al reloj \+10/.test(sum) && /again|otra vez/.test(sum), 'a second run the same day pays no second bonus');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close();
process.exit(fails ? 1 : 0);
