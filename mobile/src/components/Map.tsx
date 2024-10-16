import {
  SafeAreaView,
  View,
  Text,
  Dimensions,
  Image,
  AppState,
} from "react-native";
import MapView, {
  Details,
  Marker as RNMarker,
  PROVIDER_GOOGLE,
  UserLocationChangeEvent,
  Callout,
  Region,
  LatLng,
} from "react-native-maps";
import ButtonCenterCamera from "./map/ButtonCenterCamera";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActionType,
  Marker,
  ReservationType,
  map_style,
  ReserveStep,
  RideStep,
  RideStepType,
  getDistance,
} from "@/shared";
import { ContextRide, ContextRideDispatch } from "@/app/authed/state";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import { ContextDrive, StateDrive } from "@/app/authed/drive/context";
import MapViewDirections from "react-native-maps-directions";
import { ArrowUp01 } from "lucide-react-native";

export const googleMapsApiKey = "";

const NEW_DIRECTIONS_THRESHOLD = 1;

const MARKER_PICKUP = require("../../assets/circle.png");
const MARKER_DROPOFF = require("../../assets/square.png");

const { height: HEIGHT_SCREEN } = Dimensions.get("window");
const MAP_RATIO = 0.8;

const HEIGHT_MAP = HEIGHT_SCREEN * MAP_RATIO;
const HEIGHT_BOTTOM = HEIGHT_SCREEN * (1 - MAP_RATIO);

interface GLatLng {
  latitude: number;
  longitude: number;
}

interface ViewSize {
  width: number;
  height: number;
}

function getDriveDest(ctxDrive: StateDrive | null) {
  if (
    !ctxDrive ||
    !ctxDrive.event ||
    (!ctxDrive.dest && ctxDrive.queue.length == 0)
  )
    return null;
  // console.log("ctxDrive", ctxDrive);
  const dest = ctxDrive.dest ? ctxDrive.dest : ctxDrive.queue.at(0)!;
  return {
    type: MarkerTypes.PICKUP,
    position: {
      latitude: dest.stop.lat,
      longitude: dest.stop.lng,
    },
  };
}

function latlng(obj: Pick<any, "locationLat" | "locationLng">): LatLng {
  return {
    latitude: obj.locationLat,
    longitude: obj.locationLng,
  };
}

enum MarkerTypes {
  PICKUP,
  STOP,
  DROPOFF,
}

interface ScreenMapProps {
  button?: React.ReactNode;
  overlay?: React.ReactNode;
  slideup?: React.ReactNode;
  markers: Marker[];
  children: React.ReactNode;
}
export default function ScreenMap({
  button,
  overlay,
  slideup,
  children,
  markers,
}: ScreenMapProps) {
  const { shouldCenter, reservationType, step } = useContext(ContextRide)!;
  const ctxDrive = useContext(ContextDrive);
  const dispatch = useContext(ContextRideDispatch)!;
  // console.log("my ctx", ctxDrive);

  const [isFreemove, setIsFreemove] = useState(false);
  const mapRef = React.createRef<MapView>();
  const [position, setPosition] = useState<GLatLng>();
  const [heading, setHeading] = useState<number>();

  const [positionForDirections, setPositionForDirections] = useState<GLatLng>();

  const [region, setRegion] = useState<Region>();

  const driveDest = getDriveDest(ctxDrive);
  const driveStops =
    ctxDrive?.avaliableReservation?.stops.map((stop, idx) => ({
      type:
        idx == 0
          ? MarkerTypes.PICKUP
          : idx == ctxDrive.avaliableReservation!.stops.length - 1
          ? MarkerTypes.DROPOFF
          : MarkerTypes.STOP,
      position: { latitude: stop.stop.lat, longitude: stop.stop.lng },
    })) || [];

  const [isActive, setIsActive] = useState(true);

  function getBottomHeight() {
    if (ctxDrive != null) {
      if (!ctxDrive.isOnline) {
        return 400;
      } else {
        return 250;
        // if (ctxDrive.dest?.__typename == "DriverStopEstimationEvent" && ctxDrive.queue.length == 0) {
        //     return 160;
        // } else {
        // }
      }
    }

    switch (step.type) {
      case RideStepType.RESERVE:
        switch (step.step) {
          case ReserveStep.REVIEW:
            return 270;
          case ReserveStep.ORDER:
            return 70;
          default:
            return 0;
        }
      case RideStepType.RESERVATION:
        return 270;
      case RideStepType.INITIAL: // THIS IS CODE FOR THE DRIVER SCREEN LOL! this is such a hack and should really be changed
        return 200; //            what is going on here is that you can get the bottoms height for the driver screen
      //                        so when the driver is on the drive screen, it is assumed that the ride step is on inital
    }
  }

  const centerCamera = (force = false) => {
    if (isFreemove && !force) return;

    // const locations = markers.map(getPosition); // TODO: Figure out how markers work
    const locations = driveStops.map((s) => s.position);

    if (driveDest) locations.push(driveDest.position);
    if (position) locations.push(position);

    if (locations.length > 1) {
      showCallout();

      mapRef.current?.fitToCoordinates(locations, {
        edgePadding: {
          top: 200,
          bottom: 50 + getBottomHeight(),
          left: 50,
          right: 50,
        },
        animated: true,
      });
      // mapRef.current?.animateCamera({
      //     heading,
      // });
    } else {
      mapRef.current?.animateCamera({
        center: position,
        // center:  position ? { latitude: position.latitude + (ctxDrive && !ctxDrive.isOnline ? -.01 : 0), longitude: position.longitude } : undefined,
        zoom: 14,
        heading,
      });
    }
  };

  const onUserMove = (e: UserLocationChangeEvent) => {
    setPosition(e.nativeEvent.coordinate);
    setHeading(e.nativeEvent.coordinate?.heading);
    centerCamera();
    if (
      !positionForDirections ||
      (positionForDirections &&
        position &&
        getDistance(
          {
            lat: positionForDirections.latitude,
            lng: positionForDirections.longitude,
          },
          { lat: position.latitude, lng: position.longitude }
        ) > NEW_DIRECTIONS_THRESHOLD)
    ) {
      if (!isActive) return;
      setPositionForDirections(position);
    }
  };

  const onRegionChange = (region: Region, details: Details) => {
    setRegion(region);
    if (!details.isGesture) return;
    setIsFreemove(true);
  };

  const getOverlayOffset = (marker: Marker) => {
    if (!region) return { x: 0, y: 0, width: 0 };
    const position = marker.location;

    const width = marker.text.length * 8 + 16 + 10;

    const height = 20;

    const mapWidth = region.longitudeDelta;
    const mapHeight = region.latitudeDelta;

    const overlayLat = position.lat;
    const overlayLng = position.lng;

    const overlayX = (overlayLng - region.longitude) / mapWidth;
    const overlayY = (overlayLat - region.latitude) / mapHeight;

    const y_offset = 30;

    const x = overlayX < -0.22 ? width + 180 : -width - 140;
    // const y = overlayY < 0.21 ? y_offset : y_offset + 200;
    const y = y_offset;

    return { x, y, width, height };
  };

  const markerRefs = markers.map((marker) => React.createRef<any>());

  const onRecenter = () => {
    setIsFreemove(false);
    centerCamera(true);
  };

  useEffect(() => {
    if (shouldCenter) {
      setIsFreemove(false);
      centerCamera(true);
      dispatch({ type: ActionType.SetShouldCenter, val: false });
    }
  }, [shouldCenter]);

  const showCallout = () => {
    for (const markerRef of markerRefs) {
      if (markerRef && markerRef.current && markerRef.current.showCallout) {
        markerRef.current.hideCallout();
        markerRef.current.showCallout();
      }
    }
  };

  const onRegionChangeComplete = () => showCallout();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setIsActive(true);
      } else if (nextAppState === "background") {
        setIsActive(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View className="flex-1">
      <View className="absolute z-40">{overlay}</View>
      <SafeAreaView
        style={{ bottom: 10 + getBottomHeight() }}
        className="absolute z-10 right-2 text-right"
      >
        <View className="flex-row justify-end mb-2">
          {isFreemove && <ButtonCenterCamera onPress={onRecenter} />}
        </View>
        {button}
      </SafeAreaView>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        showsUserLocation
        customMapStyle={map_style}
        className="h-screen"
        onUserLocationChange={onUserMove}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        maxZoomLevel={isFreemove ? 20 : 14}
        onPress={showCallout}
      >
        {driveDest && (
          <RNMarker
            key={driveDest.position.latitude}
            coordinate={driveDest.position}
          >
            <Image
              source={{
                width: 50,
                height: 100,
                uri:
                  driveDest.type == MarkerTypes.PICKUP
                    ? "pickup.png"
                    : driveDest.type == MarkerTypes.STOP
                    ? "stop.png"
                    : "dropoff.png",
              }}
            />
          </RNMarker>
        )}
        {driveStops &&
          driveStops.map((stop) => (
            <RNMarker
              opacity={1}
              key={stop.position.latitude}
              coordinate={stop.position}
            >
              <Image
                source={{
                  width: 50,
                  height: 100,
                  uri:
                    stop.type == MarkerTypes.PICKUP
                      ? "pickup.png"
                      : stop.type == MarkerTypes.STOP
                      ? "stop.png"
                      : "dropoff.png",
                }}
              />
            </RNMarker>
          ))}
        {driveStops.length > 1 && positionForDirections && (
          <MapViewDirections
            resetOnChange={false}
            origin={positionForDirections}
            waypoints={driveStops.slice(0, -1).map((s) => s.position)}
            destination={driveStops[driveStops.length - 1].position}
            apikey={googleMapsApiKey}
            strokeWidth={8}
            strokeColor="white"
            onStart={() => console.log("Fetch navigation")}
            // onReady={(data) => console.log(data)}
          />
        )}
        {driveDest && positionForDirections && (
          <MapViewDirections
            resetOnChange={false}
            origin={positionForDirections}
            destination={driveDest.position}
            apikey={googleMapsApiKey}
            strokeWidth={8}
            strokeColor="white"
            onStart={() => console.log("Fetch navigation")}
            // onReady={(data) => console.log(data)}
          />
        )}
        {markers.map((marker, idx) => {
          const { x, y, width } = getOverlayOffset(marker);

          return (
            <RNMarker
              ref={markerRefs[idx]}
              anchor={{ x: 0.5, y: 0.5 }}
              key={idx}
              coordinate={getPosition(marker)}
            >
              <Image
                source={
                  reservationType == ReservationType.PICKUP
                    ? MARKER_PICKUP
                    : MARKER_DROPOFF
                }
              />
              <Callout
                onPress={marker.onPress}
                key={
                  idx +
                  "-label" +
                  marker.location.lat.toString() +
                  marker.onPress
                    ? "pressable"
                    : "not"
                }
                style={{
                  transform: [{ translateX: x }, { translateY: y }],
                }}
                tooltip
              >
                <View
                  className="bg-zinc-950 border-red-700 border-2"
                  style={{
                    width,
                  }}
                >
                  <View
                    className="flex-row items-center"
                    style={{
                      borderColor: "blue",
                      borderWidth: 1,
                    }}
                  >
                    {marker.onPress && (
                      <Icons color="white" name="chevron-left" size={20} />
                    )}
                    <Text className="text-white p-2">{marker.text}</Text>
                  </View>
                </View>
              </Callout>
            </RNMarker>
          );
        })}
        {children}
      </MapView>
    </View>
  );
}

function getPosition(marker: Marker) {
  return { latitude: marker.location.lat, longitude: marker.location.lng };
}
