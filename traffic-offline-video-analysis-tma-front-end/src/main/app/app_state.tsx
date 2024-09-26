import {createContext, Dispatch, useContext} from 'react'
import { Action } from '@/types/action'
import PageState, { initialPageState, PageReducer } from '../pages/page_state'
import FileState, { FileReducer, initialFileState } from './file_state'
import CoordinateState, { CoordinateReducer, initialCoordinateState } from './coordinate_state'

export class ApplicationState {
  constructor(
        public pageState: PageState,
        public fileState: FileState,
        public coordinateState: CoordinateState
  ) {}
}

export const initialState: ApplicationState = new ApplicationState(
    initialPageState,
    initialFileState,
    initialCoordinateState
)

export const AppReducer = (
  oldState: ApplicationState,
  action: Action,
): ApplicationState => {
  return new ApplicationState(
    PageReducer(oldState.pageState, action),
    FileReducer(oldState.fileState, action),
    CoordinateReducer(oldState.coordinateState, action)
  )
}

type Props = {
  state: ApplicationState
  dispatcher: Dispatch<Action>
}

export const ApplicationStateContext = createContext<Props>({
  state: initialState,
  dispatcher: () => {},
})

export function useApplicationStateContext() {
  return useContext(ApplicationStateContext)
}
