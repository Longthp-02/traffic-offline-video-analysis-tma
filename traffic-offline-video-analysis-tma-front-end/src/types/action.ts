import { Page } from './type';
  export interface Action {
    payload?: any
  }
  
  export class GoToPage implements Action {
    constructor(public readonly payload: Page) {}
  }

  export class saveFileName implements Action {
    constructor(public readonly payload: string) {}
  }

  export class saveRectangleCoordinates implements Action {
    constructor(
      public readonly payload: [{ x: number; y: number }[], { x: number; y: number }[]]
    ) {}
  }

  