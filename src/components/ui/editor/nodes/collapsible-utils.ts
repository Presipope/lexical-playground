export function setDomHiddenUntilFound(dom: HTMLElement): void {
  // @ts-expect-error - hidden='until-found' is a valid value
  dom.hidden = 'until-found'
}

export function domOnBeforeMatch(dom: HTMLElement, callback: () => void): void {
  dom.onbeforematch = callback
}
