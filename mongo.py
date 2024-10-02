import urllib
import urllib.request
import config
import json

def filter_by_file(filename = "Item.tabx"):
    return {
        "_id":{"$regex":"Data:" + filename.replace(".", "\\.")}
    }

def query(filter):
    req = urllib.request.Request("https://isaac.huijiwiki.com/api/rest_v1/namespace/data?" + urllib.parse.urlencode({"filter":json.dumps(filter)}), headers=config.header("mongodb query script"))
    opener = urllib.request.build_opener()
    ret = opener.open(req).read().decode()
    return json.loads(ret)

if __name__ == "__main__":
    raise RuntimeError("This file should not be executed")