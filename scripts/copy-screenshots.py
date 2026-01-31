#!/usr/bin/env python3

import argparse
import shutil
from pathlib import Path


def copy_screenshots(inp_dir: Path, out_dir: Path):
    """Copy all images from article subdirectories and root-level files to output directory."""

    if not inp_dir.exists():
        print(f"Error: Input directory does not exist: {inp_dir}")
        return False

    # Create output directory if it doesn't exist
    out_dir.mkdir(parents=True, exist_ok=True)

    # Copy root-level files (like index.tsv)
    for item in inp_dir.iterdir():
        if item.is_file():
            dest = out_dir / item.name
            shutil.copy2(item, dest)
            print(f"Copied: {item.name}")

    # Process article directories
    for article_dir in inp_dir.iterdir():
        if not article_dir.is_dir():
            continue

        images_dir = article_dir / "images"
        if not images_dir.exists() or not images_dir.is_dir():
            continue

        # Copy all images from this article
        for image_file in images_dir.iterdir():
            if image_file.is_file():
                dest = out_dir / image_file.name
                shutil.copy2(image_file, dest)
                print(f"Copied: {image_file.name}")

    print(f"\nAll files copied to: {out_dir}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Copy screenshots and index from experiment run directory to output directory"
    )
    parser.add_argument(
        "--inp",
        required=True,
        type=Path,
        help="Input directory (e.g., run-2026-01-31T13-40-40-650Z)",
    )
    parser.add_argument(
        "--out",
        required=True,
        type=Path,
        help="Output directory where files will be copied",
    )

    args = parser.parse_args()

    success = copy_screenshots(args.inp, args.out)
    exit(0 if success else 1)


if __name__ == "__main__":
    main()
