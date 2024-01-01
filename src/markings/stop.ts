import { Polygon, Segment, Point, Envelope } from "../primitives";
import { translate, angle } from "../math/utils";
import Item from "../interfaces/item";

export default class Stop {
	base: Polygon | Segment;
	parent?: Item | undefined;

	constructor(
		public center: Point,
		public directionVector: Point,
		public width: number,
		public height: number
	) {
		const support = new Segment(
			translate(center, angle(directionVector), height / 2),
			translate(center, angle(directionVector), -height / 2)
		);
		this.base = new Envelope(support, width, 1).poly;
	}

	draw(ctx: CanvasRenderingContext2D): void {
		this.base.draw(ctx);
	}
}
