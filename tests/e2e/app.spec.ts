import { expect, test, type Page } from "@playwright/test";

const ignoredConsoleFragments = ["Download the React DevTools"];

async function monitorPage(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !ignoredConsoleFragments.some((fragment) => message.text().includes(fragment))) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500 || (status === 404 && !url.includes("/favicon.ico"))) {
      failedRequests.push(`${status} ${url}`);
    }
  });

  return {
    assertClean() {
      expect(consoleErrors, "browser console errors").toEqual([]);
      expect(pageErrors, "uncaught page errors").toEqual([]);
      expect(failedRequests, "failed network responses").toEqual([]);
    }
  };
}

test("main routes render and connect via visible navigation", async ({ page }) => {
  const monitor = await monitorPage(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Real-Time NALCO Intelligence/i })).toBeVisible();
  await page.getByRole("link", { name: /Open Intelligence Dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Aluminium Market Signals")).toBeVisible();

  await page.getByRole("link", { name: "Entity Explorer" }).click();
  await expect(page).toHaveURL(/\/entities$/);
  await expect(page.getByRole("heading", { name: "Network Map" })).toBeVisible();

  await page.getByRole("link", { name: "Demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("heading", { name: /Project Architecture/i })).toBeVisible();

  monitor.assertClean();
});

test("chatbot opens, answers suggested prompt, and renders citations", async ({ page }) => {
  const monitor = await monitorPage(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Open NALCO assistant" }).click();
  await expect(page.getByText("NALCO Intelligence Assistant", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Aluminium Market" }).click();
  await expect(page.getByText(/Based on the retrieved sources/i)).toBeVisible();
  await expect(page.getByText(/Confidence/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /\[1\]/ })).toBeVisible();

  await page.getByRole("button", { name: "Collapse chat" }).click();
  await expect(page.getByText("NALCO Intelligence Assistant", { exact: true })).not.toBeVisible();
  monitor.assertClean();
});

test("mobile chatbot remains usable and within viewport", async ({ page }) => {
  const monitor = await monitorPage(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await page.getByRole("button", { name: "Open NALCO assistant" }).click();
  await expect(page.getByText("NALCO Intelligence Assistant", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Ask about NALCO...").fill("unsupported query about a private contract");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/could not verify|Based on the retrieved sources/i)).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "mobile chatbot horizontal overflow").toBeLessThanOrEqual(32);
  monitor.assertClean();
});

test("search form and linked dashboard controls return evidence", async ({ page }) => {
  const monitor = await monitorPage(page);

  await page.goto("/dashboard");
  await page.getByRole("link", { name: "1M" }).click();
  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.getByText(/retrieval score/i)).toHaveCount(5);

  await page.getByPlaceholder("Enter query to search evidence base...").fill("policy aluminium");
  await page.getByRole("button", { name: /Search/i }).click();
  await expect(page).toHaveURL(/q=policy\+aluminium|q=policy%20aluminium/);
  await expect(page.getByText(/retrieval score/i).first()).toBeVisible();

  monitor.assertClean();
});

test("source library and detail pages handle valid and invalid documents", async ({ page }) => {
  const monitor = await monitorPage(page);

  await page.goto("/sources");
  await expect(page.getByRole("heading", { name: "Source Library" })).toBeVisible();
  await page.getByRole("link", { name: /NALCO board recommends/i }).click();
  await expect(page.getByRole("heading", { name: /NALCO board recommends/i })).toBeVisible();
  await expect(page.getByText("Verified Summary")).toBeVisible();
  await expect(page.getByText("Detected Entities")).toBeVisible();

  await page.goto("/sources/not-a-real-id");
  await expect(page.getByText("Source not found")).toBeVisible();

  monitor.assertClean();
});

test("data sources status page shows integrations and run control", async ({ page }) => {
  const monitor = await monitorPage(page);

  await page.goto("/sources/status");
  await expect(page.getByRole("heading", { name: "Data Sources" })).toBeVisible();
  await expect(page.getByText("Google Sheets", { exact: true })).toBeVisible();
  await expect(page.getByText("Ollama Cloud", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Run ingestion now/i })).toBeVisible();
  await expect(page.getByText(/NALCO Official Website/i)).toBeVisible();

  monitor.assertClean();
});

test("demo sidebar can collapse and expand", async ({ page }) => {
  const monitor = await monitorPage(page);
  await page.setViewportSize({ width: 1117, height: 837 });

  await page.goto("/demo");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await expect(page.locator("nav")).toHaveClass(/-translate-x-full/);
  await expect(page.locator("main")).toHaveClass(/md:ml-0/);

  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.locator("nav")).not.toHaveClass(/-translate-x-full/);
  await expect(page.locator("main")).toHaveClass(/md:ml-\[280px\]/);

  monitor.assertClean();
});

test("api routes return expected JSON and validation errors", async ({ request }) => {
  await expect((await request.get("/api/health")).ok()).toBeTruthy();
  await expect((await request.get("/api/documents?limit=2")).ok()).toBeTruthy();
  await expect((await request.get("/api/entities")).ok()).toBeTruthy();
  await expect((await request.get("/api/analytics/overview")).ok()).toBeTruthy();
  await expect((await request.get("/api/sources/status")).ok()).toBeTruthy();
  await expect((await request.get("/api/search?q=aluminium")).ok()).toBeTruthy();

  const chat = await request.post("/api/chat", { data: { question: "What aluminium news could affect NALCO?" } });
  expect(chat.ok()).toBeTruthy();
  await expect(await chat.json()).toHaveProperty("citations");

  const badChat = await request.post("/api/chat", { data: { question: "" } });
  expect(badChat.status()).toBe(400);

  const missingDoc = await request.get("/api/documents/not-a-real-id");
  expect(missingDoc.status()).toBe(404);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`responsive smoke: ${viewport.name}`, async ({ page }) => {
    const monitor = await monitorPage(page);
    await page.setViewportSize(viewport);

    for (const route of ["/", "/dashboard", "/entities", "/demo", "/sources", "/search?q=NALCO"]) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} horizontal overflow at ${viewport.name}`).toBeLessThanOrEqual(32);
    }

    monitor.assertClean();
  });
}
