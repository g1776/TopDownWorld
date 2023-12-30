interface Primitive extends Hashable {
	draw(ctx: CanvasRenderingContext2D, options: Object): void;
	/**
	 * Primitives can optionally have a parent primitive which can be used for various purposes like grouping, movement, deletion, etc.
	 */
	parent?: Primitive;
}
