import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "../helpers/auth.js";

async function goToFrigo(page) {
  const inventoriesResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/inventories")
  );

  await page.goto("/mon-frigo", { waitUntil: "domcontentloaded" });

  const response = await inventoriesResponsePromise;

  if (!response.ok()) {
    throw new Error(
      `Erreur API inventories: ${response.status()} ${await response.text()}`
    );
  }
}

test("un utilisateur peut ouvrir la fenêtre d'ajout d'un ingrédient", async ({
  page,
  request,
}) => {
  await createAndLoginUser(page, request);

  await goToFrigo(page);

  await page.getByTestId("add-ingredient-button").click();

  await expect(page.getByTestId("ingredient-modal")).toBeVisible();
});

test("un utilisateur peut rechercher un ingrédient", async ({
  page,
  request,
}) => {
  await createAndLoginUser(page, request);

  await goToFrigo(page);

  await page.getByTestId("add-ingredient-button").click();

  const searchResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/ingredients/search")
  );

  await page.getByTestId("ingredient-search").fill("tom");

  const searchResponse = await searchResponsePromise;

  if (!searchResponse.ok()) {
    throw new Error(
      `Erreur API ingredients/search: ${searchResponse.status()} ${await searchResponse.text()}`
    );
  }

  await expect(page.getByText(/tomate/i).first()).toBeVisible();
});

test("un utilisateur peut ajouter un ingrédient à son frigo", async ({
  page,
  request,
}) => {
  await createAndLoginUser(page, request);

  await goToFrigo(page);

  await page.getByTestId("add-ingredient-button").click();

  const searchResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/ingredients/search")
  );

  await page.getByTestId("ingredient-search").fill("tom");

  await searchResponsePromise;

  await page.getByText(/tomate/i).first().click();

  await page.getByTestId("ingredient-quantity").fill("2");

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

  await expect(page.getByText(/tomate/i).first()).toBeVisible();
});