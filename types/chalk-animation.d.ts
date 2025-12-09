declare module "chalk-animation" {
  interface Animation {
    start(): Animation;
    stop(): Animation;
    replace(text: string): Animation;
    render(): Animation;
  }

  function rainbow(text: string): Animation;
  function pulse(text: string): Animation;
  function glitch(text: string): Animation;
  function radar(text: string): Animation;
  function neon(text: string): Animation;
  function karaoke(text: string): Animation;

  export default {
    rainbow,
    pulse,
    glitch,
    radar,
    neon,
    karaoke,
  };
}
