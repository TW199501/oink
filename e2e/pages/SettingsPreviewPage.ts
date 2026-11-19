import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type Platform = 'win' | 'mac';
export type SectionId = 'general' | 'appearance' | 'layout' | 'input' | 'clipboard' | 'audio' | 'shortcuts' | 'tools' | 'permissions' | 'diagnostics';

/** The dev-only settings page fixture (`?fixture=settings`), rendered without a backend. */
export class SettingsPreviewPage {
  readonly languageSelect: Locator;

  constructor(readonly page: Page) {
    this.languageSelect = page.getByRole('combobox', { name: '語言' });
  }

  section(id: SectionId): Locator {
    return this.page.locator(`[data-section="${id}"]`);
  }

  async goto(platform: Platform, section: SectionId, lang = 'zh-Hant') {
    await this.page.goto(`/?fixture=settings&lang=${lang}&platform=${platform}&section=${section}`);
    await expect(this.section(section)).toBeVisible();
  }

  async openLanguageMenu() {
    await this.languageSelect.scrollIntoViewIfNeeded();
    await this.languageSelect.click();
  }
}
