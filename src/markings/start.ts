import { Point } from "primitives";
import AbstractMarking from "./abstractMarking";
import { angle } from "../math/utils";

export default class Start extends AbstractMarking {
	img: HTMLImageElement;
	constructor(
		public center: Point,
		public directionVector: Point,
		public width: number,
		public height: number
	) {
		super(center, directionVector, width, height);

		this.img = new Image();
		this.img.src = "public/car.png";
	}

	draw(ctx: CanvasRenderingContext2D): void {
		ctx.save();
		ctx.translate(this.center.x, this.center.y);
		ctx.rotate(angle(this.directionVector) - Math.PI / 2);
		ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);

		ctx.restore();
	}
}
