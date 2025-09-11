// JavaScript CAD Script
// 3D Primitives
const myCube = cube([10, 10, 10]);
const mySphere = sphere(5);
const myCylinder = cylinder(3, 8);

// 2D Shapes
const myRectangle = rectangle(8, 6);
const myCircle = circle(4);
const myPolygon = polygon([[0, 0], [4, 0], [2, 4]]);

// Extrusion
const extrudedRect = linear_extrude(myRectangle, 5);
const rotatedShape = rotate_extrude(myCircle, 2 * Math.PI);

// Transformations
translate(mySphere, [15, 0, 0]);
rotate(myCube, [0, 0, Math.PI/4]);
scale(myCylinder, [2, 1, 1]);