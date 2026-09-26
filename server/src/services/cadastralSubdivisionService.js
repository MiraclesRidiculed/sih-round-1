import { createHash } from "node:crypto";
import polygonClipping from "polygon-clipping";

const EARTH_RADIUS_METERS = 6378137;
const SQUARE_METERS_PER_ACRE = 4046.8564224;
const GEOMETRY_TOLERANCE = 1e-8;

const invalidGeometry = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "INVALID_PARCEL_GEOMETRY";
  return error;
};

const validatePosition = (position) =>
  Array.isArray(position) &&
  position.length >= 2 &&
  Number.isFinite(position[0]) &&
  Number.isFinite(position[1]) &&
  position[0] >= -180 &&
  position[0] <= 180 &&
  position[1] >= -90 &&
  position[1] <= 90;

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

const onSegment = (a, b, point) =>
  Math.abs(cross(a, b, point)) <= GEOMETRY_TOLERANCE &&
  point[0] >= Math.min(a[0], b[0]) - GEOMETRY_TOLERANCE &&
  point[0] <= Math.max(a[0], b[0]) + GEOMETRY_TOLERANCE &&
  point[1] >= Math.min(a[1], b[1]) - GEOMETRY_TOLERANCE &&
  point[1] <= Math.max(a[1], b[1]) + GEOMETRY_TOLERANCE;

const segmentsIntersect = (a, b, c, d) => {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC * abD < -GEOMETRY_TOLERANCE && cdA * cdB < -GEOMETRY_TOLERANCE) return true;
  return (
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
};

const validateRing = (ring, ringIndex) => {
  if (!Array.isArray(ring) || ring.length < 4 || !ring.every(validatePosition)) {
    throw invalidGeometry(`Polygon ring ${ringIndex + 1} must contain at least four valid WGS84 positions.`);
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    throw invalidGeometry(`Polygon ring ${ringIndex + 1} must be closed.`);
  }

  const vertices = ring.slice(0, -1);
  if (new Set(vertices.map((point) => `${point[0]},${point[1]}`)).size < 3) {
    throw invalidGeometry(`Polygon ring ${ringIndex + 1} must have at least three distinct vertices.`);
  }

  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index];
    const b = vertices[(index + 1) % vertices.length];
    if (a[0] === b[0] && a[1] === b[1]) {
      throw invalidGeometry(`Polygon ring ${ringIndex + 1} must not contain zero-length edges.`);
    }
    if (Math.abs(a[0] - b[0]) > 180) {
      throw invalidGeometry("Polygons crossing the antimeridian are not supported for subdivision.");
    }

    for (let other = index + 1; other < vertices.length; other += 1) {
      if (other === index + 1 || (index === 0 && other === vertices.length - 1)) continue;
      if (segmentsIntersect(a, b, vertices[other], vertices[(other + 1) % vertices.length])) {
        throw invalidGeometry(`Polygon ring ${ringIndex + 1} self-intersects.`);
      }
    }
  }

  if (Math.abs(signedRingArea(ring)) <= GEOMETRY_TOLERANCE) {
    throw invalidGeometry(`Polygon ring ${ringIndex + 1} has zero area.`);
  }
};

const signedRingArea = (ring) => {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [longitudeA, latitudeA] = ring[index];
    const [longitudeB, latitudeB] = ring[index + 1];
    const deltaLongitude = ((longitudeB - longitudeA) * Math.PI) / 180;
    const latitudeARadians = (latitudeA * Math.PI) / 180;
    const latitudeBRadians = (latitudeB * Math.PI) / 180;
    sum += deltaLongitude * (2 + Math.sin(latitudeARadians) + Math.sin(latitudeBRadians));
  }
  return (sum * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2;
};

const pointInRing = (point, ring) => {
  let inside = false;
  for (let index = 0, previous = ring.length - 2; index < ring.length - 1; previous = index, index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[previous];
    const crosses = y1 > point[1] !== y2 > point[1] &&
      point[0] < ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1;
    if (crosses) inside = !inside;
  }
  return inside;
};

const pointInPolygon = (point, coordinates) =>
  pointInRing(point, coordinates[0]) && !coordinates.slice(1).some((ring) => pointInRing(point, ring));

const validateGeometry = (geoJson) => {
  const geometry = geoJson?.type === "Feature" ? geoJson.geometry : geoJson;
  if (geometry?.type !== "Polygon" || !Array.isArray(geometry.coordinates) || !geometry.coordinates.length) {
    throw invalidGeometry("Subdivision requires a GeoJSON Polygon geometry.");
  }

  geometry.coordinates.forEach(validateRing);
  const [outerRing, ...holes] = geometry.coordinates;
  holes.forEach((ring, index) => {
    if (!pointInRing(ring[0], outerRing)) {
      throw invalidGeometry(`Polygon hole ${index + 1} must be inside the exterior ring.`);
    }
    for (let first = 0; first < ring.length - 1; first += 1) {
      for (let second = 0; second < outerRing.length - 1; second += 1) {
        if (segmentsIntersect(ring[first], ring[first + 1], outerRing[second], outerRing[second + 1])) {
          throw invalidGeometry(`Polygon hole ${index + 1} intersects the exterior ring.`);
        }
      }
    }
    for (let other = 0; other < index; other += 1) {
      const otherRing = holes[other];
      if (pointInRing(ring[0], otherRing) || pointInRing(otherRing[0], ring)) {
        throw invalidGeometry("Polygon interior rings must not overlap or contain one another.");
      }
      for (let first = 0; first < ring.length - 1; first += 1) {
        for (let second = 0; second < otherRing.length - 1; second += 1) {
          if (segmentsIntersect(ring[first], ring[first + 1], otherRing[second], otherRing[second + 1])) {
            throw invalidGeometry("Polygon interior rings must not intersect.");
          }
        }
      }
    }
  });
  return geometry;
};

const areaSquareMeters = (coordinates) => {
  const [outerRing, ...holes] = coordinates;
  return Math.abs(signedRingArea(outerRing)) - holes.reduce((total, ring) => total + Math.abs(signedRingArea(ring)), 0);
};

const toMultiPolygon = (coordinates) => [coordinates];

const makeHalfPlane = (axis, edge, isFirstPart, min, max) => {
  const low = axis === 0 ? min[0] - 1 : min[1] - 1;
  const high = axis === 0 ? max[0] + 1 : max[1] + 1;
  const otherLow = axis === 0 ? min[1] - 1 : min[0] - 1;
  const otherHigh = axis === 0 ? max[1] + 1 : max[0] + 1;
  const point = (value, other) => axis === 0 ? [value, other] : [other, value];
  const rectangle = isFirstPart
    ? [point(low, otherLow), point(edge, otherLow), point(edge, otherHigh), point(low, otherHigh), point(low, otherLow)]
    : [point(edge, otherLow), point(high, otherLow), point(high, otherHigh), point(edge, otherHigh), point(edge, otherLow)];
  return [[rectangle]];
};

const clipAt = (parent, axis, edge, bounds) => {
  const first = polygonClipping.intersection(
    parent,
    makeHalfPlane(axis, edge, true, bounds.min, bounds.max)
  );
  const second = polygonClipping.intersection(
    parent,
    makeHalfPlane(axis, edge, false, bounds.min, bounds.max)
  );
  return [first, second];
};

const getSinglePolygonPair = (multiA, multiB) => {
  if (multiA.length !== 1 || multiB.length !== 1) return null;
  return [multiA[0], multiB[0]];
};

const splitOnAxis = (parentCoordinates, ratio, axis) => {
  const vertices = parentCoordinates.flat(1);
  const xs = vertices.map((point) => point[axis]);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const otherAxis = axis === 0 ? 1 : 0;
  const otherValues = vertices.map((point) => point[otherAxis]);
  const bounds = {
    min: axis === 0 ? [min, Math.min(...otherValues)] : [Math.min(...otherValues), min],
    max: axis === 0 ? [max, Math.max(...otherValues)] : [Math.max(...otherValues), max]
  };
  const parent = toMultiPolygon(parentCoordinates);
  const parentArea = areaSquareMeters(parentCoordinates);
  if (!Number.isFinite(parentArea) || parentArea <= 0) {
    throw invalidGeometry("The parcel polygon must have positive area after accounting for interior rings.");
  }
  let low = min;
  let high = max;
  let best = null;

  for (let iteration = 0; iteration < 64; iteration += 1) {
    const edge = (low + high) / 2;
    const clipped = clipAt(parent, axis, edge, bounds);
    const pair = getSinglePolygonPair(clipped[0], clipped[1]);
    if (!pair) {
      if (!best) {
        if (iteration < 32) low = edge;
        else high = edge;
        continue;
      }
      break;
    }

    const areaA = areaSquareMeters(pair[0]);
    const fraction = areaA / parentArea;
    best = { pair, edge, fraction };
    if (Math.abs(fraction - ratio) < 1e-9) break;
    if (fraction < ratio) low = edge;
    else high = edge;
  }

  if (!best || Math.abs(best.fraction - ratio) > 1e-5) return null;
  return best;
};

const roundGeometry = (coordinates) =>
  coordinates.map((ring) => ring.map((position) => position.map((value) => Number(value.toFixed(10)))));

const getSplitSegments = (coordinates, axis, edge) => {
  const crossings = [];
  for (const ring of coordinates) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      const first = ring[index];
      const second = ring[index + 1];
      const firstAxis = first[axis];
      const secondAxis = second[axis];
      if ((firstAxis < edge && secondAxis >= edge) || (secondAxis < edge && firstAxis >= edge)) {
        const ratio = (edge - firstAxis) / (secondAxis - firstAxis);
        const otherAxis = axis === 0 ? 1 : 0;
        crossings.push(first[otherAxis] + ratio * (second[otherAxis] - first[otherAxis]));
      }
    }
  }

  const uniqueCrossings = [...new Set(crossings.map((value) => Number(value.toFixed(12))))].sort((a, b) => a - b);
  const segments = [];
  for (let index = 0; index < uniqueCrossings.length - 1; index += 1) {
    const start = uniqueCrossings[index];
    const end = uniqueCrossings[index + 1];
    const middle = (start + end) / 2;
    const midpoint = axis === 0 ? [edge, middle] : [middle, edge];
    if (!pointInPolygon(midpoint, coordinates)) continue;
    const first = axis === 0 ? [edge, start] : [start, edge];
    const second = axis === 0 ? [edge, end] : [end, edge];
    segments.push([first, second]);
  }
  return segments;
};

const createChildIdentifier = (parentIdentifier, part, coordinates) => {
  const stableGeometry = JSON.stringify(roundGeometry(coordinates));
  const digest = createHash("sha256")
    .update(`${parentIdentifier}|${part}|${stableGeometry}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `${parentIdentifier}-CH-${part}-${digest}`;
};

const geometryFeature = (coordinates, properties) => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates },
  properties
});

export const splitParcelPolygon = (geoJson, splitRatio, parentIdentifier) => {
  const geometry = validateGeometry(geoJson);
  if (!Number.isFinite(splitRatio) || splitRatio <= 0 || splitRatio >= 1) {
    throw invalidGeometry("Split ratio must be a finite value greater than 0 and less than 1.");
  }
  if (typeof parentIdentifier !== "string" || !parentIdentifier.trim()) {
    throw invalidGeometry("A parent parcel identifier is required to derive child identifiers.");
  }

  let split = splitOnAxis(geometry.coordinates, splitRatio, 0);
  let axis = 0;
  if (!split) {
    split = splitOnAxis(geometry.coordinates, splitRatio, 1);
    axis = 1;
  }
  if (!split) {
    throw invalidGeometry("This split would create disconnected or invalid child polygons; choose a different split ratio or boundary geometry.");
  }

  const [coordinatesA, coordinatesB] = split.pair.map(roundGeometry);
  validateGeometry({ type: "Polygon", coordinates: coordinatesA });
  validateGeometry({ type: "Polygon", coordinates: coordinatesB });
  const parentArea = areaSquareMeters(geometry.coordinates);
  const areaA = areaSquareMeters(coordinatesA);
  const areaB = areaSquareMeters(coordinatesB);
  const containmentA = polygonClipping.intersection(toMultiPolygon(geometry.coordinates), [coordinatesA]);
  const containmentB = polygonClipping.intersection(toMultiPolygon(geometry.coordinates), [coordinatesB]);
  const overlap = polygonClipping.intersection([coordinatesA], [coordinatesB]);
  const overlapArea = overlap.reduce((total, polygon) => total + areaSquareMeters(polygon), 0);
  const containedArea = areaA + areaB;
  const relativeAreaError = Math.abs(containedArea - parentArea) / parentArea;

  if (
    containmentA.length !== 1 ||
    containmentB.length !== 1 ||
    Math.abs(areaSquareMeters(containmentA[0]) - areaA) > parentArea * 1e-8 ||
    Math.abs(areaSquareMeters(containmentB[0]) - areaB) > parentArea * 1e-8 ||
    overlapArea > parentArea * 1e-8 ||
    relativeAreaError > 1e-6
  ) {
    throw invalidGeometry("Calculated child geometries failed containment or area-conservation validation.");
  }

  const splitSegments = getSplitSegments(geometry.coordinates, axis, split.edge);
  if (!splitSegments.length) {
    throw invalidGeometry("The calculated split line does not intersect the parcel interior.");
  }
  const splitLine = splitSegments.length === 1
    ? { type: "LineString", coordinates: splitSegments[0] }
    : { type: "MultiLineString", coordinates: splitSegments };
  const partData = [
    { part: "A", coordinates: coordinatesA, areaSquareMeters: areaA },
    { part: "B", coordinates: coordinatesB, areaSquareMeters: areaB }
  ].map(({ part, coordinates, areaSquareMeters: area }) => {
    const childIdentifier = createChildIdentifier(parentIdentifier, part, coordinates);
    return {
      part,
      childIdentifier,
      identifierType: "PROJECT_DETERMINISTIC_CHILD_IDENTIFIER",
      parentIdentifier,
      geoJson: geometryFeature(coordinates, { parentIdentifier, childIdentifier, part }),
      areaSquareMeters: area,
      areaInAcres: area / SQUARE_METERS_PER_ACRE,
      sharePercent: (area / parentArea) * 100
    };
  });

  return {
    algorithm: "WGS84 planar clipping with geodesic area apportionment",
    identifierAlgorithm: "SHA-256 of parent identifier, part, and rounded child geometry; project identifier only, not an official ULPIN",
    splitAxis: axis === 0 ? "longitude" : "latitude",
    splitLine,
    parentAreaSquareMeters: parentArea,
    parentAreaInAcres: parentArea / SQUARE_METERS_PER_ACRE,
    children: partData
  };
};
