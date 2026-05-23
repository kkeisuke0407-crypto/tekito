"""
台本②「数字×権威」用スライド画像生成
解像度: 1080x1920 (TikTok縦動画)
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W, H = 1080, 1920
FONT_PATH = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"
FONT_P_PATH = "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf"

OUT = Path("/home/user/tekito/video-build/slides")
OUT.mkdir(parents=True, exist_ok=True)


def font(size, prop=False):
    return ImageFont.truetype(FONT_P_PATH if prop else FONT_PATH, size)


def text_center(draw, text, y, size, color, prop=False):
    f = font(size, prop)
    bbox = draw.textbbox((0, 0), text, font=f)
    w = bbox[2] - bbox[0]
    draw.text(((W - w) / 2, y), text, font=f, fill=color)


def text_with_stroke(draw, xy, text, font_obj, fill, stroke_fill, stroke_width):
    draw.text(xy, text, font=font_obj, fill=fill,
              stroke_width=stroke_width, stroke_fill=stroke_fill)


# ================== Slide 1: 0-3秒 ==================
# 白背景 + 「企業の30.4%が」「"退職代行を無視" している」 + 出典クレジット
img = Image.new("RGB", (W, H), "#FFFFFF")
draw = ImageDraw.Draw(img)

text_center(draw, "企業の", 550, 90, "#0A0A0A")
text_center(draw, "30.4%", 670, 280, "#C8102E")
text_center(draw, "が", 970, 90, "#0A0A0A")

text_center(draw, "“退職代行を無視”", 1180, 95, "#0A0A0A")
text_center(draw, "している", 1310, 110, "#0A0A0A")

# 出典クレジット（右下）
f_small = font(26)
credit = "※東京商工リサーチ 2026年4月調査"
bbox = draw.textbbox((0, 0), credit, font=f_small)
draw.text((W - (bbox[2] - bbox[0]) - 40, H - 60), credit, font=f_small, fill="#666666")

img.save(OUT / "slide1.png")
print("slide1 saved")


# ================== Slide 2: 3-8秒 ==================
# 左右2分割 民間業者✕ / 弁護士◎
img = Image.new("RGB", (W, H), "#FFFFFF")
draw = ImageDraw.Draw(img)

# 左半分: 赤系
draw.rectangle((0, 0, W // 2, H), fill="#E57373")
# 右半分: 緑系
draw.rectangle((W // 2, 0, W, H), fill="#66BB6A")

# タイトル
f_title = font(75)
text_with_stroke(draw, (110, 380), "民間業者", f_title, "#FFFFFF", "#B71C1C", 3)
text_with_stroke(draw, (640, 380), "弁護士", f_title, "#FFFFFF", "#1B5E20", 3)

# マーク3つ
f_mark = font(180)
for i in range(3):
    y = 650 + i * 250
    bbox = draw.textbbox((0, 0), "×", font=f_mark)
    cw = bbox[2] - bbox[0]
    draw.text((W // 4 - cw // 2, y), "×", font=f_mark, fill="#FFFFFF")
    bbox = draw.textbbox((0, 0), "◎", font=f_mark)
    cw = bbox[2] - bbox[0]
    draw.text((3 * W // 4 - cw // 2, y), "◎", font=f_mark, fill="#FFFFFF")

img.save(OUT / "slide2.png")
print("slide2 saved")


# ================== Slide 3: 8-13秒 ==================
# 緑背景 + 「弁護士なら、できること」リスト
img = Image.new("RGB", (W, H), "#2E7D6A")
draw = ImageDraw.Draw(img)

text_center(draw, "弁護士なら、できること", 350, 70, "#FFFFFF")

# リスト 3項目
items = [
    ("◎", "有給消化の交渉"),
    ("◎", "残業代の請求"),
    ("◎", "損害賠償への対応"),
]
f_item = font(70)
f_check = font(80)
y_start = 700
for i, (mark, txt) in enumerate(items):
    y = y_start + i * 180
    draw.text((140, y), mark, font=f_check, fill="#FFEB3B")
    draw.text((280, y + 10), txt, font=f_item, fill="#FFFFFF")

img.save(OUT / "slide3.png")
print("slide3 saved")


# ================== Slide 4: 13-15秒 ==================
# CTA
img = Image.new("RGB", (W, H), "#FFFFFF")
draw = ImageDraw.Draw(img)

# 上部: 緑ボタン風
draw.rounded_rectangle((100, 700, 980, 1050), radius=40, fill="#06C755")
text_center(draw, "LINE無料相談", 760, 90, "#FFFFFF")
text_center(draw, "24時間 受付中", 900, 55, "#FFFFFF")

# 矢印
text_center(draw, "↓", 1120, 100, "#0A0A0A")

# 「プロフのリンクから」
text_center(draw, "プロフのリンクから", 1280, 75, "#0A0A0A")

# サブ
text_center(draw, "相談だけでもOK", 1450, 50, "#666666")

img.save(OUT / "slide4.png")
print("slide4 saved")
print("All slides generated.")
