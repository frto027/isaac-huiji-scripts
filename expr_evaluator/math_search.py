###########################################################
import sys
import pathlib
import urllib.parse

import mwclient.page
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################

import isaac

site = isaac.site('math_search.py')
import mwclient

page : mwclient.page.Page = site.Pages['模板:Math']

import re

search = re.compile(r"\{\{[Mm][Aa][Tt][Hh]\|.*?\}\}")

with open('out.txt','w', encoding='utf8') as f:
    for p in page.embeddedin():
        f.write(p.name + "\n")
        for t in search.findall(p.text()):
            f.write("\t" + str(t) + "\n")
        
