// Run with playwright-cli run-code --filename tests/overflow-menu.js after opening the app.
async (page) => {
  // Routing disables the HTTP cache so reruns pick up edited stylesheets.
  const freshAssets = route => route.continue();
  await page.route('**/*', freshAssets);
  const results = [];
  for (const width of [1440, 768, 767, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['dark', 'light']) {
      await page.reload();
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      await page.locator('#menuBtn').click();
      await page.locator('#menu').evaluate(async menu => {
        await Promise.all(menu.getAnimations().map(animation => animation.finished));
      });
      // Visibility alone misses menus painted underneath another pane. Hit-test each item.
      const covered = await page.locator('.menu-item').evaluateAll(items => items.filter(item => {
        const r = item.getBoundingClientRect();
        return [0.1, 0.5, 0.9].some(y =>
          !item.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height * y)));
      }).map(item => item.id));
      if (covered.length) throw new Error(`${width}px ${theme}: covered menu items: ${covered.join(', ')}`);
      if (!await page.locator('#menuSettings').evaluate(item => item === document.activeElement)) {
        throw new Error('Opening the menu must focus Settings');
      }
      await page.keyboard.press('ArrowDown');
      if (!await page.locator('#menuAbout').evaluate(item => item === document.activeElement)) {
        throw new Error('ArrowDown must focus About');
      }
      await page.keyboard.press('Escape');
      if (!await page.locator('#menu').isHidden()
          || !await page.locator('#menuBtn').evaluate(item => item === document.activeElement)) {
        throw new Error('Escape must close the menu and return focus to its button');
      }
      for (const [item, sheet] of [['#menuSettings', '#settingsSheet'], ['#menuAbout', '#aboutSheet']]) {
        await page.locator('#menuBtn').click();
        await page.locator(item).click({ timeout: 2000 });
        await page.locator(sheet).waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await page.locator(sheet).waitFor({ state: 'hidden' });
      }
      results.push(`${width}px ${theme}: PASS`);
    }
  }
  await page.unroute('**/*', freshAssets);
  return results;
}
