import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "../helpers/auth.js";

async function goToRecipesAndWait(page) {
  const recipesResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/recipes")
  );

  await page.goto("/recettes", { waitUntil: "domcontentloaded" });

  const response = await recipesResponsePromise;

  if (!response.ok()) {
    throw new Error(
      `Erreur API recipes: ${response.status()} ${await response.text()}`
    );
  }

  await expect(page.locator(".loading-text")).toHaveCount(0, {
    timeout: 10000,
  });
}

test("la page recettes charge les recettes depuis l'API", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  const recipesResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/recipes")
  );

  await page.goto("/recettes", { waitUntil: "domcontentloaded" });

  const response = await recipesResponsePromise;
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.recipes.length).toBeGreaterThan(0);
});

test("la page affiche au moins une carte recette", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await goToRecipesAndWait(page);

  await expect(page.locator(".recipe-card").first()).toBeVisible();
});

test("chaque recette affichée propose l'action Voir la recette", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await goToRecipesAndWait(page);

  await expect(page.locator(".recipe-card-button").first()).toHaveText(/voir la recette/i);
});