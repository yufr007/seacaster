"""Normalize five legacy SeaCaster sprites with baked checkerboard backgrounds.

Development-only tool, not part of the game runtime. Requires Pillow 12.3.0,
numpy 2.3.5 and scipy 1.16.3. Inspect output before committing any art changes.
The existing full illustrated cards are deliberately not processed.
"""
from pathlib import Path
import argparse
import shutil
import numpy as np
from PIL import Image
from scipy import ndimage

NAMES = ('sardine', 'mackerel', 'seabass', 'cod', 'leviathan')


def clean(path: Path, output: Path) -> dict:
    image = Image.open(path).convert('RGBA')
    pixels = np.array(image)
    if (pixels[:, :, 3] < 255).mean() > .01:
        if path.resolve() != output.resolve():
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, output)
        return {'file': path.name, 'status': 'already transparent; unchanged'}
    rgb = pixels[:, :, :3].astype(np.int16)
    eligible = (rgb.max(axis=2) - rgb.min(axis=2) <= 18) & (rgb.min(axis=2) >= 52)
    labels, _ = ndimage.label(eligible)
    border_ids = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    border_ids = border_ids[border_ids != 0]
    removed = np.isin(labels, border_ids)
    if removed.mean() < .12 or removed.mean() > .94:
        raise ValueError(f'{path.name}: unexpected background area; inspect manually')
    pixels[removed, 3] = 0
    # Keep the main connected artwork, removing detached labels and background crumbs.
    objects, _ = ndimage.label(pixels[:, :, 3] > 0)
    sizes = np.bincount(objects.ravel())
    sizes[0] = 0
    main = sizes.argmax()
    if sizes[main] < .035 * objects.size:
        raise ValueError(f'{path.name}: artwork unexpectedly small')
    pixels[objects != main, 3] = 0
    result = Image.fromarray(pixels)
    box = result.getbbox()
    if box is None:
        raise ValueError(f'{path.name}: no artwork remains')
    margin = 16
    box = (max(0, box[0]-margin), max(0, box[1]-margin), min(image.width, box[2]+margin), min(image.height, box[3]+margin))
    result = result.crop(box)
    result.thumbnail((512, 512), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, optimize=True)
    return {'file': path.name, 'size': result.size, 'bytes': output.stat().st_size}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    for name in NAMES:
        print(clean(args.source / f'{name}.png', args.output / f'{name}.png'))
