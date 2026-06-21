import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "../helpers/auth.js";

async function addIngredientToFrigo(page, ingredientSearch, ingredientName, quantity = "2") {
  await page.goto("/mon-frigo", { waitUntil: "domcontentloaded" });

  await page.getByTestId("add-ingredient-button").click();

  const searchResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/ingredients/search")
  );

  await page.getByTestId("ingredient-search").fill(ingredientSearch);

  const searchResponse = await searchResponsePromise;

  if (!searchResponse.ok()) {
    throw new Error(
      `Erreur API ingredients/search: ${searchResponse.status()} ${await searchResponse.text()}`
    );
  }

  await page.getByText(new RegExp(`^${ingredientName}$`, "i")).first().click();

  await page.getByTestId("ingredient-quantity").fill(quantity);

  const addResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/inventory/add")
  );

  await page.getByTestId("submit-ingredient-button").click();

  const addResponse = await addResponsePromise;

  if (!addResponse.ok()) {
    throw new Error(
      `Erreur API inventory/add: ${addResponse.status()} ${await addResponse.text()}`
    );
  }

  await expect(page.getByTestId("ingredient-card").first()).toBeVisible({
    timeout: 10000,
  });
}

async function goToMatchingAndWait(page) {
  const matchingResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/matching")
  );

  await page.goto("/mes-matchs", { waitUntil: "domcontentloaded" });

  const response = await matchingResponsePromise;

  if (!response.ok()) {
    throw new Error(
      `Erreur API matching: ${response.status()} ${await response.text()}`
    );
  }

  const body = await response.json();

  await expect(page.locator(".loading-text")).toHaveCount(0, {
    timeout: 10000,
  });

  return body;
}

test("un utilisateur peut accéder à la page Mes Matchs", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await goToMatchingAndWait(page);

  await expect(
    page.getByRole("heading", { name: /mes matchs/i })
  ).toBeVisible();
});

test("un utilisateur sans ingrédient voit un message aucun match", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  const body = await goToMatchingAndWait(page);

  expect(body.count).toBe(0);

  await expect(page.getByText(/aucun match pour le moment/i)).toBeVisible();
});

test("le matching retourne une réponse après ajout d'un ingrédient", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await addIngredientToFrigo(page, "riz", "Riz", "2");

  const body = await goToMatchingAndWait(page);

  expect(body.debug.inventoryCount).toBeGreaterThan(0);
  expect(body.debug.recipesCount).toBeGreaterThan(0);
  expect(Array.isArray(body.results)).toBeTruthy();
});