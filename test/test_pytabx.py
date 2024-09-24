###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################


import pytabx
import isaac

site = isaac.site(__file__)

tabx = pytabx.HuijiTabx(site.Pages["Data:Item.tabx"])
print(tabx.dump_fields())

for d in tabx.datas:
    print(d.get("namezh"))