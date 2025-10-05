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

for dat in tabx.datas:
    dat.set("charge", None)

for ch in xmlhelper.game_file('items.xml'):
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
        # if page == "c422":
        #     add_id = True
        if add_id:
            charges.append(f"id={ch.attrib['id']}")
        charges_txt = ','.join(charges)
        data.set("charge", charges_txt)
        if data.get("ChargeRepp") != charges_txt:
            print(data.get("page"), data.get("charge"), data.get("ChargeRepp"))


# tabx.dump("after.json")
tabx.save('补充忏悔充能（新格式）')