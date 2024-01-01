import { Point, Polygon } from "../primitives";
import Primitive from "../interfaces/primitive";
import Item from "../interfaces/item";

export default abstract class AbstractItem implements Item {
	abstract draw(ctx: CanvasRenderingContext2D, viewPoint: Point): void;
	private parent?: Item | Primitive;

	constructor(public base: Polygon) {
		this;
	}

	getParent(): Item | Primitive | undefined {
		return this.parent;
	}

	setParent(parent: Item | Primitive): Item {
		this.parent = parent;
		return this;
	}
}
