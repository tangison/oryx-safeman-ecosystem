"""Certificate pipeline test: pass SM-CORE exam -> download cert + PVC pass."""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
bank = {c["code"]: c for c in json.load(open("public/data/portal.json"))["safeman"]}

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width": 1440, "height": 1000}, accept_downloads=True)
    pg = ctx.new_page()
    pg.goto(BASE + "/portal/", wait_until="networkidle")
    pg.fill("#pt-name", "Petrus Shikongo")
    pg.fill("#pt-id", "96120900481")
    pg.select_option("#pt-course", "SM-CORE")
    pg.click("text=Enter Portal")
    pg.wait_for_selector(".reader-pane")

    # exam: answer with the real correct indices
    pg.click("text=Timed Examination")
    pg.click("text=Start Timed Exam")
    pg.wait_for_selector(".quiz-q")
    for i in range(8):
        q_text = pg.inner_text(".quiz-q")
        q_obj = next(q for q in bank["SM-CORE"]["bank"] if q["q"] == q_text)
        pg.locator(".quiz-opt").nth(q_obj["a"]).click()
        if i < 7:
            pg.click("text=Next")
        else:
            pg.click("text=Submit Paper")
    pg.wait_for_selector(".result-banner")
    assert "PASS" in pg.inner_text(".result-banner"), "should pass with correct answers"
    print("exam: PASS achieved")

    pg.click("text=Certificate & PVC Pass")
    pg.wait_for_selector("text=Competency verified")
    pg.wait_for_selector("img[alt='Principal signature']")

    with pg.expect_download() as dl:
        pg.click("text=Download Certificate (A4)")
    cert = dl.value
    cert.save_as("/tmp/render/cert_test.pdf")
    print("certificate saved:", cert.suggested_filename)

    with pg.expect_download() as dl2:
        pg.click("text=Download PVC Pass (85.6")
    pvc = dl2.value
    pvc.save_as("/tmp/render/pvc_test.pdf")
    print("pvc saved:", pvc.suggested_filename)
    pg.screenshot(path="/tmp/render/09-certificate-unlocked.png", full_page=True)
    b.close()
print("CERT PIPELINE PASSED")
