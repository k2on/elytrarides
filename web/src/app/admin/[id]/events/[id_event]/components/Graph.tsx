import View from "@/components/View";
import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface ReservationPoint {
    timestamp: number;
    pickups: number;
    dropoffs: number;
}

interface GraphProps {
    reservations: ReservationPoint[]
}
export default function Graph({ reservations }: GraphProps) {


    const totalPoints = reservations.length;

    const last30MinTimestamp = ((new Date()).getTime() / 1000) - (60 * 30);


    let startIndex = 0;
    for (const [idx, point] of reservations.entries()) {
        if (point.timestamp > last30MinTimestamp) startIndex = idx;
    }
    console.log("res", reservations, last30MinTimestamp, startIndex)

    const endIndex = totalPoints - 1; // Last index for "now"

    return <View>
        <ResponsiveContainer width="100%" height={400}>
      <LineChart data={reservations}>
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
        />
        <YAxis />
        <CartesianGrid />
        <Tooltip />
        <Line type="monotone" dataKey="pickups" stroke="#8884d8" />
        <Line type="monotone" dataKey="dropoffs" stroke="#ff0066" />
        <Brush
          startIndex={startIndex}
          endIndex={endIndex}
          dataKey="timestamp"
          height={30}
          stroke="#8884d8"
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
        />
      </LineChart>
    </ResponsiveContainer>
    </View>
}
