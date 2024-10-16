import { LatLng } from "./generated";

interface GResponse {
    routes: GRoute[];
}

interface GRoute {
    legs: GLeg[];
}

interface GLeg {
    steps: GStep;
}

interface GStep {
}

export class Geo {
    private cached: Cached[] = [];

    constructor(private token: string) {}

    async get(from: LatLng, to: LatLng): Promise<LatLng[]> {
        console.log("Getting directions");

        const url = `https://maps.googleapis.com/maps/api/directions/json?destination=${to.lat},${to.lng}&origin=${from.lat},${from.lng}&key=${this.token}`;
        
        const resp = await fetch(url);
        const json = await resp.json() as GResponse;
        const points = Decode(json.routes[0].legs[0].steps);
        return points;
    }
}

function Decode(t: any): LatLng[] {
    let points = [];
		for (let step of t) {
			let encoded = step.polyline.points;
			let index = 0, len = encoded.length;
			let lat = 0, lng = 0;
			while (index < len) {
				let b, shift = 0, result = 0;
				do {
					b = encoded.charAt(index++).charCodeAt(0) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);

				let dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
				lat += dlat;
				shift = 0;
				result = 0;
				do {
					b = encoded.charAt(index++).charCodeAt(0) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				let dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
				lng += dlng;

				points.push({ lat: (lat / 1E5), lng: (lng / 1E5) });
			}
		}
		return points;
}

interface Cached {

}
