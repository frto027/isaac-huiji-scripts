import xml.etree.ElementTree as ET
import config
import pytabx

def game_file(path:str):
    with (config.game_folder_resource_dlc3_zh / path).open('r') as f:
        return ET.parse(f).getroot()