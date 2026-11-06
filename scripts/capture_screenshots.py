"""
Automated Screenshot Capture for BuyWise
Uses Playwright with Edge/Chromium to capture genuine high-resolution screenshots
of all running modules from http://127.0.0.1:5173.
"""

import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = os.path.abspath("docs/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def run_screenshot_capture():
    print("Launching browser for genuine application screenshot captures...")
    with sync_playwright() as p:
        # Launch using installed Microsoft Edge executable
        browser = p.chromium.launch(
            executable_path=EDGE_PATH,
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(
            viewport={"width": 1366, "height": 900},
            device_scale_factor=1.25
        )
        page = context.new_page()

        # 1. Capture Login Page
        print("1. Capturing 01_login.png...")
        page.goto("http://127.0.0.1:5173", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_login.png"), full_page=False)

        # 2. Login via Demo Student Account button
        print("Authenticating via Demo Workspace...")
        demo_btn = page.locator("button:has-text('Launch Demo Student Workspace')")
        if demo_btn.is_visible():
            demo_btn.click()
            page.wait_for_selector("text=Safe-to-Spend Right Now", timeout=10000)
            time.sleep(1.5)

        # 2. Capture Home Overview
        print("2. Capturing 02_home_overview.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_home_overview.png"), full_page=False)

        # 3. Capture Purchase Decision Analyzer
        print("3. Capturing 03_purchase_analyzer.png...")
        page.locator("button:has-text('Purchase Analyzer')").first.click()
        time.sleep(1)
        # Fill in candidate purchase
        page.fill("input[placeholder*='Noise Cancelling Headphones']", "Wireless Noise Cancelling Headphones")
        page.fill("input[placeholder='3500']", "3500")
        page.locator("button:has-text('Run Decision Analysis')").click()
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_purchase_analyzer.png"), full_page=False)

        # 4. Capture Daily Spending Evaluator
        print("4. Capturing 04_daily_evaluator.png...")
        page.locator("button:has-text('Daily Spending')").first.click()
        time.sleep(1)
        page.fill("input[placeholder='250']", "250")
        page.locator("button:has-text('Can I Spend This Today?')").click()
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "04_daily_evaluator.png"), full_page=False)

        # 5. Capture Financial Timeline
        print("5. Capturing 05_financial_timeline.png...")
        page.locator("button:has-text('Financial Timeline')").first.click()
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "05_financial_timeline.png"), full_page=False)

        # 6. Capture What-If Simulator
        print("6. Capturing 06_what_if_simulator.png...")
        page.locator("button:has-text('What-If Simulator')").first.click()
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "06_what_if_simulator.png"), full_page=False)

        # 7. Capture Spending Insights
        print("7. Capturing 07_spending_insights.png...")
        page.locator("button:has-text('Spending Insights')").first.click()
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "07_spending_insights.png"), full_page=False)

        # 8. Capture Transactions History
        print("8. Capturing 08_transactions.png...")
        page.locator("button:has-text('Transaction History')").first.click()
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "08_transactions.png"), full_page=False)

        # 9. Capture Financial Profile
        print("9. Capturing 09_financial_profile.png...")
        page.locator("button:has-text('Profile & Settings')").first.click()
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "09_financial_profile.png"), full_page=False)

        browser.close()
        print("All 9 genuine screenshots successfully captured into docs/screenshots/!")

if __name__ == "__main__":
    run_screenshot_capture()
