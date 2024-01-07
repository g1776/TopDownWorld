import { Segment, Point } from "./primitives";
import Graph, { GraphData } from "./math/graph";
import Grid from "./math/grid";
import { scale } from "./math/utils";
import Editor from "interfaces/editor";
import Appbar from "./appbar";
import Viewport from "./viewport";
import World, { WorldData } from "./world";
import { GraphEditor, StopEditor, CrossingEditor, StartEditor } from "./editors";
import Settings from "./settings";

// styles
import "./css/appbar.css";
import "./css/button/toggle.css";
import "./css/button/button.css";
import "./css/button/button-group.css";
import "./css/button/fancy.css";
import "./css/main.css";
import "./css/switch.css";
import "./css/vars.css";
import "./css/tooltip.css";
// setup the canvas
const myCanvas = document.getElementById("myCanvas") as HTMLCanvasElement;
myCanvas.width = window.innerWidth;
myCanvas.height = window.innerHeight;
const ctx = myCanvas.getContext("2d");

// Define a default graph
const p1 = new Point(200, 200);
const p2 = new Point(500, 200);
const s1 = new Segment(p1, p2);
const defaultGraph = new Graph([p1, p2], [s1]);

function loadFromLocalStorage<TargetClass, CacheData>(
	key: string,
	loader: (data: CacheData) => TargetClass,
	defaultInstance: TargetClass
): TargetClass {
	const dataString = localStorage.getItem(key);
	const loadedData: CacheData | null = dataString ? JSON.parse(dataString) : null;
	return loadedData ? loader(loadedData) : defaultInstance;
}

// load data from localStorage
const graph = loadFromLocalStorage<Graph, GraphData>(
	"graph",
	(data) => Graph.load(data),
	defaultGraph
);
const world = loadFromLocalStorage<World, WorldData>(
	"world-data",
	(data) => World.load(data, graph),
	new World(graph)
);

const grid = new Grid(100, 100, 1000);

const viewport = new Viewport(myCanvas);
const editors: Editor[] = [
	new GraphEditor(viewport, graph, grid),
	new StopEditor(viewport, world),
	new CrossingEditor(viewport, world),
	new StartEditor(viewport, world),
];
const appbar = new Appbar(editors, world);

let mouse: Point | null = null;
if (Settings.DEBUG) {
	myCanvas.addEventListener("mousemove", (e) => {
		mouse = viewport.getMouse(e);
	});
}

// start the animation loop
let oldGraphHash = graph.hash();
animate();
function animate() {
	if (!ctx) return;
	viewport.reset();
	const newGraphHash = graph.hash();
	if (newGraphHash != oldGraphHash) {
		world.generate();
		oldGraphHash = graph.hash();
	}
	const viewPoint = scale(viewport.getOffset(), -1);
	world.draw(ctx, viewPoint);
	ctx.globalAlpha = 0.3;
	editors.forEach((editor) => {
		if (editor.isEnabled()) {
			editor.display();
		}
	});
	if (appbar.isGridEnabled()) {
		grid.draw(ctx);
	}

	if (Settings.DEBUG && mouse) {
		// draw the coordinates of the mouse, at the mouse position
		ctx.font = "30px Arial";
		ctx.fillStyle = "black";
		ctx.fillText(`${mouse.x}, ${mouse.y}`, mouse.x, mouse.y);
	}

	requestAnimationFrame(animate);
}
