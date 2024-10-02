import urllib
import urllib.request
import config
import json

def filter_by_file(filename = "Item.tabx"):
    return {
        "_id":{"$regex":"Data:" + filename.replace(".", "\\.")}
    }

def query(filter:dict, page:int = None, pagesize:int = None):
    arg = {"filter":json.dumps(filter)}
    if page != None:
        arg["page"] = page
        arg["pagesize"] = 20
        arg["count"] = 1
    if pagesize != None:
        arg["pagesize"] = pagesize
        arg["count"] = 1
    req = urllib.request.Request("https://isaac.huijiwiki.com/api/rest_v1/namespace/data?" + urllib.parse.urlencode(arg), headers=config.header("mongodb query script"))
    opener = urllib.request.build_opener()
    ret = opener.open(req).read().decode()
    return json.loads(ret)["_embedded"]

def count(filter):
    req = urllib.request.Request("https://isaac.huijiwiki.com/api/rest_v1/namespace/data?" + urllib.parse.urlencode({"filter":json.dumps(filter),"count":True,"page":1,"pagesize":20}), headers=config.header("mongodb query script"))
    opener = urllib.request.build_opener()
    ret = opener.open(req).read().decode()
    return json.loads(ret)["_size"]

if __name__ == "__main__":
    raise RuntimeError("This file should not be executed")