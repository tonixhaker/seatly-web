import { expect, test } from '@playwright/test';

test('opening an event renders one seat per seat', async ({ page }) => {
  await page.goto('/');
  const seatsResponse = page.waitForResponse(
    (response) =>
      /\/api\/v1\/events\/\d+\/seats$/.test(new URL(response.url()).pathname) &&
      response.ok(),
  );
  await page.locator('a[href^="/events/"]').first().click();
  const seats = (await (await seatsResponse).json()) as unknown[];

  expect(seats.length).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: /, seat \d+, / })).toHaveCount(
    seats.length,
  );
});
