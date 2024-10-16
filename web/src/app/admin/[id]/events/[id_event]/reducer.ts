import { AdminAction, AdminActionType } from "./actions";
import { AdminState } from "./types";
import { initStrategy } from "./util";

export function reducer(state: AdminState, action: AdminAction): AdminState {
    switch (action.type) {
        case AdminActionType.SET_EVENT:
            let strat = initStrategy(action.event); // FIXME: add the drivers locations to this if they exist
            for (const driver of state.strategy?.drivers || []) {
                const idx = strat.drivers.findIndex(d => d.driver.id == driver.driver.id);
                if (idx == -1) continue;
                strat.drivers[idx] = {...strat.drivers[idx], ...{ping: driver.ping}};
            }
            const mapCenter = action.event.location && ({
                lat: action.event.location.locationLat,
                lng: action.event.location.locationLng,
            }) || null;

            return {...state, ...{ strategy: strat, mapCenter, event: action.event }};

            // setStrategy(strat);
            // strategyRef.current = strat;
            // if (data.events.get.location && !center) {
            //     setCenter({lat: data.events.get.location.locationLat, lng: data.events.get.location.locationLng})
            //     locationRef.current = { lat: data.events.get.location.locationLat, lng: data.events.get.location.locationLng };
            // }
        case AdminActionType.SET_CENTER:
            return {...state, ...{ mapCenter: action.center || null }};
        case AdminActionType.SET_FILTER_STATUS:
            return {...state, ...{ filter: {...state.filter, ...{ status: action.status }} }};
        case AdminActionType.SET_FOCUSED:
            return {...state, ...{ focusedReservation: action.id }};
        case AdminActionType.SET_TAB:
            return {...state, ...{ tab: action.tab }};
        case AdminActionType.UPDATE_DRIVER_LOCATION:
            if (!state.strategy) return state;
            let strategyNew = {...{}, ...state.strategy};

            strategyNew.drivers = strategyNew.drivers.map(driver => driver.driver.id == action.id ? {...driver, ...{ ping: { location: action.location, time: new Date() } }} : driver);

            return {...state, ...{strategy: strategyNew}};
    }

}
