PATH = r"E:\SteamLibrary\steamapps\common\The Binding of Isaac Rebirth\resources-dlc3\costumes2.xml"

obj = {
    "license": "CC0-1.0",
    "description": {
        "en": "From file costumes2.xml"
    },
    "sources": "Imported from costumes2.xml by user Frto027",
    "schema":{
        "fields":[
        ]
    },
    "data":[]
}

def appendField(name,type):
    obj["schema"]["fields"].append({
        "name":name,
        "type":type,
        "title":{
            "en":name
        }
    })
def appendData(data):
    obj["data"].append(data)

appendField("id","number")
appendField("anm2path","string")
appendField("type","string")
appendField("skinColor","number")
appendField("isFlying","boolean")
appendField("overwriteColor","boolean")
appendField("priority","number")
appendField("hasSkinAlt","boolean")
appendField("hasOverlay","boolean")
appendField("forceBodyColor","boolean")
appendField("forceHeadColor","boolean")

ROOT_FOLDER = r'E:\backup\IsaacAnmPlayer\docs'

TEST_FOLDER = [
    'resources-dlc3.zh/gfx/characters/',
    'resources-dlc3/gfx/characters/',
    'resources/gfx/characters/'
]
import json
import pathlib
def getPath(path):
    assert path.endswith('.anm2')
    path = path[:-5] + ".json"
    for test in TEST_FOLDER:
        file = pathlib.Path(ROOT_FOLDER)/test/path
        if file.exists():
            return 'Anm2/' + test + path.replace(' ','_').lower()
    assert False, path + 'not found'

import xml.etree.ElementTree as ET

with open(PATH,'r') as f:
    xml = ET.parse(f).getroot()
assert xml.tag == 'costumes'
for costume in xml:
    assert costume.tag == 'costume'
    a = costume.attrib
    appendData([
        int(a["id"]),        #"id","number"
        getPath(a["anm2path"]),        #"anm2path","string"
        a["type"],        #"type","string"
        (int(a["skinColor"]) if "skinColor" in a else -2),        #"skinColor","number"
        ("isFlying" in a and a["isFlying"] == "true"),        #"isFlying","boolean"
        ("overwriteColor" in a and a["overwriteColor"] == "true"),        #"overwriteColor","boolean"
        (int(a["priority"]) if "priority" in a else 0),        #"priority","number"
        ("hasSkinAlt" in a and a["hasSkinAlt"] == "true"),         #"hasSkinAlt","boolean"
        ("hasOverlay" in a and a["hasOverlay"] == "true"),         #"hasOverlay","boolean"
        ("forceBodyColor" in a and a["forceBodyColor"] == "true"),         #"forceBodyColor","boolean"
        ("forceHeadColor" in a and a["forceHeadColor"] == "true"),         #"forceHeadColor","boolean"
    ])

jsonout = json.dumps(obj=obj,separators=(',',':'))
# with open('output.json','w') as f:
#     f.write(jsonout)
from mwclient import Site

username = "frto027" #input("username:")
pswd = input("password")

ua = 'Frto027Robot.costumesUploader/0.0 (602706150@qq.com)'
site = Site('isaac.huijiwiki.com',scheme='http',clients_useragent=ua)

site.login(username, pswd)
site.pages["Data:costumes2.tabx"].edit(jsonout,'Upload costumes2.xml')