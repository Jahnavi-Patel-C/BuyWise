"""
Create BuyWise_Final.zip
Packages the complete, clean submission archive excluding:
node_modules, venvs, caches, temporary files, build outputs, and secrets.
"""

import os
import zipfile

ZIP_NAME = "BuyWise_Final.zip"
ROOT_DIR = os.path.abspath(".")

EXCLUDE_DIRS = {
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    ".git",
    "dist",
    ".pytest_cache",
    ".system_generated",
}

EXCLUDE_EXTS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".log",
    ".tmp",
}

EXCLUDE_FILES = {
    ZIP_NAME,
    ".env", # Only include .env.example
}

def should_exclude(rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    
    # Check directory exclusion
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
            
    # Check filename exclusion
    filename = os.path.basename(rel_path)
    if filename in EXCLUDE_FILES:
        return True
        
    # Check extension exclusion
    _, ext = os.path.splitext(filename)
    if ext.lower() in EXCLUDE_EXTS:
        return True
        
    return False

def make_zip():
    print(f"Creating academic submission package: {ZIP_NAME}...")
    file_count = 0
    total_bytes = 0

    with zipfile.ZipFile(ZIP_NAME, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for root, dirs, files in os.walk(ROOT_DIR):
            # Modify dirs in-place to avoid traversing excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ROOT_DIR)

                if should_exclude(rel_path):
                    continue

                zipf.write(full_path, os.path.join("BuyWise", rel_path))
                file_count += 1
                total_bytes += os.path.getsize(full_path)

    zip_size = os.path.getsize(ZIP_NAME)
    print(f"Archive successfully created: {ZIP_NAME}")
    print(f"Packaged {file_count} files ({total_bytes / (1024*1024):.2f} MB uncompressed -> {zip_size / (1024*1024):.2f} MB zipped)")

if __name__ == "__main__":
    make_zip()

