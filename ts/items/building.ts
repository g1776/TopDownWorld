class Building implements Item {
	constructor(public base: Polygon, public heightCoef: number = Settings.BUILDING_HEIGHT) {}

	draw(ctx: CanvasRenderingContext2D, viewPoint: Point) {
		const ceilingPoints = this.base.points.map((p) =>
			getPointOnZPlane(p, viewPoint, this.heightCoef)
		);
		const ceiling = new Polygon(ceilingPoints);

		const sides = [];
		for (let i = 0; i < this.base.points.length; i++) {
			const nextI = (i + 1) % this.base.points.length;
			const poly = new Polygon([
				this.base.points[i],
				this.base.points[nextI],
				ceilingPoints[nextI],
				ceilingPoints[i],
			]);
			sides.push(poly);
		}

		// Sort the sides by distance to the camera.
		this.base.draw(ctx, { fill: Settings.BUILDING_COLOR, stroke: "#AAA" });
		sides.sort((a, b) => b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint));
		sides.forEach((side) => side.draw(ctx, { fill: Settings.BUILDING_COLOR, stroke: "#AAA" }));
		this.drawRoof(ctx, viewPoint);
	}

	private drawRoof(ctx: CanvasRenderingContext2D, viewPoint: Point) {
		const ceiling = this.base.points.map((p) =>
			getPointOnZPlane(p, viewPoint, this.heightCoef)
		);

		// calculate the points of a segment in the middle of the ceiling.
		// We can do this with the first and last points of an envelope based on an edge of the building
		const buildingWidth = distance(this.base.points[0], this.base.points[3]);
		const roofPoints = new Envelope(
			new Segment(
				getPointOnZPlane(
					this.base.points[0],
					viewPoint,
					this.heightCoef + Settings.BUILDING_ROOF_HEIGHT
				),
				getPointOnZPlane(
					this.base.points[1],
					viewPoint,
					this.heightCoef + Settings.BUILDING_ROOF_HEIGHT
				)
			),
			buildingWidth
		).poly.points;
		const roofTopPoint1 = roofPoints[0];
		const roofTopPoint2 = roofPoints[3];

		const roofPolys = [
			new Polygon([ceiling[0], ceiling[1], roofTopPoint2, roofTopPoint1]),
			new Polygon([ceiling[2], ceiling[3], roofTopPoint1, roofTopPoint2]),
		];
		roofPolys.sort((a, b) => b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint));

		// Draw the ceiling, but it will appear as the
		new Polygon(ceiling).draw(ctx, {
			fill: Settings.BUILDING_COLOR,
			stroke: Settings.BUILDING_COLOR,
		});
		roofPolys.forEach((poly) => {
			poly.draw(ctx, {
				fill: Settings.BUILDING_ROOF_COLOR,
				stroke: "#AAA",
			});
		});
	}
}
