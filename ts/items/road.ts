class Road implements Item {
	/**
	 * The base of the road. This is the polygon of the envelope.
	 */
	base: Polygon;
	constructor(
		public skeleton: Segment,
		public width: number = Settings.ROAD_WIDTH,
		public roundness = Settings.ROAD_ROUNDNESS
	) {
		this.base = new Envelope(skeleton, width, roundness).poly;
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.base.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
	}
}
