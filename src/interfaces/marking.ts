import { Polygon } from "primitives";

export default interface Marking {
	base: Polygon;
	draw(ctx: CanvasRenderingContext2D): void;
}
