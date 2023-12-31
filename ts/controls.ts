class Controls {
	// set the default mode here
	private mode: EditorMode = EditorMode.STOP;

	constructor(public editors: Editor[]) {
		this.setEditorMode(this.mode);
	}

	save() {
		this.editors.forEach((editor) => editor.save());
	}

	dispose() {
		this.editors.forEach((editor) => editor.dispose());
	}

	/**
	 * Sets the mode of the controls.
	 * @param mode - The mode to set.
	 */
	setEditorMode(mode: EditorMode) {
		// update the button styling
		const modeBtns = document.getElementById("mode-btns")
			?.children as HTMLCollectionOf<HTMLButtonElement>;
		for (const btn of modeBtns) {
			if (btn.value === mode) {
				btn.classList.add("selected");
			} else {
				btn.classList.remove("selected");
			}
		}

		// enable/disable the appropriate editors
		this.editors.forEach((editor) => {
			if (editor.type === mode) {
				editor.enable();
			} else {
				editor.disable();
			}
		});

		this.mode = mode;
	}
}
