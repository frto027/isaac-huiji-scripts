###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################

import isaac
import config
import xml.etree.ElementTree as ET
import pytabx
import xmlhelper
site = isaac.site('sync/items.py')

item = xmlhelper.game_file('items.xml')

tabx = pytabx.HuijiTabx(site.Pages["Data:item.tabx"])
# tabx.dump("before.json")
for ch in xmlhelper.game_file('items_metadata.xml'):
    if ch.tag == "item":
        page = "c" + ch.attrib["id"]
        data = tabx.get_row_by_unique_field("page", page)
        data.set_int("quality", ch.attrib, 'quality')
        data.set_str("tag", ch.attrib, "tags", empty_as_default=True)
        data.set_int("craftquality", ch.attrib, "craftquality", -2147483648)
    if ch.tag == "trinket":
        page = "t" + ch.attrib["id"]
        data = tabx.get_row_by_unique_field("page", page)
        data.set_int("quality", ch.attrib, 'quality')
        data.set_str("tag", ch.attrib, "tags", empty_as_default=True)
        data.set_int("craftquality", ch.attrib, "craftquality", -2147483648)

for ch in xmlhelper.game_file('items.xml'):
    if ch.tag == 'passive' or ch.tag == 'active' or ch.tag == 'familiar':
        page = "c" + ch.attrib["id"]
        data = tabx.get_row_by_unique_field("page", page)
        data.set_int('unlock',ch.attrib, 'achievement', 0)
# tabx.dump("after.json")
tabx.save('忏悔+更新')