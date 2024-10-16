import { useContext } from "react";
import { ActionType } from "@/shared";
import { ContextRideDispatch } from "../../context";
import Icon from "@mdi/react";
import { mdiCloseCircleOutline } from "@mdi/js";

export default function Clear() {
    const dispatch = useContext(ContextRideDispatch)!;
    const onPress = () =>
        dispatch({
            type: ActionType.SearchClear,
        });

    return (
        <button onClick={onPress}>
            <Icon
                className="text-gray-400 active:text-gray-500"
                size={1}
                path={mdiCloseCircleOutline}
            />
        </button>
    );
}
