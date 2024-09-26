import { Action, saveFileName } from "@/types/action";

export class FileState {
  constructor(
    public currentFileName: string = ""
  ) {}

  static saveFile(
    fileSaved: string
  ): FileState {
    return new FileState(fileSaved)
  }
}

export const initialFileState: FileState = new FileState(
  ""
)


export const FileReducer = (state: FileState, action: Action) => {
  if (action instanceof saveFileName) {
    return FileState.saveFile(action.payload)
  }

  return state
}

export default FileState;