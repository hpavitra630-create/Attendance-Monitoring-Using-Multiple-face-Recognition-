"""
Bulk Student Registration Script
Reads ISE-STUDENT-PHOTOS/ directory, parses USN + name from filenames,
and registers all students with their photos via the API.

Run from project root:
  python bulk_register_students.py
"""
import os
import re
import json
import sys
import requests
from pathlib import Path

# Force UTF-8 on Windows stdout
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# -- Config -------------------------------------------------------------------
API_BASE   = "http://localhost:8000"
PHOTOS_DIR = Path("ISE-STUDENT-PHOTOS")
DEPARTMENT = "Information Science and Engineering"
COURSE     = "B.E"
SEMESTER   = "3"
SECTION    = "A"


# -- Auth ---------------------------------------------------------------------
def get_token():
    r = requests.post(
        f"{API_BASE}/api/auth/login",
        json={"username": "admin", "password": "admin123"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["access_token"]


# -- Parse filename -----------------------------------------------------------
def parse_filename(filename):
    """
    Extract (student_id, usn, name) from a student photo filename.
    Returns (None, None, None) if not parseable.

    Patterns handled:
      "3VC23IS001 - Abhinaya Reddy.jpeg"
      "3VC23IS004-akasha .jpeg"
      "3VC232IS106- Uday Kiran Pallakki.jpg"
      "USN-3VC23IS061 - Mamatha .U.jpg"
      "3VC23IS116- Vijay Harlapur"  (no extension)
    """
    stem = Path(filename).stem.strip()

    # Remove leading "USN-" prefix if present
    if stem.upper().startswith("USN-"):
        stem = stem[4:].strip()

    # Pattern: USN [sep] Name  where sep is " - " or "-"
    m = re.match(r'^([A-Za-z0-9]+)\s*-+\s*(.+)$', stem)
    if not m:
        return None, None, None

    raw_usn  = m.group(1).strip().upper()
    raw_name = m.group(2).strip()

    # Normalize name - title-case, collapse whitespace, remove trailing dots
    name = re.sub(r'\s+', ' ', raw_name).strip().rstrip('.')
    name = ' '.join(w.capitalize() for w in name.split())

    return raw_usn, raw_usn, name   # (student_id, usn, name)


def main():
    if not PHOTOS_DIR.exists():
        print(f"ERROR: {PHOTOS_DIR} not found. Run from project root.")
        return

    print("Authenticating...")
    try:
        token = get_token()
        print("OK: Authenticated as admin")
    except Exception as e:
        print(f"FAILED: Auth error: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    files   = sorted(PHOTOS_DIR.iterdir())

    success_count = 0
    skip_count    = 0
    fail_count    = 0
    results       = []

    print(f"\nProcessing {len(files)} files...\n")

    for photo_path in files:
        filename = photo_path.name
        parsed   = parse_filename(filename)

        if parsed[0] is None:
            print(f"  SKIP (unparseable): {filename}")
            skip_count += 1
            continue

        student_id, usn, name = parsed
        ext  = photo_path.suffix.lower()
        mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png" if ext == ".png" else "image/jpeg"

        if photo_path.stat().st_size == 0:
            print(f"  SKIP (empty file): {filename}")
            skip_count += 1
            continue

        print(f"  Registering: {student_id} | {name}")

        try:
            photo_bytes = photo_path.read_bytes()
            r = requests.post(
                f"{API_BASE}/api/students",
                headers=headers,
                data={
                    "student_id": student_id,
                    "usn":        usn,
                    "name":       name,
                    "department": DEPARTMENT,
                    "course":     COURSE,
                    "semester":   SEMESTER,
                    "section":    SECTION,
                    "gender":     "",
                    "phone":      "",
                    "email":      "",
                    "address":    "",
                },
                files={"photo": (filename, photo_bytes, mime)},
                timeout=30,
            )
            data = r.json()

            if r.status_code in (200, 201):
                print(f"    [OK] Registered")
                success_count += 1
                results.append({"student_id": student_id, "usn": usn, "name": name, "status": "registered"})
            elif "already exists" in str(data).lower() or "duplicate" in str(data).lower():
                print(f"    [SKIP] Already exists")
                skip_count += 1
                results.append({"student_id": student_id, "usn": usn, "name": name, "status": "already_exists"})
            else:
                print(f"    [FAIL] {data.get('detail', data)}")
                fail_count += 1
                results.append({"student_id": student_id, "usn": usn, "name": name, "status": "failed", "error": str(data)})

        except Exception as e:
            print(f"    [ERROR] {e}")
            fail_count += 1
            results.append({"student_id": student_id, "usn": usn, "name": name, "status": "error", "error": str(e)})

    # Summary
    print(f"\n{'='*55}")
    print(f"DONE: {success_count} registered | {skip_count} skipped | {fail_count} failed")
    print(f"{'='*55}\n")

    log_path = Path("student_registration_log.json")
    log_path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Log saved to: {log_path}")


if __name__ == "__main__":
    main()
