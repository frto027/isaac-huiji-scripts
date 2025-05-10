###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################

import json
from multiprocessing import Pool
import pathlib
from mwclient import Site
from glob import glob
from mwclient import errors as mwerrors
from tqdm import tqdm
import cv2
import numpy as np
import isaac

path = "D:\\SteamLibrary\\steamapps\\common\\The Binding of Isaac Rebirth\\extracted_resources\\resources\\"

site = isaac.site_bot("upload_png.py")

def compress_and_upload_png(png):
    assert png.startswith(path)

    # compress
    offline = cv2.imread(png,cv2.IMREAD_UNCHANGED)
    v,buf = cv2.imencode('.png',offline,[cv2.IMWRITE_PNG_COMPRESSION,9])
    with open("offline.png",'wb') as f:
        f.write(buf)

    online_path = "resources-repp\\" + png[len(path):]
    urlpath = 'Anm2_' + online_path.replace('\\','_')

    #upload
    print("uploading "+urlpath)
    with open("offline.png",'rb') as f:
        r = None
        retry = 0
        while r == None and retry < 3:
            try:
                retry = retry + 1
                r = site.upload(f,urlpath,'Anm2动画素材(忏悔+)[[分类:Anm2动画贴图]]',ignore=True, comment='v1.9.7.12 update')
            except mwerrors.APIError as e:
                print(e)
        print(r)

# if __name__ == "__main__":
file_lists = glob(path + "**\\*.png",recursive=True)

file_lists = [f for f in file_lists if
     f.startswith(path + "gfx\\")
    ]
# file_lists = file_lists[:5]

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

for png in tqdm(file_lists):
    compress_and_upload_png(png)
