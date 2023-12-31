class Envelope extends AbstractPrimitive {
	poly: Polygon;
	/**
	 * Creates a new Envelope instance.
	 * @param skeleton - The skeleton segment of the envelope.
	 * @param width - The width of the envelope.
	 * @param roundness - The roundness factor of the envelope (default is 1).
	 */
	constructor(public skeleton: Segment, public width: number, public roundness = 1) {
		super();
		this.poly = this.generatePolygon(width, roundness).setParent(this);
	}

	override setParent(parent: Item | Primitive): Envelope {
		super.setParent(parent);
		return this;
	}

	/**
	 * Generates the polygon shape of the envelope.
	 * @param width - The width of the envelope.
	 * @param roundness - The roundness factor of the envelope.
	 * @returns The generated polygon shape.
	 * @private
	 */
	private generatePolygon(width: number, roundness: number): Polygon {
		if (roundness == 0) {
			throw new Error("Divide by Zero Error: Envelope roundness cannot be 0");
		}

		const { p1, p2 } = this.skeleton;

		const radius = width / 2;
		const alpha = angle(subtract(p1, p2));
		const alpha_cw = alpha + Math.PI / 2;
		const alpha_ccw = alpha - Math.PI / 2;
		const points = [];
		const step = Math.PI / roundness;
		const eps = step / 2;
		for (let i = alpha_ccw; i <= alpha_cw + eps; i += step) {
			points.push(translate(p1, i, radius));
		}
		for (let i = alpha_ccw; i <= alpha_cw + eps; i += step) {
			points.push(translate(p2, Math.PI + i, radius));
		}

		return new Polygon(points);
	}

	draw(ctx: CanvasRenderingContext2D, options = {}): void {
		this.poly.draw(ctx, options);
	}

	hash(): string {
		return this.poly.hash();
	}
}
