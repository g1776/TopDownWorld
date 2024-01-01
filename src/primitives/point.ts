import AbstractPrimitive from "./abstractPrimitive";
import Item from "interfaces/item";
import Primitive from "interfaces/primitive";
import Settings from "../settings";

export interface PointData {
	x: number;
	y: number;
}

/**
 * Represents a point in 2D space
 */
export default class Point extends AbstractPrimitive {
	/**
	 * Constructs a Point instance with x and y coordinates
	 * @param x - The x-coordinate of the point
	 * @param y - The y-coordinate of the point
	 */
	constructor(public x: number, public y: number) {
		super();
		this.x = Number(x.toFixed(Settings.FLOATING_POINT_PRECISION));
		this.y = Number(y.toFixed(Settings.FLOATING_POINT_PRECISION));
	}

	/**
	 *
	 * @param data The point data to load
	 */
	static load(data: PointData): Point {
		return new Point(data.x, data.y);
	}

	override setParent(parent: Item | Primitive): Point {
		super.setParent(parent);
		return this;
	}

	/**
	 * Checks if the current point is equal to another point
	 * @param point - The point to compare for equality
	 * @returns True if the points are equal, otherwise false
	 */
	equals(point: Point): boolean {
		return this.x === point.x && this.y === point.y;
	}

	/**
	 * Draws the point on the canvas
	 * @param ctx - The CanvasRenderingContext2D to draw on
	 * @param options - Options for drawing the point
	 *   @param size - The size of the point (default is 18)
	 *   @param color - The color of the point (default is black)
	 *   @param outline - Whether to draw an outline around the point (default is false)
	 *   @param fill - Whether to fill the point (default is false)
	 */
	draw(
		ctx: CanvasRenderingContext2D,
		{ size = 18, color = "black", outline = false, fill = false } = {}
	): void {
		const rad = size / 2;
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.arc(this.x, this.y, rad, 0, Math.PI * 2);
		ctx.fill();

		if (outline) {
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "yellow";
			ctx.arc(this.x, this.y, rad * 0.6, 0, Math.PI * 2);
			ctx.stroke();
		}

		if (fill) {
			ctx.beginPath();
			ctx.arc(this.x, this.y, rad * 0.4, 0, Math.PI * 2);
			ctx.fillStyle = "yellow";
			ctx.fill();
		}
	}

	hash(): string {
		return JSON.stringify({ x: this.x, y: this.y });
	}
}
