import { test as base } from '@playwright/test';
import { MainWindowPage } from './pages/MainWindowPage';
import { SettingsPreviewPage } from './pages/SettingsPreviewPage';

export const test = base.extend<{ settings: SettingsPreviewPage; mainWindow: MainWindowPage }>({
  settings: async ({ page }, use) => { await use(new SettingsPreviewPage(page)); },
  mainWindow: async ({ page }, use) => { await use(new MainWindowPage(page)); },
});
export { expect } from '@playwright/test';
