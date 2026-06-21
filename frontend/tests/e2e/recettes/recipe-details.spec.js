import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "../helpers/auth.js";

async function openFirstRecipeDetail(page) {
  const recipesResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/recipes")
  );

  await page.goto("/recettes", { waitUntil: "domcontentloaded" });
  await recipesResponsePromise;

  await expect(page.locator(".recipe-card").first()).toBeVisible({
    timeout: 10000,
  });

  await page.locator(".recipe-card").first().click();

  await expect(page).toHaveURL(/\/recettes\/\d+/);
}

test("un utilisateur peut ouvrir le détail d'une recette", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await openFirstRecipeDetail(page);

  await expect(page.locator(".recipe-detail-wrapper")).toBeVisible();
});

test("la page détail affiche les ingrédients et la préparation", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await openFirstRecipeDetail(page);

  await expect(page.getByRole("heading", { name: /ingrédients/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /préparation/i })).toBeVisible();
  await expect(page.locator(".preparation-steps .step-item").first()).toBeVisible();
});

test("un utilisateur peut revenir à la liste des recettes", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await openFirstRecipeDetail(page);

  await page.getByRole("button", { name: /retour aux recettes/i }).first().click();

  await expect(page).toHaveURL(/\/recettes$/);
  await expect(page.getByTestId("recipe-search")).toBeVisible();
});