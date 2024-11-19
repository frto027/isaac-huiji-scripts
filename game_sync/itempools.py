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
site = isaac.site('sync/itempools.py')

tabx = pytabx.HuijiTabx(site.Pages['Data:Itempool rep.tabx'], remove_all_datas=True)
for ch in xmlhelper.game_file('itempools.xml'):
    assert ch.tag == 'Pool'
    for item in ch:
        assert item.tag == 'Item'
        data = tabx.new_data()
        data['name'] = ch.attrib["Name"]
        data['id'] = int(item.attrib['Id'])
        data['weight'] = float(item.attrib['Weight'])
        data['decreaseby'] = float(item.attrib['DecreaseBy'])
        data['removeon'] = float(item.attrib['RemoveOn'])
tabx.save('忏悔+更新')