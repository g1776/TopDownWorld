abstract class BasePrimitive implements Primitive {
	abstract draw(ctx: CanvasRenderingContext2D, options: Object): void;
	parent?: Primitive | undefined;
	abstract hash(): string;

    setParent
}
