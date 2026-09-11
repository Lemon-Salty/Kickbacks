#!/usr/bin/env python3
"""
ip_to_zipcode.py
Reads resultsMar13.csv, looks up geolocation for each IP in the 'ip' column,
and appends a 'zipcode' column using the free ip-api.com service (no API key needed).

Usage:
    python ip_to_zipcode.py
    python ip_to_zipcode.py --input my_file.csv --output results_with_zip.csv
"""

import csv
import time
import argparse
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "--break-system-packages", "-q"])
    import requests


# ip-api.com free tier: max 45 requests/minute, supports IPv4 and IPv6
BATCH_URL = "http://ip-api.com/batch"
SINGLE_URL = "http://ip-api.com/json/{ip}?fields=zip,city,regionName,country,status,message"
BATCH_SIZE = 100          # ip-api supports up to 100 IPs per batch request
RATE_LIMIT_DELAY = 1.5    # seconds between batches to stay under 45 req/min


def lookup_batch(ip_list: list[str]) -> dict[str, dict]:
    """Send a batch of IPs to ip-api.com and return a dict keyed by IP."""
    payload = [
        {"query": ip, "fields": "query,zip,city,regionName,country,status,message"}
        for ip in ip_list
    ]
    try:
        resp = requests.post(BATCH_URL, json=payload, timeout=15)
        resp.raise_for_status()
        results = resp.json()
        return {r["query"]: r for r in results}
    except requests.RequestException as e:
        print(f"  [warning] Batch request failed: {e}. Falling back to individual lookups.")
        return {}


def lookup_single(ip: str) -> dict:
    """Fallback: look up a single IP."""
    try:
        resp = requests.get(SINGLE_URL.format(ip=ip), timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        return {"status": "fail", "message": str(e)}


def extract_zip(result: dict) -> str:
    """Pull the zip code out of an ip-api response dict."""
    if result.get("status") == "success":
        return result.get("zip", "N/A") or "N/A"
    return "N/A"


def extract_location(result: dict) -> str:
    """Human-readable location for logging."""
    if result.get("status") == "success":
        parts = [result.get("city"), result.get("regionName"), result.get("country")]
        return ", ".join(p for p in parts if p)
    return result.get("message", "unknown error")


def process_csv(input_path: str, output_path: str):
    input_file = Path(input_path)
    if not input_file.exists():
        sys.exit(f"Error: '{input_path}' not found.")

    with open(input_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if "ip" not in (reader.fieldnames or []):
            sys.exit("Error: CSV must contain a column named 'ip'.")
        rows = list(reader)
        fieldnames = list(reader.fieldnames)

    if "zipcode" not in fieldnames:
        fieldnames.append("zipcode")
    if "location" not in fieldnames:
        fieldnames.append("location")

    ips = [row["ip"].strip() for row in rows]
    ip_to_result: dict[str, dict] = {}

    print(f"Processing {len(ips)} IP address(es) in batches of {BATCH_SIZE}...")
    batches = [ips[i:i + BATCH_SIZE] for i in range(0, len(ips), BATCH_SIZE)]

    for batch_num, batch in enumerate(batches, 1):
        print(f"  Batch {batch_num}/{len(batches)} ({len(batch)} IPs)...", end=" ", flush=True)
        batch_results = lookup_batch(batch)

        # Fill in any IPs missing from the batch response
        for ip in batch:
            if ip not in batch_results:
                batch_results[ip] = lookup_single(ip)

        ip_to_result.update(batch_results)
        print("done")

        if batch_num < len(batches):
            time.sleep(RATE_LIMIT_DELAY)

    # Annotate rows
    not_found = 0
    for row in rows:
        ip = row["ip"].strip()
        result = ip_to_result.get(ip, {"status": "fail", "message": "no result"})
        row["zipcode"] = extract_zip(result)
        row["location"] = extract_location(result)
        if row["zipcode"] == "N/A":
            not_found += 1

    # Write output
    output_file = Path(output_path)
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone! Results written to '{output_path}'")
    print(f"  Total IPs processed : {len(ips)}")
    print(f"  Zip codes found     : {len(ips) - not_found}")
    print(f"  Not resolved (N/A)  : {not_found}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert IPs in a CSV to zip codes.")
    parser.add_argument("--input",  default="resultsMar13.csv", help="Input CSV file (default: resultsMar13.csv)")
    parser.add_argument("--output", default="resultsMar13_with_zip.csv", help="Output CSV file")
    args = parser.parse_args()

    process_csv(args.input, args.output)
