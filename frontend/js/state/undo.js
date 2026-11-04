/** An undo must never replace edits made after the action it belongs to. */
export function draftUndo(draft,before,after=draft.snapshot()) {
  const expected=JSON.stringify(after);
  return ()=>{
    if(JSON.stringify(draft.snapshot())!==expected)return false;
    draft.load(before,{recover:true});return true;
  };
}
