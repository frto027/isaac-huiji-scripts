###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################
"""
这是一个配置文件

"""
import config

class Cfg:
    def __init__(self, pngfile, stage_css) -> None:
        self.pngfile = pngfile
        self.stage_css = stage_css
    def __str__(self) -> str:
        return f"{self.pngfile}:{self.stage_css}"
    
"01_basement.png"
"02_cellar.png"
"03_caves.png"
"04_catacombs.png"
"05_depths.png"
"06_necropolis.png"
"07_the womb.png"
"08_utero.png"
"09_sheol.png"
"10_cathedral.png"
"11_chest.png"
"12_darkroom.png"
"13_the burning basement.png"
"14_the drowned caves.png"
"15_the dank depths.png"
"16_the scarred womb.png"
"17_blue secret.png"
"18_blue womb.png"
css_postfixes = {
"01_basement":"01_basement.png",
"02_cellar":"02_cellar.png",
"03_burning_basement":"13_the burning basement.png",
"04_caves":"03_caves.png",
"05_catacombs":"04_catacombs.png",
"07_depths":"05_depths.png",
"08_necropolis":"06_necropolis.png",
"09_dank_depths":"15_the dank depths.png",
"10_womb":"07_the womb.png",
"11_utero":"08_utero.png",
"12_scarred_womb":"16_the scarred womb.png",
"13_blue_womb":"18_blue womb.png",
"14_sheol":"09_sheol.png",
"17_chest":"11_chest.png",


"15_cathedral":"01_basement.png", # something missing
"06_flooded_caves":"03_caves.png",
"16_dark_room":"01_basement.png", # 12 darkroom.png has no corner block, don't know how to draw it

}


############













shape_size = {
    "rooms_background_shape1" : [780,468],
    "rooms_background_shape2" : [780,468],
    "rooms_background_shape3" : [780,468],
    "rooms_background_shape4" : [780,823],
    "rooms_background_shape5" : [780,823],
    "rooms_background_shape6" : [1456,468],
    "rooms_background_shape7" : [1456,468],
    "rooms_background_shape8" : [1456,832],
    "rooms_background_shape9" : [1456,832],
    "rooms_background_shape10": [1456,832],
    "rooms_background_shape11": [1456,832],
    "rooms_background_shape12": [1456,832],
}
"""
.rooms_background_shape1{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/c/c7/Room_bg_shape_1.png);
	width:780px;height:468px; transform: scale(0.5) translate(-390px, -234px);
}
.rooms_background_shape2{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/c/c7/Room_bg_shape_1.png);
	width:780px;height:468px; transform: scale(0.5) translate(-390px, -234px);
}
.rooms_background_shape3{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/c/c7/Room_bg_shape_1.png);
	width:780px;height:468px; transform: scale(0.5) translate(-390px, -234px);
}
.rooms_background_shape4{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/f/fb/Room_bg_shape_4.png);
	width:780px;height:823px; transform: scale(0.5) translate(-390px, -411.5px);
}
.rooms_background_shape5{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/f/fb/Room_bg_shape_4.png);
	width:780px;height:823px; transform: scale(0.5) translate(-390px, -411.5px);
}
.rooms_background_shape6{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/0/0d/Room_bg_shape_6.png);
	width:1456px;height:468px; transform: scale(0.5) translate(-728px, -234px);
}
.rooms_background_shape7{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/0/0d/Room_bg_shape_6.png);
	width:1456px;height:468px; transform: scale(0.5) translate(-728px, -234px);
}
.rooms_background_shape8{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/0/04/Room_bg_shape_8.png);
	width:1456px;height:832px; transform: scale(0.5) translate(-728px, -416px);
}
.rooms_background_shape9{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/8/85/Room_bg_shape_9.png);
	width:1456px;height:832px; transform: scale(0.5) translate(-728px, -416px);
}
.rooms_background_shape10{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/9/9f/Room_bg_shape_10.png);
	width:1456px;height:832px; transform: scale(0.5) translate(-728px, -416px);
}
.rooms_background_shape11{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/1/1e/Room_bg_shape_11.png);
	width:1456px;height:832px; transform: scale(0.5) translate(-728px, -416px);
}
.rooms_background_shape12{
	background-image:url(https://huiji-public.huijistatic.com/isaac/uploads/3/33/Room_bg_shape_12.png);
	width:1456px;height:832px; transform: scale(0.5) translate(-728px, -416px);
}


"""

basement_paths:list[Cfg] = []

for k in css_postfixes:
    basement_paths.append(Cfg(config.game_folder_resource/f"gfx/backdrop/{css_postfixes[k]}","room_"+k))

# imgs = {}
# csss = {}
# basement_paths:list[Cfg] = [
#     Cfg(config.game_folder_resource / 'gfx/backdrop/01_basement.png', "room_00_special_rooms"),
#     Cfg(config.game_folder_resource / 'gfx/backdrop/01_basement.png', "room_01_basement")
# ]
# import re
# for f in (config.game_folder_resource/'gfx/backdrop').glob("*.png"):
#     if re.match(r"^[0-9]+_[ a-z]+\.png", f.name) and not f.name.endswith("floor.png"):
#         print(f.name)