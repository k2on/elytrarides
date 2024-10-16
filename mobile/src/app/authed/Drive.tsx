import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useContext, useEffect, useReducer, useState } from "react";
import { AuthContext } from "@/app/state";
import { AuthedParamList } from "@/app/Authed";
import ScreenMap from "@/components/Map";
import { AppState, Platform, Text } from "react-native";
import { getDriveEvent } from "./drive/util";
import { Online } from "./drive/Online";
import { Offline } from "./drive/Offline";
import { ActionTypeDrive, ContextDrive, ContextDriveDispatch, INITAL_DRIVE_STATE, reducer } from "./drive/context";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { useDriverPingMutation, useGetAvaliableReservationMutation, useGetMeQuery, DriverPingMutation, LatLng, useGetEventQuery, useGetEventForDriverQuery } from "@/shared";
import Navigate from "./drive/Navigate";
import notifee, { AndroidImportance } from '@notifee/react-native';
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import BackgroundTimer from 'react-native-background-timer';
import * as Haptics from "expo-haptics";


export const TASK_DRIVER_PING = "TASK_DRIVER_PING";
export const LOCATION_STORE = "LOCATION";

type DestType = DriverPingMutation['drivers']['ping']['dest'];

function isNewDest(destOld: DestType, destNew: DestType): boolean {
    const isCancelled = destOld && !destNew;
    if (isCancelled) return true;
    return false;
}


export type PropsDrive = BottomTabScreenProps<AuthedParamList, "Drive">;
export default function Drive({ route }: PropsDrive) {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const { idEvent } = route.params;

    
    const [state, dispatch] = useReducer(reducer, INITAL_DRIVE_STATE);

    const { data: me } = useGetMeQuery(client);

    const { data: eventData } = useGetEventForDriverQuery(client, { id: idEvent });

    const [firstPing, setFirstPing] = useState(false);

    const [isActive, setIsActive] = useState(true);

    const event = eventData?.events.get;
    const driver = event?.drivers.find(driver => driver.phone == me?.users.me.phone);

    useEffect(() => {
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          setIsActive(true);
        } else if (nextAppState === 'background') {
          setIsActive(false);
        }
      });

      return () => {
        subscription.remove();
      };
    }, []);

    const showNewRes = async () => {
        if (isActive) return;
        const channelId = await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
          title: 'Elytra',
          body: 'You have a new reservation',
          android: {
            channelId,
            smallIcon: 'ic_launcher', // optional, defaults to 'ic_launcher'.
            // pressAction is needed if you want the notification to open the app when pressed
            pressAction: {
              id: 'default',
            },
            lightUpScreen: true,
          },
        });
    }

    const showCancelledRes = async () => {
        if (isActive) return;
        const channelId = await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
          title: 'Elytra',
          body: 'Your destination has changed',
          android: {
            channelId,
            smallIcon: 'ic_launcher', // optional, defaults to 'ic_launcher'.
            // pressAction is needed if you want the notification to open the app when pressed
            pressAction: {
              id: 'default',
            },
            lightUpScreen: true,
          },
        });
    }

    const { mutate: getAvaliableReservation } = useGetAvaliableReservationMutation(client, {
        onSuccess(data, _variables, _context) {
            const reservation = data.events.get.avaliableReservation;
            const isNewRes = JSON.stringify(reservation) != JSON.stringify(state.avaliableReservation) && reservation;
            dispatch({ type: ActionTypeDrive.SET_AVALIABLE_RESERVATION, reservation });
            if (isNewRes) {
                showNewRes();
            }
        },
    });

    const { mutate } = useDriverPingMutation(client, {
        onSuccess(data) {
            if (!firstPing) {
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
                setFirstPing(true);
            }


            const { dest, queue, pickedUp, reservations } = data.drivers.ping;

            // const isNewRes = state.queue.length == 0 && queue.length > 0;
            const isNew = isNewDest(state.dest, dest);

            if (isNew) {
                showCancelledRes();
            }

            dispatch({ type: ActionTypeDrive.SET_STRAT, dest, queue, pickedUp, reservations });


            if (!dest) {
                // console.log("Getting avaliable!");
                const lastAvaliableDiff = new Date().getTime() - state.lastAvaliableReservationAt.getTime();
                const shouldUpdateAvaliable = lastAvaliableDiff > 1000 * 5;
                if (!state.event) return console.error("event was not set");
                if (!state.driver) return console.error("driver was not set");
                if (shouldUpdateAvaliable) getAvaliableReservation({ id: state.event.id, idDriver: state.driver.id })
            }
        },
        onError(error, variables, context) {
            console.error(error);
        },
        
    });

    const overlay = state.isOnline
        ? <Online />
        : event && driver ? <Offline event={event} driver={driver} />
        : null;

    const goOffline = async () => {
        await Location.stopLocationUpdatesAsync(TASK_DRIVER_PING);
        BackgroundTimer.stopBackgroundTimer();
    }

    const goOnline = async () => {
        console.log("Going online...");
        notifee.requestPermission();
        // FIXME: Android needs this check, but doing this breaks iOS?
        // const resp = await Location.requestForegroundPermissionsAsync();
        // console.log("hmmm")
        // if (resp.status != Location.PermissionStatus.GRANTED) {
        //     console.log("bruh");
        //     console.error("You need to enable background location");
        //     return;
        // }

        await Location.startLocationUpdatesAsync(TASK_DRIVER_PING, {
            accuracy: Location.Accuracy.High,
            foregroundService: {
                notificationTitle: "Elytra",
                notificationBody: "Active"
            }
        }).then(() => {
            console.log("Location updates started");
        }).catch((e) => {
            console.error("Error starting location updates", e);
            dispatch({ type: ActionTypeDrive.SET_ONLINE, val: false });
            return;
        });



        BackgroundTimer.runBackgroundTimer(async () => {
            console.log("BG TASK TICK");
            if (!event) return console.error("Drive event not defined");
            if (!driver) return console.error("Driver not defined");


            getItemAsync(LOCATION_STORE).then(locationStr => {
                if (!locationStr) return console.error("Location str not defined")
                try {
                    const latLng = JSON.parse(locationStr) as LatLng;
                    const lastPingDiff = new Date().getTime() - state.lastPingAt.getTime();
                    const shouldPing = lastPingDiff > 1000;
                    if (shouldPing) mutate({ idDriver: driver.id, idEvent, location: latLng });
                } catch (e) {
                    console.error("Could not read location", e);
                }
            }).catch(e => {
                console.error("Could not read location", e);
            })

        }, 1000);

    }

    useEffect(() => {
        if (!state.isOnline) { goOffline(); return; }
        if (!event) { console.error("Turned on before driveEvent was set "); return; };
        if (!me) return console.error("Turned on before user was set");

        if (!driver) return console.error("Was not able to get driver obj for the event");

        goOnline();
        dispatch({ type: ActionTypeDrive.SET_EVENT, event: event, driver });
    }, [state.isOnline]);

    return (
        <ContextDrive.Provider value={state}>
            <ContextDriveDispatch.Provider value={dispatch}>
                <ScreenMap
                    markers={[]}
                    overlay={overlay}
                    slideup={
                        <Text className="text-white">
                            {event?.name || "no event"}
                        </Text>
                    }
                    button={state.dest && <Navigate />}
                >
                    {null}
                </ScreenMap>
            </ContextDriveDispatch.Provider>
        </ContextDrive.Provider>
    );
}

