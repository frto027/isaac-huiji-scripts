###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################


import pytabx
import isaac
from selenium import webdriver
from selenium.webdriver.common.by import By
import base64
import time
from pathlib import Path

output_folder = Path("entity_icon_crepper") / "screenshots"

if not output_folder.exists():
    output_folder.mkdir()

opt = webdriver.ChromeOptions()
opt.add_argument("--disable-web-security")
driver = webdriver.Chrome(opt)


def screenshot(id:str):
    driver.get("https://isaac.huijiwiki.com/wiki/%E6%A8%A1%E6%9D%BF:%E5%AE%9E%E4%BD%93%E5%8A%A8%E7%94%BB/" + id)
    driver.implicitly_wait(2)
    canvas = driver.find_element(by=By.CSS_SELECTOR, value=".anm2player canvas")
    if canvas == None:
        return
    time.sleep(1)
    # get the canvas as a PNG base64 string
    canvas_base64 = driver.execute_script("return arguments[0].toDataURL('image/png').substring(21);", canvas)

    # # decode
    canvas_png = base64.b64decode(canvas_base64)
    with (output_folder / (id + ".png")).open("wb") as f:
        f.write(canvas_png)

# screenshot("950.0.0")

site = isaac.site(__file__)

tabx = pytabx.HuijiTabx(site.Pages["Data:Entity.tabx"])

for e in tabx.datas:
    id = str(e.get("type")) + "." + str(e.get("variant")) + "." + str(e.get("subtype"))
    if not site.Pages["模板:实体动画/" + id].exists:
        continue
    screenshot(id)
    # break
driver.quit()