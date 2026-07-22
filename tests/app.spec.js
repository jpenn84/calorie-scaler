import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Calorie Scaler App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calories/');
  });

  test('should calculate calories correctly', async ({ page }) => {
    // Fill in Nutrition Label Calories
    const caloriesInput = page.locator('#labelCaloriesInput');
    await caloriesInput.fill('200');

    // Fill in Nutrition Label Portion Size
    const portionInput = page.locator('#labelPortionInput');
    await portionInput.fill('30');

    // Select Grams (g) for the Label Unit
    // Using nth(0) because there are two selects that look similar, 
    // but we can also use aria-label.
    const labelUnitSelect = page.locator('select[aria-label="Unit selection"]').first();
    await labelUnitSelect.selectOption('g');

    // Fill in My Serving Size
    const myServingInput = page.locator('#myServingInput');
    await myServingInput.fill('60');

    // Verify calculated calories is 400
    // The calculated calorie amount is displayed in a large text element.
    const resultElement = page.getByText('400');
    await expect(resultElement).toBeVisible();
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Wait for the app to fully load
    await page.waitForSelector('#labelCaloriesInput');

    // Run Axe on the page
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // Assert there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  test('should calculate calories correctly with different units (ml to L)', async ({ page }) => {
    await page.locator('#labelCaloriesInput').fill('200');
    await page.locator('#labelPortionInput').fill('100');
    
    // Select Milliliters (ml) for Label Unit
    await page.locator('select[aria-label="Unit selection"]').first().selectOption('ml');
    
    // Select Liters (L) for My Serving Unit
    await page.locator('select[aria-label="Unit selection"]').nth(1).selectOption('l');
    
    // Fill in My Serving Size
    await page.locator('#myServingInput').fill('0.5');

    // 200 kcal for 100 ml = 2 kcal / ml
    // 0.5 L = 500 ml -> 500 * 2 = 1000 kcal
    await expect(page.getByText('1000')).toBeVisible();
  });

  test('should only allow weight units for My Serving Size when Label uses weight units', async ({ page }) => {
    // Select Grams (g) for Label Unit (which is a weight unit)
    await page.locator('select[aria-label="Unit selection"]').first().selectOption('g');

    // Get all options in the My Serving Unit dropdown
    const myUnitOptions = page.locator('select[aria-label="Unit selection"]').nth(1).locator('option');
    
    // Assert the text matches exactly the weight options
    await expect(myUnitOptions).toHaveText([
      'Grams (g)',
      'Ounces (oz)',
      'Kilograms (kg)',
      'Pounds (lb)',
      'Milligrams (mg)'
    ]);
  });

  test('should only allow volume units for My Serving Size when Label uses volume units', async ({ page }) => {
    // Select Cups (cup) for Label Unit (which is a volume unit)
    await page.locator('select[aria-label="Unit selection"]').first().selectOption('cup');

    // Get all options in the My Serving Unit dropdown
    const myUnitOptions = page.locator('select[aria-label="Unit selection"]').nth(1).locator('option');
    
    // Assert the text matches exactly the volume options
    await expect(myUnitOptions).toHaveText([
      'Milliliters (ml)',
      'Cups',
      'Tablespoons (tbsp)',
      'Teaspoons (tsp)',
      'Fluid Oz (fl oz)',
      'Liters (L)'
    ]);
  });
  test('should only allow generic units for My Serving Size when Label uses generic units', async ({ page }) => {
    // Select Unit for Label Unit (which is a generic unit)
    await page.locator('select[aria-label="Unit selection"]').first().selectOption('Unit');

    // Get all options in the My Serving Unit dropdown
    const myUnitOptions = page.locator('select[aria-label="Unit selection"]').nth(1).locator('option');
    
    // Assert the text matches exactly the generic options
    await expect(myUnitOptions).toHaveText([
      'Unit'
    ]);
  });
  test('should automatically select the same unit for My Serving Size when Label Unit is changed', async ({ page }) => {
    // Select Ounces (oz) for Label Unit (the 2nd weight unit option)
    await page.locator('select[aria-label="Unit selection"]').first().selectOption('oz');

    // Verify My Serving Size unit is automatically set to Ounces (oz)
    const myUnitSelect = page.locator('select[aria-label="Unit selection"]').nth(1);
    await expect(myUnitSelect).toHaveValue('oz');
  });
});
