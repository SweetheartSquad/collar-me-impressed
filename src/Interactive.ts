import { EventEmitter } from "eventemitter3";
import { Container, Sprite, Texture } from 'pixi.js';
import { mouse } from './input-mouse';
import { size } from './size';
import { lerp } from './utils';

export class Interactive extends EventEmitter<'click' | 'release', never> {
	spr: Container;
	v = { x: 0, y: 0 };
	angle = 0;
	selectAnim = -1;
	id: number;
	selected = false;
	constructor({ spr, x, y }: { spr: string; x: number; y: number }) {
		super();
		const sprite = new Sprite(Texture.from(spr));
		sprite.anchor.x = sprite.anchor.y = 0.5;
		this.spr = sprite;
		this.spr.x = (x || 0) * size.x;
		this.spr.y = (y || 0) * size.y;

		Interactive.interactives.push(this);
		this.id = Interactive.interactives.length;
	}

	update(time: number) {
		this.spr.x += this.v.x;
		this.spr.y += this.v.y;
		this.spr.angle = lerp(this.spr.angle, this.angle, 0.1);

		if (this.selected) {
			this.v.x = lerp(this.v.x, 0, 0.5);
			this.v.y = lerp(this.v.y, 0, 0.5);
		} else {
			this.v.x = lerp(this.v.x, 0, 0.1);
			this.v.y = lerp(this.v.y, 0, 0.1);
		}

		this.spr.scale.x = lerp(this.spr.scale.x, 1 + Math.sin(time / 50 + this.id) * 0.3 * (1 - Math.abs(this.selectAnim)), 0.5);
		this.spr.scale.y = lerp(this.spr.scale.y, 1 + Math.cos(time / 50 + this.id) * 0.3 * (1 - Math.abs(this.selectAnim)), 0.5);

		this.spr.skew.x = lerp(this.spr.skew.x, this.v.x / 40, 0.1);
		this.spr.skew.y = lerp(this.spr.skew.y, this.v.y / 40, 0.1);

		if (!this.selected) {
			this.selectAnim = lerp(this.selectAnim, -1, 0.2);
		}
	}

	underMouse() {
		const bounds = this.spr.getBounds(true);
		return bounds.contains(mouse.pos.x, mouse.pos.y);
	}

	static selected: Interactive = null;
	static target: Interactive = null;
	static interactives: Interactive[] = [];

	static updateAll(time: number) {
		for (var i = Interactive.interactives.length - 1; i >= 0; --i) {
			var d = Interactive.interactives[i];
			d.update(time);
			if (d.spr.x < 0) {
				d.v.x -= 1;
			}
			if (d.spr.x > size.x) {
				d.v.x += 1;
			}
			if (d.spr.y < 0) {
				d.v.y -= 1;
			}
			if (d.spr.y > size.y) {
				d.v.y += 1;
			}
			if (d.spr.x < -size.x || d.spr.x > size.x * 2 || d.spr.y < -size.y || d.spr.y > size.y * 2) {
				d.spr.destroy();
				this.interactives.splice(
					this.interactives.findIndex(i => i === d),
					1
				);
			}
		}

		if (Interactive.target) {
			Interactive.target.spr.tint = 0xffffff;
		}
		if (!Interactive.selected) {
			// find target
			Interactive.target = Interactive.interactives.find(i => i.underMouse());
			if (Interactive.target) {
				Interactive.target.spr.tint = 0x666666;
			}

			// start dragging target
			if (mouse.isJustDown() && Interactive.target) {
				Interactive.target.onClick();
			}
		} else if (mouse.isJustUp()) {
			Interactive.selected.onRelease();
		}
	}

	onClick() {
		this.emit('click')
	}
	onRelease() {
		this.emit('release')
	}
}
