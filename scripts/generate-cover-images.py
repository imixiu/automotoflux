#!/usr/bin/env python3
"""
Batch generate cover images for automotoflux articles.
Uses Qwen image-plus API → downloads with urllib → uploads to Vercel Blob → updates DB.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import psycopg2

# ── Config ──
SITE = "automotoflux"
PROJECT_DIR = f"/root/vercel-projects/{SITE}"
BLOB_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
DASHSCOPE_KEY = "sk-b11580cc1fec4c2a814a8a97e3dfd7d1"
QWEN_API = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
IMAGE_SIZE = "1024*576"
BATCH_SIZE = 10  # commit DB updates every N articles
MAX_FAILURES = 20  # stop if too many consecutive failures

# Category → visual theme mapping
CATEGORY_THEMES = {
    "engine-parts": "automotive engine components, mechanical parts, performance hardware",
    "exterior-accessories": "car exterior styling, automotive body accessories, vehicle aesthetics",
    "interior-upgrades": "car interior design, automotive cabin accessories, vehicle comfort",
    "wheels-tires": "automotive wheels and tires, alloy rims, performance tires",
    "electrical-systems": "automotive electrical components, car wiring, vehicle electronics",
    "maintenance-tools": "automotive repair tools, car maintenance equipment, garage workshop",
}

def get_articles(conn):
    """Get all articles without images."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, short_title, title, type 
            FROM articles 
            WHERE site = %s AND is_online = 'Y' AND img IS NULL
            ORDER BY id
        """, (SITE,))
        return cur.fetchall()

def generate_image_url(title, category):
    """Call Qwen API to generate a cover image, return OSS URL."""
    theme = CATEGORY_THEMES.get(category, "automotive parts and accessories")
    # Keep prompt clean and short — avoid content moderation triggers
    short_title = title[:80] if len(title) > 80 else title
    prompt = f"Professional editorial blog cover image: {short_title}. Theme: {theme}. Clean modern photography style, warm lighting, no text overlay."
    
    payload = json.dumps({
        "model": "qwen-image-plus",
        "input": {
            "messages": [{"role": "user", "content": [{"text": prompt}]}]
        },
        "parameters": {"size": IMAGE_SIZE}
    }).encode("utf-8")
    
    req = urllib.request.Request(
        QWEN_API,
        data=payload,
        headers={
            "Authorization": f"Bearer {DASHSCOPE_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())
    
    img_url = data["output"]["choices"][0]["message"]["content"][0]["image"]
    return img_url

def download_image(oss_url, local_path):
    """Download image from Qwen OSS URL using urllib (handles & in signed URLs)."""
    urllib.request.urlretrieve(oss_url, local_path)
    size = os.path.getsize(local_path)
    if size < 1024:
        raise ValueError(f"Downloaded file too small ({size} bytes), likely XML error")
    return size

def upload_to_blob(local_path, blob_path):
    """Upload image to Vercel Blob via REST API, return permanent URL."""
    with open(local_path, "rb") as f:
        img_data = f.read()
    
    req = urllib.request.Request(
        f"https://blob.vercel-storage.com/{blob_path}",
        data=img_data,
        headers={
            "Authorization": f"Bearer {BLOB_TOKEN}",
            "x-content-type": "image/png",
            "x-add-random-suffix": "true",
        },
        method="PUT",
    )
    
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
    
    return result["url"]

def update_article_img(conn, article_id, img_url):
    """Update article's img column in DB."""
    with conn.cursor() as cur:
        cur.execute("UPDATE articles SET img = %s WHERE id = %s", (img_url, article_id))

def main():
    # Load all env vars from .env.local
    env_path = os.path.join(PROJECT_DIR, ".env.local")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    v = v.strip().strip('"').strip("'")
                    os.environ[k] = v
    
    blob_token = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
    if not blob_token:
        print("ERROR: BLOB_READ_WRITE_TOKEN not found")
        sys.exit(1)
    
    global BLOB_TOKEN
    BLOB_TOKEN = blob_token
    
    # Connect to DB
    db_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not db_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)
    
    conn = psycopg2.connect(db_url, sslmode="require")
    conn.autocommit = False
    
    articles = get_articles(conn)
    total = len(articles)
    print(f"Found {total} articles without cover images")
    
    success = 0
    failed = 0
    consecutive_failures = 0
    tmp_path = "/tmp/automotoflux-cover.png"
    
    for i, (article_id, slug, title, category) in enumerate(articles):
        print(f"[{i+1}/{total}] {slug} ({category})...", end=" ", flush=True)
        
        try:
            # Step 1: Generate
            oss_url = generate_image_url(title, category)
            
            # Step 2: Download
            download_image(oss_url, tmp_path)
            
            # Step 3: Upload to Blob
            blob_path = f"covers/{SITE}/{slug}.png"
            blob_url = upload_to_blob(tmp_path, blob_path)
            
            # Step 4: Update DB
            update_article_img(conn, article_id, blob_url)
            
            # Periodic commit
            if (i + 1) % BATCH_SIZE == 0:
                conn.commit()
            
            success += 1
            consecutive_failures = 0
            print(f"OK")
            
        except Exception as e:
            failed += 1
            consecutive_failures += 1
            print(f"FAIL: {e}")
            
            if consecutive_failures >= MAX_FAILURES:
                print(f"\nStopping: {MAX_FAILURES} consecutive failures")
                break
        
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
    
    # Final commit
    conn.commit()
    conn.close()
    
    print(f"\nDone: {success} success, {failed} failed out of {total}")

if __name__ == "__main__":
    main()
