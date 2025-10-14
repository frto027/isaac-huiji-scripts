###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################


import pytabx
import isaac

import xml.etree.ElementTree as ET
import config

with (config.game_folder_resource/'wisps.xml').open("r") as f:
    doc = ET.parse(f).getroot()

class Color:
    def __init__(self, r,g,b, _or,og,ob) -> None:
        self.r = str(r) if r != None else ""
        self.g = str(g) if g != None else ""
        self.b = str(b) if b != None else ""

        self._or =  str(_or) if _or != None else "0"
        self.og =   str(og) if og != None else "0"
        self.ob =   str(ob) if ob != None else "0"
    def str(self):
        return f"{self.r};{self.g};{self.b};{self._or};{self.og};{self.ob}"
colors : dict[str,Color]= {}

site = isaac.site("wisps/update.py")
tabx = pytabx.HuijiTabx(site.Pages["Data:Wisps.tabx"])
tabx.dump("before.json")
for tag in doc:
    if tag.tag == 'color':
        def g(x):
            return tag.attrib[x] if x in tag.attrib else None
        colors[tag.attrib['name']] = Color(g('r'),g('g'), g('b'), g('or'), g('og'), g('ob'))
    elif tag.tag == 'wisp':
        id = tag.attrib["id"]
        if id[0] == 's':
            id = str(65536 + int(id[1:]))
        d = tabx.get_row_by_unique_field('id', id, True)

        if "hp" in tag.attrib:
            d["hp"] = float(tag.attrib["hp"])
        if "damage" in tag.attrib:
            d["damage"] = float(tag.attrib["damage"])
        if "tearScale" in tag.attrib:
            d["tearScale"] = float(tag.attrib["tearScale"])
        
        if "flameColor" in tag.attrib and tag.attrib["flameColor"] in colors:
            d["flameColor"] = colors[tag.attrib['flameColor']].str()
        if "coreColor" in tag.attrib and tag.attrib["coreColor"] in colors:
            d["coreColor"] = colors[tag.attrib['coreColor']].str()
        # print(tag.attrib)
        if "coreGfx" in tag.attrib:
            path = tag.attrib["coreGfx"]
            path = isaac.get_anm2_wiki_path("gfx/familiar/wisps/" + path)
            if path == None:
                print(f"warning: path not found:{tag.attrib['coreGfx']}")
            else:
                d["coreGfx"] = path
tabx.dump("after.json")
# tabx.save()