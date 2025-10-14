###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
sys.path.append(f"{pathlib.Path(__file__).parent / 'basement-renovator/src'}")
###########################################################
"""
此脚本用于将stb文件转换为json并上传至wiki
"""
import config
import json
import roomconvert
import core
import datetime
import mwclient
import pathlib
from tqdm import tqdm

room_folder = config.game_folder_resource / "rooms"

def commonToJSONObject(rooms: list[core.Room], extraProp:dict = {})->list[dict]:
    output = []
    for room in rooms:
        
        output_room = {}
        output.append(output_room)

        for k in extraProp:
            output_room[k] = extraProp[k]

        width, height = room.info.dims

        attrs = [
            ("variant", room.info.variant),
            ("name", room.name),
            ("type", room.info.type),
            ("subtype", room.info.subtype),
            ("shape", room.info.shape),
            # ("width", width - 2),
            # ("height", height - 2),
            ("width", width),
            ("height", height),
            ("difficulty", room.difficulty),
            ("weight", room.weight),
        ]

        # extra props here
        if room.lastTestTime:
            attrs.append(
                (
                    "lastTestTime",
                    room.lastTestTime.astimezone(datetime.timezone.utc).isoformat(
                        timespec="minutes"
                    ),
                )
            )

        for (k,v) in attrs:
            output_room[k] = v

        room_doors = []
        output_room['doors'] = room_doors

        for door in sorted(room.info.doors, key=core.Room.DoorSortKey):
            x, y, exists = door

            room_doors.append({
                # "x":x-1,
                # "y":y-1,
                "x":x,
                "y":y,
                "exists":exists
            })

        room_spawns = []
        output_room["spawns"] = room_spawns

        for stack, x, y in room.spawns():
            entity = []
            spawn = {
                # "x":x-1,
                # "y":y-1,
                "x":x,
                "y":y,
                "entity":entity
            }
            room_spawns.append(spawn)

            for ent in stack:
                e = {
                    "type":ent.Type,
                    "variant":ent.Variant,
                    "subtype":ent.Subtype,
                    "weight":ent.weight,
                }
                entity.append(e)
                for (k,v) in ent.xmlProps:
                    e[k] = v

    return output

results = []

for f in tqdm(room_folder.glob("*.stb"), desc='read rooms'):
    x = roomconvert.stbToCommon(str(f))
    x = commonToJSONObject(x.rooms, {'_type':'ROOM_STB', '_file': f.name})
    # manually add idx for rooms
    for i in range(len(x)):
        x[i]['_i'] = str(i)
    results.extend(x)

for f in tqdm((room_folder/'greed').glob("*.stb"), desc='read greed rooms'):
    x = roomconvert.stbToCommon(str(f))
    x = commonToJSONObject(x.rooms, {'_type':'ROOM_STB', '_file': 'greed/'+f.name, '_greed':True})
    # manually add idx for rooms
    for i in range(len(x)):
        x[i]['_i'] = str(i)
    results.extend(x)

print(f"{len(results)} rooms got")

import isaac
site = isaac.site("basement/huiji_convert.py")
page_counter = {}

valid_rooms = set()

for room in tqdm(results, desc='upload pages'):
    page_name = f"Data:rooms/{room['_file']}/{room['_i']}.json"
    valid_rooms.add(page_name.lower())
    page_content = json.dumps(room)
    # for s in room['spawns']:
    #     if len(s["entity"]) > 1:
    #         print(page_content)
    #         break
    # print(page_name)
    # print(page_content)
    site.Pages[page_name].save(page_content, summary='自动上传地形文件')

# TODO：搞明白现在的rooms文件夹结构

# rooms_in_wiki = set()

# for p in site.allpages(namespace='3500',prefix='rooms/'):
#     rooms_in_wiki.add(p.name.lower())

# print(','.join(valid_rooms - rooms_in_wiki))