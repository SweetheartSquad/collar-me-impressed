import HowlerMiddleware from 'howler-pixi-loader-middleware';
import { Loader, SCALE_MODES, settings, WRAP_MODES } from 'pixi.js';
import { Resizer } from '../src/Resizer';
import { Config } from './Config';
import './focusHack';
import { size } from './size';

// pixi config
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.WRAP_MODE = WRAP_MODES.MIRRORED_REPEAT;

export const resizer = new Resizer(size.x, size.y, 'fit');

function resourceLoad() {
	return new Promise<void>((resolve, reject) => {
		const id = Loader.shared.onError.once(() => reject());
		Loader.shared.load(() => {
			Loader.shared.onError.detach(id);
			resolve();
		});
	});
}

export async function load() {
	const loading = document.createElement('p');
	loading.innerText = 'Loading...';
	document.body.appendChild(loading);
	document.body.appendChild(resizer.element);
	Loader.shared.baseUrl = 'assets';
	Loader.shared.pre(HowlerMiddleware);
	Loader.shared.add('config', 'config.json');
	await resourceLoad();

	Loader.shared
		.add('bgm', 'audio/bgm.mp3')
		.add('pickup', 'audio/pickup.mp3')
		.add('drop', 'audio/drop.mp3')
		.add('btn', 'audio/btn.mp3')
		.add('arrow', 'img/arrow.png')
		.add('arrow_flipped', 'img/arrow_flipped.png')
		.add('save', 'img/save.png')
		.add('mouse_up', 'img/mouse/mouse_up.png')
		.add('mouse_over', 'img/mouse/mouse_over.png')
		.add('mouse_down', 'img/mouse/mouse_down.png');

	Object.values((Loader.shared.resources.config.data as Config).layers).flatMap(i => i.data.items).forEach(i => Loader.shared.add(i.spr, 'img/' + i.spr + '.png'));

	Loader.shared.onProgress.add((Loader, resource) => {
		loading.innerText = 'Loading: ' + Math.floor(Loader.progress) + '%';
		console.log('loading: ' + resource.url);
	});
	await resourceLoad();
	const { init } = await import('./main');
	loading.remove();
	init();
}
