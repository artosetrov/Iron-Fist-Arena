const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate to the combat page
  await page.goto('http://localhost:3000/combat', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for content
  await page.waitForTimeout(3000);
  
  // Get page content to debug
  const content = await page.content();
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());
  
  // Take screenshot regardless
  await page.screenshot({ path: 'combat-screenshot.png', fullPage: true });
  
  console.log('Screenshot saved as combat-screenshot.png');
  
  await browser.close();
})();
