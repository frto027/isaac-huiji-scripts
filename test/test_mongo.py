###########################################################
import sys
import pathlib
import urllib.parse
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################

import mongo

print(mongo.query(mongo.filter_by_file("Wisps.tabx")))