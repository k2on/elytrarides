import "react-native-gesture-handler";
import { q } from '@/shared';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useReducer } from "react";
import { AuthActionKind, AuthContext, DEFAULT_STATE_AUTH, authReducer, createAuthContext } from "@/app/state";
import { getToken } from "@/app/store";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, Text } from "react-native";
import { Colors } from "@/app/colors";
import Splash from "@/app/Splash";
import { StackRootParamList } from "@/app/navigation";
import { Phone } from "@/app/Phone";
import { Code } from "@/app/Code";
import Authed from "@/app/Authed";
import * as TaskManager from "expo-task-manager";
import { LOCATION_STORE, TASK_DRIVER_PING } from "@/app/authed/Drive";
import { setItemAsync } from "expo-secure-store";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

const ElytraTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: Colors.PRIMARY,
    },
};

const StackRoot = createNativeStackNavigator<StackRootParamList>();

TaskManager.defineTask(
    TASK_DRIVER_PING,
    async ({ data: { locations }, error }: any) => {
        if (error) {
            console.error(error);
            return;
        }
        const [location] = locations;

        const latLng = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
        };
        setItemAsync(LOCATION_STORE, JSON.stringify(latLng));
    }
);

export default function App() {
  let [state, dispatch] = useReducer(authReducer, DEFAULT_STATE_AUTH);
  const authContext = createAuthContext(state, dispatch);

  let client = new q.QueryClient();

  useEffect(() => {
      const bootstrapAsync = async () => {
          const token = await getToken();
          dispatch({ type: AuthActionKind.RESTORE, token });
      };
      bootstrapAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <q.QueryClientProvider client={client}>
            <AuthContext.Provider value={authContext}>
                <NavigationContainer theme={ElytraTheme}>
                    <BottomSheetModalProvider>
                        <StatusBar barStyle="light-content" backgroundColor="black" />
                        <StackRoot.Navigator>
                            {state.isLoading ? (
                                <StackRoot.Screen
                                    name="Splash"
                                    options={{ animation: "none" }}
                                    component={Splash}
                                />
                            ) : state.token == undefined ? (
                                <StackRoot.Group
                                    screenOptions={{
                                        animation: state.isLoaded ? "default" : "none",
                                        animationTypeForReplace: state.isSignout
                                            ? "pop"
                                            : "push",
                                    }}
                                >
                                    <StackRoot.Screen
                                        name="NumberEnter"
                                        component={Phone}
                                        options={{ headerShown: false }}
                                    />
                                    <StackRoot.Screen
                                        name="NumberVerfiy"
                                        component={Code}
                                        options={{ headerShown: false }}
                                    />
                                </StackRoot.Group>
                            ) : (
                                <StackRoot.Screen
                                    name="Authed"
                                    component={Authed}
                                    initialParams={{ token: state.token }}
                                    options={{ headerShown: false, animation: state.isLoaded ? "default" : "none" }}
                                />
                            )}
                        </StackRoot.Navigator>
                    </BottomSheetModalProvider>
                </NavigationContainer>
            </AuthContext.Provider>
        </q.QueryClientProvider>
    </GestureHandlerRootView>
  );
}

