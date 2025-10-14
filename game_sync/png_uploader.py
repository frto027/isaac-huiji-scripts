###########################################################
import sys
import pathlib

import mwclient.page
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################
import config
import cv2
import isaac
import mwclient.errors as mwerrors
import mwclient

site = isaac.site_bot("png_uploader.py")

def compress_and_upload_png(png:str):
    # compress
    offline = cv2.imread(png,cv2.IMREAD_UNCHANGED)
    v,buf = cv2.imencode('.png',offline,[cv2.IMWRITE_PNG_COMPRESSION,9])
    with open("offline.png",'wb') as f:
        f.write(buf)

    urlpath = isaac.get_anm2_wiki_path(png)

    #upload
    print("uploading "+urlpath)
    page :mwclient.page.Page = site.Pages["文件:" + urlpath]
    print(str(page.exists))
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


for file in config.game_folder_resource.rglob("gfx/characters/player2/**/*.png"):
# for file in config.game_folder_resource.rglob("**/*.png"):
    compress_and_upload_png(png=str(file))