// The one place that says who this lab is for and how it looks.
//   player ...... the child's name. Change it here and every greeting, title and grown-up note follows ({player} in the strings).
//   appName ..... the lab's title (index.html and manifest.webmanifest repeat it because they are static files).
//   mark ........ the picture shown in the upper left (beside the title), in the sunset message and on the Home Screen card. Drop your own file at
//                 img/brand/mark.png to replace Max's Fathom drawing; with no file there, the drawing shows.
//   partner ..... the picture shown in the upper right of every screen. Drop your own file at img/brand/logo.png to swap it (keep the same file name,
//                 or change the path here). Colors live in css/brand.css.
export const BRAND = {
  player: 'Max',
  appName: { en: '{player}’s Learning Lab', es: 'El Laboratorio de {player}' },
  mark: { src: 'img/brand/mark.png' },
  partner: { src: 'img/brand/logo.png', alt: { en: 'Partner logo', es: 'Logotipo del socio' } },
};
