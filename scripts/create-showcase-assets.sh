#!/usr/bin/env bash
set -euo pipefail

repoquest_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
images_dir="$repoquest_root/docs/images"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

font_regular="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
font_bold="/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

prepare_scene() {
  local input="$1"
  local output="$2"
  local eyebrow="$3"
  local title="$4"

  convert "$input" \
    -resize '960x540^' -gravity center -extent 960x540 \
    \( -size 960x540 xc:'#071f19' -alpha set -channel A -evaluate set 26% \) -compose over -composite \
    -fill '#102f27' -stroke '#fff1bd' -strokewidth 4 -draw 'roundrectangle 38,30 922,126 10,10' \
    -stroke none -fill '#f5d372' -font "$font_bold" -pointsize 17 -gravity northwest -annotate +54+46 "$eyebrow" \
    -fill '#fff5cf' -font "$font_bold" -pointsize 42 -gravity northwest -annotate +54+77 "$title" \
    "$output"
}

prepare_scene "$images_dir/desktop-home.jpg" "$temp_dir/scene-1.png" '01 · START A QUEST' 'Explore code as a world'
prepare_scene "$images_dir/desktop-map.jpg" "$temp_dir/scene-2.png" '02 · WALK THE MAP' 'Folders become districts'
prepare_scene "$images_dir/source-preview.jpg" "$temp_dir/scene-3.png" '03 · READ THE STORY' 'Preview source in place'

ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -t 7 -i "$temp_dir/scene-1.png" \
  -loop 1 -t 7 -i "$temp_dir/scene-2.png" \
  -loop 1 -t 8 -i "$temp_dir/scene-3.png" \
  -filter_complex "[0:v]fps=8,format=rgba[s0];[1:v]fps=8,format=rgba[s1];[2:v]fps=8,format=rgba[s2];[s0][s1]xfade=transition=fade:duration=1:offset=6[x1];[x1][s2]xfade=transition=fade:duration=1:offset=12,split[p0][p1];[p0]palettegen=max_colors=128:stats_mode=diff[pal];[p1][pal]paletteuse=dither=bayer:bayer_scale=4" \
  -t 20 "$images_dir/demo.gif"

convert "$repoquest_root/src/assets/generated/repoquest-valley-hero.webp" \
  -resize '1280x640^' -gravity center -extent 1280x640 \
  \( -size 1280x640 gradient:'#102f27-#071813' -alpha set -channel A -evaluate set 74% \) -compose over -composite \
  \( "$images_dir/desktop-map.jpg" -resize '590x400^' -gravity center -extent 590x400 -bordercolor '#fff1bd' -border 5 \) \
  -gravity east -geometry +64+0 -compose over -composite \
  -fill '#f5d372' -font "$font_bold" -pointsize 22 -gravity northwest -annotate +70+104 'A GITHUB ADVENTURE' \
  -fill '#fff5cf' -font "$font_bold" -pointsize 72 -gravity northwest -annotate +66+155 'RepoQuest' \
  -fill '#f4d169' -font "$font_bold" -pointsize 36 -gravity northwest -annotate +70+250 'Explore code.' \
  -fill '#fff5cf' -font "$font_bold" -pointsize 36 -gravity northwest -annotate +70+300 'Find the story.' \
  -fill '#f2e7c8' -font "$font_regular" -pointsize 21 -gravity northwest -annotate +70+385 'Turn any public GitHub repository' \
  -annotate +70+420 'into an explorable pixel world.' \
  -fill '#071f19' -stroke '#fff1bd' -strokewidth 4 -draw 'roundrectangle 70,496 430,558 8,8' \
  -stroke none -fill '#fff1bd' -font "$font_bold" -pointsize 19 -gravity northwest -annotate +94+518 'haotian14.github.io/RepoQuest' \
  "$images_dir/social-preview.png"

identify "$images_dir/demo.gif" "$images_dir/social-preview.png"
