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
		sides.sort((a, b) => b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint));

		this.base.draw(ctx, { fill: "white", stroke: "#AAA" });
		sides.forEach((side) => side.draw(ctx, { fill: "white", stroke: "#AAA" }));
		this.drawRoof(ctx, viewPoint);
	}

	private drawRoof(ctx: CanvasRenderingContext2D, viewPoint: Point) {
		type RoofColor = {
			shingles: string;
			side: string;
		};

		const roofColors: RoofColor[] = [
			{ shingles: "#a84a32", side: "#fcf3d7" },
			{ shingles: "#777eb5", side: "#fcf3d7" },
			{ shingles: "#3e7040", side: "#fcf3d7" },
			{ shingles: "#9c6802", side: "#fcf3d7" },
		];

		const ceilingPoints = this.base.points.map((p) =>
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

		const roofElements: {
			poly: Polygon;
			type: "side" | "shingles";
		}[] = [
			// shingle tops
			{
				poly: new Polygon([
					ceilingPoints[0],
					ceilingPoints[1],
					roofTopPoint2,
					roofTopPoint1,
				]),
				type: "shingles",
			},
			{
				poly: new Polygon([
					ceilingPoints[2],
					ceilingPoints[3],
					roofTopPoint1,
					roofTopPoint2,
				]),
				type: "shingles",
			},
			// triangle sides
			{
				poly: new Polygon([ceilingPoints[0], roofTopPoint1, ceilingPoints[3]]),
				type: "side",
			},
			{
				poly: new Polygon([ceilingPoints[1], roofTopPoint2, ceilingPoints[2]]),
				type: "side",
			},
		];

		roofElements.sort(
			(a, b) => b.poly.distanceToPoint(viewPoint) - a.poly.distanceToPoint(viewPoint)
		);

		// choose a random color palette for the roof
		const kindOfRandom = Math.pow(Math.cos((roofTopPoint1.x * roofTopPoint2.y) % 17), 2);
		const randomColor = roofColors[Math.floor(kindOfRandom * roofColors.length)];

		// we're not really drawing the side here, but rather the ceiling with the color of the side. It's a hack, but it works with our
		// fairly limited perspective.
		new Polygon(ceilingPoints).draw(ctx, { fill: randomColor.side, stroke: "#AAA" });
		roofElements.forEach((roof) => {
			if (roof.type === "shingles") {
				roof.poly.draw(ctx, {
					fill: randomColor.shingles,
					stroke: "#AAA",
				});
			}
		});
	}
}
