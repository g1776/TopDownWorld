import Hashable from "./hashable";
import Item from "./item";

export default interface Primitive extends Hashable {
	draw(ctx: CanvasRenderingContext2D, options: Object): void;
	/**
	 * Primitives can optionally have a parent which can be used for various purposes like grouping, movement, deletion, etc.
	 */
	getParent(): Primitive | Item | undefined;

	/**
	 *
	 * @param parent
	 * @returns this
	 */
	setParent(parent: Primitive | Item): Primitive;

	equals(other: Primitive): boolean;
}
