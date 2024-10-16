import { useContext } from "react";
import { ContextRideDispatch } from "../../context";
import { ActionType } from "@/shared";
import { ButtonIcon } from "@/components";

export default function Clear({ onPress }: { onPress: () => void }) {
    return (
        <ButtonIcon
            color="gray"
            colorPressed="darkgray"
            icon="close-circle-outline"
            onPress={onPress}
        />
    );
}
