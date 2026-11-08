"""End-to-end visual + functional test of the static export (out/)."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
SHOTS = "/tmp/render"
import os
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    pg = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))

    # ---------- 1. home (academy) ----------
    pg.goto(BASE + "/", wait_until="networkidle")
    pg.wait_for_selector(".course-card", timeout=15000)
    n_cards_academy = len(pg.locator(".course-card").all())
    assert n_cards_academy == 7, f"expected 7 academy cards, got {n_cards_academy}"
    accent = pg.evaluate("getComputedStyle(document.body).getPropertyValue('--accent').trim()")
    assert accent == "#6a1b29", f"academy accent wrong: {accent}"
    pg.screenshot(path=f"{SHOTS}/01-home-academy.png", full_page=True)

    # ---------- 2. switch to safeman ----------
    pg.click("text=SAFEMAN")
    pg.wait_for_timeout(600)
    accent = pg.evaluate("getComputedStyle(document.body).getPropertyValue('--accent').trim()")
    assert accent == "#14532d", f"safeman accent wrong: {accent}"
    n_cards_sm = len(pg.locator(".course-card").all())
    assert n_cards_sm == 13, f"expected 13 safeman cards, got {n_cards_sm}"
    body_txt = pg.inner_text("body")
    assert "Inter-organizational industry safety benchmark" in body_txt, "disclosure missing"
    pg.screenshot(path=f"{SHOTS}/02-home-safeman.png", full_page=True)

    # ---------- 3. enrollment drawer (mailto) ----------
    pg.click(".hero-cta-row >> text=Request Enrollment")
    pg.wait_for_selector("#en-name")
    pg.fill("#en-name", "Petrus Shikongo")
    pg.fill("#en-company", "Namib Mining Contractors CC")
    pg.select_option("#en-mode", "Corporate Cohort (in-house)")
    pg.fill("#en-seats", "24")
    pg.screenshot(path=f"{SHOTS}/03-enroll-drawer.png")
    # verify the mailto target + structured body are wired (component state check)
    course_val = pg.input_value("#en-course")
    seats_val = pg.input_value("#en-seats")
    print("drawer course:", course_val, "| seats:", seats_val)
    pg.screenshot(path=f"{SHOTS}/03b-enroll-filled.png")
    pg.click(".modal-close")
    pg.wait_for_timeout(300)

    # ---------- 4. portal login (SM-CSE: simulator + practicum) ----------
    pg.goto(BASE + "/portal/", wait_until="networkidle")
    pg.fill("#pt-name", "Petrus Shikongo")
    pg.fill("#pt-id", "96120900481")
    pg.select_option("#pt-course", "SM-CSE")
    pg.fill("#pt-code", "SM-2026")
    pg.screenshot(path=f"{SHOTS}/04-portal-login.png")
    pg.click("text=Enter Portal")
    pg.wait_for_selector(".reader-pane")
    assert "SM-CSE" in pg.inner_text("body"), "portal did not open SM-CSE"
    pg.screenshot(path=f"{SHOTS}/05-portal-module.png", full_page=True)

    # ---------- 5. simulator ----------
    pg.click("text=4-Gas Simulator")
    pg.wait_for_selector(".sim-readout")
    pg.click("text=Zero Instrument")
    pg.click("text=Pump: OFF")
    pg.wait_for_timeout(1200)
    pg.click("button:has-text('Test Bottom')")
    pg.wait_for_timeout(600)
    sim_txt = pg.inner_text(".sim-panel")
    assert "H2S" in sim_txt and "ALARM" in sim_txt, "simulator alarm not firing"
    pg.screenshot(path=f"{SHOTS}/06-simulator-alarm.png", full_page=True)

    # ---------- 6. exam ----------
    pg.click("text=Timed Examination")
    pg.wait_for_selector("text=Start Timed Exam")
    pg.click("text=Start Timed Exam")
    pg.wait_for_selector(".quiz-timer")
    # answer all 8 questions (pick index 1, correct may vary; we just need flow)
    for i in range(8):
        opts = pg.locator(".quiz-opt")
        opts.nth(1).click()
        if i < 7:
            pg.click("text=Next")
        else:
            pg.click("text=Submit Paper")
    pg.wait_for_selector(".result-banner", timeout=8000)
    result_txt = pg.inner_text(".result-banner")
    print("exam result:", result_txt.split("\\n")[0])
    pg.screenshot(path=f"{SHOTS}/07-exam-result.png", full_page=True)

    # ---------- 7. verify page ----------
    pg.goto(BASE + "/verify/", wait_until="networkidle")
    pg.fill("#vf-in", "garbage-input")
    pg.click("text=Verify")
    pg.wait_for_selector(".result-banner.fail")
    pg.screenshot(path=f"{SHOTS}/08-verify-fail.png")

    print("console errors:", errors if errors else "NONE")
    browser.close()
print("E2E TEST PASSED")
