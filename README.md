# Collar Me Impressed

## Setup

```sh
npm i
```

## Development

```sh
npm start
```

## Build

```sh
npm run build
```

## Data format

Source assets are placed in `/assets`, and include:

- `/audio/bgm.mp3`: looping background music
- `/audio/btn.mp3`: sound effect played when buttons are pressed
- `/audio/drop.mp3`: sound effect played when draggable item is dropped
- `/audio/pickup.mp3`: sound effect played when draggable item is picked up
- `/img/mouse/mouse_down.png`: texture for mouse when pressed down
- `/img/mouse/mouse_over.png`: texture for mouse when hovering over UI
- `/img/mouse/mouse_up.png`: texture for mouse in normal state
- `/img/arrow.png`: texture for cycle layer "next" arrow
- `/img/arrow_flipped.png`: texture for cycle layer "previous" arrow
- `/img/save.png`: texture for save button
- `/img/*.png`: any other textures referenced in `config.json`

### `config.json`

```jsonc
{
	// resolution in pixels
	"size": {
		"x": 720,
		"y": 480
	},
	// scale mode (one of either "fit", "cover", "multiples", or "none")
	"scaleMode": "cover",
	// all layers and items have optional `x` and `y` attributes,
	// which set their position (as an offset from their parent)
	// they default to zero if not provided
	// they also have `scale`, which defaults to one
	"layers": {
		"static-example": {
			// static layers will simply render all items,
			// and offer no interaction
			// these can be used to create persistent decorative elements
			"type": "static",
			"x": 0.5,
			"y": 0.5,
			"data": {
				"items": [{
					"spr": "texture-name",
					"x": 0,
					"y": 0
				}]
			}
		},
		"animated-example": {
			// animated layers will automatically loop through each item as a frame of animation
			// and offer no interaction
			// these can be used to create persistent decorative elements
			"type": "static",
			"x": 0.5,
			"y": 0.5,
			"data": {
				"speed": 1,
				"items": [{
					"spr": "texture-name"
				}, {
					"spr": "texture-name"
				}]
			}
		},
		"cycle-example": {
			// cycle layers will render a single item,
			// along with next/previous arrows which cycle through the rest
			"type": "cycle",
			"x": 0.5,
			"y": 0.5,
			"data": {
				"arrowX": 0,
				"arrowY": 0,
				"arrowGap": 0.5,
				"items": [{
					"spr": "texture-name"
				}, {
					"spr": "texture-name"
				}]
			}
		},
		"drag-example": {
			// drag-and-drop layers will render all items,
			// each of which will create a draggable copy when selected
			// if an item has the `unique` flag,
			// it will be draggable itself instead of creating copies
			"type": "drag-and-drop",
			"data": {
				"arrowX": 0.1,
				"arrowY": 0.2,
				"arrowGap": 0.5,
				"items": [{
					"spr": "texture-name",
					"x": 0.1,
					"y": 0.0
				}, {
					"spr": "texture-name",
					"x": 0.2,
					"y": 0.0,
					"unique": true
				}]
			}
		}
	}
}
```
