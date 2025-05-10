###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################

import config

folder = config.game_folder / "resources"

# folder = "D:\\SteamLibrary\\steamapps\\common\\The Binding of Isaac Rebirth\\extracted_resources\\resources\\"

from glob import glob
import json

import parse
import keymapper
import pathlib
from tqdm import tqdm
KEY_MAPPER = True

def replace_relative_path(obj, relative):
    if not "content" in obj:
        return
    content = obj["content"]
    if not "Spritesheets" in content:
        return
    for i in range(len(content["Spritesheets"])):
        newpath = pathlib.Path(relative).parent / content["Spritesheets"][i]["Path"]
        
        # 处理资源覆盖
        
        res_folder = newpath.parts[0]
        later_path = newpath.relative_to(res_folder)

        newpath = folder /'gfx' / later_path
        # if not newpath.exists():
        #     print(f"warning: not found file {newpath}")
        newpath = (folder / newpath).resolve().relative_to(folder)

        if not (folder / newpath).exists():
            print("warring: res not exist " + str(newpath))


        content["Spritesheets"][i]["Path"] = "resources-repp/" + str(newpath).replace('\\','/')


def copy_sprite(obj, frompath, topath):
    content_str = "content" if not KEY_MAPPER else keymapper.kmap["content"]
    spritesheet_str = "Spritesheets" if not KEY_MAPPER else keymapper.kmap["Spritesheets"]
    path_str = "Path" if not KEY_MAPPER else keymapper.kmap["Path"]

    if not content_str in obj:
        return
    content = obj[content_str]
    if not spritesheet_str in content:
        return
    for i in range(len(content[spritesheet_str])):
        path = content[spritesheet_str][i][path_str]
        fromp = pathlib.Path(frompath) / path
        top = pathlib.Path(topath) / path
        if not fromp.exists():
            print("warring:file not found " + str(fromp))
            continue
        if not top.parent.exists():
            top.parent.mkdir(parents = True)
        with open(str(fromp),"rb") as f:
            with open(str(top), "wb") as t:
                t.write(f.read())


fulljson = {}

for f in folder.rglob("*.anm2"):# glob(folder + "**\\*.anm2",recursive=True):
    relative_path = str(f.relative_to(folder))
    fulljson[relative_path] = parse.parseFile(f)
    replace_relative_path(fulljson[relative_path],relative_path)

    if KEY_MAPPER:
        keymapper.keymap(fulljson[relative_path])

# with open("anm2.json","w") as f:
#     f.write(json.dumps({
#         "keymap":keymapper.kmap_r,
#         "data":fulljson
#     },separators=(',',':')))

def dumpjson(obj):
    return json.dumps(obj,separators=(',',':'))



if True:
    # update to huijiwiki
    import isaac
    site = isaac.site_bot("anm2player_parser/run.py")
    for k in tqdm(fulljson):
        target = k.replace('.anm2','.json')
        text = dumpjson(fulljson[k])

        huijiurl = "Data:Anm2/resources-repp/" + target.replace("\\","/")
        site.Pages[huijiurl].save(text, summary="v1.9.97.12")
        # break

    exit(0)

import sys
if len(sys.argv) == 2:
    output = pathlib.Path(sys.argv[1])
    if not output.exists():
        output.mkdir(parents=True)


    for k in fulljson:
        target = output / k.replace('.anm2','.json')
        print(target)
        if not target.parent.exists():
            target.parent.mkdir(parents = True)
        with open(str(target),'w') as f:
            f.write(dumpjson(fulljson[k]))


    # copy png file

    # do not copy sprite because they have already uploaded
    # for k in fulljson:
    #     copy_sprite(fulljson[k], folder, output)

    # generate manifest

    manifest_list = []
    for k in fulljson:
        manifest_list.append(k.replace('\\','/').replace('.anm2','.json'))
    manifest = {
        "keymap":KEY_MAPPER,
        "list":manifest_list
    }
    if KEY_MAPPER:
        manifest["map"] = keymapper.kmap_r

    with open(str(output/"manifest.json"), 'w') as f:
        f.write(dumpjson(manifest))
    with open(str(output/"keymaps.json"), 'w') as f:
        f.write(dumpjson(keymapper.kmap_r))
    
else:
    print("usage: \n\tpython " + sys.argv[0] + " <output folder>")
    print(len(sys.argv))