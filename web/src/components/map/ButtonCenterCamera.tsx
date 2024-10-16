import Icon from "@mdi/react"
import View from "../View"
import { mdiCompass } from "@mdi/js"

interface ButtonCenterCameraProps {
    onPress: () => void
}
export default function ButtonCenterCamera({ onPress }: ButtonCenterCameraProps) {
    return <button onClick={onPress}>
        <View className="bg-zinc-950 p-2 rounded-xl">
            <Icon size={1} path={mdiCompass} />
        </View>
    </button>
}
