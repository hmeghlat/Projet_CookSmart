import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "../helpers/auth.js";

async function addIngredient(page) {
  await page.goto("/mon-frigo", { waitUntil: "domcontentloaded" });

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
  await addResponsePromise;

  await expect(page.getByTestId("ingredient-card").first()).toBeVisible({
    timeout: 10000,
  });
}

test("un utilisateur peut ouvrir la confirmation de suppression", async ({
  page,
  request,
}) => {
  await createAndLoginUser(page, request);
  await addIngredient(page);

  await page.getByTestId("delete-ingredient-button").first().click();

  await expect(page.getByText(/confirmer la suppression/i)).toBeVisible();
  await expect(page.getByText(/êtes-vous sûr/i)).toBeVisible();
});

test("un utilisateur peut annuler la suppression d'un ingrédient", async ({
  page,
  request,
}) => {
  await createAndLoginUser(page, request);
  await addIngredient(page);

  await page.getByTestId("delete-ingredient-button").first().click();

  await page.getByRole("button", { name: /annuler/i }).click();

  await expect(page.getByTestId("ingredient-card").first()).toBeVisible();
});

test("un utilisateur peut supprimer un ingrédient de son frigo", async ({
  page,
  request,
}) => {
  await createAndLoginUser(page, request);
  await addIngredient(page);

  await page.getByTestId("delete-ingredient-button").first().click();

  const deleteResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/inventory/delete")
  );

  await page.getByTestId("confirm-delete-ingredient-button").click();

  const deleteResponse = await deleteResponsePromise;

  if (!deleteResponse.ok()) {
    throw new Error(
      `Erreur API inventory/delete: ${deleteResponse.status()} ${await deleteResponse.text()}`
    );
  }

  await expect(page.getByText(/votre frigo est vide/i)).toBeVisible({
    timeout: 10000,
  });
});