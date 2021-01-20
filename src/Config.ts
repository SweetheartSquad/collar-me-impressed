export interface ItemConfig {
	spr: string;
	x?: number;
	y?: number;
}

export interface ItemDraggableConfig extends ItemConfig {
	unique?: boolean;
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
			type: 'animated';
			x?: number;
			y?: number;
			data: {
				speed?: number;
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
				items: ItemDraggableConfig[];
			};
	  };

export interface Config {
	layers: Partial<Record<string, LayerConfig>>;
}
