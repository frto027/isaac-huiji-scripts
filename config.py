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

def header(script_name="default"):
    agent_header = {"User-Agent":"Frto027/" + script_name + ",(https://github.com/frto027/isaac-huiji-scripts)"}
    for k in auth_header:
        agent_header[k] = auth_header[k]
    return agent_header

useraccount_bot = "Frto027的机器人"
useraccount = "Frto027"
with open("D:/pswd.txt", "r") as f:
    password = f.read()

############### 不许执行相关 ##############
if __name__ == "__main__":
    raise RuntimeError("This file should not be executed")