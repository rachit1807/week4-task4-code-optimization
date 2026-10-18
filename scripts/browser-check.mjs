import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
for (const width of [1440, 768, 390, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Run benchmark' }).click();
  await page.getByText('RUN COMPLETE', { exact: true }).waitFor();
  assert.equal(await page.locator('#integrity').textContent(), 'Passed ✓');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
  await page.screenshot({ path: `docs/workbench-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.screenshot({ path: `docs/light-${width}.png`, fullPage: true });
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.getByRole('button', { name: /Run history/ }).click();
  assert.equal(await page.locator('.history-card').count(), 1);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export ↓', exact: true }).click(); assert.ok((await download).suggestedFilename().endsWith('.md'));
  await page.getByRole('button', { name: 'Clear history' }).click();
  assert.equal(await page.locator('.history-card').count(), 0);
  for (const name of ['Code explorer', 'Field notes']) { await page.getByRole('button', { name: new RegExp(name) }).first().click(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow ${name} ${width}`); }
  assert.deepEqual(errors, []);
  console.log(`PASS ${width}px: benchmark, theme persistence, history, export, navigation, no overflow or page errors`);
  await page.close();
}
await browser.close();
