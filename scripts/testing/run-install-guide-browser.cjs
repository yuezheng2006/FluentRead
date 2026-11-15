#!/usr/bin/env node
// Validate the built installation journey in an isolated, focus-safe visible browser.
// Usage: node scripts/testing/run-install-guide-browser.cjs --playwright-root /path/to/node_modules --out /path/to/evidence
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {launchFocusSafePersistentContext, newPageWithoutForeground} = require('./focus-safe-browser.cjs');
const arg = name => {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing --${name}`);
  return process.argv[index + 1];
};
const {chromium} = require(path.join(path.resolve(arg('playwright-root')), 'playwright'));
const output = path.resolve(arg('out'));
const dist = path.resolve(__dirname, '../../docs/.vitepress/dist');
fs.mkdirSync(output, {recursive: true});
assert(fs.existsSync(path.join(dist, 'start.html')), 'Build docs before running this check');
const mime = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2'};
const server = http.createServer((request, response) => {
  const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const candidate = path.resolve(dist, `.${name}`);
  if (candidate !== dist && !candidate.startsWith(dist + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  const file = [candidate, candidate + '.html', path.join(candidate, 'index.html')]
    .find(value => fs.existsSync(value) && fs.statSync(value).isFile());
  if (!file) { response.writeHead(404).end('Not found'); return; }
  response.writeHead(200, {'content-type': mime[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(response);
});
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fluentread-install-guide-'));
const evidence = {ok: false, scope: 'Built website journey only; no store installation or translation provider requests', cases: [], diagnostics: [], expectedNavigationAborts: [], screenshots: []};
let session;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const browserPath = process.env.FLUENTREAD_BROWSER_PATH || [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].find(candidate => fs.existsSync(candidate));
    assert(browserPath, 'Set FLUENTREAD_BROWSER_PATH to an installed browser');
    session = await launchFocusSafePersistentContext({chromium, profileDir: profile,
      browserPath,
      headless: false, background: true, displayTarget: 'secondary', viewport: {width: 1280, height: 900},
      browserArgs: ['--no-first-run', '--no-default-browser-check']});
    Object.assign(evidence, {launchMode: session.launchMode, focusPolicy: session.focusPolicy, windowPlacement: session.windowPlacement});
    assert.equal(session.windowPlacement.browserFrontmost, false);
    const leavingHome = new WeakSet();
    const newPage = async () => {
      const page = await newPageWithoutForeground(session.context, 30000);
      page.on('pageerror', error => evidence.diagnostics.push({type: 'pageerror', message: error.message}));
      page.on('console', message => {
        if (['error', 'warning'].includes(message.type())) evidence.diagnostics.push({type: message.type(), message: message.text()});
      });
      page.on('requestfailed', request => {
        if (!request.url().startsWith(base)) return;
        const failure = {type: 'requestfailed', message: request.url(), error: request.failure()?.errorText};
        // Leaving the homepage cancels its media request. Retain this precise
        // lifecycle event as evidence; all other failures still fail the run.
        if (request.resourceType() === 'media' && failure.error === 'net::ERR_ABORTED'
          && /^\/videos\/fluentread-promo-(zh|en)\.mp4$/.test(new URL(request.url()).pathname)
          && leavingHome.has(page)) {
          evidence.expectedNavigationAborts.push(failure);
        } else evidence.diagnostics.push(failure);
      });
      return page;
    };
    const shot = async (page, name) => {
      const file = `${name}.png`;
      await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
      await page.screenshot({path: path.join(output, file), fullPage: true, animations: 'disabled'});
      evidence.screenshots.push(file);
    };
    const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow');
    for (const prefix of ['', '/en']) {
      const page = await newPage();
      await page.goto(base + prefix + '/');
      const action = page.locator('.bv-install-actions > a.bv-primary');
      assert.equal(await action.getAttribute('href'), prefix + '/start');
      leavingHome.add(page);
      await action.click();
      await page.locator('#fr-install-browser').waitFor();
      leavingHome.delete(page);
      await page.selectOption('#fr-install-browser', 'Chrome');
      assert.equal(await page.locator('.fr-install-progress [aria-current="step"]').count(), 1);
      await shot(page, prefix ? 'install-en-desktop' : 'install-zh-desktop');
      for (const [browser, host] of [['Chrome', 'chromewebstore.google.com'], ['Edge', 'microsoftedge.microsoft.com'], ['Firefox', 'addons.mozilla.org']]) {
        await page.selectOption('#fr-install-browser', browser);
        const store = page.locator('.fr-install-task a.fr-install-primary');
        assert.equal(new URL(await store.getAttribute('href')).host, host);
        assert.equal(await store.getAttribute('target'), '_blank');
      }
      for (const browser of ['Safari', 'Mobile', 'Other']) {
        await page.selectOption('#fr-install-browser', browser);
        assert.equal(await page.locator('.fr-install-progress').count(), 0);
        assert.equal(await page.locator('.fr-install-task a.fr-install-primary').getAttribute('href'), prefix + '/guide/mobile-safari');
      }
      await page.selectOption('#fr-install-browser', 'Chrome');
      await page.locator('.fr-install-help summary').click();
      assert(await page.locator('.fr-install-help a').isVisible());
      await page.locator('.fr-install-help summary').click();
      for (const width of [320, 375, 414, 768, 1280]) {
        await page.setViewportSize({width, height: 900});
        await page.locator('.fr-install-progress button').nth(0).click();
        await noOverflow(page);
        await page.locator('.fr-install-next').click();
        assert.equal(await page.locator('.fr-install-task h2').evaluate(node => node === document.activeElement), true);
        await noOverflow(page);
        await page.locator('.fr-install-task button.fr-install-primary').click();
        await noOverflow(page);
        const practice = page.locator('.fr-install-task a.fr-install-primary');
        assert.equal(await practice.getAttribute('href'), prefix + '/guide/translation-playground');
        if (width === 320) await shot(page, prefix ? 'install-en-narrow' : 'install-zh-narrow');
        await page.locator('.fr-install-next').click();
        assert.equal(await page.locator('.fr-install-task a.fr-install-primary').getAttribute('href'), prefix + '/guide/webpage-translation');
        await noOverflow(page);
        evidence.cases.push(`${prefix || 'zh'}: flow/back/complete/no-overflow at ${width}px`);
      }
      await page.goto(base + prefix + '/guide/translation-playground');
      assert(await page.getByRole('heading', {name: 'Read at your own pace'}).isVisible());
      assert(await page.locator(`.vp-doc a[href="${prefix}/start"]`).isVisible());
      await page.close();
    }
    // Exercise recommendation rules without claiming real browser/device compatibility.
    for (const [ua, platform, touches, expected] of [
      ['Mozilla/5.0 Chrome/157.0 Safari/537.36', 'MacIntel', 0, 'Chrome'],
      ['Mozilla/5.0 Chrome/157.0 Safari/537.36 Edg/157.0', 'MacIntel', 0, 'Edge'],
      ['Mozilla/5.0 Firefox/146.0', 'MacIntel', 0, 'Firefox'],
      ['Mozilla/5.0 Version/26.0 Safari/605.1.15', 'MacIntel', 0, 'Safari'],
      ['Mozilla/5.0 Android Chrome/157.0', 'Linux', 5, 'Mobile'],
      ['Mozilla/5.0 Version/26.0 Safari/605.1.15', 'MacIntel', 5, 'Mobile'],
      ['Unknown browser', 'Unknown', 0, 'Other'],
    ]) {
      const page = await newPage();
      await page.addInitScript(({ua, platform, touches}) => {
        Object.defineProperties(navigator, {userAgent: {get: () => ua}, platform: {get: () => platform}, maxTouchPoints: {get: () => touches}});
      }, {ua, platform, touches});
      await page.goto(base + '/start');
      await page.waitForFunction(expected => document.querySelector('#fr-install-browser')?.value === expected, expected);
      evidence.cases.push(`UA recommendation: ${expected} / ${platform} / touch=${touches}`);
      await page.close();
    }
    assert.deepEqual(evidence.diagnostics, [], 'Website emitted errors or warnings');
    evidence.ok = true;
  } finally {
    try {
      if (session) await session.close();
    } finally {
      await new Promise(resolve => server.close(resolve));
      fs.rmSync(profile, {recursive: true, force: true});
      fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(evidence, null, 2));
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
