import json
from multiprocessing import Pool
import pathlib
from mwclient import Site
from glob import glob
from mwclient import errors as mwerrors
from tqdm import tqdm
import cv2
import numpy as np


# path = "E:\\backup\\IsaacAnmPlayer\\docs\\"

path = "E:\\SteamLibrary\\steamapps\\common\\The Binding of Isaac Rebirth\\"

username = "Frto027的机器人@Robot" #input("username:")
pswd = ""

ua = 'Frto027Robot.Anm2Uploader/0.0 (602706150@qq.com)'
site = Site('isaac.huijiwiki.com',scheme='https',clients_useragent=ua)

site.login(username, pswd)

def compress_and_upload_png(png):
    assert png.startswith(path)

    # compress
    offline = cv2.imread(png,cv2.IMREAD_UNCHANGED)
    v,buf = cv2.imencode('.png',offline,[cv2.IMWRITE_PNG_COMPRESSION,9])
    with open("offline.png",'wb') as f:
        f.write(buf)

    urlpath = 'Anm2_' + png[len(path):].replace('\\','_')

    #upload
    print("uploading "+urlpath)
    with open("offline.png",'rb') as f:
        r = None
        retry = 0
        while r == None and retry < 3:
            try:
                retry = retry + 1
                r = site.upload(f,urlpath,'Anm2动画素材[[分类:Anm2动画贴图]]',ignore=True, comment='v1.7.9b update')
            except mwerrors.APIError as e:
                print(e)
        print(r)

# if __name__ == "__main__":
file_lists = glob(path + "**\\*.png",recursive=True)

file_lists = [f for f in file_lists if
     f.startswith(path + "resources\\gfx\\") or
     f.startswith(path + "resources-dlc3\\gfx\\") or
     f.startswith(path + "resources-dlc3.zh\\gfx\\")
    ]

def check_same(fpath):
    assert fpath.startswith(path)
    urlpath = 'Anm2_' + fpath[len(path):].replace('\\','_')
    retry = 0
    while retry < 3:
        retry += 1
        try:
            img = site.images[urlpath]
            if not img.exists:
                return False
            with open('online.png','wb') as f:
                img.download(f)
            break
        except Exception as e:
            print(e)
    online = cv2.imread('online.png',cv2.IMREAD_UNCHANGED)
    offline = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    return np.array_equal(online, offline)


# check modified files
# with open("changelist.txt","w") as f:
#     for ff in tqdm(file_lists[8400:]):
#         print(ff)
#         if not check_same(ff):
#             f.write(ff + "\n")

file_lists = []
with open("changelist.txt","r") as f:
    for line in f.read().split("\n"):
        if len(line) > 0:
            file_lists.append(line)
for png in tqdm(file_lists):
    compress_and_upload_png(png)
