import * as THREE from "three";

export function createAGrid(opts: {
	height: number;
	width: number;
	stepHeight: number;
	stepWidth: number;
	color: number;
}): THREE.Object3D {
	var config = opts;
	const points = [];

	var material = new THREE.LineBasicMaterial({
		color: config.color,
		transparent: true,
		opacity: 0.2,
	});

	var gridObject = new THREE.Object3D();
	var stepw = config.stepWidth;
	var steph = config.stepHeight;

	var width = config.width / 2;
	var height = config.height / 2;

	// Add horizontal lines
	for (let i = -height; i <= height; i += steph) {
		points.push(new THREE.Vector3(-width, 0, i));
		points.push(new THREE.Vector3(width, 0, i));
	}

	// Add vertical lines
	for (let i = -width; i <= width; i += stepw) {
		points.push(new THREE.Vector3(i, 0, -height));
		points.push(new THREE.Vector3(i, 0, height));
	}

	var gridGeo = new THREE.BufferGeometry().setFromPoints(points);
	var line = new THREE.LineSegments(gridGeo, material);

	gridObject.add(line);
	return gridObject;
}

export function createAnArrow(
	end: THREE.Vector3,
	start: THREE.Vector3,
	thickness: number,
	color: number,
): THREE.Object3D {
	var material = new THREE.MeshLambertMaterial({ color: color });

	var length = end.distanceTo(start);

	var ARROW_BODY = new THREE.CylinderGeometry(1, 1, 1, 12);
	ARROW_BODY = ARROW_BODY.rotateX(Math.PI / 2).translate(0, 0, 0.5);

	var ARROW_HEAD = new THREE.ConeGeometry(1, 1, 12);
	ARROW_HEAD = ARROW_HEAD.rotateX(Math.PI / 2);
	ARROW_HEAD = ARROW_HEAD.translate(0, 0, -0.5);

	var body = new THREE.Mesh(ARROW_BODY, material);
	body.scale.set(thickness, thickness, length - 10 * thickness);

	var head = new THREE.Mesh(ARROW_HEAD, material);
	head.position.set(0, 0, length);
	head.scale.set(3 * thickness, 3 * thickness, 10 * thickness);

	var arrow = new THREE.Group();
	arrow.position.set(start.x, start.y, start.z);
	arrow.lookAt(end.x, end.y, end.z);
	arrow.add(body, head);

	return arrow;
}
