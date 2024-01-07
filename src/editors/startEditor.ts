import { EditorMode } from "../enums";
import MarkingEditor from "./markingEditor";
import Viewport from "../viewport";
import World from "../world";
import Marking from "../interfaces/marking";
import { Point } from "../primitives";
import { Start } from "../markings";

export default class StartEditor extends MarkingEditor {
	public readonly type = EditorMode.START;

	constructor(viewport: Viewport, world: World) {
		super(viewport, world, world.laneGuides);
	}

	createMarking(center: Point, directionVector: Point): Marking {
		return new Start(center, directionVector, this.world.roadWidth, this.world.roadWidth / 2);
	}
}
