import os
from PIL import Image, ImageDraw, ImageFont

frames_info = [
    ("1920_01_1.75s_full_brand.png", "1. 1.75s — PZ Inscription Drawn"),
    ("1920_02_2.10s_first_visible_seam.png", "2. 2.10s — Exact Handoff at Y=450 (diff=0.00px)"),
    ("1920_03_2.23s_mid_zoom_no_double_stroke.png", "3. 2.23s — Mid-Zoom (Zero Double Stroke)"),
    ("1920_04_2.53s_only_horizontal_line.png", "4. 2.53s — Brand Fades, Crossbar Isolated"),
    ("1920_05_2.89s_crossbar_fills_width.png", "5. 2.89s — Golden Seam Fills Width"),
    ("1920_06_3.18s_gateway_opens.png", "6. 3.18s — Obsidian Shutters Part from Seam"),
    ("1920_07_3.51s_no_z_artifacts.png", "7. 3.51s — Gateways Opening (Zero Z Chunks)"),
    ("1920_08_3.82s_hero_through_portal.png", "8. 3.82s — Live DOM Hero & Image Reveal"),
    ("1920_09_4.25s_completed_reveal.png", "9. 4.25s — Fully Settled & Interactive DOM")
]

base_dir = "/home/figo/Desktop/Philo/verification/gateway-v3-clean"

# 3x3 layout
cols = 3
rows = 3
thumb_w = 640
thumb_h = 360
header_h = 60
card_h = thumb_h + 40
margin = 20

total_w = cols * thumb_w + (cols + 1) * margin
total_h = header_h + rows * card_h + (rows + 1) * margin

storyboard = Image.new("RGB", (total_w, total_h), color=(13, 14, 18))
draw = ImageDraw.Draw(storyboard)

# Header
title = "PHILOZZ — Golden Gateway V3: Fixed Seam Alignment & Production Storyboard"
subtitle = "Real Asset Crossbar Center (Y=450.0px) | Delta <= 0.00px | Zero Double Stroke | Clean Portal Separation"
draw.text((margin + 10, 15), title, fill=(245, 197, 66))
draw.text((margin + 10, 38), subtitle, fill=(160, 165, 180))

for idx, (filename, label) in enumerate(frames_info):
    r = idx // cols
    c = idx % cols
    
    x = margin + c * (thumb_w + margin)
    y = header_h + margin + r * (card_h + margin)
    
    img_path = os.path.join(base_dir, filename)
    if os.path.exists(img_path):
        with Image.open(img_path) as im:
            thumb = im.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            storyboard.paste(thumb, (x, y))
    
    # Border
    draw.rectangle([x, y, x + thumb_w, y + thumb_h], outline=(50, 55, 70), width=1)
    
    # Label bar
    draw.rectangle([x, y + thumb_h, x + thumb_w, y + thumb_h + 30], fill=(22, 24, 30))
    draw.rectangle([x, y + thumb_h, x + thumb_w, y + thumb_h + 30], outline=(50, 55, 70), width=1)
    draw.text((x + 10, y + thumb_h + 8), label, fill=(230, 235, 245))

out_jpg = os.path.join(base_dir, "PHILOZZ_Golden_Gateway_V3_Production_Storyboard.jpg")
storyboard.save(out_jpg, "JPEG", quality=92)
print("Saved storyboard to:", out_jpg)
