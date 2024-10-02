###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################
"""
生成房间背景图片及css，将图片上传至wiki
"""

import pytabx
import isaac
import config
import numpy as np

import cv2
goffsetx = 0
goffsety = 0
gflipx = False
gflipy = False

xmax = 0
ymax = 0

def set(offsetx=0,offsety=0,flipx=False,flipy=False):
    global gflipx,gflipy,goffsetx,goffsety
    gflipx =    int(flipx)
    gflipy =    int(flipy)
    goffsetx =  int(offsetx)
    goffsety =  int(offsety)
#上
def copy(x,y,w,h, sx,sy):
    x=int(x)+goffsetx
    y=int(y)+goffsety
    sx=int(sx)
    sy=int(sy)
    w=int(w)
    h=int(h)
    global xmax, ymax
    xmax = max(x,xmax, x+w)
    ymax = max(y,ymax,y+h)
    img[y:y+h,x:x+w, :] = sheet[sy:sy+h,sx:sx+w, :]
    if gflipx:
        img[y:y+h,x:x+w,:] = cv2.flip(img[y:y+h,x:x+w,:], 1)
    if gflipy:
        img[y:y+h,x:x+w,:] = cv2.flip(img[y:y+h,x:x+w,:], 0)

#################################
def draw_single_room(start_x=0, start_y=0):
    # 第一层
    set(offsetx=start_x,offsety=start_y)
    copy(0,0,52*1.5,52*3,0,0)
    for i in range(3):
        copy(52*1.5 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    set(offsetx=start_x,offsety=start_y,flipx=True)
    for i in range(3):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,0,
            52*1.5,52*3,
            0,0)
    # 第二摞
    set(offsetx=start_x,offsety=start_y)
    copy(0,52*3,52*1.5,52*1.5,0,52*1.5)
    for i in range(3):
        copy(52*1.5 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    set(offsetx=start_x,offsety=start_y,flipx=True)
    for i in range(3):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,52*3,
            52*1.5,52*1.5,
            0,52*1.5)
    # 第三摞下
    set(offsety=start_y+52*1.5,offsetx=start_x,flipy=True)
    copy(0,52*3,52*1.5,52*1.5,0,52*1.5)
    for i in range(3):
        copy(52*1.5 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    set(offsetx=start_x,offsety=start_y+52*1.5,flipx=True,flipy=True)
    for i in range(3):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,52*3,
            52*1.5,52*1.5,
            0,52*1.5)
    #最后一层
    set(offsetx=start_x,offsety=start_y+52*6,flipy=True)
    copy(0,0,52*1.5,52*3,0,0)
    for i in range(3):
        copy(52*1.5 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    set(offsetx=start_x,offsety=start_y+52*6,flipx=True,flipy=True)
    for i in range(3):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,0,
            52*1.5,52*3,
            0,0)
def draw_narrow_room(start_x = 0, start_y = 0):
    # 第一层
    set(offsetx=start_x,offsety=start_y+52*2)
    copy(0,0,52*1.5,52*3,0,0)
    for i in range(3):
        copy(52*1.5 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    set(offsetx=start_x,offsety=start_y+52*2,flipx=True)
    for i in range(3):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,0,
            52*1.5,52*3,
            0,0)
    # 第二摞
    # set(offsetx=start_x,offsety=start_y)
    # copy(0,52*3,52*1.5,52*1.5,0,52*1.5)
    # for i in range(3):
    #     copy(52*1.5 + i * 52 * 2 ,52*3,
    #         52*2,52*1.5,
    #         52*1.5,52*1.5)
    # set(offsetx=start_x,offsety=start_y,flipx=True)
    # for i in range(3):
    #     copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,52*3,
    #         52*2,52*1.5,
    #         52*1.5,52*1.5)
    # copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,52*3,
    #         52*1.5,52*1.5,
    #         0,52*1.5)
    # 第三摞下
    set(offsety=start_y+52*1.5,offsetx=start_x,flipy=True)
    copy(0,52*3,52*1.5,52*1.5,0,52*1.5)
    for i in range(3):
        copy(52*1.5 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    set(offsetx=start_x,offsety=start_y+52*1.5,flipx=True,flipy=True)
    for i in range(3):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,52*3,
            52*1.5,52*1.5,
            0,52*1.5)
    # #最后一层
    set(offsetx=start_x,offsety=start_y+52*5.5,flipy=True)
    copy(0,0,52*1.5,52*1.5,0,0)
    for i in range(3):
        copy(52*1.5 + i * 52 * 2 ,0,
            52*2,52*1.5,
            52*1.5,0)
    set(offsetx=start_x,offsety=start_y+52*5.5,flipx=True,flipy=True)
    for i in range(3):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,0,
            52*2,52*1.5,
            52*1.5,0)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 ,0,
            52*1.5,52*1.5,
            0,0)
def draw_narrow_room_v(start_x=0, start_y=0):
    # 第一层
    set(offsetx=start_x,offsety=start_y)
    copy(52*4,0,52*1.5,52*3,0,0)
    for i in range(2):
        copy(52*1.5 + 52*4 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    set(offsetx=start_x,offsety=start_y,flipx=True)
    for i in range(1):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2,0,
            52*2,52*3,
            52*1.5,0)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 - 52 * 4,0,
            52*1.5,52*3,
            0,0)
    # 第二摞
    set(offsetx=start_x,offsety=start_y)
    copy(52*4,52*3,52*1.5,52*1.5,0,52*1.5)
    for i in range(2):
        copy(52*1.5 + 52*4 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    set(offsetx=start_x,offsety=start_y,flipx=True)
    for i in range(1):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 - 52*4,52*3,
            52*1.5,52*1.5,
            0,52*1.5)
    # 第三摞下
    set(offsety=start_y+52*1.5,offsetx=start_x,flipy=True)
    copy(52*4,52*3,52*1.5,52*1.5,0,52*1.5)
    for i in range(2):
        copy(52*1.5 +52*4 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    set(offsetx=start_x,offsety=start_y+52*1.5,flipx=True,flipy=True)
    for i in range(1):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,52*3,
            52*2,52*1.5,
            52*1.5,52*1.5)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 - 52*4 ,52*3,
            52*1.5,52*1.5,
            0,52*1.5)
    #最后一层
    set(offsetx=start_x,offsety=start_y+52*6,flipy=True)
    copy(52*4,0,52*1.5,52*3,0,0)
    for i in range(1):
        copy(52*1.5 +52*4+ i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    set(offsetx=start_x,offsety=start_y+52*6,flipx=True,flipy=True)
    for i in range(1):
        copy(52*1.5 + 3 * 52 * 2 + i * 52 * 2 ,0,
            52*2,52*3,
            52*1.5,0)
    copy(52*1.5 + 3 * 52 * 2 + 3 * 52 * 2 - 52*4 ,0,
            52*1.5,52*3,
            0,0)
def draw_big_house_Inarrow():
    draw_narrow_room_v(0,0)
    draw_narrow_room_v(0,7*52)
    # 横向修复
    set()
    copy(52*4, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(52*4, 8*52, 52*3, 52*1, 0,52*1.5)
    set(flipx=True)
    copy(52*8, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(52*8, 8*52, 52*3, 52*1, 0,52*1.5)
    copy(52*1.5 + 1.5 * 52 * 3, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
    copy(52*1.5 + 1.5 * 52 * 3, 8*52, 52*3, 52*1, 52*1.5,52*1.5)

    # for i in range(4):
    #     copy(52*1.5 + i * 52 * 3, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
    #     copy(52*1.5 + i * 52 * 3, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    # copy(52*1.5 + 4 * 52 * 3, 7*52, 52*1, 52*1, 52*1.5,52*1.5)
    # copy(52*1.5 + 4 * 52 * 3, 8*52, 52*1, 52*1, 52*1.5,52*1.5)
    # set(flipx=True)
    # copy(52*2 + 4 * 52 * 3 - 26, 7*52, 52*1.5, 52*1, 0,52*1.5)
    # copy(52*2 + 4 * 52 * 3 - 26, 8*52, 52*1.5, 52*1, 0,52*1.5)
def draw_big_house_I():
    draw_single_room(0,0)
    draw_single_room(0,7*52)
    # 横向修复
    set()
    copy(0, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(0, 8*52, 52*3, 52*1, 0,52*1.5)
    for i in range(4):
        copy(52*1.5 + i * 52 * 3, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
        copy(52*1.5 + i * 52 * 3, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    copy(52*1.5 + 4 * 52 * 3, 7*52, 52*1, 52*1, 52*1.5,52*1.5)
    copy(52*1.5 + 4 * 52 * 3, 8*52, 52*1, 52*1, 52*1.5,52*1.5)
    set(flipx=True)
    copy(52*2 + 4 * 52 * 3 - 26, 7*52, 52*1.5, 52*1, 0,52*1.5)
    copy(52*2 + 4 * 52 * 3 - 26, 8*52, 52*1.5, 52*1, 0,52*1.5)

def draw_big_house_Hnarrow():
    draw_narrow_room(0,0)
    draw_narrow_room(3 * 52 * 2 + 52 + 3 * 52 * 2,0)
    set()
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*2, 52*3, 52*2, 52*1.5, 0)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*1.5 + 2.5 * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)
    set(flipy=True)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*5, 52*3, 52*2, 52*1.5, 0)

def draw_big_house_H():
    draw_single_room(0,0)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,0)
    set()
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 0, 52*3, 52*2, 52*1.5, 0)
    for i in range(7):
        copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*1.5 + i * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)
    set(flipy=True)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*7, 52*3, 52*2, 52*1.5, 0)

def draw_big_house():
    draw_single_room(0,0)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,0)
    draw_single_room(0,7*52)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,7*52)
     # 横向修复
    set(offsetx=3 * 52 * 2 + 52 + 3 * 52 * 2+52*1, flipx=True)
    copy(52*11, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(52*11, 8*52, 52*3, 52*1, 0,52*1.5)
    for i in range(4):
        copy(52*1.5 + i * 52 * 3 - 52 * 2, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
        copy(52*1.5 + i * 52 * 3 - 52 * 2, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    # 竖向修复
    set(flipy=True)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*14, 52*3, 52*2, 52*1.5, 0)
    for i in range(6):
        copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*7+52*1.5 + i * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2, 52*7+52*1.5 + 0 * 52*1-52, 52*2, 52*1, 52*1.5, 52*1.5)
    # 横向修复
    set()
    copy(0, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(0, 8*52, 52*3, 52*1, 0,52*1.5)
    for i in range(4):
        copy(52*1.5 + i * 52 * 3, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
        copy(52*1.5 + i * 52 * 3, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    # 竖向修复
    set()
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 0, 52*3, 52*2, 52*1.5, 0)
    for i in range(7):
        copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*1.5 + i * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)

def draw_big_houseLU():
    draw_single_room(0,0)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,0)
    draw_single_room(0,7*52)
    # 横向修复
    set()
    copy(0, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(0, 8*52, 52*3, 52*1, 0,52*1.5)
    for i in range(4):
        copy(52*1.5 + i * 52 * 3, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
        copy(52*1.5 + i * 52 * 3, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    # 竖向修复
    set()
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 0, 52*3, 52*2, 52*1.5, 0)
    for i in range(7):
        copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*1.5 + i * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)
    # 中心修复
    set(flipx=True,flipy=True)
    copy(52*14,52*8,52,52,52*9,0)
def draw_big_houseRU():
    draw_single_room(0,0)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,0)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,7*52)
    # 横向修复
    set(offsetx=3 * 52 * 2 + 52 + 3 * 52 * 2+52*1, flipx=True)
    copy(52*11, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(52*11, 8*52, 52*3, 52*1, 0,52*1.5)
    for i in range(4):
        copy(52*1.5 + i * 52 * 3 - 52 * 1, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
        copy(52*1.5 + i * 52 * 3 - 52 * 1, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    # 竖向修复
    set(offsetx=52)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 0, 52*3, 52*2, 52*1.5, 0)
    for i in range(7):
        copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*1.5 + i * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)
    # 中心修复
    set(flipx=False,flipy=True)
    copy(52*13,52*8,52,52,52*9,0)

def draw_big_houseLD():
    draw_single_room(0,0)
    draw_single_room(0,7*52)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,7*52)
    # 横向修复
    set()
    copy(0, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(0, 8*52, 52*3, 52*1, 0,52*1.5)
    for i in range(4):
        copy(52*1.5 + i * 52 * 3, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
        copy(52*1.5 + i * 52 * 3, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    copy(52*1.5 + 4 * 52 * 3, 7*52, 52*1, 52*1, 52*1.5,52*1.5)
    copy(52*1.5 + 4 * 52 * 3, 8*52, 52*1, 52*1, 52*1.5,52*1.5)
    # 竖向修复
    set(flipy=True)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*14, 52*3, 52*2, 52*1.5, 0)
    for i in range(6):
        copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*7+52*1.5 + i * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)
    # # 中心修复
    set(flipx=True,flipy=False)
    copy(52*14,52*7,52,52,52*9,0)

def draw_big_houseRD():
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,0)
    draw_single_room(0,7*52)
    draw_single_room(3 * 52 * 2 + 52 + 3 * 52 * 2,7*52)
    # 横向修复
    set(offsetx=3 * 52 * 2 + 52 + 3 * 52 * 2+52*1, flipx=True)
    copy(52*11, 7*52, 52*3, 52*1, 0,52*1.5)
    copy(52*11, 8*52, 52*3, 52*1, 0,52*1.5)
    for i in range(4):
        copy(52*1.5 + i * 52 * 3 - 52 * 2, 7*52, 52*3, 52*1, 52*1.5,52*1.5)
        copy(52*1.5 + i * 52 * 3 - 52 * 2, 8*52, 52*3, 52*1, 52*1.5,52*1.5)
    # 竖向修复
    set(flipy=True)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*14, 52*3, 52*2, 52*1.5, 0)
    for i in range(6):
        copy(3 * 52 * 2 + 52 + 3 * 52 * 2 - 52, 52*7+52*1.5 + i * 52*1, 52*3, 52*1, 52*1.5, 52*1.5)
    copy(3 * 52 * 2 + 52 + 3 * 52 * 2, 52*7+52*1.5 + 0 * 52*1-52, 52*2, 52*1, 52*1.5, 52*1.5)
    # # 中心修复
    set(flipx=False,flipy=False)
    copy(52*13,52*7,52,52,52*9,0)

# sheet = cv2.imread(str(config.game_folder_resource / 'gfx/backdrop/01_basement.png'),cv2.IMREAD_UNCHANGED)
# img = np.zeros((52*30,52*30, 4), dtype='uint8')
# draw_narrow_room_v()
# cv2.imshow("orig",cv2.imread(r"C:\Users\q6027\Downloads\Room_bg_shape_8.png"))
# cv2.imshow("sheet",sheet)
# cv2.imshow('preview', img)
# cv2.waitKey()

output_path = pathlib.Path(__file__).parent / 'img.out'
if not output_path.exists():
    output_path.mkdir()

generators = {
    "rooms_background_shape1" : draw_single_room,
    "rooms_background_shape2" : draw_narrow_room,
    "rooms_background_shape3" : draw_narrow_room_v,

    "rooms_background_shape4" : draw_big_house_I,
    "rooms_background_shape5" : draw_big_house_Inarrow,
    "rooms_background_shape6" : draw_big_house_H,
    "rooms_background_shape7" : draw_big_house_Hnarrow,

    "rooms_background_shape8" : draw_big_house,
    "rooms_background_shape9" : draw_big_houseRD,
    "rooms_background_shape10" : draw_big_houseLD,
    "rooms_background_shape11" : draw_big_houseRU,
    "rooms_background_shape12" : draw_big_houseLU,
}

cssText = ""

import background_img_generator_define

for shape in background_img_generator_define.shape_size:
    [x,y] = background_img_generator_define.shape_size[shape]
    cssText += ".%s{width:%dpx;height:%dpx;transform: scale(0.5) translate(-%dpx,-%dpx)}\n" % (shape, x,y,x/2,y/2)

site = isaac.site("basement/background_img_generator.py")

for cfg in background_img_generator_define.basement_paths:
    print(cfg.pngfile)
    sheet = cv2.imread(str(cfg.pngfile), cv2.IMREAD_UNCHANGED)
    for gen in generators:
        xmax = 0
        ymax = 0
        img = np.zeros((52*30,52*30, 4), dtype='uint8')
        generators[gen]()
        [xmax,ymax] = background_img_generator_define.shape_size[gen]
        img = img[:ymax, :xmax, :]

        imgName = f"{gen}_{cfg.stage_css}.png"
        cv2.imwrite(str(output_path / imgName), img)

        css_selector = f".{gen}.{cfg.stage_css}"
        with (output_path / imgName).open('rb') as f:
            try:
                site.upload(f, imgName, description="用于模块:Rooms的房间背景贴图", ignore=True)
            except Exception as e:
                print(e)

        if site.Pages['文件:' + imgName].exists:
            cssText += "%s{background-image:url(%s);}\n" % (css_selector, isaac.get_file_wiki_url(imgName))
        else:
            print(f"文件{imgName}不在wiki上，已忽略创建css")


print(cssText)