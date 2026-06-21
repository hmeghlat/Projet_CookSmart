import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "../helpers/auth.js";

test("un utilisateur peut rechercher une recette existante", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await page.goto("/recettes", { waitUntil: "domcontentloaded" });

  const searchInput = page.getByTestId("recipe-search");
  await expect(searchInput).toBeVisible();

  const recipesResponse = page.waitForResponse((response) =>
    response.url().includes("/api/recipes") &&
    response.url().includes("search=omelette")
  );

  await searchInput.fill("omelette");
  await recipesResponse;

  await expect(page.getByText(/omelette/i)).toBeVisible();
});

test("un utilisateur voit un message lorsqu'aucune recette ne correspond", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await page.goto("/recettes", { waitUntil: "domcontentloaded" });

  const searchInput = page.getByTestId("recipe-search");
  await expect(searchInput).toBeVisible();

  const recipesResponse = page.waitForResponse((response) =>
    response.url().includes("/api/recipes") &&
    response.url().includes("search=zzzzzz")
  );

  await searchInput.fill("zzzzzz");
  await recipesResponse;

  await expect(page.getByText(/aucune recette trouvée/i)).toBeVisible();
});

test("un utilisateur peut réinitialiser sa recherche", async ({ page, request }) => {
  await createAndLoginUser(page, request);

  await page.goto("/recettes", { waitUntil: "domcontentloaded" });

  const searchInput = page.getByTestId("recipe-search");
  await expect(searchInput).toBeVisible();

  const searchResponse = page.waitForResponse((response) =>
    response.url().includes("/api/recipes") &&
    response.url().includes("search=omelette")
  );

  await searchInput.fill("omelette");
  await searchResponse;

  await expect(page.getByText(/omelette/i)).toBeVisible();

  const resetResponse = page.waitForResponse((response) =>
    response.url().includes("/api/recipes") &&
    !response.url().includes("search=")
  );

  await searchInput.clear();
  await resetResponse;

  await expect(page.getByText(/recettes disponibles|recette disponible/i)).toBeVisible();
});