#!/usr/bin/env python3
"""Scrape IL019 and IL020 linen color data from fabrics-store.com.

Downloads product images, extracts average color from center region,
and writes JSON color libraries.
"""

import json
import os
import re
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

DATA_DIR = Path(__file__).parent.parent / "data"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

IL019_SLUGS = [
    "agave-fs-signature-finish-middle",
    "amethyst-orchid-fs-signature-finish-medium",
    "antique-white-fs-signature-finish-medium",
    "autumn-gold-fs-signature-finish-middle",
    "beet-red-fs-signature-finish-medium",
    "black-fs-signature-finish-middle",
    "bleached-fs-signature-finish-middle",
    "blue-bonnet-fs-signature-finish-middle",
    "blue-heaven-fs-signature-finish-medium",
    "cobalt-fs-signature-finish-middle",
    "coffee-bean-fs-signature-finish-medium",
    "crimson-fs-signature-finish-middle",
    "deep-ultramarine-fs-signature-finish-medium",
    "dried-herb-fs-signature-finish-medium",
    "dusty-lotus-fs-signature-finish-middle",
    "dusty-rose-fs-signature-finish-medium",
    "emerald-fs-signature-finish-medium",
    "evergreen-fs-signature-finish-middle",
    "insignia-blue-fs-signature-finish-middle",
    "japanese-blue-fs-signature-finish-medium",
    "kenya-fs-signature-finish-middle",
    "meadow-fs-signature-finish-middle",
    "medieval-blue-fs-signature-finish-medium",
    "mix-natural-fs-signature-finish-middle",
    "moroccan-blue-fs-signature-finish-medium",
    "natural-fs-signature-finish-middle",
    "nine-iron-fs-signature-finish-middle",
    "olive-branch-fs-signature-finish-middle",
    "optic-white-fs-signature-finish-middle",
    "parchment-fs-signature-finish-medium",
    "potting-soil-fs-signature-finish-medium",
    "royal-blue-fs-signature-finish-medium",
    "royal-purple-fs-signature-finish-middle",
    "sahara-rose-fs-signature-finish-medium",
    "soft-pink-fs-signature-finish-medium",
    "sphinx-fs-signature-finish-middle",
    "spice-fs-signature-finish-medium",
    "tea-rose-fs-signature-finish-medium",
    "tourmaline-fs-signature-finish-medium",
    "vineyard-green-fs-signature-finish-medium",
    "willow-fs-signature-finish-medium",
]

IL020_SLUGS = [
    "abyss-softened-light",
    "basile-softened-light",
    "black-softened-light",
    "bleached-softened-light",
    "blue-apatite-softened-light",
    "bougainvillea-softened-light",
    "camel-softened-light",
    "cobalt-softened-light",
    "coral-softened-light",
    "dahlia-softened-light",
    "dawn-softened-light",
    "emerald-softened-light",
    "gouache-softened-light",
    "grey-whisper-softened-light",
    "hedge-green-softened-light",
    "krista-natural-softened-light",
    "light-blue-softened-light",
    "meadow-softened-light",
    "mediterranean-blue-softened-light",
    "mushroom-softened-light",
    "natural-light",
    "optic-white-softened-light",
    "perfectly-pale-softened-light",
    "powder-blue-softened-light",
    "royal-purple-softened-light",
    "shadow-grey-softened-light",
    "silver-lilac-softened-light",
    "tadelakt-softened-light",
]

# Fallback colors when scraping fails
FALLBACK_COLORS = {
    "agave": "#7BA08C", "amethyst orchid": "#9B7EB4", "antique white": "#F5E6D3",
    "autumn gold": "#C8962E", "beet red": "#8B1A4A", "black": "#1A1A1A",
    "bleached": "#F5F0E8", "blue bonnet": "#6B8EC2", "blue heaven": "#7BA7CC",
    "cobalt": "#1C3D8F", "coffee bean": "#4A2C1A", "crimson": "#B22234",
    "deep ultramarine": "#1B2F7B", "dried herb": "#8B7D5E", "dusty lotus": "#C4A0A0",
    "dusty rose": "#C4A4A0", "emerald": "#2E8B57", "evergreen": "#2D4A3E",
    "insignia blue": "#2C3E6B", "japanese blue": "#264D73", "kenya": "#8B6B3D",
    "meadow": "#5B8C3E", "medieval blue": "#2B3D7B", "mix natural": "#D4C5A9",
    "moroccan blue": "#1E5B8E", "natural": "#D4C5A9", "nine iron": "#3A3A3A",
    "olive branch": "#6B7B3A", "optic white": "#FAFAFA", "parchment": "#E8DCC8",
    "potting soil": "#5C3D2E", "royal blue": "#2850A0", "royal purple": "#5B2E8B",
    "sahara rose": "#D4A08B", "soft pink": "#F0C4C4", "sphinx": "#A09060",
    "spice": "#B06030", "tea rose": "#E8B4A0", "tourmaline": "#3B8B8B",
    "vineyard green": "#4A7040", "willow": "#8BAA70",
    "abyss": "#1A1A2E", "basile": "#8B7D5E", "blue apatite": "#1B7B8B",
    "bougainvillea": "#B03060", "camel": "#C4A060", "coral": "#E08070",
    "dahlia": "#B03050", "dawn": "#E8D4C0", "gouache": "#D4C8B0",
    "grey whisper": "#D4D0CC", "hedge green": "#4A6B3A", "krista natural": "#C4B8A0",
    "light blue": "#A0C4E0", "mediterranean blue": "#1E6B8E",
    "mushroom": "#B0A090", "perfectly pale": "#F0E8E0", "powder blue": "#B0C4D8",
    "shadow grey": "#7A7A7A", "silver lilac": "#C0B0C8", "tadelakt": "#D4B8A0",
}


def extract_color_name(slug):
    """Extract a human-readable color name from a slug."""
    # Remove finish suffixes
    name = re.sub(r'-fs-signature-finish-(?:middle|medium)$', '', slug)
    name = re.sub(r'-softened-light$', '', name)
    name = re.sub(r'-light$', '', name)
    # Convert to title case
    name = name.replace('-', ' ').title()
    return name


def avg_color_from_image(img_data):
    """Compute average RGB from center 20% of image."""
    img = Image.open(BytesIO(img_data)).convert('RGB')
    w, h = img.size
    # Center 20% crop
    cx, cy = w // 2, h // 2
    crop_w, crop_h = int(w * 0.2), int(h * 0.2)
    box = (cx - crop_w // 2, cy - crop_h // 2,
           cx + crop_w // 2, cy + crop_h // 2)
    cropped = img.crop(box)

    pixels = list(cropped.getdata())
    r = sum(p[0] for p in pixels) // len(pixels)
    g = sum(p[1] for p in pixels) // len(pixels)
    b = sum(p[2] for p in pixels) // len(pixels)
    return f"#{r:02X}{g:02X}{b:02X}"


def scrape_color(slug, line):
    """Try to scrape a color from fabrics-store.com. Returns hex or None."""
    url = f"https://fabrics-store.com/fabrics/linen-fabric-{line}-{slug}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 403:
            print(f"  WARN: 403 Cloudflare block for {slug}")
            return None
        if resp.status_code != 200:
            print(f"  WARN: HTTP {resp.status_code} for {slug}")
            return None

        # Find product image URL
        img_match = re.search(
            r'https://fabrics-store\.com/images/product/[^"\']+500x500[^"\']*\.jpg',
            resp.text
        )
        if not img_match:
            # Try any product image
            img_match = re.search(
                r'(https://fabrics-store\.com/images/product/[^"\']+\.jpg)',
                resp.text
            )
        if not img_match:
            print(f"  WARN: No product image found for {slug}")
            return None

        img_url = img_match.group(0)
        img_resp = requests.get(img_url, headers=HEADERS, timeout=15)
        if img_resp.status_code != 200:
            print(f"  WARN: Could not download image for {slug}")
            return None

        return avg_color_from_image(img_resp.content)

    except Exception as e:
        print(f"  ERROR: {e} for {slug}")
        return None


def get_fallback_hex(slug, line):
    """Get a fallback color based on the color name."""
    name = extract_color_name(slug).lower()
    return FALLBACK_COLORS.get(name, "#CCCCCC")


def process_line(slugs, line):
    """Process all slugs for a fabric line."""
    colors = []
    scraped = 0
    fallback = 0

    for i, slug in enumerate(slugs):
        name = extract_color_name(slug)
        print(f"[{line}] {i+1}/{len(slugs)}: {name}...", end=" ", flush=True)

        hex_color = scrape_color(slug, line)
        if hex_color:
            print(f"OK → {hex_color}")
            scraped += 1
        else:
            hex_color = get_fallback_hex(slug, line)
            print(f"FALLBACK → {hex_color}")
            fallback += 1

        colors.append({
            "name": name,
            "hex": hex_color,
            "source": "fabrics-store.com",
            "line": line,
            "slug": f"linen-fabric-{line}-{slug}",
        })

        if i < len(slugs) - 1:
            time.sleep(2)

    print(f"\n{line}: {scraped} scraped, {fallback} fallback\n")
    return colors


def main():
    DATA_DIR.mkdir(exist_ok=True)

    print("=== Scraping IL019 colors ===\n")
    il019 = process_line(IL019_SLUGS, "IL019")
    with open(DATA_DIR / "il019-colors.json", "w") as f:
        json.dump(il019, f, indent=2)

    print("=== Scraping IL020 colors ===\n")
    il020 = process_line(IL020_SLUGS, "IL020")
    with open(DATA_DIR / "il020-colors.json", "w") as f:
        json.dump(il020, f, indent=2)

    print("Done! Color files written to data/")


if __name__ == "__main__":
    main()
