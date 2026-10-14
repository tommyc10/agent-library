"""Split dragon-head.png into layers so the eyes can move: whites, irises, eyelids and the head with the eyes cut out."""
import json, sys, numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

src_path, out_dir, size = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)
src = Image.open(src_path).convert('RGBA')
W, H = src.size
a = np.array(src).astype(np.float64)
r, g, b = a[..., 0], a[..., 1], a[..., 2]

# Iris circles, measured by hand on the 1254px master: centre x, centre y, radius.
IRISES = {'left': (470, 868, 86), 'right': (885, 821, 82)}

# The eye is whatever the red skin and its black liner enclose.
red = (r > 90) & (r > g + 60) & (r > b + 60)
dark = np.maximum(np.maximum(r, g), b) < 80
near_red = np.array(Image.fromarray((red * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(31))) > 0
open_ = ~red & ~(dark & near_red)

def fill_holes(mask):
    inv = Image.fromarray(((~mask) * 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(inv, (0, 0), 0)
    return mask | (np.array(inv) == 255)

sockets = {}
for name, (cx, cy, rad) in IRISES.items():
    m = Image.fromarray((open_ * 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(m, (cx, cy - 40), 128)
    s = fill_holes(np.array(m) == 128)
    s = Image.fromarray((s * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
    sockets[name] = np.array(s) > 127
socket = sockets['left'] | sockets['right']
soft = np.array(Image.fromarray((socket * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))) / 255

# Whites: an off-white fill, shaded under the top lid like the artwork.
whites = np.zeros_like(a)
ys = np.arange(H)[:, None]
for s in sockets.values():
    cols = s.any(0)
    top = np.where(cols, s.argmax(0), 0)[None, :]
    depth = np.clip((ys - top) / 70, 0, 1)
    shade = 0.62 + 0.38 * (1 - (1 - depth) ** 2)
    for i, c in enumerate((246, 240, 231)):
        whites[..., i] = np.where(s, c * shade, whites[..., i])
    whites[..., 3] = np.where(s, 255, whites[..., 3])
whites[..., 3] = np.maximum(whites[..., 3], 0)
# grow a little under the head so no gap shows at the soft edge
grow = np.array(Image.fromarray((socket * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))) > 0
for i in range(3):
    ch = Image.fromarray(np.clip(whites[..., i], 0, 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))
    whites[..., i] = np.where(socket, whites[..., i], np.array(ch))
whites[..., 3] = np.where(grow, 255, 0)

# Irises: the circle from the artwork, with the parts the lids hide filled in from the opposite side.
iris = np.zeros_like(a)
yy, xx = np.mgrid[0:H, 0:W]
for name, (cx, cy, rad) in IRISES.items():
    d = np.hypot(xx - cx, yy - cy)
    inside = d <= rad
    seen = inside & sockets[name]
    hidden = inside & ~sockets[name]
    hy, hx = np.nonzero(hidden)
    for flip_y, flip_x in ((True, True), (True, False), (False, True)):
        my = np.clip(2 * cy - hy if flip_y else hy, 0, H - 1)
        mx = np.clip(2 * cx - hx if flip_x else hx, 0, W - 1)
        ok = seen[my, mx] & hidden[hy, hx]
        iris[hy[ok], hx[ok]] = a[my[ok], mx[ok]]
        hidden[hy[ok], hx[ok]] = False
        hy, hx = np.nonzero(hidden)
    iris[seen] = a[seen]
    iris[hy, hx] = (20, 40, 10, 255)
    edge = np.clip(rad + 0.5 - d, 0, 1)
    iris[..., 3] = np.where(inside, 255 * edge, iris[..., 3])

# Head: the artwork with the eyes cut out.
head = a.copy()
head[..., 3] = a[..., 3] * (1 - soft)

def save(arr, name):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').resize((size, size), Image.LANCZOS)
    im.save(out_dir / f'{name}.png', optimize=True)

save(whites, 'whites'); save(iris, 'iris'); save(head, 'head')

# Lids for blinking: one per eye, in skin red, cropped to the eye.
boxes = {}
for name, s in sockets.items():
    ys_, xs_ = np.nonzero(s)
    x0, x1, y0, y1 = xs_.min() - 6, xs_.max() + 7, ys_.min() - 6, ys_.max() + 7
    lid = np.zeros((y1 - y0, x1 - x0, 4))
    grown = np.array(Image.fromarray((s * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(11)))[y0:y1, x0:x1] / 255
    t = np.linspace(0, 1, y1 - y0)[:, None]
    lid[..., 0] = 236 - 70 * t; lid[..., 1] = 30 - 25 * t; lid[..., 2] = 32 - 22 * t
    lid[..., 3] = 255 * grown
    lim = Image.fromarray(lid.astype(np.uint8), 'RGBA')
    k = size / W
    lim.resize((max(1, round((x1 - x0) * k * 2)), max(1, round((y1 - y0) * k * 2))), Image.LANCZOS).save(out_dir / f'lid-{name}.png', optimize=True)
    boxes[name] = {'left': x0 / W * 100, 'top': y0 / H * 100, 'width': (x1 - x0) / W * 100, 'height': (y1 - y0) / H * 100}
print(json.dumps({k: {kk: round(v, 2) for kk, v in b.items()} for k, b in boxes.items()}))
print('iris centres %', {k: (round(cx / W * 100, 2), round(cy / H * 100, 2)) for k, (cx, cy, _) in IRISES.items()})
