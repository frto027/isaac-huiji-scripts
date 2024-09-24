from pathlib import Path
import json

################# 游戏路径相关 ###########

game_folder = Path(r'E:\SteamLibrary\steamapps\common\The Binding of Isaac Rebirth')
game_folder_resource = game_folder / 'resources'
game_folder_resource_dlc3 = game_folder / 'resources-dlc3'
game_folder_resource_dlc3_zh = game_folder / 'resources-dlc3.zh'

################# 登录相关 ###############

with open('D:/huiji_auth.json','r') as f:
    auth_header = json.load(f)

useraccount_bot = "Frto027的机器人"
useraccount = "Frto027"
with open("D:/pswd.txt", "r") as f:
    password = f.read()


if __name__ == "__main__":
    raise RuntimeError("This file should not be executed")