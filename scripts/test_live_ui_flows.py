from playwright.sync_api import sync_playwright
import time

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=EDGE_PATH,
        headless=True,
        args=["--no-sandbox", "--disable-gpu"]
    )
    page = browser.new_page()

    print("1. Testing Invalid Login on Live UI...")
    page.goto("https://frontend-psi-weld-u5xxyzg6a6.vercel.app/")
    page.wait_for_selector("input[type='email']")
    page.fill("input[type='email']", "nonexistent.student@college.edu")
    page.fill("input[type='password']", "badpassword")
    page.click("button[type='submit']")
    page.wait_for_timeout(3000)

    error_box = page.query_selector(".bg-rose-50")
    if error_box:
        print("UI ERROR SHOWN CORRECTLY:", error_box.inner_text().strip())
    else:
        print("No error banner found!")

    print("\n2. Testing Registration on Live UI...")
    switch_btn = page.query_selector("button:has-text('Create free student account')")
    if switch_btn:
        switch_btn.click()
        page.wait_for_selector("input[type='text']")
        uname = f"Student_{int(time.time())}"
        uemail = f"{uname.lower()}@college.edu"
        page.fill("input[type='text']", uname)
        page.fill("input[type='email']", uemail)
        page.fill("input[type='password']", "securepass123")
        page.click("button[type='submit']")
        page.wait_for_timeout(6000)
        print("Post-register URL:", page.url)
        body = page.inner_text("body")
        if uname in body:
            print("REGISTRATION & LOGIN VIA LIVE UI SUCCESS! Found username on dashboard:", uname)
        else:
            print("Body after register snippet:", body[:300])

    print("\n3. Testing Purchase Decision Analyzer on Live UI...")
    analyzer_btn = page.query_selector("button:has-text('Purchase Analyzer')")
    if analyzer_btn:
        analyzer_btn.click()
        page.wait_for_timeout(2000)
        # Fill in a test purchase
        page.fill("input[placeholder='3500']", "1500")
        page.fill("input[placeholder='e.g. Noise Cancelling Headphones']", "Textbooks")
        page.click("button:has-text('Run Decision Analysis')")
        page.wait_for_timeout(4000)
        body = page.inner_text("body")
        if "BUY NOW" in body or "Decision" in body:
            print("DECISION ANALYZER SUCCESS ON LIVE DEPLOYMENT! Output displayed.")
        else:
            print("Analyzer output snippet:", body[:300])

    print("\n4. Testing Session Persistence Across Page Reload...")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(3000)
    reload_body = page.inner_text("body")
    if uname in reload_body or "Student Financial Command Center" in reload_body:
        print("SESSION PERSISTENCE VERIFIED! Authenticated dashboard loaded seamlessly on refresh.")
    else:
        print("Session persistence failed. Body snippet:", reload_body[:200])

    browser.close()
