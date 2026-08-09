from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out = Path('/home/ubuntu/Ace-Gym/public/assets/ace-gym-wordmark.png')
out.parent.mkdir(parents=True, exist_ok=True)
image = Image.new('RGBA', (1600, 300), (255, 255, 255, 0))
draw = ImageDraw.Draw(image)
font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 190)
text = 'ACE々GYM'
box = draw.textbbox((0, 0), text, font=font)
x = (image.width - (box[2] - box[0])) // 2
y = (image.height - (box[3] - box[1])) // 2 - box[1]
draw.text((x, y), text, font=font, fill=(17, 24, 39, 255))
image.save(out)
