import { Polygon, Segment, Point, Envelope } from "../primitives";
import { translate, angle, add, scale, perpendicular } from "../math/utils";
import Item from "../interfaces/item";
import AbstractMarking from "./abstractMarking";
import Settings from "../settings";

export default class Crossing extends AbstractMarking {
	borders: Segment[];

	constructor(
		public center: Point,
		public directionVector: Point,
		public width: number,
		public height: number
	) {
		super(center, directionVector, width, height);
		this.borders = [this.base.segments[0], this.base.segments[2]];
	}

	draw(ctx: CanvasRenderingContext2D): void {
		const perp = perpendicular(this.directionVector);
		const line = new Segment(
			add(this.center, scale(perp, this.width / 2)),
			add(this.center, scale(perp, -this.width / 2))
		);
		line.draw(ctx, { width: this.height, color: "white", dash: [11, 11] });

		if (Settings.DEBUG) {
			this.borders.forEach((border) => {
				border.draw(ctx);
			});
		}
	}
}
