
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

regex = re.compile(r'Tag::@\\b(.*?)\\b')

target:mwclient.page.Page = site.Pages["模板:infobox/set"]

for p in target.embeddedin():
    txt = p.text()
    r = regex.findall(txt)
    if r and len(r) > 0:
        print(p.name)
        for s in r:
            print("   ", s)
        replaced = regex.sub(r"TagRepp::@\\b\1\\b", txt)
        # print(replaced)
        p.edit(replaced, '品质标签至忏悔+')