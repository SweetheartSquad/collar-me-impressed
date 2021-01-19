export interface Item {
	spr: string;
	x?: number;
	y?: number;
}

export type Layer =
	| {
			type: 'cycle';
			x?: number;
			y?: number;
			data: {
				arrowX: number;
				arrowY: number;
				arrowGap: number;
				items: Item[];
			};
	  }
	| {
			type: 'drag-and-drop';
			x?: number;
			y?: number;
			data: {
				items: Item[];
			};
	  };

export interface Config {
	layers: Partial<Record<string, Layer>>;
}
