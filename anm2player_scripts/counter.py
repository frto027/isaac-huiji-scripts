from mwclient import Site

ua = 'Frto027Robot/0.0 (602706150@qq.com)'
site = Site('ff14.huijiwiki.com',scheme='http',clients_useragent=ua)
counter = 0
for i in site.allpages(namespace='3500'):
    if i.name.startswith('Data:Item/'):
        counter += 1
        print(counter)