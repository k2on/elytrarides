import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthedParamList } from "../Authed";
import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../state";
import { GetOrgVehiclesQuery, q, useGetOrgVehiclesQuery, useGetVehicleColorsQuery, useGetVehicleMakesQuery, useGetVehicleModelsQuery, useGetVehicleYearsQuery, useUpdateVehicleMutation } from "@/shared";
import { FlatList, View, Text, Image, TextInput, Alert } from "react-native";
import { TrashIcon, UserRoundIcon, UsersRoundIcon } from "lucide-react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import uuid from "react-native-uuid";
import { getImageId } from "../util";
import { BottomSheetBackdrop, BottomSheetModal, useBottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import * as Haptics from "expo-haptics";

function formatVehicleName(vehicle: Vehicle) {
    return `${vehicle.color} ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

type PropsOrg = NativeStackScreenProps<AuthedParamList, "OrganizationVehicles">;
export const OrganizationVehicles = ({ route, navigation }: PropsOrg) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();
    const { params } = route;
    const { id, searchValue, editing } = params;

    const { data } = useGetOrgVehiclesQuery(client, { id });

    const results = data?.orgs.get.vehicles
        .filter(v =>  formatVehicleName(v).toLowerCase().includes(searchValue.toLowerCase()))

    const ref = useRef<BottomSheetModalMethods>(null);
    const snapPointsUserAdd = useMemo(() => ['80%'], []);
    const renderBackdrop = useCallback( (props: any) => ( <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={1}/>), []);

    useEffect(() => {
        if (editing) {
            Haptics.impactAsync(
                Haptics.ImpactFeedbackStyle.Medium,
            )
            ref.current?.present();
        }
    }, [editing])

    return <><FlatList
        className="px-4"
        contentInsetAdjustmentBehavior="always"
        data={results}
        renderItem={({ item }) => <VehicleView idOrg={id} vehicle={item} onEdit={() => {
            navigation.setParams({ editing: { idOrg: id, idVehicle: item.id, data: item } })
        }} />}
    />
        <BottomSheetModal ref={ref} snapPoints={snapPointsUserAdd} backdropComponent={renderBackdrop} handleIndicatorStyle={{ backgroundColor: "gray" }} backgroundStyle={{ backgroundColor: "#111" }}>
            {editing && <AddVehicle editing={editing} />}
        </BottomSheetModal>

    </>;
}

type Vehicle = GetOrgVehiclesQuery["orgs"]["get"]["vehicles"][number];
interface VehicleViewProps {
    idOrg: string;
    vehicle: Vehicle;
    onEdit: () => void;
}

const VehicleView = ({ vehicle, onEdit }: VehicleViewProps) => {
    const uri = vehicle.imageUrl;

    return <View className="py-2">
        <TouchableOpacity activeOpacity={.8} onPress={onEdit}>
            <View className="flex-row items-center bg-zinc-900 rounded border-[1px] border-zinc-800">
                <Image style={{ transform: [{rotateY: "180deg"}] }} resizeMode="contain" className="w-32 h-20" source={{ uri }} />
                <View>
                    <Text className="text-white text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-gray-400 text-lg flex items-center">{vehicle.license} · {vehicle.capacity} </Text>
                        <UserRoundIcon className="text-gray-400" size={15} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    </View>
}

enum Step {
    YEAR,
    MAKE,
    MODEL,
    COLOR,
    OTHER,
}

interface AddVehicleProps {
    editing: {
        idOrg: string;
        idVehicle: string | null;
        data: Vehicle | null;
    }
}
export const AddVehicle = ({ editing }: AddVehicleProps) => {
    const { getClient } = useContext(AuthContext)!;
    const client = getClient();
    const queryClient = q.useQueryClient();

    const [step, setStep] = useState(editing.data ? Step.OTHER : Step.YEAR);

    const [year, setYear] = useState(editing.data?.year.toString() || "");
    const [make, setMake] = useState(editing.data?.make || "");
    const [model, setModel] = useState(editing.data?.model || "");
    const [color, setColor] = useState(editing.data?.color || "");

    const [license, setLicense] = useState(editing.data?.license || "");
    const [capacity, setCapacity] = useState(editing.data?.capacity || 0);

    const { data: years } = useGetVehicleYearsQuery(client, {}, { keepPreviousData: true });
    const { data: makes } = useGetVehicleMakesQuery(client, { year }, { enabled: !!year, keepPreviousData: true });
    const { data: models } = useGetVehicleModelsQuery(client, { year, make }, { enabled: !!make, keepPreviousData: true });
    const { data: colors } = useGetVehicleColorsQuery(client, { year, make, model }, { enabled: !!model, keepPreviousData: true });

    const { dismiss } = useBottomSheetModal();

    const { mutate } = useUpdateVehicleMutation(client, {
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries(["GetOrgVehicles", { id: editing.idOrg }]);
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            )
            dismiss();
        },
    })

    const getImage = () => `https://raw.githubusercontent.com/k2on/basedcarapi/main/data/years/${year}/${make}/${model}/colors/${color}.png`;

    const onNext = () => {
        if (step == Step.OTHER) {
            mutate({
                idVehicle: editing.idVehicle || uuid.v4(),
                idOrg: editing.idOrg,
                form: {
                    year: parseInt(year),
                    make,
                    model,
                    color,
                    license,
                    capacity,
                    imageUrl: getImage(),
                    owner: editing.data?.ownerPhone,
                }
            })

        } else {
            setStep(step + 1);
        }
    }

    const onStep = (s: Step) => {
        switch (s) {
            case Step.YEAR:
                setMake("");
                setModel("");
                setColor("");
                break;
            case Step.MAKE:
                setModel("");
                setColor("");
                break;
            case Step.MODEL:
                setColor("");
                break;
        }
        setStep(s);
    }

    const canProgress = (): boolean => {
        switch (step) {
            case Step.YEAR:
                return !!year;
            case Step.MAKE:
                return !!year && !!make;
            case Step.MODEL:
                return !!year && !!make && !!model;
            case Step.COLOR:
                return !!year && !!make && !!model && !!color;
            case Step.OTHER:
                return !!year && !!make && !!model && !!color && !!license && !!capacity;
        }
    }

    const onLicense = () => {
        Alert.prompt("License Plate", "Enter the license plate for this vehicle", result => {
            setLicense(result.toUpperCase());
        }, "plain-text", license)
    }

    const onCapacity = () => {
        Alert.prompt("Capacity", "Enter the max capacity for this vehicle", result => {
            setCapacity(parseInt(result));
        }, "plain-text", capacity > 0 ? capacity.toString() : undefined, "numeric")
    }

    const onDelete = () => {
        Alert.alert("Delete Vehicle", "Are you sure you want to delete this vehicle?", [
            {
                text: "Cancel",
                isPreferred: true,
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    mutate({
                        idVehicle: editing.idVehicle || uuid.v4(),
                        idOrg: editing.idOrg,
                        form: {
                            year: parseInt(year),
                            make,
                            model,
                            color,
                            license,
                            capacity,
                            imageUrl: getImage(),
                            owner: editing.data?.ownerPhone,
                            obsoleteAt: Math.floor(new Date().getTime() / 1000),
                        }
                    })

                }
            }
        ])

    }

    return <View className="flex-col justify-between flex-1 pb-20">
        <View>
            <View className="gap-y-2 pt-4">
                <Text className="text-xl text-white text-center font-semibold">Add Vehicle</Text>
                <Text className="text-gray-400 text-center">Add a vehicle to your organization.</Text>
            </View>
            <View>
                {step <= Step.COLOR
                ? <View>
                {step == Step.YEAR
                ? <Picker
                    itemStyle={{ color: "white" }}
                    selectedValue={year}
                    onValueChange={(itemValue, itemIndex) =>
                        setYear(itemValue)
                    }>
                    <Picker.Item label="Select Year" value="" />
                    {years?.vehicles.years.map(y => <Picker.Item key={y} label={y} value={y} />)}
                </Picker>
                : <Collapsed onPress={() => onStep(Step.YEAR)}>{year}</Collapsed>}
                
                {step == Step.MAKE
                ? <Picker
                    itemStyle={{ color: "white" }}
                    selectedValue={make}
                    onValueChange={(itemValue, itemIndex) =>
                        setMake(itemValue)
                    }>
                    <Picker.Item label="Select Make" value="" />
                    {makes?.vehicles.makes.map(m => <Picker.Item key={m} label={m} value={m} />)}
                </Picker>
                : step > Step.MAKE
                ? <Collapsed onPress={() => onStep(Step.MAKE)}>{make}</Collapsed>
                : null}

                {step == Step.MODEL
                ? <Picker
                    itemStyle={{ color: "white" }}
                    selectedValue={model}
                    onValueChange={(itemValue, itemIndex) =>
                        setModel(itemValue)
                    }>
                    <Picker.Item label="Select Model" value="" />
                    {models?.vehicles.models.map(m => <Picker.Item key={m} label={m} value={m} />)}
                </Picker>
                : step > Step.MODEL
                ? <Collapsed onPress={() => onStep(Step.MODEL)}>{model}</Collapsed>
                : null}

                {step == Step.COLOR
                ? <Picker
                    itemStyle={{ color: "white" }}
                    selectedValue={color}
                    onValueChange={(itemValue, itemIndex) =>
                        setColor(itemValue)
                    }>
                    <Picker.Item label="Select Color" value="" />
                    {colors?.vehicles.colors.map(c => <Picker.Item key={c} label={c} value={c} />)}
                </Picker>
                : step > Step.COLOR
                ? <Collapsed onPress={() => onStep(Step.COLOR)}>{color}</Collapsed>
                : null}

                </View>
                : <View>
                    <View className="px-2 py-4">
                        <View className="border-2 border-white rounded-xl">
                            <Image className="h-32 w-40 mx-auto" source={{ uri: getImage() }} />
                            <Text className="text-center text-gray-400 text-lg">{year} {make} {model}</Text>
                            <View className="pt-2 pb-4">
                                <TouchableOpacity onPress={() => onStep(Step.COLOR)}>
                                    <Text className="text-white font-semibold text-center text-lg">Change</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                <View className="px-2 pt-4">
                    <View className="bg-zinc-900 rounded py-2">
                        <TouchableOpacity onPress={onLicense}>
                            <View className="flex-row items-center gap-4 px-4 justify-between">
                                <Text className="text-gray-100 text-lg">License Plate</Text>
                                <Text className={`text-lg ${license ? "text-gray-400" : "text-red-400"}`}>{license || "Missing"}</Text>
                            </View>
                        </TouchableOpacity>
                        <View className="bg-zinc-700 w-full h-[1px] my-2"></View>
                        <TouchableOpacity onPress={onCapacity}>
                            <View className="flex-row items-center gap-4 px-4 justify-between">
                                <Text className="text-gray-100 text-lg">Capacity</Text>
                                <Text className={`text-lg ${capacity ? "text-gray-400" : "text-red-400"}`}>{capacity || "Missing"}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
                {editing.idVehicle && <View className="px-2 pt-4">
                    <View className="bg-zinc-900 rounded py-2">
                        <TouchableOpacity onPress={onDelete}>
                            <View className="flex-row items-center gap-4 px-4">
                                <TrashIcon size={20} color="red" />
                                <Text className="text-red-600 text-lg">Delete Vehicle</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>}
                </View>}
            </View>
        </View>

        <View className="px-2">
            <TouchableOpacity disabled={!canProgress()} className={`w-full rounded py-2 ${canProgress() ? "bg-white" : "bg-gray-400"}`} onPress={onNext}><Text className="text-xl text-center">{step == Step.OTHER ? "Save" : "Next"}</Text></TouchableOpacity>
        </View>
    </View>
}

interface CollapsedPickerProps {
    onPress: () => void;
    children: ReactNode;
}
const Collapsed = ({ onPress, children }: CollapsedPickerProps) => {
    return <View className="py-4 px-2">
        <TouchableOpacity className="bg-zinc-800 rounded-md py-2" onPress={onPress}><Text className="text-white text-center text-xl">{children}</Text></TouchableOpacity>
    </View>
}

