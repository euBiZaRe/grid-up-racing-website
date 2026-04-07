from playwright.sync_api import sync_playwright
import re

def test_scrape():
    url = "https://garage61.net/app/drivers/alex-cortez"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a real user agent to avoid bot detection
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()
        print(f"Opening {url}...")
        page.goto(url, wait_until="networkidle")
        page.screenshot(path="scripts/debug_scrape.png")
        print("Screenshot saved to scripts/debug_scrape.png")
        
        # Wait for potential Angular load
        try:
            page.wait_for_selector(".statistics", timeout=15000)
            print("Statistics section found.")
        except:
            print("Statistics section NOT found. Getting page content...")
            # print(page.content()[:1000])

        print("\n--- MEMBER SINCE CHECK ---")
        selectors = [
            "dt:has-text('Member since') + dd",
            "//dt[contains(text(), 'Member since')]/following-sibling::dd[1]",
            "div:has-text('Member since') + div"
        ]
        for sel in selectors:
            try:
                # Try with a more permissive locator
                loc = page.locator(sel).first
                if loc.count() > 0:
                    val = loc.text_content(timeout=3000).strip()
                    print(f"Selector '{sel}' found: {val}")
                else:
                    print(f"Selector '{sel}' NOT found (count=0).")
            except Exception as e:
                print(f"Selector '{sel}' failed/timed out.")

        print("\n--- IRATING CHECK ---")
        disp_name = "Sports Car"
        ir_selectors = [
            f"tr:has-text('{disp_name}')",
            f"//tr[contains(., '{disp_name}')]",
            "table tr"
        ]
        for sel in ir_selectors:
            try:
                loc = page.locator(sel)
                count = loc.count()
                print(f"Selector '{sel}' matched {count} elements.")
                if count > 0:
                    for i in range(min(count, 5)):
                        content = loc.nth(i).text_content().replace('\n', ' ').strip()
                        print(f"  Match {i}: {content}")
            except:
                print(f"IR Selector '{sel}' failed.")
        
        browser.close()

if __name__ == "__main__":
    test_scrape()
