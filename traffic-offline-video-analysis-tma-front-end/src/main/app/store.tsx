import {ReactNode, useContext, useMemo, useReducer} from 'react'
import {ApplicationStateContext, AppReducer, initialState} from './app_state'

interface StateWrapperProps {
    children: ReactNode; // Use ReactNode to type children
  }

export function StateWrapper({ children }: StateWrapperProps) {
  const [state, dispatcher] = useReducer(AppReducer, initialState)
  const contextValue = useMemo(() => {
    return {state, dispatcher}
  }, [state, dispatcher])

  return (
    <ApplicationStateContext.Provider value={contextValue}>
      {children}
    </ApplicationStateContext.Provider>
  )
}

export function useAppStore() {
  return useContext(ApplicationStateContext)
}
