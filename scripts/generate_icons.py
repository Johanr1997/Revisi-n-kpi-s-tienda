"""Genera el ícono de la app (gradiente + gráfico ascendente) en varios tamaños
para el manifest PWA y el apple-touch-icon. Se ejecuta una sola vez de forma
manual (no es parte de la app en producción); los PNG resultantes sí se suben."""
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024


def lerp(a, b, t):
    return a + (b - a) * t


def make_master():
    img = Image.new("RGB", (SIZE, SIZE), "#0071E3")
    px = img.load()

    # Gradiente diagonal azul -> púrpura -> verde agua, tomando los mismos
    # tonos que usan los "orbes" de fondo del resto de la app.
    c1 = (10, 90, 230)     # azul (#0071E3 aprox)
    c2 = (150, 110, 230)   # púrpura (orb-ventas-purple)
    c3 = (70, 200, 190)    # verde agua (orb-ventas-teal)

    for y in range(SIZE):
        for x in range(0, SIZE, 4):
            t = (x + y) / (2 * SIZE)
            if t < 0.5:
                tt = t / 0.5
                r = lerp(c1[0], c2[0], tt)
                g = lerp(c1[1], c2[1], tt)
                b = lerp(c1[2], c2[2], tt)
            else:
                tt = (t - 0.5) / 0.5
                r = lerp(c2[0], c3[0], tt)
                g = lerp(c2[1], c3[1], tt)
                b = lerp(c2[2], c3[2], tt)
            color = (int(r), int(g), int(b))
            for dx in range(4):
                if x + dx < SIZE:
                    px[x + dx, y] = color

    draw = ImageDraw.Draw(img, "RGBA")

    # Halo suave arriba-izquierda (efecto "liquid glass" del resto de la app)
    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo)
    hdraw.ellipse([-SIZE * 0.35, -SIZE * 0.35, SIZE * 0.55, SIZE * 0.55], fill=(255, 255, 255, 70))
    halo = halo.filter(ImageFilter.GaussianBlur(SIZE * 0.06))
    img = Image.alpha_composite(img.convert("RGBA"), halo)
    draw = ImageDraw.Draw(img, "RGBA")

    # Glifo: barras ascendentes, símbolo simple y legible de "ventas en crecimiento"
    margin = SIZE * 0.25
    bar_w = SIZE * 0.14
    gap = SIZE * 0.09
    base_y = SIZE * 0.70
    heights = [0.24, 0.40, 0.58]
    x = margin
    for h in heights:
        bar_h = SIZE * h
        draw.rounded_rectangle(
            [x, base_y - bar_h, x + bar_w, base_y],
            radius=bar_w * 0.32,
            fill=(255, 255, 255, 242),
        )
        x += bar_w + gap

    return img.convert("RGB")


def rounded(img, radius_pct):
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size, size], radius=int(size * radius_pct), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


if __name__ == "__main__":
    master = make_master()
    master.save("icons/icon-master.png")

    # apple-touch-icon: cuadrado SIN esquinas redondeadas (iOS aplica su propia máscara)
    for size, name in [(180, "apple-touch-icon-180.png"), (167, "apple-touch-icon-167.png"), (152, "apple-touch-icon-152.png")]:
        master.resize((size, size), Image.LANCZOS).save(f"icons/{name}")

    # Íconos del manifest (Android/otros): con esquinas redondeadas, se ven bien también en escritorio
    for size, name in [(512, "icon-512.png"), (192, "icon-192.png")]:
        r = rounded(master.resize((size, size), Image.LANCZOS), 0.22)
        r.save(f"icons/{name}")

    # Favicon
    master.resize((32, 32), Image.LANCZOS).save("icons/favicon-32.png")

    print("Listo.")
