###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################

import config
import isaac
import pytabx

site = isaac.site(__file__)
tabx = pytabx.HuijiTabx(site.Pages['Data:Babies.tabx'])

import xml.etree.ElementTree as ET
with (config.game_folder / 'resources-dlc3/babies.xml').open('r') as f:
    doc = ET.parse(f).getroot()

for item in doc:
    assert item.tag == 'baby'
    d = tabx.get_row_by_unique_field("id", int(item.attrib["id"]), create_ok=False)
    if d != None:
        continue
    d = tabx.get_row_by_unique_field("id", int(item.attrib["id"]), create_ok=True)
    d.set("name", item.attrib["name"])
    d.set("achievement", int(item.attrib["achievement"]) if "achievement" in item.attrib else -1)

    skinPath = isaac.get_anm2_wiki_path(item.attrib["skin"])
    if skinPath != None:
        d.set("skin", skinPath)

print(tabx.any_changed())