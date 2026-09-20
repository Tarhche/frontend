// leaveFor sends the browser to an address this app does not own, which the
// router cannot do: it moves between this app's own pages.
//
// It is a function of its own so that what is being left for can be said in
// one place, and so a test can watch where somebody was sent.
export function leaveFor(url: string) {
  window.location.assign(url);
}
