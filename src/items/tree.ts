import AbstractItem from "./abstractItem";
import { Point, Polygon } from "../primitives";
import { lerp, translate, lerp2D, getPointOnZPlane } from "../math/utils";
import Settings from "../settings";

export default class Tree extends AbstractItem {
	constructor(
		public center: Point,
		public radius: number = Settings.TREE_RADIUS,
		public heightCoef: number = Settings.TREE_HEIGHT
	) {
		super(new Polygon([]));
		this.base = this.generateLevel(center, radius);
	}

	private generateLevel(point: Point, diameter: number): Polygon {
		const points = [];
		const rad = diameter / 2;
		const resolution = 16; // number of points to render on each level
		for (let a = 0; a < Math.PI * 2; a += Math.PI / (resolution / 2)) {
			const kindOfRandom = Math.cos(((a + this.center.x) * diameter) % 17) ** 2;
			const noisyRadius = rad * lerp(0.5, 1, kindOfRandom);
			points.push(translate(point, a, noisyRadius));
		}
		return new Polygon(points).setParent(this);
	}

	draw(ctx: CanvasRenderingContext2D, viewPoint: Point) {
		const top = getPointOnZPlane(this.center, viewPoint, this.heightCoef);

		// for each level, interpolate the size and color, as well as finding the point to draw at based on the 3D diff
		const levelCount = 7;
		for (let level = 0; level < levelCount; level++) {
			const t = level / (levelCount - 1);
			const point = lerp2D(this.center, top, t);
			const color = `rgb(30, ${lerp(50, 200, t)}, 70)`;
			const size = lerp(this.radius, 40, t);
			const poly = this.generateLevel(point, size);
			poly.draw(ctx, { fill: color, stroke: "rgba(0, 0, 0, 0)" });
		}

		if (Settings.DEBUG) {
			this.base.draw(ctx);
		}
	}
}
