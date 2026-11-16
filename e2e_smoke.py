"""Browser smoke test for the locally running attendance application."""
from playwright.sync_api import sync_playwright


def main():
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        page.goto("http://127.0.0.1:5173", wait_until="networkidle")
        assert "/login" in page.url, f"Expected login page, got {page.url}"
        page.locator("input").nth(0).fill("admin")
        page.locator("input").nth(1).fill("admin123")
        page.get_by_role("button", name="Login", exact=True).click()
        page.wait_for_url("**/dashboard")
        page.wait_for_load_state("networkidle")
        page.get_by_role("heading", name="Dashboard").wait_for()

        for label, heading in [
            ("Class Sessions", "Class Sessions"),
            ("Attendance Records", "Attendance Records"),
            ("Reports", "Reports"),
            ("Audit Logs", "Audit Logs"),
        ]:
            page.get_by_role("link", name=label).click()
            page.wait_for_load_state("networkidle")
            assert page.get_by_role("heading", name=heading).is_visible(), label

        page.screenshot(path="e2e-smoke.png", full_page=True)
        browser.close()

    serious_errors = [error for error in errors if "favicon" not in error.lower()]
    assert not serious_errors, "Browser console errors: " + " | ".join(serious_errors)
    print("Browser smoke test: PASS")


if __name__ == "__main__":
    main()
