from pathlib import Path
from PIL import Image
import shutil,json,zipfile
root=Path('Asset/Skateaway'); dest=Path('public/assets'); mapping={}
for p in sorted(root.rglob('*.png')):
 if p.parent.name=='Buildings': key='building'+p.name[0]
 elif p.parent.name=='弹窗': key={'popup_pause_popup.png.png':'panel-pause','popup_setting_popup.png.png':'panel-settings','popup_ranking_popup.png.png':'panel-ranking'}.get(p.name,p.stem)
 elif p.parent.name=='障碍物:道具:建筑装饰':
  key={'金币':'coin','能量石':'gem','不可站障碍物-路障':'cone','不可站障碍物-纸箱':'box','不可站障碍物-香蕉皮':'banana','不可站障碍物-小心路滑':'warning','不可站障碍物-地面裂缝':'crack','可站障碍物1':'sign-cyber','可站障碍物2':'sign-neon','可站障碍物3':'aircon','广告牌1':'hotel','广告牌2':'deep-earth','广告牌3':'yidd','火箭':'rocket'}[p.stem]
 else: key={'Gamestartbg':'menu','bg_sky':'sky','bg_buildings_far':'skyline','gameover_title.png':'gameover','gameover_second_title.png':'continue-title','start_best_panel.':'ranking'}.get(p.stem,p.stem)
 shutil.copyfile(p,dest/(key+'.png')); mapping[key]=str(p)
p=Path('Asset/音乐资源/Cyan Kickflip.mp3');shutil.copyfile(p,dest/'music.mp3');mapping['music']=str(p)
Path('public/assets/map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2))
rows=['# Asset manifest','', 'Original sources and Asset.zip remain unchanged. All 44 PNGs were visually reviewed in a contact sheet; no sprite sheets or independent transparent character/animation frames exist. Menu artwork includes a flattened character and title, used only as menu decoration. Gameplay uses a labeled procedural temporary skater, never cropped from the menu. All image assets are single frames. Runtime copies retain source aspect ratios. Phaser scales large backgrounds to fit height; buildings use uniform scales with a supplemental neon collision ledge. No original art is edited.','', 'Cyan Kickflip is the selected looping supplied soundtrack. Other two tracks remain unused. Jump/coin/landing/death SFX are synthesized, not supplied recordings. Revive artwork includes a baked-in ad badge and 300 cost, so is deliberately unused. Revives are deferred. Panels are decorative with real interactive controls and live values.','', '| Source | Runtime | Dimensions | Alpha range | RGBA memory MiB |','|---|---|---|---|---|']
for k,s in mapping.items():
 p=Path(s)
 if p.suffix=='.png':
  im=Image.open(p); w,h=im.size; rows.append(f'| `{s}` | `{k}.png` | {w}×{h} | {im.getchannel("A").getextrema()} | {w*h*4/1048576:.2f} |')
 else: rows.append(f'| `{s}` | music.mp3 | MP3 | — | — |')
for p in Path('Asset/音乐资源').glob('*.mp3'):
 if str(p)!=mapping['music']: rows.append(f'| `{p}` | unused | MP3 | — | — |')
rows+=['','## Archive inventory','Extracted Asset directory was inspected first. Archive was listed without extracting or overwriting. macOS metadata excluded from runtime. Legacy ZIP names are decoded from CP437 to UTF-8 where possible.','', '| Entry | Bytes |','|---|---|']
for i in zipfile.ZipFile('Asset.zip').infolist():
 n=i.filename
 if not i.flag_bits&0x800:
  try:n=n.encode('cp437').decode('utf8')
  except UnicodeError:pass
 rows.append(f'| `{n}` | {i.file_size} |')
Path('docs/ASSET_MANIFEST.md').write_text('\n'.join(rows))
