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
site = isaac.site('sync/entity.py')

tabx = pytabx.HuijiTabx(site.Pages["Data:Entity.tabx"])
tabx.dump("before.json")

index_to_xml_node = {}
for ch in xmlhelper.game_file('entities2.xml'):
    assert 'id' in ch.attrib
    assert 'variant' in ch.attrib
    index = ch.attrib['id'] + "." + ch.attrib['variant'] + "." + (ch.attrib['subtype'] if 'subtype' in ch.attrib else '0')
    index_to_xml_node[index] = ch

for data in tabx.datas:
    index = f"{data['type']}.{data['variant']}.{data['subtype']}"
    champion = -1
    collisionDamage = -1
    if index in index_to_xml_node:
        node = index_to_xml_node[index]
        if 'champion' in node.attrib:
            champion = int(node.attrib['champion'])
        if 'collisionDamage' in node.attrib:
            try:
                collisionDamage = int(node.attrib['collisionDamage'])
            except:
                collisionDamage = float(node.attrib['collisionDamage'])

    data['champion'] = champion
    data['collisionDamage'] = collisionDamage

tabx.dump("after.json")

tabx.save('补充champoin和collisionDamage')