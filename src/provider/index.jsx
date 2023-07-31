import React, { useEffect, useMemo, useState } from "react";

const App = React.createContext({});

export function useMyContext() {
    return React.useContext(App);
}

function reducer(state, { type, payload }) {
    return {
        ...state,
        [type]: payload,
    };
}

const INIT_STATE = {
    faces: []
};

export default function Provider({ children }) {

    const [state, dispatch] = React.useReducer(reducer, INIT_STATE);

    return (
        <App.Provider
            value={React.useMemo(
                () => [
                    state, { dispatch }
                ],
                [
                    state,
                    dispatch
                ]
            )}
        >
            {
                children
            }
        </App.Provider>
    )
}