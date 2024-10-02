###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
sys.path.append(f"{pathlib.Path(__file__).parent / 'basement-renovator/src'}")
###########################################################

import mongo

def query():
    return {
        "_type":"ROOM_STB"
    }

print(mongo.query(query()))