import json
from multiprocessing import Pool
import pathlib
from mwclient import Site
from glob import glob
from mwclient import errors as mwerrors
path = "E:\\backup\\IsaacAnmPlayer\\docs\\"

username = "frto027的机器人" #input("username:")
pswd = input()

ua = 'Frto027Robot.Anm2Uploader/0.0 (602706150@qq.com)'
site = Site('isaac.huijiwiki.com',scheme='http',clients_useragent=ua)

site.login(username, pswd)

def upload_png(png):
    # assert png.startswith(path)
    urlpath = 'Anm2_' + png[len(path):].replace('\\','_')

    # if site.images[urlpath].exists:
    #     print("ignore " + urlpath)
    #     return

    print("uploading "+urlpath)
    with open(png,'rb') as f:
        r = None
        retry = 0
        while r == None and retry < 3:
            try:
                retry = retry + 1
                r = site.upload(f,urlpath,'Anm2动画素材[[分类:Anm2动画贴图]]',ignore=True, comment='v1.7.9 update')
            except mwerrors.APIError as e:
                print(e)
        print(r)

def upload_json(json):
    # assert json.startswith(path)
    urlpath = 'Anm2/' + json[len(path):].replace('\\','/')

    page = site.pages[urlpath]

    with open(json,'r') as f:
        txt = f.read()

    # if page.exists and page.text() == txt:
    #     print("ignore " + urlpath)
    #     return

    print("uploading "+urlpath)

    page.save(txt,'anm2动画(Visible属性)')

# if __name__ == "__main__":
file_lists = glob(path + "**\\*.png",recursive=True)

# print(file_lists)

# for png in file_lists:
#     upload_png(png)
counter = 0
for m_json in glob(path + "**\\*.json",recursive=True):
    urlpath = 'Anm2/' + m_json[len(path):].replace('\\','/')
    assert urlpath.endswith('.json')
    # urlpath = urlpath[:-5]
    page = site.pages['Data:'+urlpath]

    counter += 1
    print(str(counter) + "\t:"+urlpath)

    with open(m_json,'r') as f:
        txt = f.read()
    if page.exists and page.text() == txt:
        continue
    print("upload")
    page.edit(txt, 'v1.7.9 update')
