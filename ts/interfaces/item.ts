interface Item {
	base: Polygon;
	draw(ctx: CanvasRenderingContext2D, viewPoint: Point): void;

	/**
	 * Items can optionally have a parent item which can be used for various purposes like grouping, movement, deletion, etc.
	 */
	parent?: Item;
}
