import { LatLng } from "./generated/graphql";

const deg2rad = (deg: number) => {
  return deg * (Math.PI/180)
}

export const getDistance = (pointA: LatLng, pointB: LatLng) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(pointB.lat - pointA.lat);
  const dLng = deg2rad(pointB.lng - pointA.lng);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(pointA.lat)) * Math.cos(deg2rad(pointB.lat)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}


