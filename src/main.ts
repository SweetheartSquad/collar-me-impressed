import { Howl } from 'howler';
import { autoDetectRenderer, Container, Loader, Renderer, Sprite, Ticker } from 'pixi.js';
import { Draggable } from './Draggable';
import { mouse } from './input-mouse';
import { Interactive } from './Interactive';
import { resizer } from './loader';
import { size } from './size';

export const stage = new Container();
window.stage = stage;
let mouseSpr: Draggable & {
	up: Sprite;
	over: Sprite;
	down: Sprite;
	selectAnim: number;
};
let renderer: Renderer;
const btns: Interactive[] = [];
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

	mouseSpr = {
		spr: new Container(),
		up: new Sprite(Loader.shared.resources.mouse_up.texture),
		over: new Sprite(Loader.shared.resources.mouse_over.texture),
		down: new Sprite(Loader.shared.resources.mouse_down.texture),
		update: Draggable.prototype.update,
		drag: Draggable.prototype.drag,
		v: { x: 0, y: 0, a: 0 },
		selectAnim: -1,
		id: 0,
		selected: false,
		underMouse: () => false,
	};
	mouseSpr.spr.addChild(mouseSpr.up);
	mouseSpr.spr.addChild(mouseSpr.over);
	mouseSpr.spr.addChild(mouseSpr.down);

	mouseSpr.up.anchor.x = mouseSpr.up.anchor.y = mouseSpr.down.anchor.x = mouseSpr.down.anchor.y = mouseSpr.over.anchor.x = mouseSpr.over.anchor.y = 0.5;

	const config = Loader.shared.resources.config.data;

	// make layers
	const layers: Record<string, Container> = config.types.reduce((result, type) => {
		const t = new Container();
		t.x = (type.x || 0) * size.x;
		t.y = (type.y || 0) * size.y;
		result[type.label] = t;
		t.config = type;
		stage.addChild(t);
		return result;
	}, {});

	// fill out layers
	config.sprites.forEach(sprite => {
		const layer = layers[sprite.label];
		if (layer.config.type === 'drag-and-drop') {
			const s = new Interactive(sprite);
			layer.addChild(s.spr);
			s.onClick = () => {
				const d = new Draggable(sprite);
				layer.addChild(d.spr);
				d.onClick();
			};
			btns.push(s);
		} else {
			const s = new Sprite(Loader.shared.resources[sprite.spr].texture);
			s.x = sprite.x || 0;
			s.y = sprite.y || 0;
			s.anchor.x = s.anchor.y = 0.5;
			layer.addChild(s);
		}
	});

	// setup cycling layers
	Object.values(layers)
		.filter(layer => layer.config.type === 'cycle')
		.forEach(layer => {
			layer.active = 0;
			layer.children.forEach(i => {
				i.visible = false;
			});
			layer.children[0].visible = true;

			const next = new Interactive({
				spr: 'arrow',
				x: layer.config.x + layer.config.arrowX + layer.config.arrowGap / 2,
				y: layer.config.y + layer.config.arrowY,
			});
			const prev = new Interactive({
				spr: 'arrow_flipped',
				x: layer.config.x + layer.config.arrowX - layer.config.arrowGap / 2,
				y: layer.config.y + layer.config.arrowY,
			});
			stage.addChild(next.spr);
			stage.addChild(prev.spr);
			next.onClick = () => {
				Loader.shared.resources.btn.data.play();
				next.selectAnim = 1.0;
				layer.children[layer.active].visible = false;
				layer.active += 1;
				layer.active %= layer.children.length;
				layer.children[layer.active].visible = true;
			};
			prev.onClick = () => {
				Loader.shared.resources.btn.data.play();
				prev.selectAnim = 1.0;
				layer.children[layer.active].visible = false;
				layer.active -= 1;
				if (layer.active < 0) {
					layer.active += layer.children.length;
				}
				layer.children[layer.active].visible = true;
			};
			btns.push(next, prev);
		});

	// save btn
	const save = new Interactive({
		spr: 'save',
		x: 0.9,
		y: 0.9,
	});
	save.onClick = () => {
		Loader.shared.resources.btn.data.play();
		save.selectAnim = 1.0;
		saveImage();
	};
	btns.push(save);

	stage.addChild(save.spr);

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
	Draggable.updateAll(Ticker.shared.lastTime);

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
	mouseSpr.v.a = 0;

	mouseSpr.update(Ticker.shared.lastTime);

	mouseSpr.spr.x = mouse.pos.x;
	mouseSpr.spr.y = mouse.pos.y;

	// update input managers
	mouse.update();
}

function render() {
	renderer.render(stage, null, true);
}

function saveImage() {
	btns.forEach(i => (i.spr.visible = false));
	mouseSpr.spr.visible = false;
	renderer.preserveDrawingBuffer = true;
	render();
	mouseSpr.spr.visible = true;
	renderer.preserveDrawingBuffer = false;
	const url = renderer.view.toDataURL();
	btns.forEach(i => (i.spr.visible = true));
	var a = document.createElement('a');
	document.body.append(a);
	a.download = 'my cat';
	a.href = url;
	a.click();
	a.remove();
}
