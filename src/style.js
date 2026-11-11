// Look-and-feel presets, so different art directions can be compared side by side.
// Pick one with ?style=soft | toon | story | real   (see styles.html for the gallery).
export const STYLES = {
  // soft toy: gentle even light, light textures
  soft: { name: 'Soft toy', kind: 'lambert', tex: true, fur: 0, grass: 0,
    bg: '#BFEBD0', hemi: ['#ffffff', '#CDEBA8', 2.1], sun: ['#FFF1D0', 1.9], sunAt: [500, 1300, 350] },
  // cartoon: flat colours in two or three bands, no textures
  toon: { name: 'Cartoon', kind: 'toon', tex: false, fur: 0, grass: 0,
    bg: '#C8F0FF', hemi: ['#ffffff', '#BFE89A', 1.7], sun: ['#FFFFFF', 2.3], sunAt: [600, 1200, 500] },
  // storybook: warm late-afternoon sun, long shadows, fluffy fur
  story: { name: 'Storybook', kind: 'lambert', tex: true, fur: 10, grass: 1500,
    bg: '#FFE6C4', hemi: ['#FFE8D0', '#B9D78C', 1.55], sun: ['#FFC98A', 2.7], sunAt: [950, 800, 420], vignette: 'rgba(255,160,80,.25)' },
  // natural (the chosen look): stronger sun and shade, fluffy fur, lots of grass,
  // with the smooth untextured trees of the cartoon style
  real: { name: 'Natural', kind: 'standard', tex: true, plainTrees: true, fur: 14, grass: 4500,
    bg: '#CFE9F7', hemi: ['#E4F0FF', '#8FC060', 1.55], sun: ['#FFF0D2', 2.9], sunAt: [650, 1200, 450] },
};
const key = new URLSearchParams(location.search).get('style');
export const STYLE = STYLES[key] || STYLES.real;
