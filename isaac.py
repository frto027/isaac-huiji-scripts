import mwclient
import config

def site(hint = 'isaac.py')->mwclient.Site:
    site = mwclient.Site("isaac.huijiwiki.com",clients_useragent=f"Frto027/{hint}", custom_headers=config.auth_header)
    site.login(config.useraccount, config.password)
    return site

def site_bot(hint = 'isaac.py')->mwclient.Site:
    site = mwclient.Site("isaac.huijiwiki.com",clients_useragent=f"Frto027_bot/{hint}", custom_headers=config.auth_header)
    site.login(config.useraccount_bot, config.password)
    return site

"""
输入资源的相对路径，返回对应wiki中的png名称
"""
def get_anm2_wiki_path(pngname:str) -> str | None:
    if (config.game_folder_resource_dlc3_zh/pngname).exists():
        return "Anm2_"+str((config.game_folder_resource_dlc3/pngname).relative_to(config.game_folder)).replace("\\","_").lower()
    if (config.game_folder_resource_dlc3/pngname).exists():
        return "Anm2_"+str((config.game_folder_resource_dlc3/pngname).relative_to(config.game_folder)).replace("\\","_").lower()
    if (config.game_folder_resource/pngname).exists():
        return "Anm2_"+str((config.game_folder_resource/pngname).relative_to(config.game_folder)).replace("\\","_").lower()
    return None
import hashlib
def get_file_wiki_url(pngname:str):
    pngname = pngname[0].upper() + pngname[1:].lower()
    dig = hashlib.md5(pngname.encode()).hexdigest()
    return f"https://huiji-public.huijistatic.com/isaac/uploads/{dig[0]}/{dig[0:2]}/{pngname}"


if __name__ == "__main__":
    raise RuntimeError("This file should not be executed")