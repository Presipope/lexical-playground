export function setDomHiddenUntilFound(dom: HTMLElement): void {
  // @ts-expect-error - hidden='until-found' is a valid value
  dom.hidden = 'until-found'
}

export function domOnBeforeMatch(dom: HTMLElement, callback: () => void): void {
  // @ts-ignore - onbeforematch is a newer DOM API not in all TypeScript lib definitions
  dom.onbeforematch = callback
}
