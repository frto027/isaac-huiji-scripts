from pathlib import Path
import requests
from tqdm import tqdm
temp = Path(__file__).parent / 'temp'

ACHIEVEMENT_COUNT = 640

if not temp.exists():
    temp.mkdir()

import re

import html_from_steamdb

datas = re.findall('data-name="([a-z0-9]+\\.jpg)"', html_from_steamdb.html)
achis = re.findall(r'<tr id="achievement-([0-9]+)">', html_from_steamdb.html)
assert len(datas) == 2 * ACHIEVEMENT_COUNT
assert len(achis) == ACHIEVEMENT_COUNT


for i in tqdm(range(0,2 * ACHIEVEMENT_COUNT, 2)):
    achievement_idx = achis[i//2]
    bin = requests.get("https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/250900/" + datas[i]).content
    with (temp/ f"{achievement_idx}.jpg").open('wb') as f:
        f.write(bin)
    break