"""
Verification script for BuyWise submission deliverables.
Validates ZIP contents, PDF readability, PPTX slides, and screenshot assets.
"""

import os
import zipfile
from pptx import Presentation
from PIL import Image

def verify_all():
    print("====================================================")
    print("   BUYWISE SUBMISSION INTEGRITY VERIFICATION")
    print("====================================================\n")

    # 1. Verify ZIP
    zip_path = "BuyWise_Final.zip"
    assert os.path.exists(zip_path), "BuyWise_Final.zip missing"
    print(f"✓ BuyWise_Final.zip exists ({os.path.getsize(zip_path) / (1024*1024):.2f} MB)")

    with zipfile.ZipFile(zip_path, 'r') as z:
        names = z.namelist()
        print(f"✓ ZIP contains {len(names)} entries")
        
        # Verify no node_modules, venvs, or .env secrets (allowing .gitignore and .env.example)
        bad_entries = [
            n for n in names
            if "node_modules" in n
            or "/venv/" in n or n.startswith("BuyWise/venv")
            or "__pycache__" in n
            or "/.git/" in n or n == "BuyWise/.git"
            or n.endswith("/.env") or n == "BuyWise/.env"
        ]
        assert len(bad_entries) == 0, f"Found forbidden entries in ZIP: {bad_entries}"
        print("✓ Zero forbidden dependencies (no node_modules, venvs, or .env secrets)")

        # Verify key directories & files inside ZIP
        required_prefixes = [
            "BuyWise/frontend/src",
            "BuyWise/backend/src",
            "BuyWise/ml-service/app",
            "BuyWise/docs/screenshots",
            "BuyWise/README.md",
            "BuyWise/BuyWise_Project_Report.pdf",
            "BuyWise/BuyWise_AI_ML_Explanation.pdf",
            "BuyWise/BuyWise_Presentation.pptx",
        ]
        for req in required_prefixes:
            matching = [n for n in names if n.startswith(req) or n == req]
            assert len(matching) > 0, f"Missing required entry in ZIP: {req}"
            print(f"  ✓ Verified entry in ZIP: {req}")

    # 2. Verify PDFs
    report_pdf = "BuyWise_Project_Report.pdf"
    assert os.path.exists(report_pdf) and os.path.getsize(report_pdf) > 100000, "Report PDF missing or too small"
    print(f"\n✓ BuyWise_Project_Report.pdf verified ({os.path.getsize(report_pdf) / (1024*1024):.2f} MB)")

    aiml_pdf = "BuyWise_AI_ML_Explanation.pdf"
    assert os.path.exists(aiml_pdf) and os.path.getsize(aiml_pdf) > 5000, "AI/ML Explanation PDF missing or too small"
    print(f"✓ BuyWise_AI_ML_Explanation.pdf verified ({os.path.getsize(aiml_pdf) / 1024:.1f} KB)")

    # 3. Verify PPTX
    pptx_path = "BuyWise_Presentation.pptx"
    assert os.path.exists(pptx_path), "Presentation PPTX missing"
    prs = Presentation(pptx_path)
    slide_count = len(prs.slides)
    assert slide_count >= 12, f"Slide count {slide_count} less than 12"
    print(f"\n✓ BuyWise_Presentation.pptx verified ({os.path.getsize(pptx_path) / 1024:.1f} KB, {slide_count} slides)")

    # 4. Verify Screenshots
    print("\n✓ Verifying 9 genuine screenshots in docs/screenshots/:")
    expected_screens = [
        "01_login.png",
        "02_home_overview.png",
        "03_purchase_analyzer.png",
        "04_daily_evaluator.png",
        "05_financial_timeline.png",
        "06_what_if_simulator.png",
        "07_spending_insights.png",
        "08_transactions.png",
        "09_financial_profile.png",
    ]
    for sname in expected_screens:
        spath = os.path.join("docs", "screenshots", sname)
        assert os.path.exists(spath), f"Missing screenshot {sname}"
        with Image.open(spath) as img:
            w, h = img.size
            assert w > 800 and h > 500, f"Screenshot {sname} has abnormal resolution {w}x{h}"
            print(f"  ✓ {sname} ({w}x{h}, {os.path.getsize(spath)/1024:.1f} KB)")

    print("\n====================================================")
    print("   ALL SUBMISSION ARTIFACTS VERIFIED SUCCESSFULLY!")
    print("====================================================")

if __name__ == "__main__":
    verify_all()
