# 脚本记录

脚本依赖问题：

- git根目录为python的搜索目录，可以被include（每个脚本前将根目录加入sys.path）
- 只要不是直接报错的脚本，都能直接运行
- 所有的配置位于config.py，敏感信息存在硬盘上

# mwclient使用

出发点是代码复用，尽可能降低每个脚本的复杂性

- 使用isaac.py创建site

# tabx访问

tabx的操作已封装至pytabx库

# 项目结构

脚本名|注释
---|---
`config.py`|配置文件，运行前请修改
`isaac.py`|灰机wiki操作相关封装
`mongo.py`|mongodb查询
`pytabx/*`|用于操作灰机wiki中的tabx文件的py库
`test/*`|一些测试文件
`babies/*`|维护Data:Babies.tabx
`basement/*`|维护房间地形数据Data:Rooms/*
`item_keywords/*`|维护搜索关键词的相关内容
`error_detect/*`|缩略图出错爬虫？
`anm2player_scripts/*`|Anm2播放器图像上传工具
`wisps/*`|维护Data:wisps.tabx