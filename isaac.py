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

if __name__ == "__main__":
    raise RuntimeError("This file should not be executed")