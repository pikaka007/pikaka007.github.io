---
title: ffmpeg
created: 2026-11-24
updated: 2026-11-24
type: tool
status: draft
publish: true
tags:
- ffmpeg
---
# FFmpeg 学习笔记

## 1. FFmpeg 简介

FFmpeg 是一个开源的音视频处理工具，主要用于：

- 音视频格式转换
    
- 视频压缩与转码
    
- 视频剪辑与拼接
    
- 音频提取与处理
    
- 视频抽帧与 GIF 制作
    
- 添加字幕、水印及滤镜
    
- 屏幕录制与直播推流
    

FFmpeg 主要包含三个命令行工具：

|工具|作用|
|---|---|
|ffmpeg|音视频处理与转换|
|ffprobe|查看音视频文件信息|
|ffplay|音视频播放|

## 2. 基础概念

### 2.1 容器与编解码器

**容器（Container）**：用于组织和存储视频流、音频流、字幕流及元数据。

**编解码器（Codec）**：用于压缩和解压缩音视频数据。

|类型|常见格式|
|---|---|
|容器|MP4、MKV、AVI、MOV、WebM|
|视频编码|H.264、H.265、AV1、VP9|
|音频编码|AAC、MP3、Opus、FLAC|

例如，一个 MP4 文件可以包含：

- 视频流：H.264
    
- 音频流：AAC
    
- 字幕流：mov_text
    
- 元数据：标题、时长等
    

MP4 是容器格式，而 H.264 是视频编码标准，两者不是同一个层面的概念。

### 2.2 编码与解码

- 编码（Encode）：将原始音视频数据转换为编码后的数据，通常会进行压缩。
    
- 解码（Decode）：将编码后的数据还原为可播放或处理的音视频数据。
    
- 转码（Transcode）：将已有的编码数据解码，再使用相同或不同的编码器重新编码。
    
- 转封装（Remux）：不重新编码，仅改变数据的封装方式。
    

转封装通常速度较快，且不会造成重新编码带来的画质损失。

### 2.3 常见音视频参数

|参数|含义|
|---|---|
|Resolution|分辨率，例如 1920×1080|
|FPS|帧率，每秒显示的帧数|
|Bitrate|码率，单位时间内的数据量|
|Sample Rate|音频采样率|
|Channels|音频声道数量|
|Pixel Format|像素格式|
|Keyframe|关键帧|
|GOP|图像组，由一组相关的视频帧组成|
|CRF|部分编码器使用的质量控制参数|

文件体积近似计算公式：

```
文件大小（字节）≈ 总平均码率（bit/s）× 时长（秒）÷ 8
```

例如，一个总平均码率为 8 Mbps、时长为 60 秒的视频，文件大小约为 60 MB。

### 2.4 FFmpeg 工作流程

完整的转码流程：

```
输入文件
    ↓
Demuxer（解封装）
    ↓
Decoder（解码）
    ↓
Filter（滤镜处理，可选）
    ↓
Encoder（编码）
    ↓
Muxer（封装）
    ↓
输出文件
```

使用 `-c copy` 时，可以跳过解码和重新编码：

```
输入文件 → 解封装 → 封装 → 输出文件
```

因此，流复制通常比重新编码快得多。

## 3. 安装与配置

### Windows

使用 Windows Package Manager 安装：

```
winget install --id Gyan.FFmpeg -e
```

### Ubuntu

```
sudo apt update
sudo apt install ffmpeg
```

### macOS

```
brew install ffmpeg
```

### 检查安装结果

```
ffmpeg -version
ffprobe -version
```

查看支持的功能：

```
ffmpeg -encoders
ffmpeg -decoders
ffmpeg -formats
ffmpeg -filters
ffmpeg -hwaccels
```

## 4. 基本命令结构

```
ffmpeg [全局参数] [输入参数] -i 输入文件 [输出参数] 输出文件
```

例如：

```
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac output.mp4
```

参数解释：

- `-i input.mp4`：指定输入文件。
    
- `-c:v libx264`：使用 libx264 编码器生成 H.264 视频。
    
- `-crf 23`：设置视频编码质量。
    
- `-c:a aac`：使用 AAC 音频编码器。
    
- `output.mp4`：指定输出文件。
    

注意：FFmpeg 的参数顺序具有实际意义。输入参数通常放在对应的 `-i` 之前，输出参数通常放在输出文件之前。

## 5. 常用参数

|参数|作用|
|---|---|
|`-i`|指定输入文件|
|`-c:v`|指定视频编码器|
|`-c:a`|指定音频编码器|
|`-c copy`|复制选中的流，不重新编码|
|`-b:v`|设置视频目标码率|
|`-b:a`|设置音频目标码率|
|`-crf`|设置质量控制参数|
|`-preset`|设置编码速度等策略|
|`-r`|设置帧率|
|`-s`|设置分辨率|
|`-ss`|指定起始时间|
|`-t`|指定持续时间|
|`-to`|指定停止时间|
|`-vf`|设置视频滤镜|
|`-af`|设置音频滤镜|
|`-filter_complex`|设置复杂滤镜图|
|`-map`|手动选择流|
|`-an`|禁用音频|
|`-vn`|禁用视频|
|`-sn`|禁用字幕|
|`-ar`|设置音频采样率|
|`-ac`|设置音频声道数|
|`-y`|自动覆盖已有输出文件|
|`-n`|禁止覆盖已有输出文件|
|`-threads`|设置线程数量（具体作用取决于组件）|
|`-loglevel`|设置日志级别|

## 6. 查看音视频信息

查看文件基本信息：

```
ffmpeg -i input.mp4
```

使用 ffprobe 查看详细信息：

```
ffprobe input.mp4
```

查看容器及所有流的信息：

```
ffprobe -v error -show_format -show_streams input.mp4
```

以 JSON 格式输出，适合程序读取：

```
ffprobe -v error -show_format -show_streams -of json input.mp4
```

仅查看第一个视频流的分辨率：

```
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 input.mp4
```

## 7. 格式转换与转码

### 7.1 普通格式转换

```
ffmpeg -i input.avi output.mp4
```

FFmpeg 会根据输出格式选择适用的默认编码器。

### 7.2 无需重新编码的格式转换

```
ffmpeg -i input.mkv -c copy output.mp4
```

前提是输出容器支持所选流的编码格式。

### 7.3 转换为 H.264

```
ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mp4
```

### 7.4 转换为 H.265

```
ffmpeg -i input.mp4 -c:v libx265 -c:a aac output.mp4
```

常见编码标准及对应软件编码器：

|编码标准|FFmpeg 编码器|
|---|---|
|H.264|libx264|
|H.265 / HEVC|libx265|
|AV1|libsvtav1、libaom-av1|
|VP9|libvpx-vp9|
|MP3|libmp3lame|
|AAC|aac|

具体编码器是否可用取决于 FFmpeg 的构建配置。

## 8. 视频压缩

### 8.1 CRF

CRF（Constant Rate Factor）是一种基于质量目标的编码控制方式，编码器根据视频内容动态分配码率。

以 libx264 为例：

|CRF|大致效果|
|---|---|
|0|无损编码|
|18|较高画质|
|23|默认值，质量与体积较均衡|
|28|较高压缩率|
|35|画质损失通常较明显|

CRF 越小，通常画质越高、文件越大。

```
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac -b:a 128k output.mp4
```

不同编码器的 CRF 范围和质量表现不一定相同，不能直接横向比较数值。

### 8.2 Preset

Preset 主要控制编码速度与压缩效率之间的权衡。

libx264 常见预设：

```
ultrafast
superfast
veryfast
faster
fast
medium
slow
slower
veryslow
```

在相近质量目标下，较慢的预设通常能够获得更好的压缩效率，但需要更多计算时间。

```
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset slow output.mp4
```

### 8.3 指定目标码率

```
ffmpeg -i input.mp4 -c:v libx264 -b:v 2M -c:a aac -b:a 128k output.mp4
```

常见码率控制方式：

- CBR：恒定码率，常用于有稳定带宽要求的场景。
    
- VBR：可变码率，根据内容复杂程度分配码率。
    
- CRF：以质量为主要目标，输出文件大小不固定。
    

注意：仅设置 `-b:v` 并不意味着严格的 CBR。

## 9. 视频剪辑与拼接

### 9.1 快速截取视频

从第 10 秒开始截取 20 秒：

```
ffmpeg -ss 00:00:10 -i input.mp4 -t 20 -c copy output.mp4
```

使用流复制时，截取位置可能受到关键帧限制。

### 9.2 精确截取视频

通过重新编码获得更准确的剪辑结果：

```
ffmpeg -ss 00:00:10 -i input.mp4 -t 20 -c:v libx264 -c:a aac output.mp4
```

### 9.3 拼接多个视频

创建 `list.txt`：

```
file 'video1.mp4'
file 'video2.mp4'
file 'video3.mp4'
```

执行：

```
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
```

这种拼接方式要求各文件的流结构、编码参数、时间基等具有兼容性。

如果视频参数不一致，应先统一参数，或使用 concat 滤镜重新编码。

## 10. 视频滤镜

滤镜（Filter）用于对解码后的音视频数据进行处理。

### 10.1 修改分辨率

```
ffmpeg -i input.mp4 -vf "scale=1280:720" output.mp4
```

保持原始宽高比，并将高度调整为偶数：

```
ffmpeg -i input.mp4 -vf "scale=1280:-2" output.mp4
```

### 10.2 修改帧率

```
ffmpeg -i input.mp4 -vf "fps=30" output.mp4
```

普通帧率转换通常通过丢弃或复制帧实现，不等于 AI 补帧。

### 10.3 裁剪视频

```
ffmpeg -i input.mp4 -vf "crop=1280:720:100:50" output.mp4
```

参数结构：

```
crop=宽度:高度:起始X坐标:起始Y坐标
```

### 10.4 旋转与翻转

顺时针旋转 90 度：

```
ffmpeg -i input.mp4 -vf "transpose=1" output.mp4
```

水平翻转：

```
ffmpeg -i input.mp4 -vf "hflip" output.mp4
```

垂直翻转：

```
ffmpeg -i input.mp4 -vf "vflip" output.mp4
```

### 10.5 调节亮度、对比度和饱和度

```
ffmpeg -i input.mp4 -vf "eq=brightness=0.1:contrast=1.2:saturation=1.3" output.mp4
```

### 10.6 添加图片水印

```
ffmpeg -i input.mp4 -i logo.png -filter_complex "[0:v][1:v]overlay=W-w-10:H-h-10" -c:a copy output.mp4
```

其中：

- `W`、`H`：原始视频宽高。
    
- `w`、`h`：水印图片宽高。
    
- `W-w-10:H-h-10`：水印位于右下角，距离边缘 10 像素。
    

### 10.7 多个滤镜组合

使用逗号连接依次执行的滤镜：

```
ffmpeg -i input.mp4 -vf "scale=1280:-2,fps=30,hflip" output.mp4
```

对于多个输入、输出或分支，应使用 `-filter_complex`。

注意：经过视频滤镜处理的视频流通常必须重新编码，不能同时使用 `-c:v copy`。

## 11. 音频处理

### 11.1 提取音频

转换为 MP3：

```
ffmpeg -i input.mp4 -vn -c:a libmp3lame -b:a 192k output.mp3
```

直接提取原始 AAC 音频流：

```
ffmpeg -i input.mp4 -vn -c:a copy output.m4a
```

后一种方式要求原始音频编码与输出容器兼容。

### 11.2 删除视频中的音频

```
ffmpeg -i input.mp4 -an -c:v copy output.mp4
```

### 11.3 替换视频音轨

```
ffmpeg -i video.mp4 -i audio.mp3 -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest output.mp4
```

其中：

- `0:v:0`：第一个输入文件的第一个视频流。
    
- `1:a:0`：第二个输入文件的第一个音频流。
    
- `-shortest`：在较短的输出流结束时停止。
    

### 11.4 调节音量

音量增加至两倍：

```
ffmpeg -i input.mp3 -af "volume=2.0" output.mp3
```

降低 5 dB：

```
ffmpeg -i input.mp3 -af "volume=-5dB" output.mp3
```

### 11.5 音频重采样

```
ffmpeg -i input.wav -ar 16000 -ac 1 -c:a pcm_s16le output.wav
```

参数含义：

- `16000`：采样率为 16 kHz。
    
- `1`：单声道。
    
- `pcm_s16le`：16 位有符号小端序 PCM 编码。
    

这种音频格式常用于语音识别等任务的预处理。

### 11.6 音频降噪

```
ffmpeg -i input.wav -af "afftdn" output.wav
```

### 11.7 响度标准化

```
ffmpeg -i input.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11" output.wav
```

其中 I 是目标综合响度，TP 是真峰值目标，LRA 是响度范围目标。需要更精确的响度控制时，可以使用两遍分析与处理。

## 12. 视频变速

### 12.1 视频加速两倍

```
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" -af "atempo=2.0" output.mp4
```

### 12.2 视频减速至一半

```
ffmpeg -i input.mp4 -vf "setpts=2.0*PTS" -af "atempo=0.5" output.mp4
```

- `setpts`：修改视频帧的显示时间戳。
    
- `atempo`：调整音频播放速度，尽量保持原始音高。
    
- `PTS`：Presentation Timestamp，显示时间戳。
    

音频和视频需要同步调整，否则可能出现音画不同步。

## 13. 图片与 GIF

### 13.1 视频截取单张图片

```
ffmpeg -ss 5 -i input.mp4 -frames:v 1 output.png
```

### 13.2 每秒提取一帧

```
ffmpeg -i input.mp4 -vf "fps=1" frame_%04d.png
```

输出文件：

```
frame_0001.png
frame_0002.png
frame_0003.png
...
```

### 13.3 图片序列生成视频

```
ffmpeg -framerate 30 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4
```

### 13.4 视频转换为 GIF

```
ffmpeg -i input.mp4 -vf "fps=10,scale=480:-1" output.gif
```

### 13.5 高质量 GIF

通过调色板改善颜色表现：

```
ffmpeg -i input.mp4 -vf "fps=10,scale=480:-1:flags=lanczos,palettegen" palette.png
```

```
ffmpeg -i input.mp4 -i palette.png -filter_complex "[0:v]fps=10,scale=480:-1:flags=lanczos[v];[v][1:v]paletteuse" output.gif
```

GIF 颜色数量有限，使用专门生成的调色板通常可以减少颜色失真。

## 14. 字幕处理

### 14.1 添加硬字幕

将字幕直接绘制到视频画面：

```
ffmpeg -i input.mp4 -vf "subtitles=sub.srt" -c:a copy output.mp4
```

硬字幕无法在播放器中关闭，需要重新编码视频。

`subtitles` 滤镜需要 FFmpeg 构建时启用 libass 支持。

### 14.2 添加软字幕

```
ffmpeg -i input.mp4 -i sub.srt -map 0:v -map "0:a?" -map 1:s -c:v copy -c:a copy -c:s mov_text output.mp4
```

软字幕作为独立的数据流存在，可以在支持的播放器中选择开启或关闭。

### 14.3 提取字幕

```
ffmpeg -i input.mkv -map 0:s:0 output.srt
```

适用于可以转换为 SRT 的文本字幕。图片型字幕通常不能直接转换为 SRT。

## 15. 硬件加速

FFmpeg 支持通过 GPU 或专用媒体硬件加速编解码。

常见硬件编码器：

|硬件平台|H.264|H.265|
|---|---|---|
|NVIDIA|h264_nvenc|hevc_nvenc|
|Intel|h264_qsv|hevc_qsv|
|AMD|h264_amf|hevc_amf|
|Apple|h264_videotoolbox|hevc_videotoolbox|

### NVIDIA GPU 编码

```
ffmpeg -i input.mp4 -c:v h264_nvenc -c:a aac output.mp4
```

### NVIDIA GPU 解码和编码

```
ffmpeg -hwaccel cuda -hwaccel_output_format cuda -i input.mp4 -c:v h264_nvenc -c:a copy output.mp4
```

查看编码器支持的参数：

```
ffmpeg -h encoder=h264_nvenc
```

需要注意：

- 硬件编码通常具有较高的编码速度。
    
- 软件编码在部分场景下具有更好的压缩效率。
    
- 硬件加速不一定能提高所有滤镜的处理速度。
    
- 硬件加速是否可用取决于 GPU、驱动和 FFmpeg 构建配置。
    
- 不同编码器支持的参数并不完全相同，例如不能直接把 libx264 的 CRF 参数套用到所有硬件编码器。
    

## 16. 自动化处理

### 16.1 PowerShell 批量压缩视频

```
New-Item -ItemType Directory -Force output

Get-ChildItem -File -Filter *.mp4 | ForEach-Object {
    ffmpeg -n -i $_.FullName -c:v libx264 -crf 23 -preset medium -c:a aac "output/$($_.Name)"
}
```

### 16.2 Python 调用 FFmpeg

Python 可以通过 subprocess 模块调用 FFmpeg：

```
import subprocess

command = [
    "ffmpeg",
    "-n",
    "-i", "input.mp4",
    "-c:v", "libx264",
    "-crf", "23",
    "-c:a", "aac",
    "output.mp4"
]

subprocess.run(command, check=True)
```

使用参数列表可以减少命令转义问题。

`check=True` 表示当 FFmpeg 返回非零退出状态时，Python 会抛出异常。

### 16.3 Python 获取视频信息

```
import subprocess
import json

result = subprocess.run(
    [
        "ffprobe",
        "-v", "error",
        "-show_format",
        "-show_streams",
        "-of", "json",
        "input.mp4"
    ],
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True
)

data = json.loads(result.stdout)

print(data)
```

## 17. 常见问题

|问题|可能原因及解决方法|
|---|---|
|Unknown encoder|当前 FFmpeg 构建不包含该编码器，使用 `-encoders` 检查|
|No such file or directory|文件路径错误，带空格的路径需要引号|
|Width not divisible by 2|部分编码器或像素格式要求偶数宽高，可使用 `scale=1280:-2`|
|Invalid argument|参数错误或编码器、容器不兼容|
|视频无法播放|编码格式、像素格式或容器不受播放器支持|
|视频剪辑不准确|流复制受到关键帧限制，可以尝试重新编码|
|音画不同步|检查时间戳、变速参数和帧率转换|
|视频文件反而变大|输出码率或质量目标高于原始视频|
|滤镜与 copy 冲突|使用滤镜的流必须重新编码|
|硬件编码失败|检查硬件支持、驱动及编码器配置|

为提高一般设备上的 H.264 视频兼容性，可使用：

```
ffmpeg -i input.mp4 -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart output.mp4
```

`-movflags +faststart` 将 MP4 的关键索引元数据移至文件前部，有利于网络渐进式播放。

## 18. 核心知识总结

学习 FFmpeg 不需要记住所有命令，重点在于理解以下知识：

1. 容器和编解码器之间的区别。
    
2. 解封装、解码、滤镜、编码和封装的完整流程。
    
3. 什么时候可以使用 `-c copy`，什么时候需要重新编码。
    
4. 码率、分辨率、帧率与文件大小之间的关系。
    
5. CRF 和 Preset 对画质、速度及压缩效率的影响。
    
6. 如何通过 `-map` 选择不同的音视频流。
    
7. 如何通过滤镜组合实现复杂的音视频处理。
    
8. 如何使用 ffprobe 获取结构化的媒体信息。
    
9. 如何结合 Python 和 Shell 实现自动化处理。
    

遇到不熟悉的编码器、滤镜或参数时，可以直接查询帮助：

```
ffmpeg -h
ffmpeg -h full
ffmpeg -h encoder=libx264
ffmpeg -h filter=scale
ffmpeg -h muxer=mp4
```

## 19. 参考资料

- [FFmpeg 官方网站](https://ffmpeg.org/)
    
- [FFmpeg 官方命令文档](https://ffmpeg.org/ffmpeg.html)
    
- [FFmpeg 滤镜文档](https://ffmpeg.org/ffmpeg-filters.html)
    
- [FFmpeg 编解码器文档](https://ffmpeg.org/ffmpeg-codecs.html)
    
- [FFmpeg 容器格式文档](https://ffmpeg.org/ffmpeg-formats.html)
    
- [FFprobe 官方文档](https://ffmpeg.org/ffprobe.html)
    
- [FFmpeg GitHub 仓库](https://github.com/FFmpeg/FFmpeg)