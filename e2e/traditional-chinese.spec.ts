/**
 * Traditional Chinese (zh-Hant) interface.
 *
 * Protects: a zh-TW browser picks Traditional Chinese on its own, the settings
 * pages render Traditional text with no Simplified characters left over, and
 * the language menu offers 繁體中文. The unit tests check the catalog keys; only
 * a real browser shows the rendered pages, its language list and the menu
 * popup, and each test keeps a screenshot for review.
 */
import { expect, test } from './fixtures';
import type { Platform, SectionId } from './pages/SettingsPreviewPage';

test.use({ locale: 'zh-TW' });

// Characters whose Simplified form differs from the Traditional one.
const SIMPLIFIED = /[这为个时开关门们说话对发机设网络图标键录频视输复贴将无删资过还选择显认证软载达动态应该备组连闭启项码页]/u;
const SECTIONS: { id: SectionId; heading: string }[] = [
  { id: 'general', heading: '通用' },
  { id: 'appearance', heading: '外觀' },
  { id: 'layout', heading: '佈局' },
  { id: 'input', heading: '鍵鼠' },
  { id: 'clipboard', heading: '剪貼簿' },
  { id: 'audio', heading: '音訊' },
  { id: 'shortcuts', heading: '快速鍵' },
  { id: 'tools', heading: '工具' },
  { id: 'permissions', heading: '權限' },
  { id: 'diagnostics', heading: '診斷' },
];

test.describe('Traditional Chinese settings', () => {
  for (const platform of ['win', 'mac'] as Platform[]) {
    for (const { id, heading } of SECTIONS) {
      // Windows needs no system permissions, so it has no permissions section.
      if (platform === 'win' && id === 'permissions') continue;
      test(`shows the ${id} section in Traditional Chinese on ${platform}`, async ({ settings, page }) => {
        await settings.goto(platform, id);
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
        await expect(settings.section(id).getByRole('heading', { level: 2 })).toHaveText(heading);
        expect((await settings.section(id).innerText()).match(SIMPLIFIED)?.[0]).toBeUndefined();
      });
    }
  }

  test('offers 繁體中文 in the language menu', async ({ settings, page }) => {
    await settings.goto('win', 'appearance');
    await settings.openLanguageMenu();
    await expect(page.getByRole('menuitemradio', { name: /繁體中文/ }).or(page.getByRole('option', { name: /繁體中文/ }))).toBeVisible();
  });
});

test.describe('Traditional Chinese main window', () => {
  test('follows a zh-TW browser when the language is automatic', async ({ mainWindow, page }) => {
    await mainWindow.goto();
    await expect(page.getByText('沒有可共享的螢幕')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
  });
});
