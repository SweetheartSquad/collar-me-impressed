import { Howl } from 'howler';
import { autoDetectRenderer, BaseRenderTexture, Container, DisplayObject, Filter, Loader, Rectangle, Renderer, RenderTexture, Sprite, Ticker } from 'pixi.js';
import { Button } from './Button';
import { Config } from './Config';
import { mouse } from './input-mouse';
import { Interactive } from './Interactive';
import { ItemAnimated } from './ItemAnimated';
import { ItemDraggable } from './ItemDraggable';
import { ItemStatic } from './ItemStatic';
import { Layer } from './Layer';
import { resizer } from './loader';
import { size } from './size';
import { clamp } from './utils';

export const stage = new Container();
stage.filters = [];
let mouseSpr: ItemDraggable & {
	up: Sprite;
	over: Sprite;
	down: Sprite;
	selectAnim: number;
};
let renderer: Renderer;
const hideOnSave: DisplayObject[] = [];

function setFilter(index, fragment: string, uniforms: any) {
	const filter = new Filter(undefined, Loader.shared.resources[fragment].data, uniforms);
	filter.padding = 0;
	stage.filters.splice(index, 1, filter);
}

export function init() {
	// create window.renderer
	renderer = autoDetectRenderer({
		width: size.x,
		height: size.y,
		antialias: false,
		transparent: false,
		resolution: 1,
		clearBeforeRender: true,
	});

	renderer.backgroundColor = 0;

	// add the canvas to the html document
	resizer.appendChild(renderer.view);

	// setup game
	// initialize input managers
	mouse.init(renderer.view);

	// save on ctrl+s
	document.addEventListener('keydown', function (event) {
		if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
			saveImage();
			event.preventDefault();
			event.stopPropagation();
		}
	});

	mouseSpr = {
		spr: new Container(),
		up: new Sprite(Loader.shared.resources.mouse_up.texture),
		over: new Sprite(Loader.shared.resources.mouse_over.texture),
		down: new Sprite(Loader.shared.resources.mouse_down.texture),
		update: ItemDraggable.prototype.update,
		drag: ItemDraggable.prototype.drag,
		v: { x: 0, y: 0 },
		angle: 0,
		selectAnim: -1,
		scale: 1,
		id: 0,
		selected: false,
		underMouse: () => false,
	};
	mouseSpr.spr.addChild(mouseSpr.up);
	mouseSpr.spr.addChild(mouseSpr.over);
	mouseSpr.spr.addChild(mouseSpr.down);
	hideOnSave.push(mouseSpr.spr);

	mouseSpr.up.anchor.x = mouseSpr.up.anchor.y = mouseSpr.down.anchor.x = mouseSpr.down.anchor.y = mouseSpr.over.anchor.x = mouseSpr.over.anchor.y = 0.5;

	const config = Loader.shared.resources.config.data as Config;
	const ui = new Container();

	// make layers
	const layers: Record<string, Layer> = Object.entries(config.layers).reduce((result, [key, layerConfig]) => {
		const layer = new Layer(layerConfig);

		if (layerConfig.type === 'static') {
			layerConfig.data.items.forEach(itemConfig => {
				const item = new ItemStatic(itemConfig);
				layer.addChild(item.spr);
			});
			if (layerConfig.data.ui) {
				hideOnSave.push(layer);
			}
		} else if (layerConfig.type === 'animated') {
			const item = new ItemAnimated(
				layerConfig.data.items.map(i => i.spr),
				layerConfig.data.speed
			);
			layer.addChild(item.spr);
			if (layerConfig.data.ui) {
				hideOnSave.push(layer);
			}
		} else if (layerConfig.type === 'drag-and-drop') {
			layerConfig.data.items.forEach(itemConfig => {
				if (itemConfig.unique) {
					const item = new ItemDraggable(itemConfig);
					item.disposable = false;
					layer.addChild(item.spr);
				} else {
					const item = new Interactive(itemConfig);
					layer.addChild(item.spr);
					item.addListener('click', () => {
						const d = new ItemDraggable(itemConfig);
						layer.addChild(d.spr);
						d.onClick();
					});
					hideOnSave.push(item.spr);
				}
			});
		} else if (layerConfig.type === 'cycle') {
			layerConfig.data.items.forEach(itemConfig => {
				const item = new ItemStatic(itemConfig);
				item.spr.visible = false;
				layer.addChild(item.spr);
			});
			layer.children[0].visible = true;

			function onNext() {
				layer.children[layer.active].visible = false;
				layer.active += 1;
				layer.active %= layer.children.length;
				layer.children[layer.active].visible = true;
			}
			function onPrev() {
				layer.children[layer.active].visible = false;
				layer.active -= 1;
				if (layer.active < 0) {
					layer.active += layer.children.length;
				}
				layer.children[layer.active].visible = true;
			}

			const next = new Button(onNext, {
				spr: 'arrow',
				x: layerConfig.x + layerConfig.data.arrowX + layerConfig.data.arrowGap / 2,
				y: layerConfig.y + layerConfig.data.arrowY,
			});
			const prev = new Button(onPrev, {
				spr: 'arrow_flipped',
				x: layerConfig.x + layerConfig.data.arrowX - layerConfig.data.arrowGap / 2,
				y: layerConfig.y + layerConfig.data.arrowY,
			});
			ui.addChild(next.spr);
			ui.addChild(prev.spr);
			hideOnSave.push(next.spr, prev.spr);
		} else if (layerConfig.type === 'filter') {
			const idx = stage.filters.length;
			stage.filters.push(null);
			const filters = layerConfig.data.shaders;
			function onNext() {
				layer.active += 1;
				layer.active %= filters.length;
				setFilter(idx, filters[layer.active].fragment, filters[layer.active].uniforms);
			}
			function onPrev() {
				layer.active -= 1;
				if (layer.active < 0) {
					layer.active += filters.length;
				}
				setFilter(idx, filters[layer.active].fragment, filters[layer.active].uniforms);
			}
			setFilter(idx, filters[0].fragment, filters[0].uniforms);

			const next = new Button(onNext, {
				spr: 'arrow',
				x: layerConfig.x + layerConfig.data.arrowX + layerConfig.data.arrowGap / 2,
				y: layerConfig.y + layerConfig.data.arrowY,
			});
			const prev = new Button(onPrev, {
				spr: 'arrow_flipped',
				x: layerConfig.x + layerConfig.data.arrowX - layerConfig.data.arrowGap / 2,
				y: layerConfig.y + layerConfig.data.arrowY,
			});
			ui.addChild(next.spr);
			ui.addChild(prev.spr);
			hideOnSave.push(next.spr, prev.spr);
		}

		result[key] = layer;
		stage.addChild(layer);
		return result;
	}, {});

	// save btn
	const save = new Button(saveImage, {
		spr: 'save',
		x: 0.95,
		y: 0.95,
	});
	save.spr.anchor.x = save.spr.anchor.y = 1.0;
	hideOnSave.push(save.spr);

	ui.addChild(save.spr);
	stage.addChild(ui);

	stage.addChild(mouseSpr.spr);

	// start the main loop
	Ticker.shared.add(main);
	const bgm = Loader.shared.resources.bgm.data as Howl;
	bgm.loop(true);
	const bgmId = bgm.play();
	bgm.fade(0, 1, 2000, bgmId);
}

function main() {
	update();
	render();
}

function update() {
	// game update
	ItemDraggable.updateAll(Ticker.shared.lastTime);

	mouseSpr.selected = false;
	mouseSpr.up.visible = false;
	mouseSpr.over.visible = false;
	mouseSpr.down.visible = false;
	if (mouse.isDown() && Interactive.target) {
		mouseSpr.drag();
		mouseSpr.down.visible = true;
	} else {
		if (Interactive.target) {
			mouseSpr.over.visible = true;
		} else {
			mouseSpr.up.visible = true;
		}
	}

	mouseSpr.v.x = mouse.pos.x - mouseSpr.spr.x;
	mouseSpr.v.y = mouse.pos.y - mouseSpr.spr.y;
	mouseSpr.angle = 0;

	mouseSpr.update(Ticker.shared.lastTime);

	mouseSpr.spr.x = mouse.pos.x;
	mouseSpr.spr.y = mouse.pos.y;

	// update input managers
	mouse.update();
	stage.filters.forEach(filter => {
		filter.uniforms.time = Ticker.shared.lastTime;
		filter.uniforms.mouse = [mouse.pos.x / size.x, mouse.pos.y / size.y];
	});
}

function render() {
	renderer.render(stage, null, true);
}

function saveImage() {
	const config = Loader.shared.resources.config.data as Config;
	let { x, y, w, h } = config.crop || {};
	x = clamp(0, x || 0, 1);
	y = clamp(0, y || 0, 1);
	w = clamp(0, w || 1, 1 - x);
	h = clamp(0, h || 1, 1 - y);
	hideOnSave.forEach(i => {
		i.visible = false;
	});
	const t = new RenderTexture(
		new BaseRenderTexture({ width: size.x, height: size.y }),
		new Rectangle(
			0,
			0,
			w * size.x,
			h * size.y
		)
	);

	const m = new PIXI.Matrix();
	m.translate(x * -size.x, y * -size.y);
	renderer.render(stage, t, true, m, true);
	hideOnSave.forEach(i => {
		i.visible = true;
	});
	const url = renderer.extract.canvas(t).toDataURL();
	const a = document.createElement('a');
	document.body.append(a);
	a.download = 'my cat';
	a.href = url;
	a.click();
	a.remove();
}

// for debugging
// @ts-ignore
if (!window.stage) {
	// @ts-ignore
	window.stage = stage;
}
