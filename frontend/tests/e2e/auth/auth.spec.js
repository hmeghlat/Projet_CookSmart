import { test, expect } from "@playwright/test";

test("inscription utilisateur", async ({ page }) => {
  const email = `register-${Date.now()}@mail.com`;
  const password = "Password123";

  await page.goto("/register");

  await page.getByTestId("register-username").fill("TestUser");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill(password);

  const registerResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/register"),
  );

  await page.getByRole("button", { name: /s'inscrire|inscription/i }).click();

  const registerResponse = await registerResponsePromise;

  expect(registerResponse.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/login/);
});

test("connexion utilisateur", async ({ page, request }) => {
  const email = `login-${Date.now()}@mail.com`;
  const password = "Password123";

  // Préparation indépendante : on crée l'utilisateur via l'API
  const registerResponse = await request.post(
    "https://127.0.0.1:8000/api/register",
    {
      ignoreHTTPSErrors: true,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        pseudo: "LoginUser",
        email,
        password,
      },
    },
  );
 
  expect(registerResponse.ok()).toBeTruthy();

  await page.goto("/login");

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);

  const loginResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/login_check"),
  );

  await page.getByRole("button").click();

  const loginResponse = await loginResponsePromise;

  expect(loginResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL("http://localhost:5173/");

  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).not.toBeNull();
});
