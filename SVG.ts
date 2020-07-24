// Copyright 2020 Harbers Bik LLC
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License. You may obtain a
// copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.


export interface Point {
	x: number
	y: number
}

export function toPoints(x: ArrayLike<number>, y: ArrayLike<number>) {
	let points : any = []
	let n = Math.min(x.length, y.length)
	for (let i = 0; i < n; i++) points.push({ x: x[i], y: y[i] })
	return points
}

export function toPointsSmooth(x: ArrayLike<number>, y: ArrayLike<number>, mul: number) {
	let points: any = []
	let n = Math.min(x.length, y.length)
	let m = n * mul;
	let i_val = [...range(0, 1.0/(n-1), n)]
	let xcs = CubicSplineInterpolator(i_val, x)(0.0, 1.0/(m-1), m)
	let ycs = CubicSplineInterpolator(i_val, y)(0.0, 1.0/(m-1), m)
	for (let i = 0; i < m; i++) points.push({ x: xcs[i], y: ycs[i] })
	return points
}

export interface SVGAttributes {
	'class'?: string
	'clip-path'?: string
	fill?: string
	'font-weight'?: string
	'fill-opacity'?: string
	stroke?: string
	'stroke-opacity'?: string
	'stroke-width'?: string
	'stroke-dasharray'?:string
	style?: string
	'text-anchor'?: string
	transform?: string
	id?:string
	'marker-start'?: string
	'marker-end'?: string
	'marker-mid'?: string

}

interface FrameGeometry {
	left: number // in percentage
	bottom: number // in percentage
	width: number // in percentage
	height: number // in percentage
	xMin?: number // in user coordinates
	yMin?: number // in user coordinates
	xMax?: number // in user coordinates
	yMax?: number // in user coordinates
}

export interface Geometry extends FrameGeometry {
	canvasWidth: number // in raw SVG pixels 
	canvasHeight: number // in raw SVG pixels
}

function stringStack(sep = "\n") {
	let s: string[] = []
	return (...v: string[]) => { if (v.length>0) s.push(...v); else return s.join(sep)}
}


function scale(geo: Geometry, ...xys: Point[]) {
	let newPoints = Array<Point>(xys.length)
	let pxBottom = geo.bottom * geo.canvasHeight / 100
	let pxLeft = geo.left * geo.canvasWidth / 100
	let pxWidth = geo.width * geo.canvasWidth / 100
	let pxHeight = geo.height * geo.canvasHeight / 100
	let xWidth = geo.xMax! - geo.xMin!
	let yHeight = geo.yMax! - geo.yMin!
	let pxTop = geo.canvasHeight - pxBottom - pxHeight
	for (let [i, { x, y }] of xys.entries()) {
		newPoints[i] = {
			x: (x - geo.xMin!) / xWidth * pxWidth + pxLeft,
			y: (1 - (y - geo.yMin!) / yHeight) * pxHeight + pxTop
		}
	}
	return newPoints
}


class Path {
	precision = 4
	p: any = []

	To = (xy: Point) => this.pather("", xy)
	MoveTo = (xy: Point) => this.pather("M", xy)
	LineTo = (xy: Point) => this.pather("L", xy)
	moveTo = (xy: Point) => this.pather("m", xy)
	lineTo = (xy: Point) => this.pather("l", xy)
	closePath = () => { this.p.push('z'); return this }

	toString() { return this.p.join(' ') }

	private pather(action: string, { x, y }: Point) {
		// +x.toPrecision(..) to limit the length of the number string, and to remove trailing spaces
		this.p.push(`${action}${+x.toPrecision(this.precision)} ${+y.toPrecision(this.precision)}`)
		return this
	}
}

function svgAttributes(attr:SVGAttributes = {}) {
	let s : string[] = []
	for (let k in attr){
		s.push(`${k}="${attr[k]}"`)
	}
	return s.join(" ")
}

function svgAttributeIfDefined(k, v, prc = 4) {
	if (v === undefined) return ""
	else if (typeof v === "string") return `${k}="${v}"`
	else return `${k}="${v.toPrecision(prc)}"`
}

// Canvas as a foreign element
function svgCanvas(id: string, x:number, y:number, width:number, height:number, attr:SVGAttributes = {}) {
	return oneLine`<foreignObject
		x="${+x.toPrecision(4)}"
		y="${+y.toPrecision(4)}" 
		width="${+width.toPrecision(4)}" 
		height="${+height.toPrecision(4)}" 
		${svgAttributes(attr)}
		><canvas xmlns="http://www.w3.org/1999/xhtml" id=${id} width="${+width.toPrecision(4)}" height="${+height.toPrecision(4)}">No foreign element supported</canvas></foreignObject>`
}

function svgCircle(cx:number, cy:number, r:number, attr:SVGAttributes = {}) {
	return oneLine`<circle
		cx="${+cx.toPrecision(4)}"
		cy="${+cy.toPrecision(4)}" 
		r="${+r.toPrecision(4)}" 
		${svgAttributes(attr)}
		/>`
}

function svgClipPath(id: string, path: Path) {
	return `<clipPath id="${id}"> <path d="${path}"/> </clipPath>`
}

function svgEllipse(cx:number, cy:number, rx:number, ry:number, attr:SVGAttributes = {}) {
	return oneLine`<ellipse
		cx="${+cx.toPrecision(4)}"
		cy="${+cy.toPrecision(4)}" 
		rx="${+rx.toPrecision(4)}" 
		ry"${+ry.toPrecision(4)}" 
		${svgAttributes(attr)}
		/>`
}



function svgForeignObject(innerHTML: string, x:number, y:number, width:number, height:number, attr:SVGAttributes = {}) {
	return oneLine`<foreignObject
		x="${+x.toPrecision(4)}"
		y="${+y.toPrecision(4)}" 
		width="${+width.toPrecision(4)}" 
		height="${+height.toPrecision(4)}" 
		${svgAttributes(attr)}
		>${innerHTML}</foreignObject>`
}

function svgGroup(id: string|undefined, a: SVGAttributes = {}) {
	return oneLine`<g ${svgAttributeIfDefined("id", id)} ${svgAttributes(a)}>`
}

function svgHeader(width: number, height: number, css?: string) {
	return oneLine`
		${css ? `<?xml-stylesheet type="text/css" href="${css}" ?>` : ""}
		<svg
			version="1.1"
			xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
			width="${width}"
			height="${height}"
			viewBox="0 0 ${width} ${height}"
		>
		`
		/*
			width="${width}" 
			height ="${height}"
		<defs>
			<marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
				<path d="M 0 0 L 10 5 L 0 10  L 5 5 z" />
			</marker>
		</defs>
		Does not inherit color from line...
		*/
}

function svgImage(href: string, x:number, y:number, width:number, height:number, attr:SVGAttributes = {}) {
	return oneLine`<image
		x="${+x.toPrecision(4)}" 
		y="${+y.toPrecision(4)}" 
		width="${+width.toPrecision(4)}" 
		height="${+height.toPrecision(4)}" 
		href="${href}"
		${svgAttributes(attr)}
		/>`
}

function svgLine(x1:number, y1:number, x2:number, y2:number, attr:SVGAttributes = {}) {
	return oneLine`<line
		x1="${+x1.toPrecision(4)}"
		y1="${+y1.toPrecision(4)}" 
		x2="${+x2.toPrecision(4)}" 
		y2="${+y2.toPrecision(4)}" 
		${svgAttributes(attr)}
		/>`
}


function svgPath(path: Path, a: SVGAttributes = {}){ return `<path ${svgAttributes(a)} d="${path}"/>` }

function svgPolygonPath(p: Point[]) {
	let path = new Path()
	path.MoveTo(p[0])
	for (let i = 1; i < p.length; i++) path.LineTo(p[i])
	path.closePath()
	return path
}

function svgPoly(poly: string, path: Path, a: SVGAttributes = {}) {
	return `<${poly} ${svgAttributes(a)} points="${path}" />`
}

function svgRect(x, y, width, height, attr:SVGAttributes = {}) {
	if (width < 0) {
		width = Math.abs(width)
		x = x - width
	}
	if (height < 0) {
		height = Math.abs(height)
		y = y - height
	}
	return oneLine`<rect
		x="${x.toPrecision(4)}"
		y="${y.toPrecision(4)}"
		width="${width.toPrecision(4)}"
		height="${height.toPrecision(4)}"
		${svgAttributes(attr)}
	/>`
}

function svgSymbol(id: string) { return `<symbol id=${id}>` }
function svgSymbolEnd() { return `</symbol>` }

function svgUse(id, x, y) {
	return oneLine`<use xlink:href="#${id}" x="${x}" y="${y}"/>`
}

function svgText(x, y, text, attr:SVGAttributes){
	return oneLine`<text
		x="${x.toPrecision(4)}"
		y="${y.toPrecision(4)}"
		${svgAttributes(attr)}
	>${text}</text>`
}

function svgTextRotated(x, y, angle, text, attr:SVGAttributes){
	return oneLine`<text
		x="${x.toPrecision(4)}"
		y="${y.toPrecision(4)}"
		transform="rotate(${angle},${x.toPrecision(4)},${y.toPrecision(4)})"
		${svgAttributes(attr)}
	>${text}</text>`
}

export class Frame {

	// linked list
	head: Frame | undefined
	next: Frame | undefined

	id: string
	geo: Geometry
	renderers: any = []
	precision = 4

	autoXMin = false
	autoYMin = false
	autoXMax = false
	autoYMax = false

	svgAttributes
	css // if defined, includes an xlink reference to the name of the css file

	// number of renderers built in the constructor, use in grid
	preAmbleLength: number

	/**
	 * 
	 * @param id  // unique frame identifier
	 * @param geo  // geometric parameters for the frame - see Geometry interface
	 * @param svgAttributes  // style options for frame itself
	 */
	constructor(id: string, geo: Geometry, svgAttributes: SVGAttributes = {}) {
		this.head = undefined
		this.next = undefined
		this.id = id
		this.geo = geo
		this.svgAttributes = {
			stroke: "black",
			fill: "none",
			'stroke-width': "1",
			...svgAttributes
		}

		// do we need to autoscale?
		if (geo.xMin === undefined) { this.autoXMin = true; this.geo.xMin = Number.MAX_VALUE }
		if (geo.xMax === undefined) { this.autoXMax = true; this.geo.xMax = Number.MIN_VALUE }
		if (geo.yMin === undefined) { this.autoYMin = true; this.geo.yMin = Number.MAX_VALUE }
		if (geo.yMax === undefined) { this.autoYMax = true; this.geo.yMax = Number.MIN_VALUE }

		this.g(this.id) // frame container
		if (this.id !== "canvas") this.frameClipPath(`clip${this.id}`) // clip to frame area
		this.frameArea(this.svgAttributes)
		this.preAmbleLength = this.renderers.length
	}


	axisLabels(dx:number, dy = 0, attr:SVGAttributes = {}) {

		this.renderers.push(() => {
			if (dx>0) {
				this.g(undefined, { transform: "translate(0 20)", 'text-anchor': "middle" })
				let xmin = this.geo.xMin! - round(this.geo.xMin! % dx, 4)
				for (let x = xmin<this.geo.xMin!? xmin +dx: xmin; x < this.geo.xMax!; x += dx) {
					let val = +round(x,4).toPrecision(4)
					this.text(x, this.geo.yMin, `${val}`, attr)
				}
				this.gEnd()
			}
			if (dy>0) {
				this.g(undefined, { transform: "translate(-7 5)", 'text-anchor': "end" })
				let ymin = this.geo.yMin! - round(this.geo.yMin! % dy,4)
				for (let y = ymin<=this.geo.yMin!? ymin +dy: ymin; y < this.geo.yMax!; y += dy) {
					let val = +round(y,4).toPrecision(4)
					this.text(this.geo.xMin, y, `${val}`, attr)
				}
				this.gEnd()
			}
		})
		return this
	}

	canvas(id:string, x:number, y:number, width:number, height:number, attr: SVGAttributes = {}) {
		let p1: Point = { x, y }
		let p2: Point = { x: x + width, y: y + height }
		if (p1.x > p2.x) [p1.x, p2.x] = [p2.x, p1.x]
		if (p1.y < p2.y) [p1.y, p2.y] = [p2.y, p1.y]
		this.expandAuto(p1, p2)
		this.renderers.push(() => {
			let [{ x, y }, { x: x1, y: y1 }] = scale(this.geo, p1, p2)
			return svgCanvas(id, x, y, x1 -x, y1 - y, attr)
		})
		return this
	}

	// radius in pixels! use negative radius for cases to use a scaled radius?
	circle(cx, cy, r, attr = {}) {
		let c: Point = { x:cx, y:cy }
		let ct : Point = { x: cx, y: cy+r}
		let cr : Point = { x: cx+r, y: cy}
		let cb : Point = { x: cx, y: cy-r}
		let cl : Point = { x: cx-r, y: cy}
		this.expandAuto(c, ct, cr, cb, cl )
		this.renderers.push(() => {
			[c, ct, cr, cb, cl] = scale(this.geo, c, ct, cr, cb, cl)
			if (r>=0) return svgCircle(c.x, c.y, r, attr)
			else {
				r = (Math.abs(ct.y-cb.y) + Math.abs(cr.x - cl.x))/4.0;
				return svgCircle(c.x, c.y, r, attr)
			}
		})
		return this
	}

	svgCircle(cx, cy, r, attr = {}) {
		let c: Point = { x:cx, y:cy }
		let ct : Point = { x: cx, y: cy+r}
		let cr : Point = { x: cx+r, y: cy}
		let cb : Point = { x: cx, y: cy-r}
		let cl : Point = { x: cx-r, y: cy};
		[c, ct, cr, cb, cl] = scale(this.geo, c, ct, cr, cb, cl);
		if (r>=0) return svgCircle(c.x, c.y, r, attr)
		else {
			r = (Math.abs(ct.y-cb.y) + Math.abs(cr.x - cl.x))/4.0;
			return svgCircle(c.x, c.y, r, attr)
		}
	}

	circles(p:Point[], r, attr = {}) {
		this.expandAuto(...p)
		this.renderers.push(() => {
			const s = stringStack()
			p = scale(this.geo, ...p)
			p.forEach(v => s(svgCircle(v.x, v.y, r, attr)))
			return s()
		})
		return this
	}

	clip(id?: string) {
		if (id) return this.g(id, { 'style': `clip-path: url(#clip${this.id});`})
		else return this.g(undefined, { 'clip-path': `url(#clip${this.id})` })
	}

	clipEnd() {
		return this.gEnd()
	}

	// for now canvas coordinates
	clipPath(id: string, p: Point[]) {
		this.renderers.push(() => {
			p = scale(this.geo, ...p)
			return svgClipPath(id, svgPolygonPath(p))
		})
		return this
	}

	dash(points:Point[],
		attributes = {}) {
		this.expandAuto(...points)
		this.renderers.push(() => {
			points = scale(this.geo, ...points)
			let path = new Path()
			for (let i = 0; i < points.length; i+=2) { 
				path.MoveTo(points[i])
				path.LineTo(points[i+1])
			}
			return svgPath(path, attributes)
		})
		return this
	}

	// radii in pixels! use negative radii for cases to use a scaled radius?
	ellipse(cx:number, cy:number, rx:number, ry:number, attr: SVGAttributes = {}) {
		let c: Point = { x:cx, y:cy }
		this.expandAuto(c)
		this.renderers.push(() => {
			c = scale(this.geo, c)[0]
			return svgEllipse(c.x, c.y, rx, ry, attr)
		})
		return this
	}

	// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
	foreignObject(innerHTML:string, x:number, y:number, width:number, height:number, attr: SVGAttributes = {}) {
		let p1: Point = { x, y }
		let p2: Point = { x: x + width, y: y + height }
		if (p1.x > p2.x) [p1.x, p2.x] = [p2.x, p1.x]
		if (p1.y < p2.y) [p1.y, p2.y] = [p2.y, p1.y]
		this.expandAuto(p1, p2)
		this.renderers.push(() => {
			let [{ x, y }, { x: x1, y: y1 }] = scale(this.geo, p1, p2)
			return svgForeignObject(innerHTML, x, y, x1 -x, y1 - y, attr)
		})
		return this
	}

	/**
	 * 
	 * Adds a new frame, and set the pointers right for the linked list
	 * 
	 * @param id  Frame identifier
	 * @param geoFrame Frame geometric properties
	 * @param frameOptions Frame rendering options
	 */
	frame(id, geoFrame: FrameGeometry, frameOptions = {}) {
		// inherit canvas width and height
		// set these as separate parameters,  just as head?
		let geo = {
			canvasWidth: this.geo.canvasWidth,
			canvasHeight: this.geo.canvasHeight,
			...geoFrame
		}
		let f = new Frame(id, geo, frameOptions)
		this.next = f
		f.head = this.head
		return f
	}

	/**
	 * Draw Frame's background and or outline. 
	 * @param opt optional style attributes
	 */
	frameArea(opt = {}) {
		this.renderers.push(() => {
			let p:any = [
				{ x: this.geo.xMin, y: this.geo.yMin },
				{ x: this.geo.xMax, y: this.geo.yMax }
			]
			let [{ x: x0, y: y0 }, { x: x1, y: y1 }] = scale(this.geo, ...p)
			return svgRect(x0, y0, x1 - x0, y1 - y0, opt)
		})
		return this
	}

	/**
	 * Defines a clip path corresponding with the area of the current frame.
	 * This is used in the constructor to create a clip path with the frame id
	 * surrounded by underscores.
	 * 
	 * @param id Path identifier
	 */
	frameClipPath(id: string) {
		this.renderers.push(() => {
			let p: any = [
				{ x: this.geo.xMin, y: this.geo.yMin },
				{ x: this.geo.xMax, y: this.geo.yMin },
				{ x: this.geo.xMax, y: this.geo.yMax },
				{ x: this.geo.xMin, y: this.geo.yMax }
			]
			let q = scale(this.geo, ...p)
			return svgClipPath(id, svgPolygonPath(q))
		})
		return this

	}

	g(id?: string, opt = {}) {
		this.renderers.push(() => svgGroup(id, opt))
		return this
	}

	gEnd() {
		this.renderers.push(() => `</g>`)
		return this
	}

	/**
	 * 
	 * Plot grid lines, with spacing dx and dy. The lines will be aligned to
	 * the data: so if the data ranges from 8 to 93, and a spacing of 10 is
	 * specified, the lines will be plot at locations 10, 20 through 90.
	 * 
	 */
	grid(dx, dy, opt = {}) {
		let attributes = {
			stroke: "lightgrey",
			'stroke-width': "0.4",
			...opt
		}
		this.renderers.push(() => {
			if (this.renderers.length === (this.preAmbleLength + 1)) {
				// Nothing rendered yet. Can not use xMinAuto in this case.
				this.geo.xMin = this.geo.left
				this.geo.yMin = this.geo.bottom
				this.geo.xMax = this.geo.left + this.geo.width
				this.geo.yMax = this.geo.bottom + this.geo.height
			}
			let path = new Path
			if (dx>0) for (let x = this.geo.xMin! - Math.abs(this.geo.xMin! % dx) + dx; x < this.geo.xMax!; x += dx) {
				path.MoveTo(scale(this.geo, { x, y: this.geo.yMin! })[0])
				path.LineTo(scale(this.geo, { x, y: this.geo.yMax! })[0])
			}
			if (dy>0) for (let y = this.geo.yMin! - Math.abs(this.geo.yMin! % dy) + dy; y < this.geo.yMax!; y += dy) {
				path.MoveTo(scale(this.geo, { x: this.geo.xMin!, y })[0])
				path.LineTo(scale(this.geo, { x: this.geo.xMax!, y })[0])
			}

			return svgPath(path, attributes)
		})
		return this
	}

	image(href:string, x:number, y:number, width:number, height:number, attr: SVGAttributes = {}) {
		let p1: Point = { x, y }
		let p2: Point = { x: x + width, y: y + height }
		if (p1.x > p2.x) [p1.x, p2.x] = [p2.x, p1.x]
		if (p1.y < p2.y) [p1.y, p2.y] = [p2.y, p1.y]
		this.expandAuto(p1, p2)
		this.renderers.push(() => {
			let [{ x, y }, { x: x1, y: y1 }] = scale(this.geo, p1, p2)
			return svgImage(href, x, y, x1 -x, y1 - y, attr)
		})
		return this
	}

	// label text with line between point and  text
	// angle in degrees, l in pixels
	label(x, y, l, angle, strText: string, opt: SVGAttributes = {}) {
		angle *= Math.PI/180	
		const p = [{x,y}]
		this.renderers.push(() => {
			const q = scale(this.geo, ...p)[0]
			const s = stringStack()
			const [x2,y2] = [q.x+l*Math.cos(angle), q.y-l*Math.sin(angle)]
			s(svgLine(q.x, q.y, x2, y2, {stroke:"black", 'stroke-width':"0.5",  ...opt}))
			delete opt.stroke
			delete opt['stroke-width']
			s(svgText(x2, y2, strText, opt))
			return s()
		})
		return this
	}

	line(xb, yb, xe, ye, opt: SVGAttributes = {}) {
		let p1: Point = { x: xb, y: yb }
		let p2: Point = { x: xe, y: ye }
		this.expandAuto(p1, p2)
		this.renderers.push(() => {
			[p1, p2] = scale(this.geo, p1, p2);
			return svgLine(p1.x, p1.y, p2.x, p2.y, opt)
		})
		return this
	}

	svgPolyline(points: Point[], attributes = {}) {
		points = scale(this.geo, ...points)
		let path = new Path()
		for (let i = 0; i < points.length; i++) path.To(points[i])
		return svgPoly("polyline", path, attributes)
	}

	polyline(points: Point[], attributes = {}) {
		this.expandAuto(...points)
		this.renderers.push(() => {
			return this.svgPolyline(points, attributes)
		})
		return this
	}

	polylineArray(x: ArrayLike<number>, y: ArrayLike<number>, opt:SVGAttributes = {}) {
		return this.polyline(toPoints(x, y), opt)
	}

	polygon(points: Point[],
		attributes = {}) {
		this.expandAuto(...points)
		this.renderers.push(() => {
			points = scale(this.geo, ...points)
			let path = new Path()
			for (let i = 0; i < points.length; i++) path.To(points[i])
			return svgPoly("polygon", path, attributes)
		})
		return this
	}

	polygonArray(x: ArrayLike<number>, y: ArrayLike<number>, opt = {}) {
		return this.polygon(toPoints(x, y), opt)
	}

	// rx and ry in pixels
	rect(x, y, width, height, opt = {}) {
		let p1: Point = { x, y }
		let p2: Point = { x: x + width, y: y + height }
		if (p1.x > p2.x) [p1.x, p2.x] = [p2.x, p1.x]
		if (p1.y > p2.y) [p1.y, p2.y] = [p2.y, p1.y]
		this.expandAuto(p1, p2)
		this.renderers.push(() => {
			let [{ x, y }, { x: x1, y: y1 }] = scale(this.geo, p1, p2)
			return svgRect(x, y, x1 - x, y1 - y, opt)
		})
		return this
	}

	svgRect(x:number , y:number, width:number, height:number, opt = {}) {
		let p1: Point = { x, y }
		let p2: Point = { x: x + width, y: y + height }
		if (p1.x > p2.x) [p1.x, p2.x] = [p2.x, p1.x]
		if (p1.y > p2.y) [p1.y, p2.y] = [p2.y, p1.y]
		let [{ x: x0, y: y0 }, { x: x1, y: y1 }] = scale(this.geo, p1, p2)
		return svgRect(x0, y0, x1 - x0, y1 - y0, opt)
	}

	renderFrame() {
		// Building up the output, one line at a time, by calling each of 
		// the renderers, and pushing those on top of the string.
		let s : any = []
		for (let p of this.renderers) s.push(p())
		s.push("</g>")
		return s.join('\n')
	}

	render() {
		let svgString: any = []
		svgString.push(svgHeader(this.head!.geo.canvasWidth, this.head!.geo.canvasHeight, this.head!.css))

		let frame = this.head
		while (frame) {
			svgString.push(frame.renderFrame())
			frame = frame.next

		}
		svgString.push(`</svg>`)
		return svgString.join("\n")
	}

	text(x, y, strText: string, opt: SVGAttributes = {}) {
		//		this.expandAuto({x,y})
		this.renderers.push(() => {
			({ x, y } = scale(this.geo, { x, y })[0])
			return svgText(x, y, strText, opt)
		})
		return this
	}


	textRotated(x, y, angle,  strText: string, opt: SVGAttributes = {}) {
		//		this.expandAuto({x,y})
		this.renderers.push(() => {
			({ x, y } = scale(this.geo, { x, y })[0])
			return svgTextRotated(x, y, angle,  strText, opt)
		})
		return this
	}


	ticks(dx, dy, size, opt = {}) {
		let attributes = {
			stroke: "black",
			'stroke-width': "1",
			...opt
		}
		this.renderers.push(() => {
			if (this.renderers.length === (this.preAmbleLength + 1)) {
				// Nothing rendered yet. Can not use xMinAuto in this case.
				this.geo.xMin = this.geo.left
				this.geo.yMin = this.geo.bottom
				this.geo.xMax = this.geo.left + this.geo.width
				this.geo.yMax = this.geo.bottom + this.geo.height
			}
			let path = new Path
			if (dx>0) for (let x = this.geo.xMin! - Math.abs(this.geo.xMin! % dx) + dx; x < this.geo.xMax!; x += dx) {
				let xy  = scale(this.geo, {x,y:this.geo.yMin!})[0]
				path.MoveTo(xy)
				path.LineTo({x: xy.x, y: xy.y + size})
			}
			if (dy>0) for (let y = this.geo.yMin! - Math.abs(this.geo.yMin! % dy) + dy; y < this.geo.yMax!; y += dy) {
				let xy  = scale(this.geo, {x: this.geo.xMin!,y})[0]
				path.MoveTo(xy)
				path.LineTo({x: xy.x - size, y: xy.y})
			}

			return svgPath(path, attributes)
		})
		return this
	}

	private expandAuto(...xys: Point[]) {
		for (let xy of xys) {
			if (this.autoXMin && xy.x < this.geo.xMin!) this.geo.xMin = xy.x
			if (this.autoXMax && xy.x > this.geo.xMax!) this.geo.xMax = xy.x
			if (this.autoYMin && xy.y < this.geo.yMin!) this.geo.yMin = xy.y
			if (this.autoYMax && xy.y > this.geo.yMax!) this.geo.yMax = xy.y
		}
	}


}


export function SVG(canvasWidth = 600, canvasHeight = 400, css: SVGAttributes = {}) {
	let frame = new Frame(
		"canvas",
		{
			canvasWidth,
			canvasHeight,
			left: 0,
			bottom: 0,
			width: 100,
			height: 100,
			xMin: 0,
			xMax: canvasWidth,
			yMin: 0,
			yMax: canvasHeight,
		},
		{
			fill: "beige",
			stroke: "lightgray",
			'stroke-width': "0.4",
			...css
		}
	)
	frame.head = frame // set this frame as head of the linked list
	return frame
}


function oneLine(strings, ...values) {
	let output = new Array(Math.max(strings.length, values.length))
	values.forEach( (v,i) =>  output[i] = strings[i] + v )
	if (strings.length > values.length) output.push(strings[values.length]); // strings is 1 larger than values
	return output.join('').replace(/\s+/gm, ' ').trim();
  }

 function CubicSplineInterpolator(xs: ArrayLike<number>, ys: ArrayLike<number>) {
	let ks = new Float64Array(xs.length)
	const n = xs.length - 1;
	const A: Float64Array[] = []
	for (let i = 0; i < (n + 1); i++) A.push(new Float64Array(n + 2))

	for (let i = 1; i < n; i++) {
		A[i][i - 1] = 1 / (xs[i] - xs[i - 1])
		A[i][i] = 2 * (1 / (xs[i] - xs[i - 1]) + 1 / (xs[i + 1] - xs[i]))
		A[i][i + 1] = 1 / (xs[i + 1] - xs[i])
		A[i][n + 1] = 3 * (
			(ys[i] - ys[i - 1]) / ((xs[i] - xs[i - 1]) * (xs[i] - xs[i - 1])) +
			(ys[i + 1] - ys[i]) / ((xs[i + 1] - xs[i]) * (xs[i + 1] - xs[i]))
		)
	}

	A[0][0] = 2 / (xs[1] - xs[0]);
	A[0][1] = 1 / (xs[1] - xs[0]);
	A[0][n + 1] = (3 * (ys[1] - ys[0])) / ((xs[1] - xs[0]) * (xs[1] - xs[0]));
	A[n][n - 1] = 1 / (xs[n] - xs[n - 1]);
	A[n][n] = 2 / (xs[n] - xs[n - 1]);
	A[n][n + 1] = (3 * (ys[n] - ys[n - 1])) / ((xs[n] - xs[n - 1]) * (xs[n] - xs[n - 1]));

	ks = solve(A, ks);

	return (x0: number, dx: number, Nx: number, scale = 1.0) => {
		let v = new Float64Array(Nx)
		let i = 1
		for (let x = x0, j = 0; j < Nx; j++ , x += dx) {
			while (xs[i] < x) i++;
			const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
			const a = ks[i - 1] * (xs[i] - xs[i - 1]) - (ys[i] - ys[i - 1]);
			const b = -ks[i] * (xs[i] - xs[i - 1]) + (ys[i] - ys[i - 1]);
			const q = (1 - t) * ys[i - 1] + t * ys[i] + t * (1 - t) * (a * (1 - t) + b * t);
			v[j] = q * scale;
		}
		return v
	}
}

function solve(A, ks) {
	let m = A.length;
	for (let k = 0; k < m; k++) {
		let i_max = 0;
		let val = Number.NEGATIVE_INFINITY;
		for (let i = k; i < m; i++)
			if (A[i][k] > val) {
				i_max = i;
				val = A[i][k];
			}
		[A[k], A[i_max]] = [A[i_max], A[k]]
		for (let i = k + 1; i < m; i++) {
			for (let j = k + 1; j < m + 1; j++) {
				A[i][j] = A[i][j] - A[k][j] * (A[i][k] / A[k][k]);
			}
			A[i][k] = 0;
		}
	}
	for (let i = m - 1; i >= 0; i--) {
		const v = A[i][m] / A[i][i];
		ks[i] = v;
		for (let j = i - 1; j >= 0; j--) {
			A[j][m] -= A[j][i] * v;
			A[j][i] = 0;
		}
	}
	return ks;
}

export function* range(start, step, n) {
	for (let i=0, s=start; i<n; i++, s+=step) yield s;
}

function round(value:number, precision:number){
	let t = 10**precision
	return Math.round(value*t)/t
}