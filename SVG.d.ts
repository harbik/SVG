export interface Point {
    x: number;
    y: number;
}
export declare function toPoints(x: ArrayLike<number>, y: ArrayLike<number>): any;
export declare function toPointsSmooth(x: ArrayLike<number>, y: ArrayLike<number>, mul: number): any;
export interface SVGAttributes {
    'class'?: string;
    'clip-path'?: string;
    fill?: string;
    'font-weight'?: string;
    'fill-opacity'?: string;
    stroke?: string;
    'stroke-opacity'?: string;
    'stroke-width'?: string;
    'stroke-dasharray'?: string;
    style?: string;
    'text-anchor'?: string;
    transform?: string;
    id?: string;
    'marker-start'?: string;
    'marker-end'?: string;
    'marker-mid'?: string;
}
interface FrameGeometry {
    left: number;
    bottom: number;
    width: number;
    height: number;
    xMin?: number;
    yMin?: number;
    xMax?: number;
    yMax?: number;
}
export interface Geometry extends FrameGeometry {
    canvasWidth: number;
    canvasHeight: number;
}
export declare class Frame {
    head: Frame | undefined;
    next: Frame | undefined;
    id: string;
    geo: Geometry;
    renderers: any;
    precision: number;
    autoXMin: boolean;
    autoYMin: boolean;
    autoXMax: boolean;
    autoYMax: boolean;
    svgAttributes: any;
    css: any;
    preAmbleLength: number;
    /**
     *
     * @param id  // unique frame identifier
     * @param geo  // geometric parameters for the frame - see Geometry interface
     * @param svgAttributes  // style options for frame itself
     */
    constructor(id: string, geo: Geometry, svgAttributes?: SVGAttributes);
    axisLabels(dx: number, dy?: number, attr?: SVGAttributes): this;
    canvas(id: string, x: number, y: number, width: number, height: number, attr?: SVGAttributes): this;
    circle(cx: any, cy: any, r: any, attr?: {}): this;
    svgCircle(cx: any, cy: any, r: any, attr?: {}): string;
    circles(p: Point[], r: any, attr?: {}): this;
    clip(id?: string): this;
    clipEnd(): this;
    clipPath(id: string, p: Point[]): this;
    dash(points: Point[], attributes?: {}): this;
    ellipse(cx: number, cy: number, rx: number, ry: number, attr?: SVGAttributes): this;
    foreignObject(innerHTML: string, x: number, y: number, width: number, height: number, attr?: SVGAttributes): this;
    /**
     *
     * Adds a new frame, and set the pointers right for the linked list
     *
     * @param id  Frame identifier
     * @param geoFrame Frame geometric properties
     * @param frameOptions Frame rendering options
     */
    frame(id: any, geoFrame: FrameGeometry, frameOptions?: {}): Frame;
    /**
     * Draw Frame's background and or outline.
     * @param opt optional style attributes
     */
    frameArea(opt?: {}): this;
    /**
     * Defines a clip path corresponding with the area of the current frame.
     * This is used in the constructor to create a clip path with the frame id
     * surrounded by underscores.
     *
     * @param id Path identifier
     */
    frameClipPath(id: string): this;
    g(id?: string, opt?: {}): this;
    gEnd(): this;
    /**
     *
     * Plot grid lines, with spacing dx and dy. The lines will be aligned to
     * the data: so if the data ranges from 8 to 93, and a spacing of 10 is
     * specified, the lines will be plot at locations 10, 20 through 90.
     *
     */
    grid(dx: any, dy: any, opt?: {}): this;
    image(href: string, x: number, y: number, width: number, height: number, attr?: SVGAttributes): this;
    label(x: any, y: any, l: any, angle: any, strText: string, opt?: SVGAttributes): this;
    line(xb: any, yb: any, xe: any, ye: any, opt?: SVGAttributes): this;
    svgPolyline(points: Point[], attributes?: {}): string;
    polyline(points: Point[], attributes?: {}): this;
    polylineArray(x: ArrayLike<number>, y: ArrayLike<number>, opt?: SVGAttributes): this;
    polygon(points: Point[], attributes?: {}): this;
    polygonArray(x: ArrayLike<number>, y: ArrayLike<number>, opt?: {}): this;
    rect(x: any, y: any, width: any, height: any, opt?: {}): this;
    svgRect(x: number, y: number, width: number, height: number, opt?: {}): string;
    renderFrame(): any;
    render(): any;
    text(x: any, y: any, strText: string, opt?: SVGAttributes): this;
    textRotated(x: any, y: any, angle: any, strText: string, opt?: SVGAttributes): this;
    ticks(dx: any, dy: any, size: any, opt?: {}): this;
    private expandAuto;
}
export declare function SVG(canvasWidth?: number, canvasHeight?: number, css?: SVGAttributes): Frame;
export declare function range(start: any, step: any, n: any): Generator<any, void, unknown>;
export {};
