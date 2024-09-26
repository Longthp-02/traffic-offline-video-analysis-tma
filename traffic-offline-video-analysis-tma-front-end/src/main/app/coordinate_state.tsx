import { Action, saveRectangleCoordinates } from "@/types/action";

export class CoordinateState {
  constructor(
    public firstRectanglePoints: { x: number; y: number }[] = [],
    public secondRectanglePoints: { x: number; y: number }[] = []
  ) {}

  static saveRectanglePoints(
    firstRectanglePoints: { x: number; y: number }[],
    secondRectanglePoints: { x: number; y: number }[]
  ): CoordinateState {
    return new CoordinateState(firstRectanglePoints, secondRectanglePoints)
  }
}

export const initialCoordinateState: CoordinateState = new CoordinateState(
  [],
  []
)


export const CoordinateReducer = (state: CoordinateState, action: Action) => {
  if (action instanceof saveRectangleCoordinates) {
    return CoordinateState.saveRectanglePoints(action.payload[0], action.payload[1])
  }

  return state
}

export default CoordinateState;