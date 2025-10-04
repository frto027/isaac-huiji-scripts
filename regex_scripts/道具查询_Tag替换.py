
###########################################################
import sys
import pathlib

import mwclient.page
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################
import isaac
import tqdm
import p_tqdm
import re
import mwclient

site = isaac.site_bot('regex_replace.py')

regex = re.compile(r'\{\{道具查询\|Tag::(.*)\}\}')

target:mwclient.page.Page = site.Pages["模板:道具查询"]

for p in target.embeddedin():
    txt = p.text()
    r = regex.findall(txt)
    if r and len(r) > 0:
        print(p.name)
        for s in r:
            print("   ", s)
        replaced = regex.sub("{{道具查询|TagRepp::\\1}}", txt)
        p.edit(replaced, '品质标签至忏悔+')