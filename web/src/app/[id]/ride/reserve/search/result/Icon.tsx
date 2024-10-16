import View from "@/components/View";
import { mdiHistory, mdiMapMarker } from "@mdi/js";
import Icon from "@mdi/react";
import { SearchStateResult, SearchResultType } from "@/shared";

interface ResultIconProps {
    result: SearchStateResult;
}
export default function ResultIcon({ result }: ResultIconProps) {
    const path = getPath(result.icon);

    return (
        <View className="bg-gray-800 rounded-full p-1">
            <Icon className="text-white" size={1} path={path} />
        </View>
    );
}

function getPath(icon: SearchResultType) {
    switch (icon) {
        case SearchResultType.RECENT:
            return mdiHistory;
        default:
            return mdiMapMarker;
    }
}
