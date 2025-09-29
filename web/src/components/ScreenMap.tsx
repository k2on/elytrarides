import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    DirectionsService,
    GoogleMap,
    MarkerF,
    PolylineF,
    InfoWindowF,
    OverlayViewF,
    OVERLAY_MOUSE_TARGET,
    useLoadScript,
    LoadScript,
    Libraries,
} from "@react-google-maps/api";
import {
    ActionType,
    LatLng,
    ReservationType,
    ReserveStep,
    RideStepType,
    getDistance,
} from "@/shared";
import View from "./View";
import {
    ContextRide,
    ContextRideDispatch
} from "@/app/[id]/ride/context";
import { useProgrammaticCameraMovement } from "./map/hooks";
import {
    ICON_CIRCLE_INNER,
    ICON_CIRCLE_OUTER,
    ICON_SQUARE_INNER,
    ICON_SQUARE_OUTER,
} from "./map/const";
import Icon from "@mdi/react";
import { mdiChevronRight } from "@mdi/js";
import ButtonCenterCamera from "./map/ButtonCenterCamera";
import MarkerEstimation from "./map/MarkerEstimation";
import { COLOR_PURPLE_500, googleMapsApiKey } from "@/const";
import { getPickupTime } from "@/lib";

export const GOOGLE_MAPS_LIBRARIES: Libraries = ["geometry"];

const markerUrl = `https://ride.koon.us/car.png`
const spriteSize = 64;

interface MapMarker {
    location: LatLng;
    text: string;
    driverDirection?: number;
    isStatic?: boolean;
    onPress?: () => void;
}

interface DirectionsRequestProps {
    origin: LatLng;
    destination: LatLng;
    travelMode: google.maps.TravelMode;
}

interface ScreenMapProps {
    children?: React.ReactNode;
}
function ScreenMap({ children }: ScreenMapProps) {
    const { reservationType, locations, shouldCenter, step } =
        useContext(ContextRide)!;
    const dispatch = useContext(ContextRideDispatch)!;

    const [center, setCenter] = useState({ lat: -3.745, lng: -38.523 });
    const [bounds, setBounds] = useState<google.maps.LatLngBounds>();

    const [map, setMap] = useState<google.maps.Map>();
    const [isFreemove, setIsFreemove] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);

    const [path, setPath] = useState<google.maps.LatLngLiteral[]>([]);
    const [_travelledPath, setTravelledPath] = useState<google.maps.LatLngLiteral[]>([]);

    const [request, request_set] = useState<DirectionsRequestProps | null>(null);

    const directions_callback = (res: any) => {
        if (!res) return;
        if (res.status != "OK") { return console.error("res", res); }
        console.log("res",res);
        setPath(res.routes[0].overview_path.map((latLng: any) => ({
          lat: latLng.lat(),
          lng: latLng.lng()
        })));
    }

    const directionsServiceOptions = useMemo(() => request && ({
      requestOptions: {
        origin: request.origin,
        destination: request.destination,
        travelMode: request.travelMode
      },
      callback: directions_callback
    }), [request]);

    useEffect(() => {
        const driverDest = locations.at(0);
        if (step.type == RideStepType.RESERVATION && step.driverLocation && driverDest && request?.destination.lat != driverDest.location.lat) {
            request_set({
                origin: step.driverLocation,
                destination: driverDest.location,
                travelMode: google.maps.TravelMode.DRIVING,
            });
        }
    }, [step])

    

    const estimation = step.type == RideStepType.RESERVE
        ? step.estimation
        : step.type == RideStepType.RESERVATION
        ? step.estimation
        : null;

    const markers: MapMarker[] = locations.map((loc) => ({
        location: loc.location,
        text: loc.main,
        isStatic: step.type == RideStepType.RESERVE && step.step == ReserveStep.CONFIRM_PIN && step.confirmPin?.placeId == loc.placeId,
        onPress:
            step.type == RideStepType.RESERVE ? step.step == ReserveStep.REVIEW
                ? () => dispatch({ type: ActionType.Order })
                : undefined
                : undefined,
    }));

    if (step.type == RideStepType.RESERVATION && step.driverLocation) {
        markers.push({
            location: step.driverLocation,
            text: "Driver",
            driverDirection: 10,
        });
    }

    const getBottomHeight = () => document.getElementById("overlay-bottom")?.clientHeight || 0;

    const [isCameraProgramaticallyChanging, centerCamera] =
        useProgrammaticCameraMovement(() => {
            if (!map) return;

            setIsFreemove(false);
            const bounds = new window.google.maps.LatLngBounds();
            setBounds(bounds);

            markers.map((marker) => bounds.extend(marker.location));

            const overlayTop =
                document.getElementById("overlay-top")?.clientHeight || 0;
            const overlayBottom = getBottomHeight();
                

            if (markers.length == 1) {
                map.setZoom(18);
                // map.setZoom(step.type == RideStepType.RESERVE && step.step == ReserveStep.CONFIRM_PIN ? 18 : 14);
                map.panTo(markers.at(0)!.location);
                map.panBy(0, overlayTop / -2 + overlayBottom / 2);
            } else {
                map.fitBounds(bounds, {
                    top: 50 + overlayTop,
                    left: 50,
                    right: 50,
                    bottom: 50 + overlayBottom,
                });
            }
        });

    useEffect(() => {
        if (!isFreemove && step.type == RideStepType.RESERVATION && step.driverLocation) {
            centerCamera();
        }
    }, [isFreemove, step])


    const onRecenter = () => {
        centerCamera();
    };

    const onDragStart = () => {
        setIsDragging(true);
        if (!isCameraProgramaticallyChanging && !firstLoad) {
            setIsFreemove(true);
        }
        if (firstLoad) {
            setFirstLoad(false);
        }
    };

    useEffect(() => {
        if (shouldCenter) {
            centerCamera();
            dispatch({ type: ActionType.SetShouldCenter, val: false });
        }
    }, [shouldCenter]);

    const onBoundsChanged = () => {
        if (!map) return;
        const bounds = map.getBounds();
        if (!bounds) return;
        setBounds(bounds);
    };

    const onDragEnd = () => {
        setIsDragging(false);
        saveCenter();
        if (step.type == RideStepType.RESERVE && step.step == ReserveStep.CONFIRM_PIN && map && step.confirmPin) {
            const newCenter = map.getCenter()!;
            
            dispatch({
                type: ActionType.SetStopLocation,
                placeId: step.confirmPin.placeId,
                location: { lat: newCenter.lat(), lng: newCenter.lng() },
            });
        }
    }

    const saveCenter = useCallback(() => {
        if (map) {
            const newCenter = map.getCenter()!;
            setCenter({
                lat: newCenter.lat(),
                lng: newCenter.lng(),
            });
        }
    }, []);

    const getPixelPositionOffset = (
        position: LatLng,
        width: number,
        height: number,
    ) => {
        if (!bounds) return { x: 0, y: 0 };

        const mapNE = bounds.getNorthEast();
        const mapSW = bounds.getSouthWest();

        const mapWidth = mapNE.lng() - mapSW.lng();
        const mapHeight = mapNE.lat() - mapSW.lat();

        if (markers.length === 0) return { x: 0, y: 0 };

        const overlayLng = position.lng;
        const overlayLat = position.lat;

        const overlayX = (overlayLng - mapSW.lng()) / mapWidth;
        const overlayY = (overlayLat - mapNE.lat()) / mapHeight;

        const x_offset = 20;
        const y_offset = 30;
        const x = overlayX < 0.5 ? x_offset : width * -1;
        const y = overlayY < -0.1 ? height * -1 : y_offset;
        return { x, y };
    };

    const pickedUp = step.type == RideStepType.RESERVATION && step.reservation.isPickedUp;
    const showDriverDest = step.type == RideStepType.RESERVATION && step.reservation.isDropoff ? pickedUp : !pickedUp;

    let driverMarker: MapMarker | null = null;
    if (step.type == RideStepType.RESERVATION && step.driverLocation != undefined && step.driverLocationLast != undefined) {
        const angleDegrees = window.google.maps.geometry.spherical.computeHeading(step.driverLocationLast, step.driverLocation);

        const normalizedAngle = (angleDegrees % 360 + 360) % 360 + 90;

        const adjustedAngle = (360 - normalizedAngle + 90) % 360;
        const spriteIndex = Math.round(adjustedAngle / 3.6) % 100;

        const spriteY = Math.floor(spriteIndex / 10) * spriteSize;  // row
        const spriteX = (spriteIndex % 10) * spriteSize;  // column

        const marker = document.querySelector(`[src="${markerUrl}"]`);

        if (marker && spriteIndex != 0) {
            // @ts-ignore
            marker.style.objectPosition = `-${spriteX}px -${spriteY}px`;
            // @ts-ignore
            marker.style.objectFit = "none";

            // marker.style.transform = `rotate(${angle}deg)`;
        }

        if (showDriverDest) {

            const proximity_threshold = 0.1;
            const proximity_threshold_directions = 0.4;

            for (let i = 0; i < path.length; i++) {
              if (getDistance(step.driverLocation, path[i]) < proximity_threshold) {
                setTravelledPath([...path.slice(0, i + 1)]);
                setPath([...path.slice(i + 1)]);
                break;
              }
            }

            let isOffCourse = true;
            for (let i = 0; i < path.length; i++) {
                if (getDistance(step.driverLocation, path[i]) < proximity_threshold_directions) {
                    isOffCourse = false;
                    break;
                }
            }

            if (isOffCourse && request?.origin.lat != step.driverLocation.lat) {
                request_set({
                    origin: step.driverLocation,
                    destination: markers[0].location!,
                    travelMode: google.maps.TravelMode.DRIVING,
                });
            }

        }

        driverMarker = {
            location: step.driverLocation,
            text: "Driver",
            driverDirection: 0
        }
    }

    const DEBUG_DRIVER_MARKER = false;

    const STATIC_PIN_WIDTH = 180;
    const STATIC_PIN_HEIGHT = 210;
    const STATIC_PIN_SCALE_FACTOR = .3;
    const STATIC_PIN_COLOR = "#fff";

    return (
        <LoadScript mapIds={["e054b907b2c2d1b6"]} googleMapsApiKey={googleMapsApiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
            <View style={{ bottom: getBottomHeight() }} className="absolute right-0 z-10 pr-2">
                {isFreemove && <ButtonCenterCamera onPress={onRecenter} />}
            </View>
            {step.type == RideStepType.RESERVE && step.step == ReserveStep.CONFIRM_PIN && <>
                <View className="pointer-events-none h-screen w-full flex absolute z-10 justify-center items-center">
                    <View>
                         <svg width={STATIC_PIN_WIDTH * STATIC_PIN_SCALE_FACTOR} height={STATIC_PIN_HEIGHT * STATIC_PIN_SCALE_FACTOR} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 210" className={`transition-all ${isDragging ? '-mt-20' : '-mt-16'}`}>
                            <circle cx={90} cy={70} r={60} fill={STATIC_PIN_COLOR} />
                            <rect x={80} y={60} width={20} height={20} fill="#000" />
                            <rect x={88} y={130} width={5} height={70} fill={STATIC_PIN_COLOR} />
                          </svg>
                    </View>
                    <View className={`absolute w-2 h-2 bg-white rounded-full transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0'}`}></View>
                </View>
            </>}
            <GoogleMap
                onLoad={(e) => setMap(e)}
                mapContainerClassName="h-screen"
                mapContainerStyle={{ height: "-webkit-fill-available" }}
                center={center}
                zoom={18}
                options={{
                    disableDefaultUI: true,
                    mapId: "e054b907b2c2d1b6",
                }}
                onBoundsChanged={onBoundsChanged}
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
                onZoomChanged={() => {
                    onDragStart();
                    saveCenter();
                    setIsDragging(false);
                }}
            >
                {showDriverDest && directionsServiceOptions && <DirectionsService
                    options={directionsServiceOptions.requestOptions}
                    callback={directionsServiceOptions.callback}
                />}
                {showDriverDest && path.length > 0 && markers.length && (
                    <PolylineF
                        key={path.length}
                        options={{
                            path,
                            strokeColor: COLOR_PURPLE_500,
                            editable: false,
                            strokeOpacity: 1,
                            strokeWeight: 5
                          }}
                        />
                )}
                {step.type == RideStepType.RESERVATION && step.driverLocationLast != undefined &&
                    <MarkerF
                        position={step.driverLocationLast}
                        icon={{
                            url: markerUrl,
                            scaledSize: new window.google.maps.Size(spriteSize, spriteSize), // Assuming each sprite is 128px by 128px

                            // scaledSize: new window.google.maps.Size(30, 30),
                            anchor: new window.google.maps.Point(spriteSize / 2, spriteSize / 2),
                        }}
                    />
                }
                {DEBUG_DRIVER_MARKER && driverMarker && (
                    <MarkerF
                        position={driverMarker.location}
                    />
                )}
                {markers
                    .filter(marker => marker.driverDirection == undefined && !marker.isStatic)
                    .map((marker, idx) => (
                    <>
                        <MarkerF
                            key={"reservation-location-" + idx + "-outer"}
                            icon={{
                                ...(reservationType == ReservationType.PICKUP
                                    ? ICON_CIRCLE_OUTER
                                    : ICON_SQUARE_OUTER),
                                ...{ anchor: typeof google != "undefined" ? new google.maps.Point(10, 10) : undefined },
                            }}
                            position={marker.location}
                        />
                        <MarkerF
                            key={"reservation-location-" + idx + "-inner"}
                            icon={{
                                ...(reservationType == ReservationType.PICKUP
                                    ? ICON_CIRCLE_INNER
                                    : ICON_SQUARE_INNER),
                                ...{ anchor: typeof google != "undefined" ? new google.maps.Point(10, 10) : undefined },
                            }}
                            position={marker.location}
                        />
                        <OverlayViewF
                            key={
                                "reservation-location-" +
                                idx +
                                "-text" +
                                bounds?.toString()
                            }
                            position={marker.location}
                            mapPaneName={OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={(w, h) =>
                                getPixelPositionOffset(marker.location, w, h)
                            }
                        >
                            <button onClick={marker.onPress}>
                                <div className="flex items-strech bg-zinc-950">
                                    {estimation && <MarkerEstimation seconds={estimation.timeEstimate.pickup} />}
                                    <div className="flex items-center text-white text-lg p-2">

                                        {marker.text}
                                        {marker.onPress && (
                                            <Icon
                                                className="ml-2"
                                                size={0.9}
                                                path={mdiChevronRight}
                                            />
                                        )}
                                    </div>
                                </div>
                            </button>
                        </OverlayViewF>
                    </>
                ))}
            </GoogleMap>
            <style>{`
            img[src="${markerUrl}"] {
                object-position: 0px 0px;
                object-fit: none;
                filter: drop-shadow(0 2px 2px black);
            }
            `}</style>
        </LoadScript>
    );
}


export default React.memo(ScreenMap);
