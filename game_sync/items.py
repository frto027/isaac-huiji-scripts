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
tabx.dump("before.json")
for ch in xmlhelper.game_file('items_metadata.xml'):
    if ch.tag == "item":
        page = "c" + ch.attrib["id"]
        data = tabx.get_row_by_unique_field("page", page)
        data.set_int("QualityRepp", ch.attrib, 'quality')
        data.set_str("TagRepp", ch.attrib, "tags", empty_as_default=True)
        data.set_int("CraftQualityRepp", ch.attrib, "craftquality", -2147483648)
    if ch.tag == "trinket":
        page = "t" + ch.attrib["id"]
        data = tabx.get_row_by_unique_field("page", page)
        data.set_int("QualityRepp", ch.attrib, 'quality')
        data.set_str("TagRepp", ch.attrib, "tags", empty_as_default=True)
        data.set_int("CraftQualityRepp", ch.attrib, "craftquality", -2147483648)

for ch in xmlhelper.game_file('items.xml'):
    if ch.tag == 'passive' or ch.tag == 'active' or ch.tag == 'familiar':
        page = "c" + ch.attrib["id"]
        data = tabx.get_row_by_unique_field("page", page)
        data.set_int('unlock',ch.attrib, 'achievement', 0)
    if ch.tag == "active":
        page = "c" + ch.attrib["id"]
        data = tabx.get_row_by_unique_field("page", page)
        charges = []
        add_id = False
        if "maxcharges" in ch.attrib:
            charges.append(f"maxcharges={ch.attrib['maxcharges']}")
            if ch.attrib['maxcharges'] == "0":
                add_id = True
        if "chargetype" in ch.attrib:
            charges.append(f"chargetype={ch.attrib['chargetype']}")
            if ch.attrib["chargetype"] == "special":
                add_id = True
        if page in [
            	# "c127","c297","c347","c475","c536","c577","c622","c628","c636",
	            # "c40","c126","c133","c135","c137","c177","c186","c282","c290","c295","c434","c487","c555","c623","c640","c710","c715",
                "c422", "c622", "c487", "c710", "c636"]:
            add_id = True
        if add_id:
            charges.append(f"id={ch.attrib['id']}")
        charges_txt = ','.join(charges)
        data.set("ChargeRepp", charges_txt)

tabx.dump("after.json")
tabx.save('补充充能')