import { expect } from "@playwright/test";

const API_URL = "https://127.0.0.1:8000";

export async function createAndLoginUser(page, request) {
  const email = `user-${Date.now()}-${Math.random().toString(36).slice(2)}@mail.com`;
  const password = "Password123";

  const registerResponse = await request.post(`${API_URL}/api/register`, {
    ignoreHTTPSErrors: true,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      pseudo: "TestUser",
      email,
      password,
    },
  });

  if (!registerResponse.ok()) {
    throw new Error(
      `Register failed: ${registerResponse.status()} ${await registerResponse.text()}`
    );
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);

  const loginResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/login_check")
  );

  await page
    .getByRole("button", { name: /connexion|se connecter/i })
    .click();

  const loginResponse = await loginResponsePromise;

  if (!loginResponse.ok()) {
    throw new Error(
      `Login failed: ${loginResponse.status()} ${await loginResponse.text()}`
    );
  }

  await expect(page).toHaveURL(/\/$/);

  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).not.toBeNull();

  return { email, password };
}