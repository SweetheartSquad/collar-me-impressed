export interface ItemConfig {
	spr: string;
	x?: number;
	y?: number;
}

export type LayerConfig =
	| {
			type: 'static';
			x?: number;
			y?: number;
			data: {
				items: ItemConfig[];
			};
	}
	| {
			type: 'cycle';
			x?: number;
			y?: number;
			data: {
				arrowX: number;
				arrowY: number;
				arrowGap: number;
				items: ItemConfig[];
			};
	  }
	| {
			type: 'drag-and-drop';
			x?: number;
			y?: number;
			data: {
				items: ItemConfig[];
			};
	  };

export interface Config {
	layers: Partial<Record<string, LayerConfig>>;
}
