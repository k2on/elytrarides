import View from "@/components/View";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { googleMapsApiKey } from "@/const";
import { LatLng, getAvatarLetters, getDistance } from "@/shared";
import { CircleF, DirectionsService, GoogleMap, LoadScript, MarkerF, OVERLAY_MOUSE_TARGET, OverlayViewF, PolylineF } from "@react-google-maps/api";
import { useContext, useEffect, useState } from "react";
import { ContextAdmin, ContextAdminDispatch } from "./context";
import { useProgrammaticCameraMovement } from "@/components/map/hooks";
import { getDriverColor, getReservationStatus } from "./util";
import ActiveStopView from "./map/ActiveStop";
import { AdminActionType } from "./actions";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";
import { Driver, Reservation, ReservationStatus, Strategy } from "./types";
import { ANY, ReservationFilter } from "./all/columns";

const ICON_CANCELLED =
    "https://staticnode.batchgeo.com/marker/svg?type=pushpinPlain&size=20&fill=red&stroke=black&text=";
const ICON_COMPLETE =
    "https://staticnode.batchgeo.com/marker/svg?type=pushpinPlain&size=20&fill=green&stroke=black&text=";
const ICON_WAITING =
    "https://staticnode.batchgeo.com/marker/svg?type=pushpinPlain&size=20&fill=blue&stroke=black&text=";
const ICON_ACTIVE =
    "https://staticnode.batchgeo.com/marker/svg?type=pushpinPlain&size=20&fill=white&stroke=black&text=";


type DriverMap<T> = {[k: number]: T};
interface DirectionsRequestProps {
    origin: LatLng;
    destination: LatLng;
    travelMode: google.maps.TravelMode;
}

interface DirectionsServiceOptions {
    requestOptions: DirectionsRequestProps,
    callback: (res: any) => void;
}

export interface FilteredStop {
    id_reservation: string;
    madeAt: Date;
    location: LatLng;
    status: ReservationStatus;
}

function getFilteredStops(reservations: Reservation[], filter: ReservationFilter, strategy: Strategy | null): FilteredStop[] {
    const applyFilter = (stop: FilteredStop) => {
        if (stop.status != filter.status && filter.status != ANY) return false;
        return true;
    }

    return reservations.flatMap(res => res.stops.map(stop => ({
        id_reservation: res.id,
        madeAt: new Date(res.madeAt * 1000),
        location: { lat: stop.locationLat, lng: stop.locationLng },
        status: getReservationStatus(res, strategy),
    }))).filter(applyFilter);
}

export default function Map() {
    const { strategy, event, mapCenter, filter, focusedReservation } = useContext(ContextAdmin)!;
    const dispatch = useContext(ContextAdminDispatch)!;

    const [center, setCenter] = useState(mapCenter);

    const [isFreemove, setIsFreemove] = useState(false);
    const [map, setMap] = useState<google.maps.Map>();
    const [firstLoad, setFirstLoad] = useState(true);

    const [paths, setPaths] = useState<DriverMap<google.maps.LatLngLiteral[]>>({});
    const [_travelledPaths, setTravelledPaths] = useState<DriverMap<google.maps.LatLngLiteral[]>>([]);
    const [requests, setRequests] = useState<DriverMap<DirectionsRequestProps | null>>({});
    const [directionsServiceOptions, setDirectionsServiceOptions] = useState<DriverMap<DirectionsServiceOptions>>({});

    const location = event?.location;
    const stops = event && getFilteredStops(event.reservations, filter, strategy) || [];

    console.log("stops", stops);

    const directions_callback = (driverId: number) => (res: any) => {
        if (!res) return;
        if (res.status != "OK") { return console.error("res", res); }
        setPaths({...paths, ...{[driverId]: res.routes[0].overview_path.map((latLng: any) => ({
          lat: latLng.lat(),
          lng: latLng.lng()
        }))}});
    }

    useEffect(() => {
        strategy?.drivers.forEach(driver => {
            if (!driver.ping) return;
            if (!driver.dest) return;
            if (!event?.location) return console.error("no location");

            const proximity_threshold = 0.1;
            const proximity_threshold_directions = 0.4;

            const path = paths[driver.driver.id] || [];

            for (let i = 0; i < path.length; i++) {
              if (getDistance(driver.ping.location, path[i]) < proximity_threshold) {
                setTravelledPaths({..._travelledPaths, ...{[driver.driver.id]: [...path.slice(0, i + 1)]}});
                setPaths({...paths, ...{[driver.driver.id]: [...path.slice(i + 1)]}});
                break;
              }
            }

            let isOffCourse = true;
            for (let i = 0; i < path.length; i++) {
                const dist = getDistance(driver.ping.location, path[i]);
                if (dist < proximity_threshold_directions) {
                    isOffCourse = false;
                    break;
                }
            }

            // isOffCourse = false;

            if (isOffCourse && requests[driver.driver.id]?.origin.lat != driver.ping.location.lat) {
                if (!location) return console.warn("No location for is off course");
                setDirectionsServiceOptions({...directionsServiceOptions, ...{[driver.driver.id]: {
                    requestOptions: {
                        origin: driver.ping.location,
                        destination: driver.dest.__typename == "DriverStopEstimationEvent" ? {lat: location.locationLat, lng: location.locationLng} : driver.dest.location.coords,
                        travelMode: google.maps.TravelMode.DRIVING,
                    },
                    callback: directions_callback(driver.driver.id)
                }}})
            }
        })
    }, [strategy])


    useEffect(() => {
        if (!isFreemove) centerCamera();
    }, [map, isFreemove, strategy])

    const [isCameraProgramaticallyChanging, centerCamera] =
        useProgrammaticCameraMovement(() => {
            if (!map) return console.error("map not set");
            if (!strategy) return console.error("strategy not set");
            if (!location) return console.error("location not set");

            setIsFreemove(false);
            const bounds = new window.google.maps.LatLngBounds();

            const points: LatLng[] = focusedReservation == null ? [{ lat: location.locationLat, lng: location.locationLng }, ...strategy.drivers.filter(d => d.ping?.location).map(d => d.ping?.location!), ...stops.map(stop => stop.location)] : event.reservations.find(res => res.id == focusedReservation)!.stops.map(stop => ({ lat: stop.locationLat, lng: stop.locationLng }));

            if (points.length == 1) {
                map.setZoom(focusedReservation == null ? 12 : 18);
                map.setCenter(points[0]);
            } else {
                points.forEach(p => bounds.extend(p));
                map.fitBounds(bounds, {
                    top: 100,
                    left: 100,
                    right: 100,
                    bottom: 100,
                });
            }
        });

    useEffect(() => {
        centerCamera();
    }, [focusedReservation])

    const getPixelPositionOffset = (width: number, height: number) => ({
      x: -(width / 2),
      y: -(height / 2) - 20,
    });

    const getPixelPositionOffsetReservation = (width: number, height: number) => ({
      x: -(width / 2),
      y: -(height / 2) - 60,
    });

    const onDragStart = () => {
        if (!map) return;
        if (!isCameraProgramaticallyChanging && !firstLoad) {
            setIsFreemove(true);
        }
        if (firstLoad) {
            setFirstLoad(false);
        }
    };


    // console.log("map", map);
    // console.log("strat", strategy);

    const getDriver = (id: number): Driver => event?.drivers.find(d => d.id == id)!;

    return <LoadScript mapIds={["e054b907b2c2d1b6"]} googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap
            onLoad={(e) => setMap(e)}
            mapContainerClassName="w-full relative h-full z-10"
            center={center || undefined}
            zoom={14}
            onDragStart={onDragStart}
            onZoomChanged={onDragStart}
            options={{
                disableDefaultUI: true,
                mapId: "e054b907b2c2d1b6",
            }}>
                {location && <CircleF
                    radius={10000}
                    options={{
                        strokeColor: "white",
                        strokeWeight: 2,
                        fillOpacity: 0,
                    }}
                    center={{ lat: location.locationLat, lng: location.locationLng }}
                />}
                {event?.location && <MarkerF position={{ lat: event.location.locationLat, lng: event.location.locationLng }} />}
                {strategy?.drivers.map((driver, idx) => driver.ping && <OverlayViewF
                    position={driver.ping?.location!}
                    mapPaneName={OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={getPixelPositionOffset}>
                    <View className="flex flex-col items-center">
                        <Avatar className="border-2" style={{ borderColor: getDriverColor(idx) }}>
                            <AvatarImage src={getDriver(driver.driver.id).user.imageUrl || ""} alt={getDriver(driver.driver.id).user.name} />
                            <AvatarFallback>{getAvatarLetters(getDriver(driver.driver.id).user.name || "")}</AvatarFallback>
                        </Avatar>
                        <span className="w-0 h-0 block -mt-px" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${getDriverColor(idx)}`}}></span>
                    </View>
                </OverlayViewF>)}
                {stops.map((stop, idx) => <>
                    <MarkerF options={{ optimized: false }} key={Math.random().toString() + " - " + idx} icon={stop.status == ReservationStatus.CANCELLED ? ICON_CANCELLED : stop.status == ReservationStatus.COMPLETE ? ICON_COMPLETE : stop.status == ReservationStatus.WAITING ? ICON_WAITING : ICON_ACTIVE} onClick={() => dispatch({ type: AdminActionType.SET_FOCUSED, id: stop.id_reservation })} position={stop.location} />
                    {(stop.status == ReservationStatus.WAITING || stop.status == ReservationStatus.ACTIVE) && <OverlayViewF
                        position={stop.location} 
                        mapPaneName={OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={getPixelPositionOffsetReservation}>
                            <ActiveStopView stop={stop} />
                    </OverlayViewF>}
                </>)}
                {strategy?.drivers.map((driver, idx) => <div key={`directions-${driver.driver.id}`}>
                    {driver.dest && directionsServiceOptions[driver.driver.id] && <DirectionsService
                        options={directionsServiceOptions[driver.driver.id]!.requestOptions}
                        callback={directionsServiceOptions[driver.driver.id]!.callback}
                    />}
                    {driver.dest && paths[driver.driver.id] && paths[driver.driver.id].length > 0 && (
                        <PolylineF
                            key={paths[driver.driver.id].length}
                            options={{
                                path: paths[driver.driver.id],
                                strokeColor: getDriverColor(idx),
                                editable: false,
                                strokeOpacity: 1,
                                strokeWeight: 5
                              }}
                            />
                    )}
                    
                </div>)}
        </GoogleMap>
        {isFreemove && <View className="relative z-20 bottom-16 right-0 text-right pr-4"><Button onClick={centerCamera}><LocateFixed className="h-4 w-4 mr-1" /> Recenter</Button></View>}
    </LoadScript>

}
