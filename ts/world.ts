class World {
	roads: Road[];
	roadBorders: Segment[];
	buildings: Building[] = [];
	trees: Set<Tree> = new Set();
	constructor(
		public graph: Graph,
		public roadWith = Settings.ROAD_WIDTH,
		public roadRoundness = Settings.ROAD_ROUNDNESS,

		/***
		 *The width of the building envelope. This is depth of the building, perpendicular to the road.
		 */
		public buildingWidth = Settings.BUILDING_WIDTH,

		/**
		 * The minimum length of the building, parallel to the road.
		 */
		public buildingMinLength = Settings.BUILDING_MIN_LENGTH,
		public buildingSpacing = Settings.BUILDING_SPACING,
		/**
		 * The radius of the trees
		 */
		public treeRadius = Settings.TREE_RADIUS,
		public treeHeight = Settings.TREE_HEIGHT
	) {
		this.roads = [];
		this.roadBorders = [];

		const graphHash = graph.hash();
		this.generate();
	}

	generate() {
		this.roads.length = 0;
		for (const seg of this.graph.segments) {
			this.roads.push(new Road(seg, this.roadWith, this.roadRoundness));
		}

		this.roadBorders = Polygon.union(this.roads.map((road) => road.base));
		this.buildings = this.generateBuildings();
		this.trees = this.generateTrees();
	}

	generateBuildings(): Building[] {
		if (this.graph.segments.length === 0) {
			return [];
		}

		const tmpEvelopes = this.graph.segments
			// for each segment, generate an envelope around it to create guides for placing buildings
			.map(
				(seg) =>
					new Envelope(
						seg,
						this.roadWith + this.buildingWidth + this.buildingSpacing * 2,
						// pass a fairly large roundness, so we don't get weird buildings on the edge of the envelope
						// This will ensure that we don't get edges > buildingMinLength
						20
					)
			);

		// Create a union of all envelopes, and keep segments that are long enough. Call these segments "guides".
		const guides = Polygon.union(tmpEvelopes.map((env) => env.poly)).filter(
			(seg) => seg.length() >= this.buildingMinLength
		);

		// For each guide, determine the "support" structures (segments) that will be used to place buildings.
		// These will be spaced along the guide
		let supports: Segment[] = [];
		guides.forEach((seg) => {
			const len = seg.length() + this.buildingSpacing;
			// How many buildings can we fit on this segment?
			const buildingCount = Math.floor(
				len / (this.buildingMinLength + this.buildingSpacing)
			);

			// Based on the number of buildings, what is the length of each building?
			const buildingLength = len / buildingCount - this.buildingSpacing;

			const randomizeLength = (length: number, q1: Point) => {
				let kindOfRandom = Math.pow(Math.cos((q1.x * q1.y) % 11), 2);
				let buildingLengthAdj = buildingLength * (1 - (kindOfRandom * 0.5 - 0.25));
				return buildingLengthAdj;
			};

			const dir = seg.directionVector();

			// build the support segments buildingCount times. These are the "spines" of the buildings, parallel to the road.
			let q1 = seg.p1;
			let buildingLengthAdj = randomizeLength(buildingLength, q1);
			let q2 = add(q1, scale(dir, buildingLengthAdj));
			supports.push(new Segment(q1, q2));

			for (let i = 2; i <= buildingCount; i++) {
				q1 = add(q2, scale(dir, this.buildingSpacing));
				buildingLengthAdj = randomizeLength(buildingLength, q1);
				q2 = add(q1, scale(dir, buildingLengthAdj));
				supports.push(new Segment(q1, q2));
			}
		});

		// add the bases of the buildings. These are the envelopes around the support segments.

		const bases: Polygon[] = supports.map((supportSegment) => {
			// randomize the width of the building a bit
			const kindOfRandom = Math.pow(
				Math.cos((supportSegment.p1.x * supportSegment.p2.y) % 11),
				2
			);
			const width = this.buildingWidth * (1 + kindOfRandom);
			return new Envelope(supportSegment, width).poly;
		});

		// remove bases that intersect, so buildings don't overlap
		bases.forEach((base, i) => {
			bases.forEach((otherBase, j) => {
				if (i !== j && base.intersectsPoly(otherBase)) {
					bases.splice(j, 1);
				}
			});
		});

		return bases.map((b) => new Building(b));
	}

	generateTrees(): Set<Tree> {
		// Determine the bounds that trees can be generated in
		const points = [
			...this.roadBorders.map((seg) => [seg.p1, seg.p2]).flat(),
			...this.buildings.map((b) => b.base.points).flat(),
		];

		if (points.length === 0) {
			return new Set();
		}

		const left = Math.min(...points.map((p) => p.x));
		const right = Math.max(...points.map((p) => p.x));
		const top = Math.min(...points.map((p) => p.y));
		const bottom = Math.max(...points.map((p) => p.y));

		// We dont want to generate trees on the road or in buildings
		const illegalPolys = new Set([
			...this.buildings.map((b) => b.base),
			...this.roads.map((road) => road.base),
		]);

		const newTrees: Set<Tree> = new Set();
		const closestGraphSegments = new Map<Tree, Segment>();

		for (const tree of this.trees) {
			const closestGraphSegment =
				closestGraphSegments.get(tree) ||
				this.graph.segments.reduce((prev, curr) =>
					curr.distanceToPoint(tree.center) < prev.distanceToPoint(tree.center)
						? curr
						: prev
				);

			if (
				tree.center.parent
					? tree.center.parent.hash() === closestGraphSegment.hash()
					: false
			) {
				// make sure its location is still valid
				if (!this.validateTreeLocation(tree.center, illegalPolys, newTrees)) {
					continue;
				}

				// keep the tree
				newTrees.add(tree);
				closestGraphSegments.set(tree, closestGraphSegment);
			}
		}

		let tryCount = 0;
		const treeCountScaleFactor = 100 * Settings.TREE_COUNT_SCALE_FACTOR;

		while (tryCount < treeCountScaleFactor) {
			// generate a random point in the bounds
			const p = new Point(
				lerp(left, right, Math.random()),
				lerp(bottom, top, Math.random())
			);

			// validate the point
			const keep = this.validateTreeLocation(p, illegalPolys, newTrees);

			// find the closest graph segment to the tree and set it as the parent
			const closestGraphSegment = this.graph.segments.reduce((prev, curr) =>
				curr.distanceToPoint(p) < prev.distanceToPoint(p) ? curr : prev
			);
			p.parent = closestGraphSegment;

			if (keep) {
				const newTree = new Tree(p, this.treeRadius, this.treeHeight);
				newTrees.add(newTree);
				closestGraphSegments.set(newTree, closestGraphSegment);
				tryCount = 0;
			}
			tryCount++;
		}

		return newTrees;
	}

	draw(ctx: CanvasRenderingContext2D, viewPoint: Point) {
		this.roads.forEach((road) => road.draw(ctx));

		// draw dashed lines on the road
		this.graph.segments.forEach((seg) =>
			seg.draw(ctx, { color: "white", width: 3, dash: [10, 10] })
		);
		this.roadBorders.forEach((seg) => seg.draw(ctx));

		// sort and draw all the items in 3D
		[...this.buildings, ...this.trees]
			.sort((a, b) => b.base.distanceToPoint(viewPoint) - a.base.distanceToPoint(viewPoint))
			.forEach((item) => {
				item.draw(ctx, viewPoint);
			});
	}

	private validateTreeLocation(
		p: Point,
		illegalPolys: Set<Polygon>,
		otherTrees: Set<Tree>
	): boolean {
		// make sure the tree is not in an illegal polygon
		for (const poly of illegalPolys) {
			if (poly.containsPoint(p) || poly.distanceToPoint(p) < this.treeRadius / 2) {
				return false;
			}
		}

		// make sure the tree is not too close to another tree
		for (const tree of otherTrees) {
			if (distance(tree.center, p) < this.treeRadius) {
				return false;
			}
		}

		// make sure the tree is close to something
		const numTreesToPadWith = 2;
		let closeToSomething = false;
		for (const poly of illegalPolys) {
			if (poly.distanceToPoint(p) < this.treeRadius * numTreesToPadWith) {
				closeToSomething = true;
				break;
			}
		}
		if (!closeToSomething) {
			return false;
		}

		return true;
	}
}
