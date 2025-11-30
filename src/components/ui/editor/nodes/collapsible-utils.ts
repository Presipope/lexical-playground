export function setDomHiddenUntilFound(dom: HTMLElement): void {
  // @ts-expect-error - hidden='until-found' is a valid value
  dom.hidden = 'until-found'
}

export function domOnBeforeMatch(dom: HTMLElement, callback: () => void): void {
  // @ts-expect-error - onbeforematch is not in the types yet
  dom.onbeforematch = callback
}
