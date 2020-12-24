import { Loader } from 'pixi.js';
import { mouse } from './input-mouse';
import { Interactive } from './Interactive';
import { lerp } from './utils';

export class Draggable extends Interactive {
	drag() {
		this.selected = true;
		this.v.x += (mouse.pos.x - this.spr.x - Draggable.offset.x) / 4;
		this.v.y += (mouse.pos.y - this.spr.y - Draggable.offset.y) / 4;
		this.v.a += (mouse.mouseWheel / Math.PI) * 0.1;
		this.selectAnim = lerp(this.selectAnim, 0.9, 0.1);
	}
	static dragging: Draggable = null;
	static target: Draggable = null;
	static offset = { x: 0, y: 0 };

	update(time) {
		super.update(time);
		if (Interactive.selected === this) {
			this.drag();
		}
	}

	onClick() {
		Interactive.selected = this;
		Interactive.interactives.splice(
			Interactive.interactives.findIndex(i => i === Interactive.target),
			1
		);
		Interactive.interactives.unshift(Interactive.target);
		Interactive.selected.spr.parent.addChildAt(Interactive.selected.spr, Interactive.selected.spr.parent.children.length);
		Draggable.offset.x = mouse.pos.x - Interactive.selected.spr.x;
		Draggable.offset.y = mouse.pos.y - Interactive.selected.spr.y;
		Loader.shared.resources.pickup.data.play();
	}

	onRelease() {
		Loader.shared.resources.drop.data.play();
		Interactive.selected.selected = false;
		Interactive.selected = null;
	}
}
