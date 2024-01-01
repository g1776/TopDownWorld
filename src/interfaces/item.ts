interface Item {
	base: Polygon;
	draw(ctx: CanvasRenderingContext2D, viewPoint: Point): void;

	/**
	 * Items can optionally have a parent which can be used for various purposes like grouping, movement, deletion, etc.
	 */
	getParent(): Item | Primitive | undefined;

	/**
	 *
	 * @param parent
	 * @returns this
	 */
	setParent(parent: Item | Primitive): Item;
}
