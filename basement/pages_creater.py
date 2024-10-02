###########################################################
import sys
import pathlib

import mwclient.page
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
sys.path.append(f"{pathlib.Path(__file__).parent / 'basement-renovator/src'}")
###########################################################

import mongo

ROOM_PER_PAGE = 50

room_types = {
"ROOM_NULL" : 0,
"ROOM_DEFAULT" : 1,
"ROOM_SHOP" : 2,
"ROOM_ERROR" : 3,
"ROOM_TREASURE" : 4,
"ROOM_BOSS" : 5,
"ROOM_MINIBOSS" : 6,
"ROOM_SECRET" : 7,
"ROOM_SUPERSECRET" : 8,
"ROOM_ARCADE" : 9,
"ROOM_CURSE" : 10,
"ROOM_CHALLENGE" : 11,
"ROOM_LIBRARY" : 12,
"ROOM_SACRIFICE" : 13,
"ROOM_DEVIL" : 14,
"ROOM_ANGEL" : 15,
"ROOM_DUNGEON" : 16,
"ROOM_BOSSRUSH" : 17,
"ROOM_ISAACS" : 18,
"ROOM_BARREN" : 19,
"ROOM_CHEST" : 20,
"ROOM_DICE" : 21,
"ROOM_BLACK_MARKET" : 22,
"ROOM_GREED_EXIT" : 23,
"ROOM_PLANETARIUM" : 24,
"ROOM_TELEPORTER" : 25		,
"ROOM_TELEPORTER_EXIT" : 26	,
"ROOM_SECRET_EXIT" : 27		,
"ROOM_BLUE" : 28				,
"ROOM_ULTRASECRET" : 29		,
}
gotos = {
    "ROOM_PLANETARIUM" : "s.planetarium",
    "ROOM_SECRET_EXIT" : "s.secretexit"		,
    "ROOM_BLUE" : "s.blue"				,
    "ROOM_ULTRASECRET" : "s.ultrasecret"		,

    "ROOM_DEFAULT" : 'd',
    "ROOM_SHOP" : 's.shop',
    "ROOM_ERROR" : 's.error',
    "ROOM_TREASURE" : 's.treasure',
    "ROOM_BOSS" : 's.boss',
    "ROOM_MINIBOSS" : 's.miniboss',
    "ROOM_SECRET" : 's.secret',
    "ROOM_SUPERSECRET" : 's.supersecret',
    "ROOM_ARCADE" : 's.arcade',
    "ROOM_CURSE" : 's.curse',
    "ROOM_CHALLENGE" : 's.challenge',
    "ROOM_LIBRARY" : 's.library',
    "ROOM_SACRIFICE" : 's.sacrifice',
    "ROOM_DEVIL" : 's.devil',
    "ROOM_ANGEL" : 's.angel',
    "ROOM_DUNGEON" : 's.itemdungeon',
    "ROOM_BOSSRUSH" : 's.bossrush',
    "ROOM_ISAACS" : 's.isaacs',
    "ROOM_BARREN" : 's.barren',
    "ROOM_CHEST" : 's.chest',
    "ROOM_DICE" : 's.dice',
    "ROOM_BLACK_MARKET" : 's.blackmarket',
}
prefixes = {
    "ROOM_DEFAULT" : "d",
    "ROOM_SHOP" : 's/商店',
    "ROOM_ERROR" : 's/错误房',
    "ROOM_TREASURE" : 's/宝箱房',
    "ROOM_BOSS" : 's/头目房',
    "ROOM_MINIBOSS" : 's/小头目房',
    "ROOM_SECRET" : 's/隐藏房',
    "ROOM_SUPERSECRET" : 's/超级隐藏房',
    "ROOM_ARCADE" : 's/赌博房',
    "ROOM_CURSE" : 's/诅咒房',
    "ROOM_CHALLENGE" : 's/挑战房',
    "ROOM_LIBRARY" : 's/图书馆',
    "ROOM_SACRIFICE" : 's/献祭房',
    "ROOM_DEVIL" : 's/恶魔房',
    "ROOM_ANGEL" : 's/天使房',
    "ROOM_DUNGEON" : 's/夹层',
    "ROOM_BOSSRUSH" : 's/Boss Rush',
    "ROOM_ISAACS" : 's/卧室',
    "ROOM_BARREN" : 's/肮脏的卧室',
    "ROOM_CHEST" : 's/宝库',
    "ROOM_DICE" : 's/骰子房',
    "ROOM_BLACK_MARKET" : 's/黑市',
    "ROOM_PLANETARIUM":"s/星象房",
    "ROOM_SECRET_EXIT" : "s/隐秘出口"		,
    "ROOM_BLUE" : "s/蓝色房间"				,
    "ROOM_ULTRASECRET" : "s/究极隐藏房"		,

}
room_name_to_type:dict[str,int] = {}
room_name_to_prefixes:dict[str,str] = {}
for k in gotos:
    if gotos[k].startswith("s."):
        room_name_to_type[gotos[k][2:]] = room_types[k]
    else:
        room_name_to_type[gotos[k]] = room_types[k]

for k in prefixes:
    if gotos[k].startswith("s."):
        room_name_to_prefixes[gotos[k][2:]] = prefixes[k]
    else:
        room_name_to_prefixes[gotos[k]] = prefixes[k]

# for k in room_name_to_type:
#     print(k)

def query():
    return {
        "_type":"ROOM_STB"
    }
import isaac
site = isaac.site_bot("basement/page_creater.py")

def build_prefix(page_prefix:str, count:int, args:str):
    import math
    page_count = math.ceil(count / ROOM_PER_PAGE)
        
    print(f"前缀“{page_prefix}”需要{page_count}个页面，共计{count}条数据")
    if page_count == 0:
        return
    
    for i in range(page_count + 10):
        page_name = f"{page_prefix}/{i+1}"
        page_template_content = "{{" + f"#invoke:Rooms|roomList|page={i+1}"  + args + "}}"
        priv_page = f"[[{page_prefix}/{i}|上一页]]" if i > 0 else ""
        next_page = f"[[{page_prefix}/{i+2}|下一页]]" if i + 1 < page_count else ""

        page_content = "<!-- 该页面由机器人批量创建维护，为避免覆盖，请勿在此放置内容 -->\n" + page_template_content + "\n\n" + priv_page + next_page
        if i < page_count:
            print(f"创建页面:{page_name}", page_content)
            site.pages[page_name].edit(page_content, summary="自动更新页面")
        else:
            if site.pages[page_name].exists:
                site.pages[page_name].delete(reason="批量删除多余页面")
                print(f"移除页面:{page_name}")

def manage_special(roomtype='shop', isGreed=False):
    query = {
        "_type":"ROOM_STB",
        "_file":("greed/" if isGreed else "") + "00.special rooms.stb",
        "type":room_name_to_type[roomtype]
    }
    count = mongo.count(query)
    
    if not roomtype in room_name_to_prefixes:
        print(f"room {roomtype} not found in prefixes, return.")
        return
    prefix = room_name_to_prefixes[roomtype]

    build_prefix(("布局/贪婪/" if isGreed else "布局/") + prefix, count, ("|greed=1" if isGreed else "") + f"|room={roomtype}")

def manage_normal(stbfile='greed/xx.stb', room_name = "地下室", roomtype='d'):
    query = {
        "_type":"ROOM_STB",
        "_file":stbfile,
        "type":room_name_to_type[roomtype]
    }


    prefix = ("布局/贪婪/" if stbfile.startswith("greed/") else "布局/") + room_name_to_prefixes[roomtype] + "/" + room_name

    count = mongo.count(query)
    print(count)
    if not roomtype in room_name_to_prefixes:
        print(f"room {roomtype} not found in prefixes, return.")
        return

    build_prefix(prefix, count, ("|greed=1" if stbfile.startswith("greed/") else "") + f"|stage={room_name}" + (f"|room={roomtype}" if roomtype != "d" else ""))


for k in room_name_to_type:
    manage_special(k, True)

for k in room_name_to_type:
    manage_special(k, False)

normal_rooms = {
    "00.special rooms.stb": 				"特殊",
	"01.basement.stb": 					"地下室",
	"02.cellar.stb": 					"地窖",
	"03.burning basement.stb": 			"燃烧地下室",
	"04.caves.stb": 						"洞穴",
	"05.catacombs.stb": 					"墓穴",
	"06.flooded caves.stb": 				"淹水洞穴",
	"07.depths.stb": 					"深牢",
	"08.necropolis.stb": 				"坟场",
	"09.dank depths.stb": 				"阴湿深牢",
	"10.womb.stb": 						"子宫",
	"11.utero.stb": 						"血宫",
	"12.scarred womb.stb": 				"结痂子宫",
	"13.blue womb.stb": 					"???",
	"14.sheol.stb": 						"阴间",
	"15.cathedral.stb": 					"教堂",
	"16.dark room.stb": 					"暗室",
	"17.chest.stb": 						"玩具箱",
	"26.the void.stb": 					"虚空",
	"27.downpour.stb": 					"下水道",
	"28.dross.stb": 						"污水井",
	"29.mines.stb": 						"矿洞",
	"30.ashpit.stb": 					"灰坑",
	"31.mausoleum.stb": 					"陵墓",
	"32.gehenna.stb": 					"炼狱",
	"33.corpse.stb": 					"尸宫",
	# "34.mortis.stb": 					"mortis",
	"35.home.stb": 						"家",
	# "36.backwards.stb": 					"backwards",
	"greed/00.special rooms.stb": 		"特殊",
	"greed/01.basement.stb": 			"地下室",
	"greed/02.cellar.stb": 				"地窖",
	"greed/03.burning basement.stb": 	"燃烧地下室",
	"greed/04.caves.stb": 				"洞穴",
	"greed/05.catacombs.stb": 			"墓穴",
	"greed/06.flooded caves.stb": 		"淹水洞穴",
	"greed/07.depths.stb": 				"深牢",
	"greed/08.necropolis.stb": 			"坟场",
	"greed/09.dank depths.stb": 			"阴湿深牢",
	"greed/10.womb.stb": 				"子宫",
	"greed/11.utero.stb": 				"血宫",
	"greed/12.scarred womb.stb": 		"结痂子宫",
	"greed/14.sheol.stb": 				"阴间",
	"greed/24.the shop.stb": 			"商店",
	"greed/25.ultra greed.stb": 			"究极贪婪",
	"greed/27.downpour.stb": 			"下水道",
	"greed/28.dross.stb": 				"污水井",
	"greed/29.mines.stb": 				"矿洞",
	"greed/30.ashpit.stb": 				"灰坑",
	"greed/31.mausoleum.stb": 			"陵墓",
	"greed/32.gehenna.stb": 				"炼狱",
	"greed/33.corpse.stb": 				"尸宫",
	# "greed/34.mortis.stb": 				"mortis",

}

# for k in normal_rooms:
#     manage_normal(k, normal_rooms[k], 'd')
# print(mongo.query(query()))