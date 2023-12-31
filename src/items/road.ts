import { Envelope, Segment } from "../primitives";
import AbstractItem from "./abstractItem";
import Settings from "../settings";
import Item from "interfaces/item";
import Primitive from "interfaces/primitive";

export default class Road extends AbstractItem {
	constructor(
		public skeleton: Segment,
		public width: number = Settings.ROAD_WIDTH,
		public roundness = Settings.ROAD_ROUNDNESS
	) {
		super(new Envelope(skeleton, width, roundness).poly);
	}

	override setParent(parent: Item | Primitive): Road {
		super.setParent(parent);
		return this;
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.base.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
	}
}
