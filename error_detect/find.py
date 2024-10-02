###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################

from tqdm import tqdm
import requests
import config

find_headers = config.header("error_detect/find.py")
 
def find(page):
    url = "https://isaac.huijiwiki.com/wiki/" + page
    return requests.get(url, headers=find_headers).text

with open('result.log', 'a', encoding='utf-8') as f:
    for i in tqdm(range(700)):
        # if i == 0:
        #     continue
        if i < 64:
            continue
        txt = find('C' + str(i))
        if '缩略图' in txt:
            print(str(i))
            f.write(txt)