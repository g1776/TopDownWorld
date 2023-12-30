class Controls {
	private mode: Mode = Mode.GRAPH;

	constructor(public graphEditor: GraphEditor) {}

	dispose() {
		this.graphEditor.dispose();
	}

	save() {
		localStorage.setItem("graph", JSON.stringify(graph));
	}

	setMode(mode: Mode) {
		const modeBtns = document.getElementById("mode-btns")
			?.children as HTMLCollectionOf<HTMLButtonElement>;
		for (const btn of modeBtns) {
			if (btn.value === mode) {
				btn.classList.add("selected");
			} else {
				btn.classList.remove("selected");
			}
		}

		this.mode = mode;
	}

	disableEditors() {}
}
