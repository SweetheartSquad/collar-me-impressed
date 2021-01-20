import { Loader, Sprite } from 'pixi.js';
import { ItemConfig } from './Config';
import { size } from './size';

export class ItemStatic {
	spr: Sprite;
	constructor({ spr, x, y }: ItemConfig) {
		const sprite = new Sprite(Loader.shared.resources[spr].texture);
		sprite.anchor.x = sprite.anchor.y = 0.5;
		sprite.x = (x || 0) * size.x;
		sprite.y = (y || 0) * size.y;
		this.spr = sprite;
	}
}
