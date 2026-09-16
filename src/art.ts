import grassFlower from './assets/kenney/tiny-town/tile_0002.png'
import pineTree from './assets/kenney/tiny-town/tile_0004.png'
import roundTree from './assets/kenney/tiny-town/tile_0005.png'
import fruitTree from './assets/kenney/tiny-town/tile_0016.png'
import mushrooms from './assets/kenney/tiny-town/tile_0029.png'

import roofBlueLeft from './assets/kenney/tiny-town/tile_0048.png'
import roofBlueMiddle from './assets/kenney/tiny-town/tile_0049.png'
import roofBlueRight from './assets/kenney/tiny-town/tile_0050.png'
import roofRedLeft from './assets/kenney/tiny-town/tile_0052.png'
import roofRedMiddle from './assets/kenney/tiny-town/tile_0053.png'
import roofRedRight from './assets/kenney/tiny-town/tile_0054.png'
import roofBlueLowerLeft from './assets/kenney/tiny-town/tile_0060.png'
import roofBlueLowerMiddle from './assets/kenney/tiny-town/tile_0061.png'
import roofBlueLowerRight from './assets/kenney/tiny-town/tile_0062.png'
import roofRedLowerLeft from './assets/kenney/tiny-town/tile_0064.png'
import roofRedLowerMiddle from './assets/kenney/tiny-town/tile_0065.png'
import roofRedLowerRight from './assets/kenney/tiny-town/tile_0066.png'
import wallBrownLeft from './assets/kenney/tiny-town/tile_0072.png'
import wallBrownMiddle from './assets/kenney/tiny-town/tile_0073.png'
import wallBrownDoor from './assets/kenney/tiny-town/tile_0074.png'
import wallBrownRight from './assets/kenney/tiny-town/tile_0075.png'
import wallBlueLeft from './assets/kenney/tiny-town/tile_0076.png'
import wallBlueMiddle from './assets/kenney/tiny-town/tile_0077.png'
import wallBlueDoor from './assets/kenney/tiny-town/tile_0078.png'
import wallBlueRight from './assets/kenney/tiny-town/tile_0079.png'

import cropLeaf from './assets/kenney/tiny-farm/tile_0029.png'
import cropCorn from './assets/kenney/tiny-farm/tile_0030.png'
import cropRoots from './assets/kenney/tiny-farm/tile_0031.png'
import cropWheat from './assets/kenney/tiny-farm/tile_0032.png'
import cropTomatoes from './assets/kenney/tiny-farm/tile_0039.png'
import cropCabbage from './assets/kenney/tiny-farm/tile_0044.png'
import player from './assets/kenney/tiny-farm/tile_0108.png'
import sheep from './assets/kenney/tiny-farm/tile_0120.png'
import rabbit from './assets/kenney/tiny-farm/tile_0121.png'
import chicken from './assets/kenney/tiny-farm/tile_0122.png'

export const buildingSprites = [
  [
    roofBlueLeft, roofBlueMiddle, roofBlueMiddle, roofBlueRight,
    roofBlueLowerLeft, roofBlueLowerMiddle, roofBlueLowerMiddle, roofBlueLowerRight,
    wallBlueLeft, wallBlueMiddle, wallBlueDoor, wallBlueRight,
  ],
  [
    roofRedLeft, roofRedMiddle, roofRedMiddle, roofRedRight,
    roofRedLowerLeft, roofRedLowerMiddle, roofRedLowerMiddle, roofRedLowerRight,
    wallBrownLeft, wallBrownMiddle, wallBrownDoor, wallBrownRight,
  ],
]

export const scenery = {
  trees: [roundTree, pineTree, fruitTree],
  flower: grassFlower,
  mushrooms,
  crops: [cropLeaf, cropCorn, cropRoots, cropWheat, cropTomatoes, cropCabbage],
  animals: [sheep, rabbit, chicken],
  player,
}
