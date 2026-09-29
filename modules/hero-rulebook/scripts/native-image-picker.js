// Use Foundry's normal image picker so its storage sources, upload controls,
// permissions, and Forge integrations remain available.
export function pickArticleImage(current, onSelect) {
  if (!globalThis.game?.user?.isGM) throw new Error('Only the GM may choose article images.');
  const Picker = globalThis.FilePicker ?? globalThis.foundry?.applications?.apps?.FilePicker?.implementation;
  if (!Picker) throw new Error('Foundry image picker is unavailable.');
  const picker = new Picker({type: 'image', current: current || '', callback: path => {
    if (path) onSelect(path);
  }});
  picker.render(true);
  return picker;
}
