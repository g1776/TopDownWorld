import { Polygon, Segment, Point, Envelope } from "../primitives";
import { translate, angle } from "../math/utils";
import Item from "../interfaces/item";
import AbstractMarking from "./abstractMarking";

export default class Stop extends AbstractMarking {
	border: Segment;

	constructor(
		public center: Point,
		public directionVector: Point,
		public width: number,
		public height: number
	) {
		super(center, directionVector, width, height);

		this.border = this.base.segments[2];
	}

	draw(ctx: CanvasRenderingContext2D): void {
		this.border.draw(ctx, { width: 5, color: "white" });
		ctx.save();
		ctx.translate(this.center.x, this.center.y);
		ctx.rotate(angle(this.directionVector) - Math.PI / 2);
		ctx.scale(1, 3);

		ctx.beginPath();
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = "white";
		ctx.font = "bold " + this.height * 0.3 + "px Arial";
		ctx.fillText("STOP", 0, 1);
		ctx.restore();
	}
}
