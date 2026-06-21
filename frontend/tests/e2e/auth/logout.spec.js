import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "../helpers/auth";

test("un utilisateur peut se déconnecter", async ({
  page,
  request,
}) => {
  // Préparation
  await createAndLoginUser(page, request);

  // Vérifie qu'on est connecté
  expect(
    await page.evaluate(() =>
      localStorage.getItem("token")
    )
  ).not.toBeNull();

  // Action utilisateur
  await page.getByTestId("logout-button").click();

  // Vérifie la redirection
  await expect(page).toHaveURL("http://localhost:5173/");

  // Vérifie la suppression du token
  const token = await page.evaluate(() =>
    localStorage.getItem("token")
  );

  expect(token).toBeNull();

  // Vérifie que le bouton a disparu
  await expect(
    page.getByTestId("logout-button")
  ).toHaveCount(0);
});