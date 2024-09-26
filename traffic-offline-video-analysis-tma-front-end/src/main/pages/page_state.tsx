import { Action, GoToPage } from "@/types/action";
import { Page } from "@/types/type";

export class PageState {
  constructor(
    public currentPage: Page = Page.HOMEPAGE
  ) {}

  static goToPage(
    pageToGo: Page
  ): PageState {
    return new PageState(pageToGo)
  }
}

export const initialPageState: PageState = new PageState(
  Page.HOMEPAGE
)


export const PageReducer = (state: PageState, action: Action) => {
  if (action instanceof GoToPage) {
    return PageState.goToPage(action.payload)
  }

  return state
}

export default PageState;