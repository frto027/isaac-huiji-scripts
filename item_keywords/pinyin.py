###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################


# pinyin dict from https://www.mdbg.net/chinese/dictionary ---> cedict_ts.u8

# input -> item.tabx (Page, NameZH, NameList), itemkeywords.tabx(Page, NameAlias)
# output -> itemkeywords.tabx (PinyinIndex)
import gzip
import re
import mwclient
import json

pinyins = dict()

import urllib.request

import pathlib

tmpFile = pathlib.Path(__file__).parent / 'cedict_ts.u8.tgz'

if not tmpFile.exists():
    urllib.request.urlretrieve('https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz', str(tmpFile))

regex = re.compile(r"^[^ ]+ ([^ ]+) \[([A-Za-z0-9 ]+)\] .*$")

with gzip.open(str(tmpFile), 'r') as f:
    for line in f.readlines():
        group = regex.match(line.decode("utf8"))
        if not group:
            continue
        name = group[1]
        pinyin = group[2].replace("1","").replace("2","").replace("3","").replace("4","").replace("5","").replace(" ","")
        if not name in pinyins:
            pinyins[name] = str.lower(pinyin)

pinyins['？'] = ""
pinyins["("] = ""
pinyins[")"] = ""
# pinyins["？ 卡"]="wenhaoka"
# pinyins['卡'] = "ka"
pinyins['！'] =''
pinyins[' '] = ''
pinyins['绿'] = "lv"
pinyins['魔法'] = "m"

def get_pinyin(word):
    if word in pinyins:
        return pinyins[word]
    ret = ""

    i = 0
    while i < len(word):
        if re.match("[a-zA-Z0-9]", word[i]):
            ret += word[i]
            i += 1
            continue
        j = len(word)
        found = False
        while j > i:
            if word[i:j] in pinyins:
                ret += pinyins[word[i:j]]
                i = j
                found = True
                break
            j -= 1
        if found:
            continue
        ret += word[i]
        i += 1
    return ret
import isaac
site = isaac.site('pinyin.py')

import pytabx

itemPage = pytabx.HuijiTabx(site.Pages["Data:Item.tabx"])
keywordPage = pytabx.HuijiTabx(site.Pages["Data:ItemKeywords.tabx"])

items = dict()

def add_pinyin(page, word):
    pinyin = get_pinyin(word)
    if pinyin == word:
        return
    if pinyin == '':
        return
    if not page in items:
        items[page] = set()
    # print(f"{word}=>{pinyin}")
    items[page].add(pinyin)
for item in itemPage.datas:
    page = item.get("page")
    namezh = item.get("namezh")
    namelist = item.get("namelist")
    add_pinyin(page, namezh)
    for n in namelist.split(";"):
        add_pinyin(page, n)

print(keywordPage.dump_fields())

for item in keywordPage.datas:
    page = item.get("page")
    namealias = item.get("name_alias")
    if namealias == None:
        continue
    for n in namealias.split(";"):
        add_pinyin(page, n)

for item in keywordPage.datas:
    page = item.get("page")
    if not page in items:
        continue
    item.set("PinyinIndex", ';'.join(items[page]))

# add data to keywordPage
# print(keywordPageJson)
keywordPage.save("优化拼音算法")