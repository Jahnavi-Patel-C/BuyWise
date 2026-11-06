import os
from playwright.sync_api import sync_playwright

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=EDGE_PATH,
        headless=True,
        args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
    )
    page = browser.new_page()

    console_logs = []
    network_events = []

    page.on('console', lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on('pageerror', lambda err: console_logs.append(f"[PAGE ERROR] {err}"))
    page.on('request', lambda req: network_events.append(f"REQ: {req.method} {req.url}"))
    page.on('response', lambda res: network_events.append(f"RES: {res.status} {res.url}"))
    page.on('requestfailed', lambda req: network_events.append(f"FAILED: {req.method} {req.url} {req.failure}"))

    print("Navigating to live frontend: https://frontend-psi-weld-u5xxyzg6a6.vercel.app/")
    page.goto('https://frontend-psi-weld-u5xxyzg6a6.vercel.app/', wait_until='networkidle')

    print("Page title:", page.title())

    # Check button
    demo_btn = page.query_selector('button:has-text("Launch Demo Student Workspace")')
    if demo_btn:
        print("Found Demo button. Clicking...")
        demo_btn.click()
        page.wait_for_timeout(8000)
    else:
        print("Demo button not found! Page HTML snippet:")
        print(page.content()[:800])

    print("\n--- CONSOLE LOGS ---")
    for log in console_logs:
        print(log)

    print("\n--- NETWORK EVENTS ---")
    for ev in network_events:
        print(ev)

    print("\n--- CURRENT URL ---")
    print(page.url)

    # Check page text after click
    body_text = page.inner_text('body')
    print("\n--- BODY TEXT (first 500 chars) ---")
    print(body_text[:500])

    browser.close()
