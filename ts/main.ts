const myCanvas = document.getElementById("myCanvas") as HTMLCanvasElement;

myCanvas.width = window.innerWidth;
myCanvas.height = window.innerHeight;

const ctx = myCanvas.getContext("2d");

const p1 = new Point(200, 200);
const p2 = new Point(500, 200);

const s1 = new Segment(p1, p2);

const graphString = localStorage.getItem("graph");
const graphData: GraphData | null = graphString ? JSON.parse(graphString) : null;

const graph = graphData ? Graph.load(graphData) : new Graph([p1, p2], [s1]);
const world = new World(graph);
const viewport = new Viewport(myCanvas);
const graphEditor = new GraphEditor(viewport, graph);
const controls = new Controls(graphEditor);

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
	graphEditor.display();
	requestAnimationFrame(animate);
}
