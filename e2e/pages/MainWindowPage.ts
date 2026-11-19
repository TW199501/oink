import type { Locator, Page } from '@playwright/test';

/** The main window as the dev server shows it without an Oink service behind it. */
export class MainWindowPage {
  readonly root: Locator;

  constructor(readonly page: Page) {
    this.root = page.locator('#root');
  }

  async goto() {
    await this.page.goto('/');
  }
}
