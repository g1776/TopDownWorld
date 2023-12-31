abstract class AbstractPrimitive implements Primitive {
	abstract draw(ctx: CanvasRenderingContext2D, options: Object): void;
	abstract hash(): string;
	private parent?: Item | Primitive;

	getParent(): Item | Primitive | undefined {
		return this.parent;
	}

	setParent(parent: Item | Primitive): Primitive {
		this.parent = parent;
		return this;
	}
}
